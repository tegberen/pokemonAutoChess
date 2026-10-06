import { Passive } from "../../types/enum/Passive"
import { Weather } from "../../types/enum/Weather"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class QuiverDanceStrategy extends AbilityStrategy {
  requiresTarget = false
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    super.process(pokemon, board, target, crit)
    const weather = pokemon.simulation.weather
    const isWormadam = pokemon.passive === Passive.WORMADAM
    const boostedIn = (boostedWeather: Weather) =>
      isWormadam && weather === boostedWeather ? 1.5 : 1
    const attackAndSpecialDefenseGain = [3, 4, 5, 10][pokemon.stars - 1] ?? 10
    const speedGain = [10, 10, 10, 15][pokemon.stars - 1] ?? 15
    pokemon.addAttack(
      attackAndSpecialDefenseGain * boostedIn(Weather.ZENITH),
      pokemon,
      1,
      crit
    )
    pokemon.addSpecialDefense(
      attackAndSpecialDefenseGain * boostedIn(Weather.SANDSTORM),
      pokemon,
      1,
      crit
    )
    pokemon.addSpeed(
      speedGain * boostedIn(Weather.DISTORTION),
      pokemon,
      1,
      crit
    )
    pokemon.addAbilityPower(20, pokemon, 0, false)
  }
}
