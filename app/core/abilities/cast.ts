import PokemonFactory from "../../models/pokemon-factory"
import { Awakening } from "../../types/enum/Awakening"
import { Blessing } from "../../types/enum/Blessing"
import { Rarity } from "../../types/enum/Game"
import { Pkm } from "../../types/enum/Pokemon"
import { EffectEnum } from "../../types/enum/Effect"
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
