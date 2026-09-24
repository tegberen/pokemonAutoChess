import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

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

export function DailyDuelCountdown() {
  const { t } = useTranslation()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

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
