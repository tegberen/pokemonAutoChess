import { MapSchema } from "@colyseus/schema"
import { useState } from "react"
import ReactDOM from "react-dom"
import { useTranslation } from "react-i18next"
import { Tooltip } from "react-tooltip"
import type Player from "../../../../../models/colyseus-models/player"
import type { Pokemon } from "../../../../../models/colyseus-models/pokemon"
import { GamePhaseState } from "../../../../../types/enum/Game"
import { Item } from "../../../../../types/enum/Item"
import { Weather } from "../../../../../types/enum/Weather"
import { count } from "../../../../../utils/array"
import { getPlayerWeatherScores, getWeather } from "../../../../../utils/weather"
import { selectSpectatedPlayer, useAppSelector } from "../../../hooks"
import { Blessing } from "../../../../../types/enum/Blessing"
import WeatherDetailComponent from "./weather-detail-component"
import "./weather-forecast.css"

export default function WeatherForecast() {
  const { t } = useTranslation()
  const [hoveredWeather, setHoveredWeather] = useState<{
    weather: Weather
    score: number
    threshold: number
  } | null>(null)
  const spectatedPlayer = useAppSelector(selectSpectatedPlayer)
  const players = useAppSelector((state) => state.game.players)
  const baseThreshold = useAppSelector((state) => state.game.weatherThreshold)
  const phase = useAppSelector((state) => state.game.phase)
  const blessingsByPlayerId = useAppSelector(
    (state) => state.game.blessingsByPlayerId
  )
  useAppSelector((state) => state.game.synergiesSpectated)

  if (!spectatedPlayer) return null

  // store board/items can be plain JSON clones (no schema .forEach) until the
  // first onChange fires, e.g. for a spectator joining mid-game
  const isSchema = (s: unknown): boolean =>
    typeof (s as { forEach?: unknown } | null)?.forEach === "function"

  const opponent =
    phase === GamePhaseState.FIGHT && spectatedPlayer.opponentId
      ? players.find((p) => p.id === spectatedPlayer.opponentId)
      : undefined

  const forecastWeight = (playerId: string) =>
    blessingsByPlayerId[playerId]?.includes(Blessing.FORECAST) ? 2 : 1

  const myScores =
    isSchema(spectatedPlayer.board) && isSchema(spectatedPlayer.items)
      ? getPlayerWeatherScores(
          spectatedPlayer.board,
          spectatedPlayer.items,
          forecastWeight(spectatedPlayer.id)
        )
      : new Map<Weather, number>()
  const opponentScores =
    opponent && isSchema(opponent.board) && isSchema(opponent.items)
      ? getPlayerWeatherScores(
          opponent.board,
          opponent.items,
          forecastWeight(opponent.id)
        )
      : new Map<Weather, number>()

  const myUmbrellas = isSchema(spectatedPlayer.items)
    ? count(spectatedPlayer.items, Item.UTILITY_UMBRELLA)
    : 0
  const opponentUmbrellas =
    opponent && isSchema(opponent.items)
      ? count(opponent.items, Item.UTILITY_UMBRELLA)
      : 0

  const canResolve =
    isSchema(spectatedPlayer.board) &&
    isSchema(spectatedPlayer.items) &&
    (!opponent || (isSchema(opponent.board) && isSchema(opponent.items)))
  const predicted = canResolve
    ? getWeather(
        spectatedPlayer as unknown as Player,
        (opponent as unknown as Player) ?? null,
        (opponent?.board as MapSchema<Pokemon, string>) ??
          new MapSchema<Pokemon, string>(),
        false,
        baseThreshold < 8
      )
    : Weather.NEUTRAL

  const weathers = new Set([...myScores.keys(), ...opponentScores.keys()])
  const forecast = [...weathers]
    .map((weather) => {
      const mine = myScores.get(weather) ?? 0
      const theirs = opponentScores.get(weather) ?? 0
      const nonOwnerUmbrellas = mine >= theirs ? opponentUmbrellas : myUmbrellas
      return {
        weather,
        score: mine + theirs,
        threshold: baseThreshold + nonOwnerUmbrellas,
        predicted: weather === predicted && predicted !== Weather.NEUTRAL
      }
    })
    .filter((f) => f.weather !== Weather.NEUTRAL && f.score > 0)
    .sort((a, b) => Number(b.predicted) - Number(a.predicted) || b.score - a.score)

  if (forecast.length === 0) {
    return null
  }

  const tooltip = (
    <Tooltip
      id="detail-weather-forecast"
      hidden={hoveredWeather === null}
      className="custom-theme-tooltip"
      place="right-start"
      delayShow={100}
      delayHide={0}
    >
      {hoveredWeather && (
        <WeatherDetailComponent
          weather={hoveredWeather.weather}
          score={hoveredWeather.score}
          threshold={hoveredWeather.threshold}
        />
      )}
    </Tooltip>
  )

  return (
    <div className="weather-forecast">
      <ul>
        {forecast.map(({ weather, score, threshold, predicted }) => (
          <li
            key={weather}
            className={predicted ? "active" : ""}
            data-tooltip-id="detail-weather-forecast"
            onMouseEnter={() => setHoveredWeather({ weather, score, threshold })}
            onMouseLeave={() => setHoveredWeather(null)}
          >
            <img
              src={`/assets/icons/weather/${weather.toLowerCase()}.svg`}
              alt={weather}
            />
            <div className="weather-forecast-info">
              <p className="weather-forecast-label">
                <span className="weather-forecast-name">
                  {t(`weather.${weather}`)}
                </span>
                {!predicted && (
                  <span className="weather-forecast-count">
                    {score}/{threshold}
                  </span>
                )}
              </p>
              <div className="weather-forecast-bar">
                <div
                  className="weather-forecast-bar-fill"
                  style={{
                    width: predicted
                      ? "100%"
                      : `${Math.min(100, (score / threshold) * 100)}%`
                  }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      {ReactDOM.createPortal(tooltip, document.body)}
    </div>
  )
}
