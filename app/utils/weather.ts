import type { MapSchema } from "@colyseus/schema"
import { WeatherThreshold } from "../config"
import type Player from "../models/colyseus-models/player"
import type { Pokemon } from "../models/colyseus-models/pokemon"
import { Item, WeatherByWeatherRocks } from "../types/enum/Item"
import { Passive } from "../types/enum/Passive"
import { Synergy } from "../types/enum/Synergy"
import {
  PassivesAssociatedToWeather,
  Weather,
  WeatherAssociatedToSynergy
} from "../types/enum/Weather"
import { count } from "./array"
import { hasKey } from "./map"
import { schemaValues } from "./schemas"

// Passives that boost a specific weather by +2 (on top of the +1 the unit gives
// from its matching synergy). A unit may carry one on either passive slot.
export const WeatherSupportPassives: Partial<Record<Passive, Weather>> = {
  [Passive.SANDSTORM_WEATHER_SUPPORT]: Weather.SANDSTORM,
  [Passive.RAIN_WEATHER_SUPPORT]: Weather.RAIN,
  [Passive.STORM_WEATHER_SUPPORT]: Weather.STORM,
  [Passive.SMOG_WEATHER_SUPPORT]: Weather.SMOG,
  [Passive.MISTY_WEATHER_SUPPORT]: Weather.MISTY,
  [Passive.SNOW_WEATHER_SUPPORT]: Weather.SNOW,
  [Passive.WINDY_WEATHER_SUPPORT]: Weather.WINDY,
  [Passive.NIGHT_WEATHER_SUPPORT]: Weather.NIGHT,
  [Passive.ZENITH_WEATHER_SUPPORT]: Weather.ZENITH,
  [Passive.DROUGHT_WEATHER_SUPPORT]: Weather.DROUGHT,
  [Passive.MURKY_WEATHER_SUPPORT]: Weather.MURKY,
  [Passive.BLOODMOON_WEATHER_SUPPORT]: Weather.BLOODMOON,
  [Passive.MAGNET_STORM_WEATHER_SUPPORT]: Weather.MAGNET_STORM,
  [Passive.PLAGUE_WEATHER_SUPPORT]: Weather.PLAGUE,
  [Passive.ECLIPSE_WEATHER_SUPPORT]: Weather.ECLIPSE,
  [Passive.FLOOD_WEATHER_SUPPORT]: Weather.FLOOD,
  [Passive.DISTORTION_WEATHER_SUPPORT]: Weather.DISTORTION,
  [Passive.CLOUDY_WEATHER_SUPPORT]: Weather.CLOUDY,
  [Passive.HARD_TERRAIN_WEATHER_SUPPORT]: Weather.TERRAIN,
  [Passive.BLOSSOM_WEATHER_SUPPORT]: Weather.BLOSSOM
}

export function getWeather(
  bluePlayer: Player,
  redPlayer: Player | null,
  redPlayerBoard: MapSchema<Pokemon, string>,
  isGhostBattle = false,
  // Castform town encounter lowers everyone's activation threshold by 1
  castformEncounter = false
): Weather {
  function getDominantWeather(
    count: Map<Weather, number>,
    weathers: Weather[] = [...count.keys()]
  ): Weather | null {
    const sortedCount = weathers
      .map((w) => [w, count.get(w) ?? 0] as [Weather, number])
      .sort((a, b) => b[1] - a[1])

    if (sortedCount.length === 0) return null
    if (sortedCount.length === 1) return sortedCount[0][0]
    if (sortedCount.length >= 2 && sortedCount[0][1] === sortedCount[1][1])
      return null
    return sortedCount[0][0]
  }

  const boardWeatherScore = new Map<Weather, number>()
  // per-player contributions, used to attribute the dominant weather to whoever
  // is driving it (so the *other* player's Utility Umbrellas oppose it)
  const blueWeatherScore = new Map<Weather, number>()
  const redWeatherScore = new Map<Weather, number>()

  // weather rocks
  for (const [player, playerScore] of [
    [bluePlayer, blueWeatherScore],
    [redPlayer, redWeatherScore]
  ] as const) {
    if (player === null) continue
    player.items.forEach((item) => {
      if (hasKey(WeatherByWeatherRocks, item)) {
        const weatherBoosted = WeatherByWeatherRocks.get(item)!
        boardWeatherScore.set(
          weatherBoosted,
          (boardWeatherScore.get(weatherBoosted) ?? 0) + 3
        )
        playerScore.set(
          weatherBoosted,
          (playerScore.get(weatherBoosted) ?? 0) + 3
        )
      }
    })
  }

  for (const board of [bluePlayer.board, redPlayerBoard]) {
    // reuse the persistent per-player map so it also feeds weather attribution
    const playerWeatherScore =
      board === bluePlayer.board ? blueWeatherScore : redWeatherScore
    board.forEach((pkm) => {
      if (pkm.positionY != 0) {

        for (const passive of [pkm.passive, pkm.passive2]) {
          const weather = [...PassivesAssociatedToWeather.keys()].find((key) =>
            PassivesAssociatedToWeather.get(key)!.includes(passive)
          )
          if (weather) {
            boardWeatherScore.set(
              weather,
              (boardWeatherScore.get(weather) ?? 0) + 100
            )
            playerWeatherScore.set(
              weather,
              (playerWeatherScore.get(weather) ?? 0) + 100
            )
          }
        }

        pkm.types.forEach((type) => {
          if (WeatherAssociatedToSynergy.has(type)) {
            const weather = WeatherAssociatedToSynergy.get(type)!
            boardWeatherScore.set(
              weather,
              (boardWeatherScore.get(weather) ?? 0) + 1
            )

            if (pkm.passive !== Passive.CASTFORM) {
              playerWeatherScore.set(
                weather,
                (playerWeatherScore.get(weather) ?? 0) + 1
              )
            }
          }
        })

        // A weather-support passive (on either slot) adds +2 to its weather,
        // regardless of synergy: a unit with the matching synergy reaches +3
        // (its +1 above plus this +2); one without still contributes +2.
        for (const p of [pkm.passive, pkm.passive2]) {
          const supportedWeather = WeatherSupportPassives[p]
          if (supportedWeather) {
            boardWeatherScore.set(
              supportedWeather,
              (boardWeatherScore.get(supportedWeather) ?? 0) + 2
            )
            playerWeatherScore.set(
              supportedWeather,
              (playerWeatherScore.get(supportedWeather) ?? 0) + 2
            )
          }
        }
      }
    })

    // apply special weather passives
    board.forEach((pkm) => {
      if (pkm.positionY != 0) {
        if (
          pkm.passive === Passive.CASTFORM &&
          !(isGhostBattle && board === redPlayerBoard)
        ) {
          const dominant = getDominantWeather(playerWeatherScore, [
            Weather.DROUGHT,
            Weather.ZENITH,
            Weather.RAIN,
            Weather.SNOW
          ])
          if (dominant) {
            boardWeatherScore.set(
              dominant,
              (boardWeatherScore.get(dominant) ?? 0) + 100
            )
          }
        }

        if (pkm.passive === Passive.TORNADUS) {
          const dominant =
            getDominantWeather(playerWeatherScore, [
              Weather.WINDY,
              Weather.SNOW
            ]) ?? Weather.WINDY
          boardWeatherScore.set(
            dominant,
            (boardWeatherScore.get(dominant) ?? 0) + 100
          )
        }

        if (pkm.passive === Passive.THUNDURUS) {
          const dominant =
            getDominantWeather(playerWeatherScore, [
              Weather.WINDY,
              Weather.STORM
            ]) ?? Weather.STORM
          boardWeatherScore.set(
            dominant,
            (boardWeatherScore.get(dominant) ?? 0) + 100
          )
        }

        if (pkm.passive === Passive.LANDORUS) {
          const dominant =
            getDominantWeather(playerWeatherScore, [
              Weather.WINDY,
              Weather.SANDSTORM
            ]) ?? Weather.SANDSTORM
          boardWeatherScore.set(
            dominant,
            (boardWeatherScore.get(dominant) ?? 0) + 100
          )
        }

        if (pkm.passive === Passive.ENAMORUS) {
          const dominant =
            getDominantWeather(playerWeatherScore, [
              Weather.WINDY,
              Weather.MISTY
            ]) ?? Weather.MISTY
          boardWeatherScore.set(
            dominant,
            (boardWeatherScore.get(dominant) ?? 0) + 100
          )
        }

        if (pkm.passive === Passive.RAIN_OR_STORM) {
          const dominant =
            getDominantWeather(playerWeatherScore, [
              Weather.RAIN,
              Weather.STORM
            ]) ?? Weather.RAIN
          boardWeatherScore.set(
            dominant,
            (boardWeatherScore.get(dominant) ?? 0) + 100
          )
        }

        if (pkm.passive === Passive.DROUGHT_OR_SANDSTORM) {
          const dominant =
            getDominantWeather(playerWeatherScore, [
              Weather.DROUGHT,
              Weather.SANDSTORM
            ]) ?? Weather.DROUGHT
          boardWeatherScore.set(
            dominant,
            (boardWeatherScore.get(dominant) ?? 0) + 100
          )
        }

        if (pkm.passive === Passive.DROUGHT_OR_ZENITH) {
          const nbLight = schemaValues(board).filter((p) =>
            p.types.has(Synergy.LIGHT)
          ).length
          const nbFire = schemaValues(board).filter((p) =>
            p.types.has(Synergy.FIRE)
          ).length
          const dominant = nbLight >= nbFire ? Weather.ZENITH : Weather.DROUGHT
          boardWeatherScore.set(
            dominant,
            (boardWeatherScore.get(dominant) ?? 0) + 100
          )
        }

        if (pkm.passive === Passive.ECLIPSE_OR_MAGNET_STORM) {
          const nbPsychic = schemaValues(board).filter((p) =>
            p.types.has(Synergy.PSYCHIC)
          ).length
          const nbSteel = schemaValues(board).filter((p) =>
            p.types.has(Synergy.STEEL)
          ).length
          const dominant =
            nbPsychic >= nbSteel ? Weather.ECLIPSE : Weather.MAGNET_STORM
          boardWeatherScore.set(
            dominant,
            (boardWeatherScore.get(dominant) ?? 0) + 100
          )
        }

        if (pkm.passive === Passive.ECLIPSE_OR_MURKY) {
          const nbPsychic = schemaValues(board).filter((p) =>
            p.types.has(Synergy.PSYCHIC)
          ).length
          const nbGhost = schemaValues(board).filter((p) =>
            p.types.has(Synergy.GHOST)
          ).length
          const dominant =
            nbPsychic >= nbGhost ? Weather.ECLIPSE : Weather.MURKY
          boardWeatherScore.set(
            dominant,
            (boardWeatherScore.get(dominant) ?? 0) + 100
          )
        }

        if (pkm.passive === Passive.ECLIPSE_OR_NIGHT) {
          const nbPsychic = schemaValues(board).filter((p) =>
            p.types.has(Synergy.PSYCHIC)
          ).length
          const nbDark = schemaValues(board).filter((p) =>
            p.types.has(Synergy.DARK)
          ).length
          const dominant =
            nbPsychic >= nbDark ? Weather.ECLIPSE : Weather.NIGHT
          boardWeatherScore.set(
            dominant,
            (boardWeatherScore.get(dominant) ?? 0) + 100
          )
        }
      }
    })
  }

  //logger.debug("boardWeatherScore", boardWeatherScore)
  const dominantWeather = getDominantWeather(boardWeatherScore)
  if (dominantWeather) {
    // whoever contributes more owns the weather; the opposing player's Utility
    // Umbrellas raise the count needed to activate it
    const blueContribution = blueWeatherScore.get(dominantWeather) ?? 0
    const redContribution = redWeatherScore.get(dominantWeather) ?? 0
    const opponent = blueContribution >= redContribution ? redPlayer : bluePlayer
    const umbrellas = opponent
      ? count(opponent.items, Item.UTILITY_UMBRELLA)
      : 0

    const threshold =
      WeatherThreshold[dominantWeather] -
      (castformEncounter ? 1 : 0) +
      umbrellas

    if ((boardWeatherScore.get(dominantWeather) ?? 0) >= threshold) {
      return dominantWeather
    }
  }
  return Weather.NEUTRAL
}
