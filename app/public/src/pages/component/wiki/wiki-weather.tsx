import { useTranslation } from "react-i18next"
import { Tooltip } from "react-tooltip"

import { WeatherThreshold } from "../../../../../config"
import {
  getPokemonData,
  PRECOMPUTED_POKEMONS_DATA
} from "../../../../../models/precomputed/precomputed-pokemon-data"
import {
  WeatherRock,
  WeatherRocksByWeather
} from "../../../../../types/enum/Item"
import { Pkm, PkmFamily } from "../../../../../types/enum/Pokemon"
import {
  SynergyAssociatedToWeather,
  Weather
} from "../../../../../types/enum/Weather"
import { getPortraitSrc } from "../../../../../utils/avatar"
import { WeatherSupportPassives } from "../../../../../utils/weather"
import { usePreferences } from "../../../preferences"
import { ItemDetailTooltip } from "../../../game/components/item-detail"
import { addIconsToDescription } from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import { Checkbox } from "../checkbox/checkbox"
import { GamePokemonDetailTooltip } from "../game/game-pokemon-detail"
import SynergyIcon from "../icons/synergy-icon"
import { AwakeningCard } from "./wiki-awakening"

export default function WikiWeather({
  onGoToAwakening
}: {
  onGoToAwakening?: () => void
}) {
  const { t } = useTranslation()
  const [preferences, setPreferences] = usePreferences()
  return (
    <div id="wiki-weather">
      <div className="my-box" style={{ marginBottom: "0.5em" }}>
        <p>{t("wiki.weather.weather_dominant_hint")}</p>
        <p>{t("wiki.weather.weather_dominant_hint2")}</p>
      </div>
      <div className="wiki-weather-toolbar">
        <Checkbox
          checked={preferences.showEvolutions}
          onToggle={(checked) => setPreferences({ showEvolutions: checked })}
          label={t("show_evolutions")}
          isDark
        />
        <Checkbox
          checked={preferences.showWeatherRocks}
          onToggle={(checked) => setPreferences({ showWeatherRocks: checked })}
          label={t("show_weather_rocks")}
          isDark
        />
        {onGoToAwakening && (
          <button
            type="button"
            className="bubbly blue"
            onClick={onGoToAwakening}
            style={{ marginLeft: "auto" }}
          >
            <img src="/assets/icons/AWAKENING.svg" alt="" aria-hidden="true" />
            {t("wiki.weather.awakenings", { defaultValue: "Awakening" })}
          </button>
        )}
      </div>
      <ul>
        {Object.values(Weather)
          .sort((a, b) => t(`weather.${a}`).localeCompare(t(`weather.${b}`)))
          .map((weather: Weather) => (
          <li key={weather} className="my-box">
            <header>
              <img
                className="weather-icon"
                src={`/assets/icons/weather/${weather.toLowerCase()}.svg`}
              />
              <h2>{t(`weather.${weather}`)}</h2>
              <span
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                {WeatherThreshold[weather]}
                <SynergyIcon type={SynergyAssociatedToWeather.get(weather)!} />
              </span>
            </header>
            <p className="description">
              {addIconsToDescription(t(`weather_description.${weather}`))}
            </p>
            <ul>
              {(pokemonsInfluencingWeather.get(weather) ?? [])
                .map((p) => getPokemonData(p))
                .map((p) => (
                  <li key={p.index}>
                    <div
                      key={p.name}
                      className={cc("pokemon-portrait", {
                        additional: p.additional,
                        regional: p.regional
                      })}
                      data-tooltip-id="game-pokemon-detail-tooltip"
                      data-tooltip-content={p.name}
                    >
                      <img
                        src={getPortraitSrc(p.index)}
                        decoding="async"
                        width={40}
                        height={40}
                      />
                    </div>
                  </li>
                ))}
            </ul>
            {((weatherSupportPokemons.get(weather) ?? []).length > 0 ||
              (preferences.showWeatherRocks &&
                WeatherRocksByWeather.get(weather))) && (
              <div className="weather-support">
                <ul>
                  {(preferences.showEvolutions
                    ? weatherSupportPokemons.get(weather) ?? []
                    : familyRepresentatives(
                        weatherSupportPokemons.get(weather) ?? []
                      )
                  )
                    .map((p) => getPokemonData(p))
                    .map((p) => (
                      <li key={p.index}>
                        <div
                          key={p.name}
                          className={cc("pokemon-portrait", {
                            additional: p.additional,
                            regional: p.regional
                          })}
                          data-tooltip-id="game-pokemon-detail-tooltip"
                          data-tooltip-content={p.name}
                        >
                          <img
                            src={getPortraitSrc(p.index)}
                            decoding="async"
                            width={40}
                            height={40}
                          />
                        </div>
                      </li>
                    ))}
                  {preferences.showWeatherRocks &&
                    WeatherRocksByWeather.get(weather) && (
                      <li key="weather-rock" className="weather-rock-cell">
                        <img
                          className="weather-awakening-icon"
                          src="/assets/icons/AWAKENING.svg"
                          data-tooltip-id="weather-awakening-tooltip"
                          data-tooltip-content={WeatherRocksByWeather.get(
                            weather
                          )}
                        />
                        <img
                          className="weather-rock"
                          src={`assets/item/${WeatherRocksByWeather.get(weather)}.png`}
                          data-tooltip-id="item-detail-tooltip"
                          data-tooltip-content={WeatherRocksByWeather.get(
                            weather
                          )}
                        />
                      </li>
                    )}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>

      <GamePokemonDetailTooltip origin="wiki" />
      <ItemDetailTooltip showAwakening={false} />
      <Tooltip
        id="weather-awakening-tooltip"
        className="custom-theme-tooltip"
        render={({ content }) =>
          content ? (
            <div className="weather-awakening-tooltip-card">
              <AwakeningCard rock={content as WeatherRock} />
            </div>
          ) : null
        }
      />
    </div>
  )
}

const pokemonsInfluencingWeather = new Map([
  [Weather.ZENITH, [Pkm.SOLROCK, Pkm.CASTFORM_SUN]],
  [
    Weather.DROUGHT,
    [Pkm.PRIMAL_GROUDON, Pkm.MOLTRES, Pkm.SOLROCK, Pkm.CASTFORM_SUN]
  ],
  [Weather.NIGHT, [Pkm.SHADOW_LUGIA, Pkm.LUNATONE]],
  [Weather.WINDY, [Pkm.LANDORUS, Pkm.THUNDURUS, Pkm.TORNADUS, Pkm.ENAMORUS]],
  [Weather.MISTY, [Pkm.ENAMORUS]],
  [Weather.RAIN, [Pkm.PRIMAL_KYOGRE, Pkm.CASTFORM_RAIN]],
  [Weather.SNOW, [Pkm.ARTICUNO, Pkm.CASTFORM_HAIL, Pkm.TORNADUS]],
  [Weather.STORM, [Pkm.ZAPDOS, Pkm.THUNDURUS, Pkm.PRIMAL_KYOGRE, Pkm.MEGA_DRAMPA]],
  [Weather.SANDSTORM, [Pkm.LANDORUS, Pkm.PRIMAL_GROUDON]],
  [Weather.NEUTRAL, [Pkm.MEGA_RAYQUAZA]],
  [Weather.MAGNET_STORM, [Pkm.SOLGALEO]],
  [Weather.MURKY, [Pkm.LUNALA]],
  [Weather.BLOODMOON, [Pkm.URSALUNA_BLOODMOON]],
  [Weather.ECLIPSE, [Pkm.SOLGALEO, Pkm.LUNALA, Pkm.LUNATONE]],
  [Weather.FLOOD, [Pkm.LUGIA]],
  [Weather.ELDER_STORM, [Pkm.ETERNATUS]],
  [Weather.BLOSSOM, [Pkm.SHAYMIN_SKY]]
])

// All Pokémon that boost a weather via a *_WEATHER_SUPPORT passive (on either
// slot), sorted base→final within each weather.
const weatherSupportPokemons: Map<Weather, Pkm[]> = (() => {
  const result = new Map<Weather, Pkm[]>()
  for (const name of Object.keys(PRECOMPUTED_POKEMONS_DATA) as Pkm[]) {
    const data = PRECOMPUTED_POKEMONS_DATA[name]!
    const weather =
      WeatherSupportPassives[data.passive] ??
      WeatherSupportPassives[data.passive2]
    if (!weather) continue
    const list = result.get(weather) ?? []
    list.push(name)
    result.set(weather, list)
  }
  result.forEach((list) =>
    list.sort(
      (a, b) =>
        (PRECOMPUTED_POKEMONS_DATA[a]?.stars ?? 0) -
        (PRECOMPUTED_POKEMONS_DATA[b]?.stars ?? 0)
    )
  )
  return result
})()

// Collapse an evolution line to one representative (lowest-star) per family.
function familyRepresentatives(pokemons: Pkm[]): Pkm[] {
  const best = new Map<Pkm, Pkm>()
  for (const name of pokemons) {
    const family = PkmFamily[name] ?? name
    const current = best.get(family)
    if (
      !current ||
      (PRECOMPUTED_POKEMONS_DATA[name]?.stars ?? Infinity) <
        (PRECOMPUTED_POKEMONS_DATA[current]?.stars ?? Infinity)
    ) {
      best.set(family, name)
    }
  }
  return [...best.values()]
}
