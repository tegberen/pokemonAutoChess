import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class LeechSeedStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const duration = [4000, 8000, 16000, 32000][pokemon.stars - 1] ?? 32000
    const heal = [25, 50, 100, 200][pokemon.stars - 1] ?? 200
    pokemon.handleHeal(heal, pokemon, 1, crit)
    target.status.triggerPoison(duration, target, pokemon)
  }
}
