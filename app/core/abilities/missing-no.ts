import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class MissingNoStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    board.cells.forEach((entity) => {
      if (entity && entity.team !== pokemon.team) {
        entity.status.runeProtect = false
      }
    })
  }
}
