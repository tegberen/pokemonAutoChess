import {
  Blessing,
  JOLLY_ROGER_ABILITY_KO_GOLD
} from "../../types/enum/Blessing"
import { stealGoldOnKO } from "../jolly-roger"
import { min } from "../../utils/number"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class CrunchStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [40, 80, 150, 200, 400][pokemon.stars - 1] ?? 400
    const { death } = target.handleSpecialDamage(
      damage,
      board,
      AttackType.SPECIAL,
      pokemon,
      crit,
      true
    )
    if (death) {
      pokemon.handleHeal(Math.ceil(0.5 * target.maxHP), pokemon, 0, false)
      if (pokemon.heroBlessings.has(Blessing.JOLLY_ROGER)) {
        stealGoldOnKO(pokemon, target, JOLLY_ROGER_ABILITY_KO_GOLD)
      }
    }
  }
}
