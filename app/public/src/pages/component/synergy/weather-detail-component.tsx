import { useTranslation } from "react-i18next"
import {
  SynergyAssociatedToWeather,
  Weather
} from "../../../../../types/enum/Weather"
import { addIconsToDescription } from "../../utils/descriptions"
import SynergyIcon from "../icons/synergy-icon"

export default function WeatherDetailComponent(props: {
  weather: Weather
  score: number
  threshold: number
}) {
  const { t } = useTranslation()
  const synergy = SynergyAssociatedToWeather.get(props.weather)
  return (
    <div
      style={{
        minWidth: "250px",
        maxWidth: "360px",
        padding: "4px 6px",
        lineHeight: 1.5
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <img
          src={`/assets/icons/weather/${props.weather.toLowerCase()}.svg`}
          alt={props.weather}
          style={{ width: "36px", height: "36px" }}
        />
        <h3 style={{ margin: 0 }}>{t(`weather.${props.weather}`)}</h3>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginLeft: "auto"
          }}
        >
          {props.score}/{props.threshold}
          {synergy && <SynergyIcon type={synergy} />}
        </span>
      </div>
      <p style={{ whiteSpace: "pre-wrap", margin: "0.6em 0 0.2em" }}>
        {addIconsToDescription(t(`weather_description.${props.weather}`))}
      </p>
    </div>
  )
}
