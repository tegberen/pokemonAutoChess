import { useTranslation } from "react-i18next"
import { WeatherRocks } from "../../../../../types/enum/Item"
import { ItemDetailTooltip } from "../../../game/components/item-detail"
import { addIconsToDescription } from "../../utils/descriptions"

export default function WikiAwakening() {
  const { t } = useTranslation()
  return (
    <div id="wiki-awakening">
      <div className="my-box">
        <h2>{t("wiki.weather.awakenings", { defaultValue: "Awakenings" })}</h2>
        <p className="description">
          {addIconsToDescription(t("effect_description.CRYSTALLISATION"))}
        </p>
      </div>
      <ul className="wiki-awakening-list">
        {WeatherRocks.map((rock) => (
          <li key={rock} className="wiki-awakening-card my-box">
            <div
              className="wiki-awakening-card-header"
              data-tooltip-id="item-detail-tooltip"
              data-tooltip-content={rock}
            >
              <img src={`assets/item/${rock}.png`} alt={t(`item.${rock}`)} />
              <h3>{t(`item.${rock}`)}</h3>
            </div>
            <p className="description">
              {addIconsToDescription(t(`effect_description.CRYSTALLISE_${rock}`))}
            </p>
          </li>
        ))}
      </ul>
      <ItemDetailTooltip />
    </div>
  )
}
