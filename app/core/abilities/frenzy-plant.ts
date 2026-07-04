import { AttackType } from "../../types/enum/Game"
import { max } from "../../utils/number"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

export class FrenzyPlantStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit,true)
    const baseDamage = [15, 30, 60, 120][pokemon.stars - 1] ?? 120
    const adjacentEnemies = board
      .getAdjacentCells(target.positionX, target.positionY)
      .filter((cell) => cell.value && cell.value.team !== pokemon.team).length
    const multiplier = Math.max(1, adjacentEnemies)
    const damage = baseDamage * multiplier

    let currentTarget = target
    let hitsRemaining = 3

    const strike = () => {
      if (hitsRemaining <= 0 || !currentTarget || currentTarget.hp <= 0) return
      pokemon.commands.push(
        new DelayedCommand(() => {
          pokemon.broadcastAbility({
            positionX: pokemon.positionX,
            positionY: pokemon.positionY,
            targetX: currentTarget.positionX,
            targetY: currentTarget.positionY
          })
          const { death } = currentTarget.handleSpecialDamage(
            damage, board, AttackType.SPECIAL, pokemon, crit
          )
          hitsRemaining--
          if (death && hitsRemaining > 0) {
            const next = pokemon.state.getNearestTargetAtSight(pokemon, board)?.target
            if (next) currentTarget = next
          }
          strike()
        }, 90)
      )
    }

  strike()

  }
}
