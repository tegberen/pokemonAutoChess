import type { RoomAvailable } from "@colyseus/sdk"
import { useTranslation } from "react-i18next"
import { type IGameMetadata, Role } from "../../../../../types"
import {
  GameMode,
  getGameModification
} from "../../../../../types/enum/Game"
import { useAppSelector } from "../../../hooks"
import { cc } from "../../utils/jsx"
import { GameModeIcon } from "../icons/game-mode-icon"
import { GameModificationIcon } from "../preparation/game-modification-banner"
import "./room-item.css"

export default function GameRoomItem(props: {
  room: RoomAvailable<IGameMetadata>
  click: (action: string) => void
}) {
  const { t } = useTranslation()
  const myUid = useAppSelector((state) => state.network.uid)
  const user = useAppSelector((state) => state.network.profile)
  const isAdmin = user?.role === Role.ADMIN
  const playerIds = props.room.metadata?.playerIds ?? []
  const spectate = playerIds.includes(myUid) === false

  const metadata = props.room.metadata
  // tournament games keep their bracket name (Qualification, Finals…) beside
  // the event tag; Daily Duels read like other rooms
  const showsModification =
    ((metadata?.gameMode === GameMode.CUSTOM_LOBBY ||
      metadata?.gameMode === GameMode.DOUBLE_UP) &&
      !metadata?.tournamentId) ||
    metadata?.dailyDuel === true
  const modification = getGameModification({
    blessingsEnabled: metadata?.blessingsEnabled ?? false,
    whimsy: metadata?.whimsy ?? false,
    specialGameRule: metadata?.specialGameRule ?? null
  })
  const modificationLabel = metadata?.specialGameRule
    ? t(`scribble.${metadata.specialGameRule}`)
    : t(`game_modification.${modification}`)

  const title = `${metadata?.name ?? ""}
${metadata?.ownerName ? "Owner: " + metadata.ownerName : ""}\n${metadata?.playersInfo?.join("\n")}`

  const isTournament = !!metadata?.tournamentId
  // Daily Duels and tournaments share the striped, sheened event look
  const isEvent = metadata?.dailyDuel === true || isTournament

  return (
    <div
      className={cc("room-folder", {
        "event-folder": isEvent,
        "tournament-folder": isTournament
      })}
    >
      <div className="room-folder-header" title={title}>
        <div className="room-folder-tab">
          {metadata?.gameMode && <GameModeIcon gameMode={metadata.gameMode} />}
        </div>
        <div className="room-mode">
          {showsModification && (
            <img
              alt=""
              aria-hidden="true"
              className="modification-icon"
              src={GameModificationIcon[modification]}
            />
          )}
          <span className="room-name">
            {showsModification ? modificationLabel : metadata?.name}
          </span>
          {isEvent && (
            <span className="game-event-tag">
              {metadata?.dailyDuel
                ? t("game_event_tag.DAILY_DUEL")
                : t("game_event_tag.TOURNAMENT")}
            </span>
          )}
        </div>
      </div>
      <div className={cc("room-item my-box", { "daily-duel": isEvent })}>
        {isTournament && (
          <img
            alt=""
            aria-hidden="true"
            className="tournament-icon"
            src="/assets/icons/fire_week_streak.svg"
          />
        )}
        <span className="room-info">
          {playerIds.length} {t("player")}
          {playerIds.length !== 1 ? "s" : ""}, {t("stage")}{" "}
          {metadata?.stageLevel}
        </span>
        {isAdmin && (
          <button
            title={t("delete_room")}
            onClick={() => {
              props.click("delete")
            }}
          >
            X
          </button>
        )}
        <button
          className={cc("bubbly", spectate ? "blue" : "green")}
          onClick={() => props.click(spectate ? "spectate" : "join")}
        >
          {spectate ? t("spectate") : t("reconnect")}
        </button>
      </div>
    </div>
  )
}
