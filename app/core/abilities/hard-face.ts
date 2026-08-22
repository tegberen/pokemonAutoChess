import { AttackType } from "../../types/enum/Game"
import { Item } from "../../types/enum/Item"
import { distanceC } from "../../utils/distance"
import type { Board } from "../board"
import { OnAttackReceivedEffect } from "../effects/effect"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class HardFaceStrategy extends AbilityStrategy {
  requiresTarget = false
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity | null,
    crit: boolean
  ) {
    /* ap: 0 because addAbilitySprite scales the sprite by (1 + ap/200), and the
       shield ring must read as a constant size */
    super.process(pokemon, board, target, crit, true)
    pokemon.broadcastAbility({ ap: 0 })
    const shield = [20, 40, 80, 160][pokemon.stars - 1] ?? 160
    pokemon.addShield(shield, pokemon, 1, crit)

    // the retaliation is armed once and then lives off the shield the user
    // happens to have, so recasts only top the shield up
    if (pokemon.count.ult > 1) return

    const retaliationDamage = [3, 6, 12, 24][pokemon.stars - 1] ?? 24
    pokemon.effectsSet.add(
      new OnAttackReceivedEffect(({ pokemon, attacker, board }) => {
        if (
          pokemon.shield <= 0 ||
          attacker.items.has(Item.PROTECTIVE_PADS) ||
          distanceC(
            pokemon.positionX,
            pokemon.positionY,
            attacker.positionX,
            attacker.positionY
          ) !== 1
        )
          return

        attacker.handleDamage({
          damage: Math.round(
            retaliationDamage * (1 + pokemon.ap / 100) + 0.2 * pokemon.def
          ),
          board,
          attackType: AttackType.TRUE,
          attacker: pokemon,
          shouldTargetGainMana: true,
          isRetaliation: true
        })
      })
    )
  }
}
