import { Ability } from "../../types/enum/Ability"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import { OnDamageReceivedEffect, PeriodicEffect } from "../effects/effect"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

class TemporalRuptureEffect extends PeriodicEffect {
  duration: number
  damageTracked: Map<PokemonEntity, number> = new Map()
  monitors: OnDamageReceivedEffect[] = []

  constructor(pokemon: PokemonEntity, duration: number, board: Board, crit: boolean) {
    super(
      (pokemon) => {
        if (this.duration <= 0) {
          // cleanup monitors
          this.monitors.forEach((m) => {
            board.cells.forEach((cell) => {
              if (cell) cell.effectsSet.delete(m)
            })
          })
          pokemon.broadcastAbility({ skill: Ability.TEMPORAL_RUPTURE })
          this.damageTracked.forEach((damage, unit) => {
            if (unit.hp <= 0) return
            const amount = Math.round(damage) // define like thise for ap adjustments
            const damageMultiplier = [0.5, 0.75, 1, 2][pokemon.stars - 1] ?? 2
            if (unit.team !== pokemon.team) {
              unit.handleSpecialDamage(amount * damageMultiplier, board, AttackType.TRUE, pokemon, crit)
            } else {
              unit.handleHeal(Math.round(amount * damageMultiplier * (1 + pokemon.ap / 100)), pokemon, 0, false)
            }
          })
          pokemon.effectsSet.delete(this)
        } else {
          this.duration -= this.intervalMs
        }
      },
      Ability.TEMPORAL_RUPTURE,
      1000
    )
    this.duration = duration

    // add monitor to every unit on the board
    board.cells.forEach((unit) => {
      if (!unit) return
      const monitor = new OnDamageReceivedEffect(({ damage }) => {
        this.damageTracked.set(unit, (this.damageTracked.get(unit) ?? 0) + damage)
      }, Ability.TEMPORAL_RUPTURE)
      this.monitors.push(monitor)
      unit.effectsSet.add(monitor)
    })
  }
}

export class TemporalRuptureStrategy extends AbilityStrategy {
  process(pokemon: PokemonEntity, board: Board, target: PokemonEntity, crit: boolean) {
    super.process(pokemon, board, target, crit, true)
    pokemon.effectsSet.add(new TemporalRuptureEffect(pokemon, 3000, board, crit))
  }
}
