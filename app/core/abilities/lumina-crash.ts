import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class LuminaCrashStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const baseDamage = [10,20,40,80][pokemon.stars - 1] ?? 80
    const damageMultiplier = [2, 4, 8, 10][pokemon.stars - 1] ?? 10
    const damage = baseDamage + target.speDef * damageMultiplier  
    target.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
    target.addSpecialDefense(-target.speDef, pokemon, 0, false)
  }
}
