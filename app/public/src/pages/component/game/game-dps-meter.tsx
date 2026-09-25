import { useTranslation } from "react-i18next"
import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import { Team } from "../../../../../types/enum/Game"
import { DEPTH } from "../../../game/depths"
import { selectSpectatedPlayer, useAppSelector } from "../../../hooks"
import { usePreference } from "../../../preferences"
import DraggableWindow from "../modal/draggable-window"
import GamePlayerDpsMeter from "./game-player-dps-meter"
import GamePlayerDpsTakenMeter from "./game-player-dps-taken-meter"
import GamePlayerHpsMeter from "./game-player-hps-meter"
import "./game-dps-meter.css"

export default function GameDpsMeter() {
  const { t } = useTranslation()
  const spectatedPlayer = useAppSelector(selectSpectatedPlayer)
  const team = useAppSelector((state) => state.game.teamSpectated)
  const [showDpsMeter, setShowDpsMeter] = usePreference("showDpsMeter")
  const [dpsMeterPosition, setDpsMeterPosition] =
    usePreference("dpsMeterPosition")

  const blueDpsMeter = useAppSelector((state) => state.game.blueDpsMeter)
  const redDpsMeter = useAppSelector((state) => state.game.redDpsMeter)
  const myDpsMeter = team === Team.BLUE_TEAM ? blueDpsMeter : redDpsMeter
  const opponentDpsMeter = team === Team.BLUE_TEAM ? redDpsMeter : blueDpsMeter

  if (!spectatedPlayer || spectatedPlayer.opponentAvatar == "") return null

  return (
    <DraggableWindow
      title={t("game_stats.title")}
      className="my-container game-dps-meter"
      style={{ zIndex: DEPTH.DPS_METER }}
      defaultMinimized={!showDpsMeter}
      initialPosition={dpsMeterPosition}
      onToggleMinimize={(minimized) => setShowDpsMeter(!minimized)}
      onMove={(position) => setDpsMeterPosition(position)}
    >
      <Tabs>
        <TabList>
          <Tab key="damage_dealt">
            <img
              src="assets/icons/ATK.png"
              title={t("game_stats.damage_dealt")}
              alt={t("game_stats.damage_dealt")}
            ></img>
          </Tab>
          <Tab key="damage_blocked">
            <img
              src="assets/icons/SHIELD.png"
              title={t("game_stats.damage_blocked")}
              alt={t("game_stats.damage_blocked")}
            ></img>
          </Tab>
          <Tab key="heal">
            <img
              src="assets/icons/HP.png"
              title={t("game_stats.heal_shield")}
              alt={t("game_stats.heal_shield")}
            ></img>
          </Tab>
        </TabList>

        <TabPanel>
          <p>{t("game_stats.damage_dealt")}</p>
          <GamePlayerDpsMeter dpsMeter={myDpsMeter} />
          <GamePlayerDpsMeter dpsMeter={opponentDpsMeter} />
        </TabPanel>

        <TabPanel>
          <p>{t("game_stats.damage_blocked")}</p>
          <GamePlayerDpsTakenMeter dpsMeter={myDpsMeter} />
          <GamePlayerDpsTakenMeter dpsMeter={opponentDpsMeter} />
        </TabPanel>

        <TabPanel>
          <p>{t("game_stats.heal_shield")}</p>
          <GamePlayerHpsMeter dpsMeter={myDpsMeter} />
          <GamePlayerHpsMeter dpsMeter={opponentDpsMeter} />
        </TabPanel>
      </Tabs>
    </DraggableWindow>
  )
}
