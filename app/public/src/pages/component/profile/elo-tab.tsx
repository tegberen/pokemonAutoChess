import { useTranslation } from "react-i18next"
import { VIDEO_BG_THEMES } from "../../../../../config"
import type { IGameRecord } from "../../../../../models/colyseus-models/game-record"
import type { IUserMetadataClient } from "../../../../../types/interfaces/UserMetadata"
import { getRank } from "../../../../../utils/elo"
import { usePreference } from "../../../preferences"

type RecordUser = Pick<
  IUserMetadataClient,
  | "elo"
  | "maxElo"
  | "activeWeeks"
  | "currentFirstPlaceStreak"
  | "highestFirstPlaceStreak"
>

export function EloTab({
  gameHistory,
  user
}: {
  gameHistory: IGameRecord[]
  user: RecordUser
}) {
  const { t } = useTranslation()
  const [hideElo] = usePreference("hideElo")
  const [theme] = usePreference("theme")

  const rank = getRank(user.elo)
  const firstNonWin = gameHistory.findIndex((game) => game.rank !== 1)
  const loadedCurrentStreak =
    firstNonWin === -1 ? gameHistory.length : firstNonWin
  const currentStreak = Math.max(
    user.currentFirstPlaceStreak ?? 0,
    loadedCurrentStreak
  )
  const highestStreak = Math.max(
    user.highestFirstPlaceStreak ?? 0,
    currentStreak
  )

  return rank ? (
    <div className={hideElo ? "elo-tab no-elo" : "elo-tab"}>
      {hideElo ? (
        <figure className="profile-theme-frame">
          {(VIDEO_BG_THEMES as string[]).includes(theme) ? (
            <video
              className="profile-theme-art"
              src={`/assets/theme/${theme}/videobg.mp4`}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <div className="profile-theme-art custom-bg" />
          )}
          <figcaption>Thank you for playing John Auto Chess</figcaption>
        </figure>
      ) : (
        <img
          className="elo-rank-icon"
          src={"assets/ranks/" + rank + ".svg"}
          alt={t(`elorank.${rank}`)}
          title={t(`elorank.${rank}`)}
        />
      )}
      <div className="elo-summary">
        {!hideElo && (
          <>
            <span className="elo-label">{t("rank")}</span>
            <strong className="elo-rank-name">{t(`elorank.${rank}`)}</strong>
          </>
        )}
        <div className="profile-stats">
          {!hideElo && (
            <div
              className="elo-record"
              title={`Highest Elo reached: ${user.maxElo}`}
            >
              <span className="elo-record-emblem">
                <img
                  src="/assets/icons/elo_record.svg"
                  alt=""
                  aria-hidden="true"
                />
              </span>
              <span className="elo-record-label">
                <small>Personal best</small>
                <b>Highest Elo</b>
              </span>
              <strong className="elo-record-value">{user.maxElo}</strong>
            </div>
          )}
          <div
            className="profile-stat"
            title={`Current first-place streak: ${currentStreak}. Highest streak: ${highestStreak}.`}
          >
            <span className="profile-stat-emblem">
              <img
                src="/assets/icons/fire_first_streak.svg"
                alt=""
                aria-hidden="true"
              />
            </span>
            <strong className="profile-stat-count">{highestStreak}</strong>
            <span className="profile-stat-label">
              <small>Current {currentStreak}</small>
              <b>Best streak</b>
            </span>
          </div>
          <div
            className="profile-stat"
            title="Total calendar weeks in which you completed a game. Skipped weeks do not reset this count."
          >
            <span className="profile-stat-emblem">
              <img
                src="/assets/icons/fire_week_streak.svg"
                alt=""
                aria-hidden="true"
              />
            </span>
            <strong className="profile-stat-count">
              {user.activeWeeks ?? 0}
            </strong>
            <span className="profile-stat-label">
              <small>Community</small>
              <b>Active weeks</b>
            </span>
          </div>
        </div>
      </div>
    </div>
  ) : null
}
