import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class SlackOffStrategy extends AbilityStrategy {
  requiresTarget = false
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    super.process(pokemon, board, target, crit)
    pokemon.handleHeal(pokemon.maxHP * 0.5, pokemon, 1, crit)
    pokemon.addAttack(pokemon.baseAtk * 0.5, pokemon, 1, crit)
    pokemon.status.triggerSleep(3000, pokemon)
  }
}
