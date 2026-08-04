import { Ability } from "../../types/enum/Ability"
import {
  Blessing,
  RAMPAGE_CHANNEL_THRESHOLD,
  RAMPAGE_DAMAGE_MULTIPLIER,
  RAMPAGE_DURATION_EXTENSION
} from "../../types/enum/Blessing"
import { EffectEnum } from "../../types/enum/Effect"
import { AttackType, Team } from "../../types/enum/Game"
import { chance } from "../../utils/random"
import type { Board } from "../board"
import { PeriodicEffect } from "../effects/effect"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

class DarkHarvestEffect extends PeriodicEffect {
  duration: number
  channelledMs = 0
  constructor(duration: number, pokemon: PokemonEntity) {
    super(
      (pokemon) => {
        this.duration -= this.intervalMs
        this.channelledMs += this.intervalMs
        if (this.duration <= 0) {
          pokemon.effectsSet.delete(this)
          pokemon.effects.delete(EffectEnum.DARK_HARVEST)
          return
        }

        if (
          pokemon.status.resurrecting ||
          pokemon.status.freeze ||
          pokemon.status.sleep
        ) {
          return
        }
        pokemon.broadcastAbility({ skill: Ability.DARK_HARVEST })
        const board = pokemon.simulation.board
        const crit = pokemon.effects.has(EffectEnum.ABILITY_CRIT)
          ? chance(pokemon.critChance / 100, pokemon)
          : false
        const isRampaging = pokemon.heroBlessings?.has(Blessing.RAMPAGE)
        const rampageBonus =
          isRampaging && this.channelledMs >= RAMPAGE_CHANNEL_THRESHOLD
            ? RAMPAGE_DAMAGE_MULTIPLIER
            : 1
        const darkHarvestDamage =
          ([5, 10, 20, 40][pokemon.stars - 1] ?? 40) * rampageBonus
        const healFactor = 0.3
        board
          .getAdjacentCells(pokemon.positionX, pokemon.positionY)
          .forEach((cell) => {
            if (cell.value && cell.value.team !== pokemon.team) {
              const { takenDamage, death } = cell.value.handleSpecialDamage(
                darkHarvestDamage,
                board,
                AttackType.SPECIAL,
                pokemon,
                crit,
                true
              )
              pokemon.handleHeal(
                Math.round(takenDamage * healFactor),
                pokemon,
                0,
                false
              )
              if (isRampaging && death) {
                this.duration += RAMPAGE_DURATION_EXTENSION
                pokemon.status.triggerSilence(
                  pokemon.status.silenceCooldown + RAMPAGE_DURATION_EXTENSION,
                  pokemon,
                  pokemon
                )
              }
            }
          })
      },
      EffectEnum.DARK_HARVEST,
      1000
    )

    this.timer = 0 // delay the first tick
    this.duration = duration + 200 // to ensure the effect ticks 3 times exactly, 200ms is a good margin for 3 event loops

    if (pokemon.effects.has(EffectEnum.DARK_HARVEST)) {
      pokemon.effectsSet.delete(this)
      for (const effect of pokemon.effectsSet) {
        if (effect instanceof DarkHarvestEffect) {
          effect.duration = Math.max(this.duration, effect.duration)
          effect.timer = this.timer
          break
        }
      }
    } else {
      pokemon.effects.add(EffectEnum.DARK_HARVEST)
    }
  }
}

export class DarkHarvestStrategy extends AbilityStrategy {
  requiresTarget = false
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    super.process(pokemon, board, target, crit, true)

    const opponentTeam =
      pokemon.team === Team.BLUE_TEAM ? Team.RED_TEAM : Team.BLUE_TEAM
    const mostSurroundedCoordinate =
      pokemon.state.getMostSurroundedCoordinateAvailablePlace(
        opponentTeam,
        board
      )
    const effectDuration = 3000

    if (mostSurroundedCoordinate) {
      pokemon.moveTo(
        mostSurroundedCoordinate.x,
        mostSurroundedCoordinate.y,
        board,
        false
      )
      pokemon.effectsSet.add(new DarkHarvestEffect(effectDuration, pokemon))
      pokemon.status.triggerSilence(effectDuration, pokemon, pokemon)
    }
  }
}
