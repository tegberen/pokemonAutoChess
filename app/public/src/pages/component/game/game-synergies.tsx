import { useTranslation } from "react-i18next"
import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import { DEPTH } from "../../../game/depths"
import { useAppSelector } from "../../../hooks"
import { usePreference } from "../../../preferences"
import DraggableWindow from "../modal/draggable-window"
import Synergies from "../synergy/synergies"
import WeatherForecast from "../synergy/weather-forecast"

export default function GameSynergies() {
  const synergies = useAppSelector((state) => state.game.synergiesSpectated)
  const { t } = useTranslation()
  const [synergiesPosition, setSynergiesPosition] =
    usePreference("synergiesPosition")

  return (
    <DraggableWindow
      title={t("effects")}
      className="my-container synergies-container"
      initialPosition={synergiesPosition}
      onMove={(position) => setSynergiesPosition(position)}
      style={{ zIndex: DEPTH.SYNERGIES_CONTAINER }}
    >
      <Tabs className="effects-tabs">
        <TabList>
          <Tab key="synergies">
            <img
              src="assets/icons/synergy_stats.svg"
              title={t("synergies")}
              alt={t("synergies")}
            />
          </Tab>
          <Tab key="weather">
            <img
              src="assets/icons/weather_stats.svg"
              title={t("weather_forecast")}
              alt={t("weather_forecast")}
            />
          </Tab>
        </TabList>
        <TabPanel>
          <Synergies synergies={synergies} tooltipPortal={true} />
        </TabPanel>
        <TabPanel>
          <WeatherForecast />
        </TabPanel>
      </Tabs>
    </DraggableWindow>
  )
}
