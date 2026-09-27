import {
  Blessing,
  WICKED_HUNTER_EXECUTE_CHANCE_PER_STATUS
} from "../../types/enum/Blessing"
import { AttackType } from "../../types/enum/Game"
import { chance, pickRandomIn } from "../../utils/random"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class DireClawStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)

    if (pokemon.heroBlessings?.has(Blessing.WICKED_HUNTER)) {
      const statusesAlreadyOnTarget = target.status.countNegativeStatuses()
      if (
        chance(
          WICKED_HUNTER_EXECUTE_CHANCE_PER_STATUS * statusesAlreadyOnTarget,
          pokemon
        )
      ) {
        target.handleSpecialDamage(9999, board, AttackType.TRUE, pokemon, crit)
        return
      }
      target.status.triggerPoison(3000, target, pokemon)
      target.status.triggerSleep(3000, target)
      target.status.triggerParalysis(3000, target, pokemon)
    } else {
      const status = pickRandomIn(["poison", "sleep", "paralysis"])
      switch (status) {
        case "poison":
          target.status.triggerPoison(3000, target, pokemon)
          break
        case "sleep":
          target.status.triggerSleep(3000, target)
          break
        case "paralysis":
          target.status.triggerParalysis(3000, target, pokemon)
          break
      }
    }

    const damage = [25, 50, 100, 200][pokemon.stars - 1] ?? 200
    target.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
  }
}
