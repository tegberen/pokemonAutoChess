import { useTranslation } from "react-i18next"

import { WeatherThreshold } from "../../../../../config"
import {
  getPokemonData,
  PRECOMPUTED_POKEMONS_DATA
} from "../../../../../models/precomputed/precomputed-pokemon-data"
import { WeatherRocks } from "../../../../../types/enum/Item"
import { Pkm, PkmFamily } from "../../../../../types/enum/Pokemon"
import {
  SynergyAssociatedToWeather,
  Weather
} from "../../../../../types/enum/Weather"
import { getPortraitSrc } from "../../../../../utils/avatar"
import { WeatherSupportPassives } from "../../../../../utils/weather"
import { usePreferences } from "../../../preferences"
import { addIconsToDescription } from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import { Checkbox } from "../checkbox/checkbox"
import { GamePokemonDetailTooltip } from "../game/game-pokemon-detail"
import SynergyIcon from "../icons/synergy-icon"

export default function WikiWeather() {
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
      </div>
      <ul>
        {Object.values(Weather).map((weather: Weather) => (
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
                      <img src={getPortraitSrc(p.index)} />
                    </div>
                  </li>
                ))}
            </ul>
            {(weatherSupportPokemons.get(weather) ?? []).length > 0 && (
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
                          <img src={getPortraitSrc(p.index)} />
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="my-box" style={{ marginTop: "0.5em" }}>
        <h2>{t("wiki.weather.awakenings", { defaultValue: "Awakenings" })}</h2>
        <p className="description">
          {addIconsToDescription(t("effect_description.CRYSTALLISATION"))}
        </p>
        <br />
        <table className="wiki-weather-awakenings">
          <tbody>
            {WeatherRocks.map((rock) => (
              <tr key={rock}>
                <td style={{ whiteSpace: "nowrap", verticalAlign: "top" }}>
                  <img
                    src={`assets/item/${rock}.png`}
                    alt={t(`item.${rock}`)}
                    style={{ width: "40px", verticalAlign: "middle" }}
                  />{" "}
                  {t(`item.${rock}`)}
                </td>
                <td className="description">
                  {addIconsToDescription(
                    t(`effect_description.CRYSTALLISE_${rock}`)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <GamePokemonDetailTooltip origin="wiki" />
    </div>
  )
}

const pokemonsInfluencingWeather = new Map([
  [Weather.ZENITH, [Pkm.SHAYMIN_SKY, Pkm.SOLROCK, Pkm.CASTFORM_SUN]],
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
  [Weather.BLOSSOM, [Pkm.XERNEAS]]
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
