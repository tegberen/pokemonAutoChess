import { useTranslation } from "react-i18next"
import { WeatherRock, WeatherRocks } from "../../../../../types/enum/Item"
import { ItemDetailTooltip } from "../../../game/components/item-detail"
import { addIconsToDescription } from "../../utils/descriptions"

export function AwakeningCard({ rock }: { rock: WeatherRock }) {
  const { t } = useTranslation()
  return (
    <div className="wiki-awakening-card">
      <div
        className="wiki-awakening-card-header"
        data-tooltip-id="item-detail-tooltip"
        data-tooltip-content={rock}
      >
        <img src={`assets/item/${rock}.png`} alt={t(`item.${rock}`)} />
        <div className="wiki-awakening-card-title">
          <h3>{t(`item.${rock}`)}</h3>
          <span className="wiki-awakening-card-tag">
            <img src="/assets/icons/AWAKENING.svg" alt="" aria-hidden="true" />
            {t("wiki.weather.awakenings", { defaultValue: "Awakening" })}
          </span>
        </div>
      </div>
      <p className="description">
        {addIconsToDescription(t(`effect_description.CRYSTALLISE_${rock}`))}
      </p>
    </div>
  )
}

export default function WikiAwakening({
  onGoToWeather
}: {
  onGoToWeather?: () => void
}) {
  const { t } = useTranslation()
  return (
    <div id="wiki-awakening">
      <div className="my-box">
        <div className="wiki-awakening-heading">
          <h2>{t("wiki.weather.awakenings", { defaultValue: "Awakening" })}</h2>
          {onGoToWeather && (
            <button type="button" className="bubbly blue" onClick={onGoToWeather}>
              <img
                src="/assets/icons/weather/neutral.svg"
                alt=""
                aria-hidden="true"
              />
              {t("wiki.nav.weather_label")}
            </button>
          )}
        </div>
        <p className="description">
          {addIconsToDescription(t("effect_description.CRYSTALLISATION"))}
        </p>
      </div>
      <ul className="wiki-awakening-list">
        {WeatherRocks.map((rock) => (
          <li key={rock} className="my-box">
            <AwakeningCard rock={rock} />
          </li>
        ))}
      </ul>
      <ItemDetailTooltip />
    </div>
  )
}
