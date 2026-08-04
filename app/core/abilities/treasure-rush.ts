import { Blessing } from "../../types/enum/Blessing"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class TreasureRushStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [30, 60, 90, 120][pokemon.stars - 1] ?? 120
    const goldCost = 1
    const atkGain = [1, 2, 3, 4][pokemon.stars - 1] ?? 4

    if (pokemon.player && pokemon.player.money >= goldCost) {
      pokemon.player.addMoney(-goldCost, false, pokemon)
      pokemon.addAttack(atkGain, pokemon, 0, false, true)
      if (pokemon.heroBlessings?.has(Blessing.PLUNDER)) {
        pokemon.player.plunderGoldSpentThisFight += goldCost
      }
    }

    target.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
  }
}
