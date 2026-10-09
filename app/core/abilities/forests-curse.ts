import { Ability } from "../../types/enum/Ability"
import { distanceC } from "../../utils/distance"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class ForestsCurseStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    const canBeCursed = (enemy: PokemonEntity) =>
      enemy.team !== pokemon.team && enemy.hp > 0 && !enemy.status.grassField
    const distanceToTarget = (enemy: PokemonEntity) =>
      distanceC(
        enemy.positionX,
        enemy.positionY,
        target.positionX,
        target.positionY
      )
    const cursedTarget = canBeCursed(target)
      ? target
      : board.cells
          .filter(
            (enemy): enemy is PokemonEntity =>
              enemy !== undefined && canBeCursed(enemy)
          )
          .sort((a, b) => distanceToTarget(a) - distanceToTarget(b))[0]
    if (cursedTarget) {
      pokemon.broadcastAbility({
        skill: Ability.FORESTS_CURSE,
        targetX: cursedTarget.positionX,
        targetY: cursedTarget.positionY
      })
      // forestsCursed keeps the mark from being stripped by the enemy's own
      // terrain or spread to its allies as a real field
      cursedTarget.status.grassField = true
      cursedTarget.forestsCursed = true
    }
    pokemon.addPP(5, pokemon, 1, crit)
  }
}
