import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import { effectInLine } from "../board"

import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class FlameThrowerStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)

    const ppBurnPercent = [100, 150, 200, 400][pokemon.stars - 1] ?? 400
    const ppBurn = Math.round(
      ((pokemon.atk * ppBurnPercent) / 100) * (1 + pokemon.ap / 100)
    )

    effectInLine(board, pokemon, target, (cell) => {
      const enemy = cell.value
      if (enemy == null || enemy.team === pokemon.team) return

      enemy.status.triggerBurn(3000, enemy, pokemon)

      const ppBeforeBurn = enemy.pp
      enemy.addPP(-ppBurn, pokemon, 0, false)
      const burnedPP = ppBeforeBurn - enemy.pp
      if (burnedPP < 0) return // twist band turned the burn into a PP gain
      if (burnedPP === 0 && ppBeforeBurn > 0) return // PP loss prevented (tree status, ...)

      if (burnedPP > 0) enemy.count.manaBurnCount++

      const overflow = ppBurn - burnedPP
      if (overflow <= 0) return

      pokemon.broadcastAbility({
        skill: "FLAMETHROWER_ERUPT",
        targetX: enemy.positionX,
        targetY: enemy.positionY
      })

      board
        .getAdjacentCells(enemy.positionX, enemy.positionY, true)
        .forEach((adjacentCell) => {
          const splashed = adjacentCell.value
          if (splashed == null || splashed.team === pokemon.team) return

          splashed.handleSpecialDamage(
            overflow,
            board,
            AttackType.SPECIAL,
            pokemon,
            crit
          )

          if (splashed !== enemy) {
            pokemon.broadcastAbility({
              skill: "FLAMETHROWER_SPLASH",
              targetX: splashed.positionX,
              targetY: splashed.positionY
            })
          }
        })
    })
  }
}
