import { AttackType } from "../../types/enum/Game"
import { Item } from "../../types/enum/Item"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

const castersThatDroppedAnApple = new WeakSet<PokemonEntity>()

export class GravAppleStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damageRatio = [0.5, 1, 2, 4][pokemon.stars - 1] ?? 4
    const damage = damageRatio * pokemon.atk
    target.handleSpecialDamage(
      damage,
      board,
      AttackType.PHYSICAL,
      pokemon,
      crit
    )
    if (
      pokemon.player &&
      !pokemon.isGhostOpponent &&
      !castersThatDroppedAnApple.has(pokemon)
    ) {
      castersThatDroppedAnApple.add(pokemon)
      pokemon.player.addFreshApple(Item.TART_APPLE)
    }
  }
}
