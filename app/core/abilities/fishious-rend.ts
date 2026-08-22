import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class FishiousRendStrategy extends AbilityStrategy {
  requiresTarget = false
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity | null,
    crit: boolean
  ) {
    const destination = board.getFarthestTargetCoordinateAvailablePlace(pokemon)
    if (!destination) {
      super.process(pokemon, board, target, crit)
      return
    }
    pokemon.setTarget(destination.target)
    super.process(pokemon, board, destination.target, crit)

    pokemon.moveTo(destination.x, destination.y, board, false)
    pokemon.simulation.seizePokemon(pokemon, destination.target, board)
    // Dracovish is spent for the rest of the combat
    pokemon.pp = 0
    pokemon.spentForCombat = true
  }
}
