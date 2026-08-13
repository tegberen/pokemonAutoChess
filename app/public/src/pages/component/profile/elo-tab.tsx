import { useTranslation } from "react-i18next"
import type { IGameRecord } from "../../../../../models/colyseus-models/game-record"
import { getRank } from "../../../../../utils/elo"
import { useAppSelector } from "../../../hooks"

export function EloTab({ gameHistory }: { gameHistory: IGameRecord[] }) {
  const { t } = useTranslation()
  const user = useAppSelector((state) => state.network.profile)

  const rank = user ? getRank(user.elo) : null
  const firstPlaceStreak = gameHistory.findIndex((game) => game.rank !== 1)
  const streak = firstPlaceStreak === -1 ? gameHistory.length : firstPlaceStreak

  return user && rank ? (
    <div className="elo-tab">
      <img
        className="elo-rank-icon"
        src={"assets/ranks/" + rank + ".svg"}
        alt={t(`elorank.${rank}`)}
        title={t(`elorank.${rank}`)}
      />
      <div className="elo-summary">
        <span className="elo-label">{t("rank")}</span>
        <strong className="elo-rank-name">{t(`elorank.${rank}`)}</strong>
        <p>
          {t("profile.elo_tab.current_elo")}: <strong>{user.elo}</strong>
        </p>
        <p>
          {t("profile.elo_tab.max_elo_reached")}: <strong>{user.maxElo}</strong>
        </p>
        <div className="profile-stats">
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
          <div
            className="profile-stat"
            title={`${streak} first-place finishes in a row`}
          >
            <span className="profile-stat-emblem">
              <img
                src="/assets/icons/fire_first_streak.svg"
                alt=""
                aria-hidden="true"
              />
            </span>
            <strong className="profile-stat-count">{streak}</strong>
            <span className="profile-stat-label">
              <small>1st place</small>
              <b>Win streak</b>
            </span>
          </div>
        </div>
      </div>
    </div>
  ) : null
}
