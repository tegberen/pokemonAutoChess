import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  getScribbleWeekendEnd,
  isScribbleWeekend
} from "../../../../../config"
import "./whimsy-weekend.css"

function formatRemaining(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000))
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

/** Ticks once a minute so the window flips over on its own. */
function useWhimsyWeekendWindow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return {
    active: isScribbleWeekend(now),
    end: getScribbleWeekendEnd(now),
    now
  }
}

/** Renders nothing once the window has closed. */
export function WhimsyWeekendCountdown() {
  const { t } = useTranslation()
  const { active, end, now } = useWhimsyWeekendWindow()
  if (!active || !end) return null
  return (
    <p className="whimsy-weekend-countdown">
      <img src="assets/ui/clock.png" alt="" aria-hidden="true" />
      {t("whimsy_weekend_ends_in", {
        time: formatRemaining(end.getTime() - now.getTime())
      })}
    </p>
  )
}

export { useWhimsyWeekendWindow }
