import { type ReactNode, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  getRainbowFinaleTime,
  isRainbowHours,
  RAINBOW_FINALE_ROOM_NAME,
  RAINBOW_FINALE_WINNER_BOOSTERS,
  RAINBOW_FINALE_WONDER_PICKS,
  RAINBOW_HOURS_TICKETS_PER_GAME,
  RAINBOW_HOURS_TICKETS_PER_WIN
} from "../../../../../config/game/rainbow-hours"
import {
  getNextWildCardTime,
  WILD_CARD_ROOM_NAME,
  WILD_CARD_WONDER_PICKS
} from "../../../../../config/game/wild-card"
import { cc } from "../../utils/jsx"
import {
  DAILY_DUEL_ICON,
  formatLocalTime,
  getNextDailyDuel,
  RAINBOW_HOURS_ICON,
  WILD_CARD_ICON
} from "./daily-events"

const TICKETS_ICON = "/assets/icons/season_poke.svg"

export function formatTimeUntil(ms: number) {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

export function useMinuteClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])
  return now
}

function EventBanner(props: {
  className?: string
  title: string
  children: ReactNode
}) {
  return (
    <div
      className={cc("daily-duel-countdown my-box", props.className ?? "")}
      title={props.title}
    >
      {props.children}
    </div>
  )
}

// replaces the next-event countdown while Rainbow Hours run
export function RainbowHoursCountdown() {
  const { t } = useTranslation()
  const now = useMinuteClock()
  if (!isRainbowHours(now)) return null
  const finale = getRainbowFinaleTime(now)
  return (
    <EventBanner
      className="rainbow-hours-countdown"
      title={t("rainbow_hours.banner_hint", {
        ticketsPerGame: RAINBOW_HOURS_TICKETS_PER_GAME,
        ticketsPerWin: RAINBOW_HOURS_TICKETS_PER_WIN,
        finale: RAINBOW_FINALE_ROOM_NAME,
        wonderPicks: RAINBOW_FINALE_WONDER_PICKS,
        boosters: RAINBOW_FINALE_WINNER_BOOSTERS
      })}
    >
      <img
        alt=""
        aria-hidden="true"
        className="icon"
        src={RAINBOW_HOURS_ICON}
      />
      <em className="rainbow-hours-title">{t("rainbow_hours.title")}</em>
      <span className="daily-duel-countdown-label rainbow-hours-rewards">
        <span className="rainbow-hours-reward">
          +{RAINBOW_HOURS_TICKETS_PER_GAME}
          <img alt="" width={18} height={18} src={TICKETS_ICON} />
        </span>
        <span className="rainbow-hours-reward">
          <img
            alt=""
            width={18}
            height={18}
            src="/assets/icons/LAUREL_CROWN_ICON.svg"
          />
          +{RAINBOW_HOURS_TICKETS_PER_WIN}
          <img alt="" width={18} height={18} src={TICKETS_ICON} />
        </span>
      </span>
      <span className="daily-duel-countdown-time">
        {t("rainbow_hours.finale_in", {
          time: formatTimeUntil(finale.getTime() - now.getTime())
        })}
      </span>
    </EventBanner>
  )
}

// whichever comes first: the next Wild Card or the next Daily Duel
export function NextEventCountdown() {
  const { t } = useTranslation()
  const now = useMinuteClock()
  if (isRainbowHours(now)) return null

  const nextWildCard = getNextWildCardTime(now)
  const nextDailyDuel = getNextDailyDuel(now)
  const timeUntil = (date: Date) =>
    formatTimeUntil(date.getTime() - now.getTime())

  if (nextWildCard < nextDailyDuel) {
    return (
      <EventBanner
        className="wild-card-countdown"
        title={t("daily_events.wild_card_reward", {
          wonderPicks: WILD_CARD_WONDER_PICKS
        })}
      >
        <img
          alt=""
          aria-hidden="true"
          className="icon"
          width={32}
          height={32}
          src={WILD_CARD_ICON}
        />
        <em className="wild-card-title">{WILD_CARD_ROOM_NAME}</em>
        <span className="daily-duel-countdown-label">
          {formatLocalTime(nextWildCard)}
        </span>
        <span className="daily-duel-countdown-time">
          {t("daily_duel_in", { time: timeUntil(nextWildCard) })}
        </span>
      </EventBanner>
    )
  }

  return (
    <EventBanner title={t("daily_duel_hint")}>
      <img
        alt=""
        aria-hidden="true"
        className="icon"
        src={DAILY_DUEL_ICON}
      />
      <span className="daily-duel-countdown-label">
        {t("daily_duel_next", { time: formatLocalTime(nextDailyDuel) })}
      </span>
      <span className="daily-duel-countdown-time">
        {t("daily_duel_in", { time: timeUntil(nextDailyDuel) })}
      </span>
    </EventBanner>
  )
}
