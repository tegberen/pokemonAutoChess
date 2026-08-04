import PokemonFactory from "../../models/pokemon-factory"
import { Awakening } from "../../types/enum/Awakening"
import {
  Blessing,
  ECHO_CHAMBER_PP_TO_ALLIES,
  ECHO_CHAMBER_PP_TO_LEADER,
  LANGUAGE_BARRIER_SHIELD
} from "../../types/enum/Blessing"
import { Synergy } from "../../types/enum/Synergy"
import { Rarity } from "../../types/enum/Game"
import { Pkm, Unowns } from "../../types/enum/Pokemon"
import { DPS_LANGUAGE_BARRIER_ID } from "../../types"
import { EffectEnum } from "../../types/enum/Effect"
import { isIn } from "../../utils/array"
import { chance } from "../../utils/random"
import type { Board } from "../board"
import { OnAbilityCastEffect } from "../effects/effect"
import type { PokemonEntity } from "../pokemon-entity"
import type { AbilityStrategy } from "./ability-strategy"

export function castAbility(
  abilityStrategy: AbilityStrategy,
  pokemon: PokemonEntity,
  board: Board,
  target: PokemonEntity | null,
  canCrit = true,
  preventDefaultAnim = false
) {
  if (pokemon.canCast === false) return

  let crit = false
  if (
    canCrit &&
    (pokemon.effects.has(EffectEnum.ABILITY_CRIT) ||
      abilityStrategy.canCritByDefault)
  ) {
    crit = chance(pokemon.critChance / 100, pokemon)
  }
  abilityStrategy.process(pokemon, board, target, crit, preventDefaultAnim)

  pokemon.getEffects(OnAbilityCastEffect).forEach((effect) => {
    effect.apply(pokemon, board, target, crit)
  })

  if (
    pokemon.types.has(Synergy.WATER) &&
    pokemon.player?.blessings?.includes(Blessing.ATLANTEAN_MAGIC)
  ) {
    pokemon.addAbilityPower(pokemon.stars, pokemon, 0, false, true)
  }

  const casterBlessings = pokemon.player?.blessings

  if (
    pokemon.types.has(Synergy.SOUND) &&
    casterBlessings?.includes(Blessing.ECHO_CHAMBER)
  ) {
    if (pokemon.isEchoChamberLeaderThisFight) {
      board.forEach((x, y, ally) => {
        if (ally && ally.team === pokemon.team && ally !== pokemon) {
          ally.addPP(ECHO_CHAMBER_PP_TO_ALLIES, ally, 0, false)
        }
      })
    } else {
      board.forEach((x, y, ally) => {
        if (ally && ally.isEchoChamberLeaderThisFight) {
          ally.addPP(ECHO_CHAMBER_PP_TO_LEADER, ally, 0, false)
        }
      })
    }
  }

  if (
    isIn(Unowns, pokemon.name) &&
    casterBlessings?.includes(Blessing.LANGUAGE_BARRIER)
  ) {
    const shieldBefore = pokemon.shieldDone
    board.forEach((x, y, ally) => {
      if (ally && ally.team === pokemon.team) {
        ally.addShield(LANGUAGE_BARRIER_SHIELD, pokemon, 1, false)
      }
    })
    /* the Unown kills itself as part of casting, so it is already out of the
       team map and its own Battle Stats row will never be flushed again */
    const languageBarrierDps = pokemon.simulation.getOrCreateSyntheticDps(
      pokemon.team,
      DPS_LANGUAGE_BARRIER_ID
    )
    languageBarrierDps.shield = Math.min(
      65535,
      languageBarrierDps.shield + (pokemon.shieldDone - shieldBefore)
    )
  }

  // BEEKEEPING blessing: a Combee joins the fight each time a unique casts
  if (
    pokemon.rarity === Rarity.UNIQUE &&
    pokemon.player?.blessings?.includes(Blessing.BEEKEEPING)
  ) {
    const coord = pokemon.state.getNearestAvailablePlaceCoordinates(
      pokemon,
      board
    )
    if (coord) {
      pokemon.player.pokemonsPlayed.add(Pkm.COMBEE)
      pokemon.simulation.addPokemon(
        PokemonFactory.createPokemonFromName(Pkm.COMBEE, pokemon.player),
        coord.x,
        coord.y,
        pokemon.team,
        true
      )
    }
  }

  // ELECTRIC_QUARTZ awakening: allies within 2 tiles (incl. self) charge up
  // whenever a nearby ally casts an ability. (The THUNDER_STRUCK trigger is
  // handled in simulation.ts where storm lightning strikes.)
  board
    .getCellsInRadius(pokemon.positionX, pokemon.positionY, 2, true)
    .forEach((cell) => {
      if (
        cell.value &&
        cell.value.team === pokemon.team &&
        cell.value.awakening === Awakening.ELECTRIC_QUARTZ
      ) {
        cell.value.addSpeed(5, cell.value, 0, false)
        cell.value.addShield(10, cell.value, 0, false)
      }
    })
}
