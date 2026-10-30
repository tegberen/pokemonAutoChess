import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  getRainbowFinaleTime,
  isRainbowHours,
  RAINBOW_FINALE_ROOM_NAME
} from "../../../../../config/game/rainbow-hours"

const DAILY_DUEL_HOUR_UTC = 20

function getNextDailyDuel(now: Date) {
  const next = new Date(now)
  next.setUTCHours(DAILY_DUEL_HOUR_UTC, 0, 0, 0)
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1)
  return next
}

function formatTimeUntil(ms: number) {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

function useMinuteClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])
  return now
}

// replaces the Daily Duel countdown while Rainbow Hours run
export function RainbowHoursCountdown() {
  const { t } = useTranslation()
  const now = useMinuteClock()
  if (!isRainbowHours(now)) return null
  const finale = getRainbowFinaleTime(now)
  const localFinaleTime = finale.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  })
  return (
    <div className="daily-duel-countdown rainbow-hours-countdown my-box">
      <img
        alt=""
        aria-hidden="true"
        className="icon"
        src="/assets/ui/game_modes/scribble_icon.svg"
      />
      <em className="rainbow-hours-title">{t("rainbow_hours.title")}</em>
      <span className="daily-duel-countdown-label">
        {RAINBOW_FINALE_ROOM_NAME} · {localFinaleTime}
      </span>
      <span className="daily-duel-countdown-time">
        {t("daily_duel_in", {
          time: formatTimeUntil(finale.getTime() - now.getTime())
        })}
      </span>
    </div>
  )
}

export function DailyDuelCountdown() {
  const { t } = useTranslation()
  const now = useMinuteClock()
  if (isRainbowHours(now)) return null

  const nextDailyDuel = getNextDailyDuel(now)
  const localStartTime = nextDailyDuel.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  })

  return (
    <div className="daily-duel-countdown my-box">
      <img
        alt=""
        aria-hidden="true"
        className="icon"
        src="/assets/icons/blessing_stats.svg"
      />
      <span className="daily-duel-countdown-label">
        {t("daily_duel_next", { time: localStartTime })}
      </span>
      <span className="daily-duel-countdown-time">
        {t("daily_duel_in", {
          time: formatTimeUntil(nextDailyDuel.getTime() - now.getTime())
        })}
      </span>
    </div>
  )
}
