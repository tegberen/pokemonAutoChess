import type { Board } from "../board"
import { OnAttackEffect } from "../effects/effect"
import type { PokemonEntity } from "../pokemon-entity"
import { AttackCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

const AMPING_BEAK_ATTACK_INTERVAL = 3
const AMPING_BEAK_EXTRA_ATTACK_DELAY = 100

/* Dracozolt: every third basic attack fires extra attacks, one per cast so far */
export class AmpingBeakStrategy extends AbilityStrategy {
  requiresTarget = false
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity | null,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    pokemon.ampingBeakStacks += 1
    // the listener is armed once; later casts only raise the stack count
    if (pokemon.ampingBeakStacks > 1) return

    let lastTriggeredAttackCount = -1

    pokemon.effectsSet.add(
      new OnAttackEffect(({ pokemon, target, board }) => {
        if (
          !target ||
          pokemon.count.attackCount % AMPING_BEAK_ATTACK_INTERVAL !== 0 ||
          pokemon.count.attackCount === lastTriggeredAttackCount
        ) {
          return
        }
        lastTriggeredAttackCount = pokemon.count.attackCount
        for (let n = 0; n < pokemon.ampingBeakStacks; n++) {
          pokemon.commands.push(
            new AttackCommand(
              AMPING_BEAK_EXTRA_ATTACK_DELAY * (n + 1),
              pokemon,
              target,
              board
            )
          )
        }
      })
    )
  }
}
