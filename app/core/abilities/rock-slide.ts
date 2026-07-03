import { AttackType } from "../../types/enum/Game"
import { Synergy } from "../../types/enum/Synergy"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class RockSlideStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [30, 60, 120, 150, 300][pokemon.stars - 1] ?? 300
    if (target.types.has(Synergy.FLYING)) {
      target.handleSpecialDamage(damage * 2, board, AttackType.SPECIAL, pokemon, crit)
    } else {
      target.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
    }
  }
}
