import { chance } from "../../utils/random"
import { AttackType } from "../../types/enum/Game"
import { pickRandomIn } from "../../utils/random"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

export class RockArtilleryStrategy extends AbilityStrategy {
  requiresTarget = false
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    super.process(pokemon, board, target, crit, true)
    const numberOfRocks = [10, 20, 30, 50][pokemon.stars - 1] ?? 50
    const damage = [15, 25, 35, 70][pokemon.stars - 1] ?? 70

    const enemies = board.cells.filter(
      (cell) => cell && cell.team !== pokemon.team
    ) as PokemonEntity[]

    for (let i = 0; i < numberOfRocks; i++) {
      const randomEnemy = pickRandomIn(enemies)
      if (randomEnemy) {
        const adjacentCells = board.getAdjacentCells(
          randomEnemy.positionX,
          randomEnemy.positionY,
          true
        )
        const targetCell = pickRandomIn(adjacentCells)

        pokemon.commands.push(
          new DelayedCommand(() => {
            pokemon.broadcastAbility({
              targetX: targetCell.x,
              targetY: targetCell.y
            })
            if (targetCell.value && targetCell.value.team !== pokemon.team) {
              targetCell.value.handleSpecialDamage(
                damage,
                board,
                AttackType.SPECIAL,
                pokemon,
                crit
              )
              if (chance(0.3, pokemon)) {
                targetCell.value.status.triggerLocked(2000, targetCell.value)
              }
            }
          }, i * 100)
        )
      }
    }
  }
}
