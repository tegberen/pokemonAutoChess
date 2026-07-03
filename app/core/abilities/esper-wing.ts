import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class EsperWingStrategy extends AbilityStrategy {
  canCritByDefault = true 
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)

    const damageMultiplier = [0.5, 1, 2, 4][pokemon.stars - 1] ?? 4
    const damage = pokemon.speed * damageMultiplier
    const speedBoost = [5, 10, 20, 40][pokemon.stars - 1] ?? 40

    target.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
    pokemon.addSpeed(speedBoost, pokemon, 0, false)
  }
}
