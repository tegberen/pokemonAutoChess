import { Ability } from "../../types/enum/Ability"
import { EffectEnum } from "../../types/enum/Effect"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import {
  OnAbilityCastEffect,
  OnDeathEffect,
  PeriodicEffect
} from "../effects/effect"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

// two Palkias can channel at once, so an ally keeps its PP boost until the
// last channel covering it ends
const activeChannelsByAlly = new WeakMap<PokemonEntity, number>()

class SubspaceSwellEffect extends PeriodicEffect {
  remainingMs: number
  allyCasts = 0
  castMonitorsByAlly = new Map<PokemonEntity, OnAbilityCastEffect>()
  // a KO stops the caster's periodic effects, so the channel is ended here
  endChannelOnDeath = new OnDeathEffect(({ pokemon }) => {
    this.endChannel(pokemon)
  }, Ability.SUBSPACE_SWELL)

  constructor(
    pokemon: PokemonEntity,
    durationMs: number,
    board: Board,
    crit: boolean
  ) {
    super(
      (pokemon) => {
        this.remainingMs -= this.intervalMs
        if (this.remainingMs > 0) return
        this.endChannel(pokemon)
        pokemon.broadcastAbility({ skill: Ability.SUBSPACE_SWELL })
        const baseDamage = [5, 10, 20, 40][pokemon.stars - 1] ?? 40
        const damage = baseDamage * Math.max(1, this.allyCasts)
        board
          .getCellsInRadius(pokemon.positionX, pokemon.positionY, 4, false)
          .forEach((cell) => {
            if (cell.value && cell.value.team !== pokemon.team) {
              cell.value.handleSpecialDamage(
                damage,
                board,
                AttackType.SPECIAL,
                pokemon,
                crit
              )
            }
          })
      },
      Ability.SUBSPACE_SWELL,
      500
    )
    this.remainingMs = durationMs

    board.cells.forEach((ally) => {
      if (ally && ally.team === pokemon.team && ally !== pokemon) {
        const channelsCoveringAlly = activeChannelsByAlly.get(ally) ?? 0
        activeChannelsByAlly.set(ally, channelsCoveringAlly + 1)
        ally.effects.add(EffectEnum.SUBSPACE_SWELL_CHANNEL)
        const castMonitor = new OnAbilityCastEffect(() => {
          this.allyCasts++
        }, Ability.SUBSPACE_SWELL)
        this.castMonitorsByAlly.set(ally, castMonitor)
        ally.effectsSet.add(castMonitor)
      }
    })
    pokemon.effects.add(EffectEnum.CHANNELING)
    pokemon.effectsSet.add(this.endChannelOnDeath)
  }

  endChannel(pokemon: PokemonEntity) {
    this.castMonitorsByAlly.forEach((castMonitor, ally) => {
      ally.effectsSet.delete(castMonitor)
      const channelsLeft = (activeChannelsByAlly.get(ally) ?? 1) - 1
      if (channelsLeft > 0) {
        activeChannelsByAlly.set(ally, channelsLeft)
      } else {
        activeChannelsByAlly.delete(ally)
        ally.effects.delete(EffectEnum.SUBSPACE_SWELL_CHANNEL)
      }
    })
    this.castMonitorsByAlly.clear()
    pokemon.effects.delete(EffectEnum.CHANNELING)
    pokemon.effectsSet.delete(this.endChannelOnDeath)
    pokemon.effectsSet.delete(this)
  }
}

export class SubspaceSwellStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    const alreadyChanneling = [...pokemon.effectsSet].some(
      (effect) => effect instanceof SubspaceSwellEffect
    )
    if (!alreadyChanneling) {
      pokemon.effectsSet.add(
        new SubspaceSwellEffect(pokemon, 3000, board, crit)
      )
    }
  }
}
