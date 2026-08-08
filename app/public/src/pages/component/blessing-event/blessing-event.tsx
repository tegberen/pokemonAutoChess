import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { getBlessingEventEnd, isBlessingEvent } from "../../../../../config"
import "./blessing-event.css"

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
function useBlessingEventWindow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return {
    active: isBlessingEvent(now),
    end: getBlessingEventEnd(now),
    now
  }
}

/** Renders nothing once the window has closed. */
export function BlessingEventBanner() {
  const { t } = useTranslation()
  const { active, end, now } = useBlessingEventWindow()
  if (!active || !end) return null
  return (
    <div className="rule-banner blessing-event-banner my-box">
      <img
        className="rule-banner-icon"
        src="assets/ui/game_modes/blessing_event.png"
        alt=""
        aria-hidden="true"
      />
      <div className="rule-banner-text">
        <h3>{t("blessing_event_title")}</h3>
        <p>{t("blessing_event_description")}</p>
        <p className="blessing-event-remaining">
          <img src="assets/ui/clock.png" alt="" aria-hidden="true" />
          {t("blessing_event_ends_in", {
            time: formatRemaining(end.getTime() - now.getTime())
          })}
        </p>
      </div>
    </div>
  )
}

export { useBlessingEventWindow }
