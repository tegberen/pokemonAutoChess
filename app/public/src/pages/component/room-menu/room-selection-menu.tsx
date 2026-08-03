import { useTranslation } from "react-i18next"
import { GADGETS } from "../../../../../config/game/gadgets"
import { Role } from "../../../../../types"
import {
  GameMode,
  type RoomRequest,
  WHIMSY_WEEKEND_REQUEST
} from "../../../../../types/enum/Game"
import { useAppSelector } from "../../../hooks"
import { Modal } from "../modal/modal"
import { BlessingEventBanner } from "../blessing-event/blessing-event"
import {
  useWhimsyWeekendWindow,
  WhimsyWeekendCountdown
} from "../whimsy-weekend/whimsy-weekend"
import "./room-selection-menu.css"

export function RoomSelectionMenu(props: {
  show: boolean
  onClose: () => void
  onSelectMode: (mode: RoomRequest) => void
}) {
  const { t } = useTranslation()
  const profile = useAppSelector((state) => state.network.profile)
  const profileLevel = profile?.level ?? 0
  const { active: whimsyWeekend } = useWhimsyWeekendWindow()

  return (
    <Modal
      show={props.show}
      onClose={props.onClose}
      className="room-selection-menu anchor-top"
      header={t("new_game")}
      body={
        <>
        <BlessingEventBanner />
        <ul>

          <li
            className="my-box"
            onClick={() => props.onSelectMode(GameMode.CUSTOM_LOBBY)}
          >
            <img
              src="assets/ui/game_modes/custom_lobby.png"
              alt={t(`game_modes.${GameMode.CUSTOM_LOBBY}`)}
              draggable="false"
            />
            <h2>{t(`game_modes.${GameMode.CUSTOM_LOBBY}`)}</h2>
            <p>{t(`game_modes_descriptions.${GameMode.CUSTOM_LOBBY}`)}</p>
          </li>
          <li
            className="my-box"
            onClick={() => props.onSelectMode(GameMode.DOUBLE_UP)}
          >
            <img
              src="assets/ui/game_modes/double_up.png"
              alt={t(`game_modes.${GameMode.DOUBLE_UP}`)}
              draggable="false"
            />
            <h2>{t(`game_modes.${GameMode.DOUBLE_UP}`)}</h2>
            <p>{t(`game_modes_descriptions.${GameMode.DOUBLE_UP}`)}</p>
          </li>
          {whimsyWeekend && (
            <li
              className="my-box"
              onClick={() => props.onSelectMode(WHIMSY_WEEKEND_REQUEST)}
            >
              <img
                src="assets/ui/game_modes/whimsy_weekend.png"
                alt={t("whimsy_weekend")}
                draggable="false"
              />
              <h2>{t("whimsy_weekend")}</h2>
              <p>{t("whimsy_weekend_description")}</p>
              <WhimsyWeekendCountdown />
            </li>
          )}
        </ul>
        </>
      }
    />
  )
}
