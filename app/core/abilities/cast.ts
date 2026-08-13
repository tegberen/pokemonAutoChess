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
import { distanceC } from "../../utils/distance"
import { chance, pickRandomIn } from "../../utils/random"
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

  const casterBlessings = pokemon.player?.blessings
  pokemon.getEffects(OnAbilityCastEffect).forEach((effect) => {
    effect.apply(pokemon, board, target, crit)
  })

  if (
    pokemon.types.has(Synergy.WATER) &&
    pokemon.player?.blessings?.includes(Blessing.ATLANTEAN_MAGIC)
  ) {
    pokemon.addAbilityPower(pokemon.stars, pokemon, 0, false, true)
  }

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

  if (
    isIn(Unowns, pokemon.name) &&
    pokemon.name !== Pkm.UNOWN_EXCLAMATION &&
    pokemon.name !== Pkm.UNOWN_Q &&
    pokemon.hasSynergyEffect(Synergy.PSYCHIC) &&
    casterBlessings?.includes(Blessing.HIEROGLYPHS) &&
    pokemon.player
  ) {
    const corners = [
      { x: 0, y: 0 },
      { x: board.columns - 1, y: 0 },
      { x: 0, y: board.rows - 1 },
      { x: board.columns - 1, y: board.rows - 1 }
    ]
    const availableCorners = corners
      .map((corner) =>
        board.getEntityOnCell(corner.x, corner.y) === undefined
          ? corner
          : board.getClosestAvailablePlace(corner.x, corner.y)
      )
      .filter((corner): corner is { x: number; y: number } => corner !== null)
      .filter(
        (corner, index, all) =>
          all.findIndex(
            (candidate) =>
              candidate.x === corner.x && candidate.y === corner.y
          ) === index
      )
    const enemies = board.cells.filter(
      (entity): entity is PokemonEntity =>
        entity !== undefined && entity.team !== pokemon.team && entity.hp > 0
    )
    const safety = (corner: { x: number; y: number }) =>
      enemies.length === 0
        ? 0
        : Math.min(
            ...enemies.map((enemy) =>
              distanceC(
                corner.x,
                corner.y,
                enemy.positionX,
                enemy.positionY
              )
            )
          )
    if (availableCorners.length > 0) {
      const safestDistance = Math.max(...availableCorners.map(safety))
      const safestCorners = availableCorners.filter(
        (corner) => safety(corner) === safestDistance
      )
      const corner = pickRandomIn(safestCorners)
      const summonableUnowns = Unowns.filter(
        (unown) =>
          unown !== Pkm.UNOWN_EXCLAMATION && unown !== Pkm.UNOWN_Q
      )
      const unown = pokemon.simulation.addPokemon(
        PokemonFactory.createPokemonFromName(
          pickRandomIn(summonableUnowns),
          pokemon.player
        ),
        corner.x,
        corner.y,
        pokemon.team,
        true
      )
      unown.maxPP = Math.max(1, Math.round(unown.maxPP * 0.5))
    }
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
