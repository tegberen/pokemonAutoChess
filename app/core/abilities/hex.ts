import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class HexStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [20, 40, 60, 120] [pokemon.stars - 1] ?? 120
    if (target.status.hasNegativeStatus()) {
      target.handleSpecialDamage(damage * 2, board, AttackType.SPECIAL, pokemon, crit)
    } else {
      target.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
    }
  }
}
