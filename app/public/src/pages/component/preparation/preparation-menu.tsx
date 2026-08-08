import firebase from "firebase/compat/app"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  EloRankThreshold,
  MAX_PLAYERS_PER_GAME
} from "../../../../../config"
import type { IGameUser } from "../../../../../models/colyseus-models/game-user"
import { Role } from "../../../../../types"
import { EloRank } from "../../../../../types/enum/EloRank"
import { BotDifficulty, GameMode } from "../../../../../types/enum/Game"
import { SpecialGameRule } from "../../../../../types/enum/SpecialGameRule"
import { formatMinMaxRanks } from "../../../../../utils/elo"
import { throttle } from "../../../../../utils/function"
import { max } from "../../../../../utils/number"
import { setTitleNotificationIcon } from "../../../../../utils/window"
import { useAppSelector } from "../../../hooks"
import {
  addBot,
  gameStartRequest,
  rooms,
  toggleReady
} from "../../../network"
import { addIconsToDescription } from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import { GameModeIcon } from "../icons/game-mode-icon"
import { BlessingEventBanner } from "../blessing-event/blessing-event"
import { WhimsyWeekendCountdown } from "../whimsy-weekend/whimsy-weekend"
import PreparationMenuUser from "./preparation-menu-user"
import "./preparation-menu.css"

export default function PreparationMenu() {
  const { t } = useTranslation()
  const users: IGameUser[] = useAppSelector((state) => state.preparation.users)
  const user = useAppSelector((state) => state.preparation.user)
  const name: string = useAppSelector((state) => state.preparation.name)
  const ownerId: string = useAppSelector((state) => state.preparation.ownerId)
  const noElo: boolean = useAppSelector((state) => state.preparation.noElo)
  const specialGameRule: SpecialGameRule | null = useAppSelector(
    (state) => state.preparation.specialGameRule
  )
  const minRank = useAppSelector((state) => state.preparation.minRank)
  const maxRank = useAppSelector((state) => state.preparation.maxRank)
  const uid: string = useAppSelector((state) => state.network.uid)
  const isOwner: boolean = useAppSelector(
    (state) => state.preparation.ownerId === state.network.uid
  )

  const gameMode = useAppSelector((state) => state.preparation.gameMode)
  const scribbleExtended = useAppSelector(
    (state) => state.preparation.scribbleExtended
  )
  const isWhimsyWeekend = useAppSelector((state) => state.preparation.whimsy)
  const blessingsEnabled = useAppSelector(
    (state) => state.preparation.blessingsEnabled
  )

  const isReady = users.find((user) => user.uid === uid)?.ready
  const nbUsersReady = users.filter((user) => user.ready).length
  const allUsersReady = users.every((user) => user.ready) && nbUsersReady > 1

  const isAdmin = user?.role === Role.ADMIN

  const nbExpectedPlayers = useAppSelector((state) =>
    state.preparation.whitelist && state.preparation.whitelist.length > 0
      ? max(MAX_PLAYERS_PER_GAME)(state.preparation.whitelist.length)
      : MAX_PLAYERS_PER_GAME
  )

  useEffect(() => {
    if (allUsersReady) {
      setTitleNotificationIcon("🟢")
    } else if (nbUsersReady === 0) {
      setTitleNotificationIcon("🔴")
    } else if (nbUsersReady === users.length - 1) {
      setTitleNotificationIcon("🟡")
    } else {
      setTitleNotificationIcon("🟠")
    }
  }, [nbUsersReady, users.length, allUsersReady])

  const humans = users.filter((u) => !u.isBot)
  const isEligibleForELO = gameMode === GameMode.RANKED
  const averageElo =
    humans.length > 0
      ? Math.round(humans.reduce((acc, u) => acc + u.elo, 0) / humans.length)
      : 0

  const startGame = throttle(async function startGame() {
    if (rooms.preparation) {
      const token = await firebase.auth().currentUser?.getIdToken()
      if (token) {
        gameStartRequest(token)
      }
    }
  }, 1000)

  const headerMessage = (
    <>
      {gameMode === GameMode.RANKED && (
        <p>
          <GameModeIcon gameMode={gameMode} />
          {t("ranked_game_hint")}
        </p>
      )}

      {isWhimsyWeekend && (
        <>
          <p>
            <img
              src="/assets/ui/whimsy_weekend.png"
              alt={t("whimsy_weekend")}
              className="gamemode icon"
            />
            <b>{t("whimsy_weekend")}</b>: {t("whimsy_weekend_description")}
          </p>
          <WhimsyWeekendCountdown />
        </>
      )}

      {(gameMode === GameMode.SCRIBBLE || specialGameRule != null) && (
        <div className="rule-banner scribble-rule-banner my-box">
          <img
            className="rule-banner-icon"
            src="assets/ui/game_modes/scribble.png"
            alt=""
            aria-hidden="true"
          />
          <div className="rule-banner-text">
            <h3>
              {specialGameRule != null
                ? t(`scribble.${specialGameRule}`)
                : t("game_modes.SCRIBBLE")}
            </h3>
            <p>
              {specialGameRule != null
                ? addIconsToDescription(
                    t(`scribble_description.${specialGameRule}`, {
                      type: "(random Synergy)"
                    })
                  )
                : t("smeargle_scribble_hint")}
            </p>
          </div>
        </div>
      )}

      {/* the global event can be running while this room has blessings off */}
      {blessingsEnabled && <BlessingEventBanner />}

      {gameMode === GameMode.CLASSIC && (
        <p>
          <GameModeIcon gameMode={gameMode} />
          {t("classic_hint")}
        </p>
      )}

      {noElo !== true &&
        (isEligibleForELO ? (
          <p>
            {t("eligible_elo_hint")} {t("average_elo")}: {averageElo} ;{" "}
            {t("GLHF")}
            {" !"}
          </p>
        ) : users.length > 1 ? (
          <p>{t("not_eligible_elo_hint")}</p>
        ) : null)}

    </>
  )

  const readyButton = (gameMode === GameMode.CUSTOM_LOBBY || gameMode === GameMode.DOUBLE_UP || !isReady) &&
    users.length > 0 && (
      <button
        className={cc("bubbly", "ready-button", isReady ? "green" : "orange")}
        onClick={() => {
          toggleReady(!isReady)
        }}
      >
        {t("ready")} {isReady ? "✔" : "?"}
      </button>
    )

  const addBotButton = process.env.MODE === "dev" &&
    (isOwner || isAdmin) &&
    users.length < MAX_PLAYERS_PER_GAME && (
      <button
        className="bubbly blue"
        onClick={() => addBot(BotDifficulty.MEDIUM)}
      >
        {t("add_bot")}
      </button>
    )

  const startGameButton = (isOwner || isAdmin) && (
    <button
      className={cc("bubbly", {
        green: allUsersReady,
        orange: !allUsersReady
      })}
      onClick={startGame}
      data-tooltip-id={"start-game"}
    >
      {t("start_game")}
    </button>
  )

  return (
    <div className="preparation-menu my-container is-centered custom-bg">
      <header>
        <h1>
          {blessingsEnabled && (
            <img
              alt={t("blessings")}
              title={t("blessing_event_title")}
              className="preparation-header-icon"
              src="/assets/icons/blessing_stats.svg"
            />
          )}
          {specialGameRule != null && (
            <img
              alt={t("game_modes.SCRIBBLE")}
              title={t(`scribble.${specialGameRule}`)}
              className="preparation-header-icon"
              src="/assets/icons/smeargle_scribble_icon.svg"
            />
          )}
          {formatMinMaxRanks(minRank, maxRank)} {name}: {users.length}/
          {nbExpectedPlayers}
          <span
            className="hp-badge"
            title={
              scribbleExtended
                ? t("scribble_extended_on")
                : t("scribble_extended_off")
            }
          >
            {scribbleExtended
              ? t("scribble_extended_on_short")
              : t("scribble_extended_off_short")}
          </span>
        </h1>
        {headerMessage}
      </header>

      <div className={`preparation-menu-users${gameMode === GameMode.DOUBLE_UP ? " double-up" : ""}`}>
        {gameMode === GameMode.DOUBLE_UP
          ? (() => {
              const paired: Set<string> = new Set()
              const groups: IGameUser[][] = []
              users.forEach((u) => {
                if (paired.has(u.uid)) return
                const partner = users.find(
                  (p) =>
                    p.uid === u.doubleUpPartnerId &&
                    u.doubleUpPartnerId !== "" &&
                    p.doubleUpPartnerId === u.uid &&
                    !paired.has(p.uid)  // add this check
                )
                if (partner) {
                  groups.push([u, partner])
                  paired.add(u.uid)
                  paired.add(partner.uid)
                } else {
                  groups.push([u])
                }
              })
              return groups.map((group, colorIndex) => (
                <div
                  key={group.map((u) => u.uid).join("-")}
                  className={`double-up-pair ${group.length === 2 ? "paired" : "unpaired"}`}
                >
                  {group.map((u) => (
                    <PreparationMenuUser
                      key={u.uid}
                      user={u}
                      isOwner={isOwner}
                      ownerId={ownerId}
                      colorIndex={colorIndex}
                    />
                  ))}
                </div>
              ))
            })()
          : users.map((u) => (
              <PreparationMenuUser
                key={u.uid}
                user={u}
                isOwner={isOwner}
                ownerId={ownerId}
              />
            ))}
      </div>

      <div className="actions">
        <div className="actions-bar">
          <div className="spacer" />
          {addBotButton}
          {readyButton}
          {startGameButton}
        </div>
      </div>
    </div>
  )
}

export function RankSelect(props: {
  label: string
  value: EloRank
  onChange: (rank: EloRank) => void
}) {
  const { t } = useTranslation()
  return (
    <label>
      {props.label}
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value as EloRank)}
        style={{ marginLeft: "0.5em" }}
      >
        {Object.values(EloRank).map((rank) => (
          <option key={rank} value={rank}>
            {t(`elorank.${rank}`)} ({EloRankThreshold[rank]})
          </option>
        ))}
      </select>
    </label>
  )
}
