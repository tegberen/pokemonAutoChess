import { useTranslation } from "react-i18next"
import { GameMode, type RoomRequest } from "../../../../../types/enum/Game"
import { Modal } from "../modal/modal"
import "./room-selection-menu.css"

export function RoomSelectionMenu(props: {
  show: boolean
  onClose: () => void
  onSelectMode: (mode: RoomRequest) => void
}) {
  const { t } = useTranslation()

  return (
    <Modal
      show={props.show}
      onClose={props.onClose}
      className="room-selection-menu anchor-top"
      header={t("new_game")}
      body={
        <ul>
          <li
            className="my-box room-choice-card"
            onClick={() => props.onSelectMode(GameMode.CUSTOM_LOBBY)}
          >
            <div
              className="room-choice-art solo-art"
              style={{
                backgroundImage: "url(assets/ui/cards/solo_card.jpeg)"
              }}
            />
            <div className="room-choice-caption">
              <h2>{t("new_game_solo")}</h2>
              <p>{t("new_game_solo_description")}</p>
            </div>
          </li>
          <li
            className="my-box room-choice-card"
            onClick={() => props.onSelectMode(GameMode.DOUBLE_UP)}
          >
            <div
              className="room-choice-art duo-art"
              style={{
                backgroundImage: "url(assets/ui/cards/duo_card.png)"
              }}
            />
            <div className="room-choice-caption">
              <h2>{t("new_game_duo")}</h2>
              <p>{t("new_game_duo_description")}</p>
            </div>
          </li>
        </ul>
      }
    />
  )
}
