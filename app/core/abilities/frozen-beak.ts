import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

const FROZEN_BEAK_SHIELD = 100
const FROZEN_BEAK_SELF_FREEZE_DURATION = 2000
/* read by pokemon-state alongside the other pre-mitigation reductions, so the
   halving happens before the hit lands rather than being healed back after */
export const FROZEN_BEAK_DAMAGE_REDUCTION = 0.5

export class FrozenBeakStrategy extends AbilityStrategy {
  requiresTarget = false
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity | null,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    pokemon.addShield(FROZEN_BEAK_SHIELD, pokemon, 1, crit)
    pokemon.frozenBeakArmed = true
    pokemon.status.triggerFreeze(
      FROZEN_BEAK_SELF_FREEZE_DURATION,
      pokemon,
      undefined
    )
  }
}
