import { AttackType } from "../../types/enum/Game"
import { type Board, type Cell, effectInOrientation } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class BlazeKickStrategy extends AbilityStrategy {
  canCritByDefault = true
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    let damage = [30, 60, 120, 240][pokemon.stars - 1] ?? 240
    const critGain = [10, 20, 40, 80][pokemon.stars - 1] ?? 80
    if (target.status.burn) {
      damage = Math.round(damage * 1.3)
    }
    pokemon.addCritChance(critGain, pokemon, 0, false)
    target.status.triggerBurn(2000, target, pokemon)
    target.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
  }
}
