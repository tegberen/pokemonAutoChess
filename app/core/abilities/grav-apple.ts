import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class GravAppleStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damageRatio = [1, 2, 3, 4][pokemon.stars - 1] ?? 4
    const damage = damageRatio * pokemon.atk
    target.handleSpecialDamage(
      damage,
      board,
      AttackType.PHYSICAL,
      pokemon,
      crit
    )
  }
}
