import { Ability } from "../../types/enum/Ability"
import { EffectEnum } from "../../types/enum/Effect"
import { AttackType } from "../../types/enum/Game"
import { max } from "../../utils/number"
import type { Board } from "../board"
import { OnAbilityCastEffect, PeriodicEffect } from "../effects/effect"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

class SubspaceSwellEffect extends PeriodicEffect {
  duration: number
  allyCasts: number = 0
  castMonitors: OnAbilityCastEffect[] = []

  constructor(pokemon: PokemonEntity, duration: number, board: Board, crit: boolean) {
    super(
      (pokemon) => {
        if (this.duration <= 0) {
          // cleanup channel effect from allies
          board.cells.forEach((ally) => {
            if (ally && ally.team === pokemon.team && ally !== pokemon) {
              ally.effects.delete(EffectEnum.SUBSPACE_SWELL_CHANNEL)
              this.castMonitors.forEach((m) => ally.effectsSet.delete(m))
            }
          })
          // release burst
          pokemon.broadcastAbility({ skill: Ability.SUBSPACE_SWELL })
          const damage = Math.round(20 * Math.max(1, this.allyCasts))
          board.getCellsInRadius(pokemon.positionX, pokemon.positionY, 4, false)
            .forEach((cell) => {
              if (cell.value && cell.value.team !== pokemon.team) {
                cell.value.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
              }
            })
          pokemon.effectsSet.delete(this)
        } else {
          this.duration -= this.intervalMs
        }
      },
      Ability.SUBSPACE_SWELL,
      500
    )
    this.duration = duration

    // apply channel boost and cast monitor to each ally
    board.cells.forEach((ally) => {
      if (ally && ally.team === pokemon.team && ally !== pokemon) {
        ally.effects.add(EffectEnum.SUBSPACE_SWELL_CHANNEL)
        const monitor = new OnAbilityCastEffect(() => {
          this.allyCasts++
        }, Ability.SUBSPACE_SWELL)
        this.castMonitors.push(monitor)
        ally.effectsSet.add(monitor)
      }
    })
  }
}

export class SubspaceSwellStrategy extends AbilityStrategy {
  process(pokemon: PokemonEntity, board: Board, target: PokemonEntity, crit: boolean) {
    super.process(pokemon, board, target, crit, true)
    const alreadyChanneling = [...pokemon.effectsSet].some((e) => e.constructor.name === "SubspaceSwellEffect")
    if (!alreadyChanneling)
    pokemon.effectsSet.add(new SubspaceSwellEffect(pokemon, 3000, board, crit))
  }
}
