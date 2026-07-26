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
        <br />
        <table className="wiki-weather-awakenings">
          <tbody>
            {WeatherRocks.map((rock) => (
              <tr key={rock}>
                <td
                  style={{ whiteSpace: "nowrap", verticalAlign: "top" }}
                  data-tooltip-id="item-detail-tooltip"
                  data-tooltip-content={rock}
                >
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
      <ItemDetailTooltip />
    </div>
  )
}
