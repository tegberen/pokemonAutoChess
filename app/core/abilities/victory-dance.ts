import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class VictoryDanceStrategy extends AbilityStrategy {
  requiresTarget = false
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    super.process(pokemon, board, target, true)
    danceToVictory(pokemon, crit)
  }
}

// also used by the VICTORIOUS Wish, which must not spend the unit's PP
export function danceToVictory(pokemon: PokemonEntity, crit: boolean) {
  const attack = [3, 6, 12, 24][pokemon.stars - 1] ?? 24
  const defense = [3, 6, 9, 12][pokemon.stars - 1] ?? 12
  const speed = [10, 20, 30, 40][pokemon.stars - 1] ?? 40
  pokemon.addAttack(attack, pokemon, 1, crit)
  pokemon.addDefense(defense, pokemon, 1, crit)
  pokemon.addSpeed(speed, pokemon, 1, crit)
}
