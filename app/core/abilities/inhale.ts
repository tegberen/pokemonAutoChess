import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class InhaleStrategy extends AbilityStrategy {
  requiresTarget = false

  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity | null,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const maxHpGain = [10, 20, 30][pokemon.stars - 1] ?? 30
    pokemon.addMaxHP(maxHpGain, pokemon, 1, crit)
  }
}
