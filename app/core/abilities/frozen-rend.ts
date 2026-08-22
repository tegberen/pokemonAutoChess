import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

const FROZEN_REND_FREEZE_DURATION = 2000

export class FrozenRendStrategy extends AbilityStrategy {
  requiresTarget = false
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity | null,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const radius = pokemon.count.ult // 1 on the first cast, wider after
    board
      .getCellsInRadius(pokemon.positionX, pokemon.positionY, radius, false)
      .forEach((cell) => {
        const enemy = cell.value
        if (!enemy || enemy.team === pokemon.team) return
        enemy.status.triggerFreeze(FROZEN_REND_FREEZE_DURATION, enemy, pokemon)
      })
  }
}
