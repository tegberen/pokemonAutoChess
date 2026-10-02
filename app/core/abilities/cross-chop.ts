import { Ability, CROSS_CHOP_CRIT_ANIMATION } from "../../types/enum/Ability"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export const CROSS_CHOP_ATTACK_RATIO = 3
export const CROSS_CHOP_CRIT_POWER_PER_THROW = [0.25, 0.5, 1, 2]

export class CrossChopStrategy extends AbilityStrategy {
  canCritByDefault = true

  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    pokemon.broadcastAbility({
      skill: crit ? CROSS_CHOP_CRIT_ANIMATION : Ability.CROSS_CHOP,
      targetX: target.positionX,
      targetY: target.positionY
    })
    const baseDamage = pokemon.atk * CROSS_CHOP_ATTACK_RATIO
    // lands a crit at critPower plus the throw bonus, leaving the stat alone
    const starIndex =
      Math.min(pokemon.stars, CROSS_CHOP_CRIT_POWER_PER_THROW.length) - 1
    const critPowerPerThrow = CROSS_CHOP_CRIT_POWER_PER_THROW[starIndex]
    const throwCritPower = pokemon.fightingThrowCount * critPowerPerThrow
    const damage =
      crit && pokemon.critPower > 0
        ? baseDamage * (1 + throwCritPower / pokemon.critPower)
        : baseDamage
    target.handleSpecialDamage(
      damage,
      board,
      AttackType.SPECIAL,
      pokemon,
      crit
    )
  }
}
