import type { RoomAvailable } from "@colyseus/sdk"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { EloRankThreshold, MAX_PLAYERS_PER_GAME } from "../../../../../config"
import { GADGETS } from "../../../../../config/game/gadgets"
import { type IPreparationMetadata, Role } from "../../../../../types"
import type { EloRank } from "../../../../../types/enum/EloRank"
import {
  GameMode,
  getGameModification
} from "../../../../../types/enum/Game"
import { formatMinMaxRanks, getRank } from "../../../../../utils/elo"
import { useAppSelector } from "../../../hooks"
import { cc } from "../../utils/jsx"
import { GameModeIcon } from "../icons/game-mode-icon"
import { GameModificationIcon } from "../preparation/game-modification-banner"
import "./room-item.css"

export default function RoomItem(props: {
  room: RoomAvailable<IPreparationMetadata>
  click: (action: string) => void
}) {
  const { t } = useTranslation()
  const user = useAppSelector((state) => state.network.profile)
  const isAdmin = user?.role === Role.ADMIN

  const nbPlayersExpected =
    props.room.metadata?.whitelist && props.room.metadata.whitelist.length > 0
      ? props.room.metadata?.whitelist.length
      : MAX_PLAYERS_PER_GAME

  let canJoin = true,
    disabledReason: string | null = null
  if (props.room.clients >= nbPlayersExpected) {
    canJoin = false
    disabledReason = t("room_menu.game_full")
  } else if (props.room.metadata?.gameStartedAt != null) {
    canJoin = false
    disabledReason = t("room_menu.game_already_started")
  } else if (
    props.room.metadata?.blacklist &&
    props.room.metadata.blacklist.length > 0 &&
    user?.uid &&
    props.room.metadata.blacklist.includes(user.uid) === true
  ) {
    canJoin = false
    disabledReason = t("room_menu.blacklisted")
  } else if (
    props.room.metadata?.whitelist &&
    props.room.metadata.whitelist.length > 0 &&
    user?.uid &&
    props.room.metadata.whitelist.includes(user.uid) === false
  ) {
    canJoin = false
    disabledReason = t("errors.USER_NOT_WHITELISTED")
  } else if (
    props.room.metadata?.minRank != null &&
    (user?.elo ?? 0) < EloRankThreshold[props.room.metadata.minRank as EloRank]
  ) {
    canJoin = false
    disabledReason = t("room_menu.min_rank_not_reached")
  } else if (
    props.room.metadata?.maxRank != null &&
    user?.elo &&
    EloRankThreshold[getRank(user.elo)] >
      EloRankThreshold[props.room.metadata?.maxRank as EloRank]
  ) {
    canJoin = false
    disabledReason = t("room_menu.max_rank_not_reached")
  } else if (
    props.room.metadata?.gameMode === GameMode.RANKED &&
    (!user || user.level < GADGETS.certificate.levelRequired)
  ) {
    canJoin = false
    disabledReason = t("room_menu.ranked_mode_locked", {
      requiredLevel: GADGETS.certificate.levelRequired
    })
  }
  if (user?.role === Role.ADMIN) {
    canJoin = true
  }

  const title = `${props.room.metadata?.ownerName ? "Owner: " + props.room.metadata?.ownerName : ""}\n${props.room.metadata?.playersInfo?.join("\n")}`
  const [joining, setJoining] = useState<boolean>(false)

  if (props.room.metadata?.dailyDuel) {
    return (
      <div className="room-item daily-duel my-box">
        <img
          alt=""
          aria-hidden="true"
          className="icon"
          src="/assets/icons/blessing_stats.svg"
        />
        <span className="room-name" title={title}>
          <b>{props.room.metadata.name}</b>
          <small>{t("daily_duel_room_hint")}</small>
        </span>
        <span className="daily-duel-count">
          {props.room.clients}/{nbPlayersExpected}
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
          title={disabledReason ?? t("join")}
          disabled={!canJoin || joining}
          className={cc("bubbly", joining ? "loading" : "", "green")}
          onClick={() => {
            if (canJoin && !joining) {
              props.click("join")
              setJoining(true)
              setTimeout(() => setJoining(false), 3000)
            }
          }}
        >
          {t("join")}
        </button>
      </div>
    )
  }

  const metadata = props.room.metadata
  // Solo and Duo rooms are named after their game mode, like their lobby header
  // tournament rooms keep their bracket name (Qualification, Finals…)
  const showsModification =
    (metadata?.gameMode === GameMode.CUSTOM_LOBBY ||
      metadata?.gameMode === GameMode.DOUBLE_UP) &&
    !metadata?.tournamentId
  const modification = getGameModification({
    blessingsEnabled: metadata?.blessingsEnabled ?? false,
    whimsy: metadata?.whimsy ?? false,
    specialGameRule: metadata?.specialGameRule ?? null
  })
  const modificationLabel = metadata?.specialGameRule
    ? t(`scribble.${metadata.specialGameRule}`)
    : t(`game_modification.${modification}`)
  const isTournament = !!metadata?.tournamentId

  return (
    <div
      className={cc("room-folder", {
        "event-folder": isTournament,
        "tournament-folder": isTournament
      })}
      title={title}
    >
      <div className="room-folder-header">
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
            {formatMinMaxRanks(
              metadata?.minRank as EloRank | null,
              metadata?.maxRank as EloRank | null
            ) + " "}
            {showsModification ? modificationLabel : metadata?.name}
          </span>
        </div>
      </div>
      <div className={cc("room-item my-box", { "daily-duel": isTournament })}>
        {isTournament && (
          <img
            alt=""
            aria-hidden="true"
            className="tournament-icon"
            src="/assets/icons/fire_week_streak.svg"
          />
        )}
        <span className="room-info">
          {props.room.clients}/{nbPlayersExpected}
        </span>
        {(metadata?.gameMode === GameMode.CUSTOM_LOBBY ||
          metadata?.gameMode === GameMode.DOUBLE_UP) &&
          metadata?.scribbleExtended && (
            <span className="hp-badge" title={t("player_hp")}>
              150 HP
            </span>
          )}
        {metadata?.passwordProtected && (
          <img
            alt={t("private")}
            title={t("password_protected")}
            className="lock icon"
            src="/assets/ui/lock.svg"
          />
        )}
        {metadata?.minRank && (
          <img
            alt={t("minimum_rank")}
            title={t("minimum_rank") + ": " + t(`elorank.${metadata.minRank}`)}
            className="rank icon"
            src={"/assets/ranks/" + metadata.minRank + ".svg"}
          />
        )}
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
          title={disabledReason ?? t("join")}
          disabled={!canJoin || joining}
          className={cc(
            "bubbly",
            joining ? "loading" : "",
            metadata?.passwordProtected ? "orange" : "green"
          )}
          onClick={() => {
            if (canJoin && !joining) {
              props.click("join")
              setJoining(true)
              setTimeout(() => setJoining(false), 3000)
            }
          }}
        >
          {t("join")}
        </button>
      </div>
    </div>
  )
}
