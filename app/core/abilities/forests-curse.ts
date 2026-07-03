import { Ability } from "../../types/enum/Ability"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class ForestsCurseStrategy extends AbilityStrategy {
  process(pokemon: PokemonEntity, board: Board, target: PokemonEntity, crit: boolean) {
    super.process(pokemon, board, target, crit, true)
    let cursedTarget = target
    if (target.status.grassField) {
      const nonGrassEnemy = board.cells.find(
        (p) => p && p.team !== pokemon.team && !p.status.grassField
      ) as PokemonEntity | undefined
      if (!nonGrassEnemy) return
      cursedTarget = nonGrassEnemy
    }
    pokemon.broadcastAbility({
      skill: Ability.FORESTS_CURSE,
      targetX: cursedTarget.positionX,
      targetY: cursedTarget.positionY
    })
    cursedTarget.status.grassField = true
    pokemon.addPP(5, pokemon, 1, crit)
  }
}
