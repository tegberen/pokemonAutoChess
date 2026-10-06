import { Ability } from "../../types/enum/Ability"
import { EffectEnum } from "../../types/enum/Effect"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import {
  OnDamageReceivedEffect,
  OnDeathEffect,
  PeriodicEffect
} from "../effects/effect"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

const TEMPORAL_RUPTURE_RADIUS = 4

class TemporalRuptureEffect extends PeriodicEffect {
  remainingMs: number
  damageReceivedByUnit = new Map<PokemonEntity, number>()
  damageMonitorsByUnit = new Map<PokemonEntity, OnDamageReceivedEffect>()
  // a KO stops the caster's periodic effects, so the channel is ended here
  endChannelOnDeath = new OnDeathEffect(({ pokemon }) => {
    this.endChannel(pokemon)
  }, Ability.TEMPORAL_RUPTURE)

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
        const damageReceivedByUnit = new Map(this.damageReceivedByUnit)
        this.endChannel(pokemon)
        pokemon.broadcastAbility({ skill: Ability.TEMPORAL_RUPTURE })
        const ratio = [0.5, 0.75, 1, 2][pokemon.stars - 1] ?? 2
        board
          .getCellsInRadius(
            pokemon.positionX,
            pokemon.positionY,
            TEMPORAL_RUPTURE_RADIUS,
            true
          )
          .forEach((cell) => {
            const unit = cell.value
            const damageReceived = unit && damageReceivedByUnit.get(unit)
            if (!unit || !damageReceived || unit.hp <= 0) return
            const amount = Math.round(damageReceived * ratio)
            if (unit.team !== pokemon.team) {
              unit.handleSpecialDamage(
                amount,
                board,
                AttackType.TRUE,
                pokemon,
                crit
              )
            } else {
              unit.handleHeal(
                Math.round(amount * (1 + pokemon.ap / 100)),
                pokemon,
                0,
                false
              )
            }
          })
      },
      Ability.TEMPORAL_RUPTURE,
      500
    )
    this.remainingMs = durationMs

    board.cells.forEach((unit) => {
      if (!unit) return
      const damageMonitor = new OnDamageReceivedEffect(({ damage }) => {
        const damageSoFar = this.damageReceivedByUnit.get(unit) ?? 0
        this.damageReceivedByUnit.set(unit, damageSoFar + damage)
      }, Ability.TEMPORAL_RUPTURE)
      this.damageMonitorsByUnit.set(unit, damageMonitor)
      unit.effectsSet.add(damageMonitor)
    })
    pokemon.effects.add(EffectEnum.CHANNELING)
    pokemon.effectsSet.add(this.endChannelOnDeath)
  }

  endChannel(pokemon: PokemonEntity) {
    this.damageMonitorsByUnit.forEach((damageMonitor, unit) => {
      unit.effectsSet.delete(damageMonitor)
    })
    this.damageMonitorsByUnit.clear()
    this.damageReceivedByUnit.clear()
    pokemon.effects.delete(EffectEnum.CHANNELING)
    pokemon.effectsSet.delete(this.endChannelOnDeath)
    pokemon.effectsSet.delete(this)
  }
}

export class TemporalRuptureStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    const alreadyChanneling = [...pokemon.effectsSet].some(
      (effect) => effect instanceof TemporalRuptureEffect
    )
    if (!alreadyChanneling) {
      pokemon.effectsSet.add(
        new TemporalRuptureEffect(pokemon, 3000, board, crit)
      )
    }
  }
}
