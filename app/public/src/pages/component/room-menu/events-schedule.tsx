import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { formatTimeUntil, useMinuteClock } from "./daily-duel-countdown"
import { getDailyEvents } from "./daily-events"

// every recurring event with its time and rewards, one click away from the
// banner that only names the next one
export function EventsSchedule() {
  const { t } = useTranslation()
  const now = useMinuteClock()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", closeOnOutsideClick)
    return () => document.removeEventListener("mousedown", closeOnOutsideClick)
  }, [isOpen])

  return (
    <div className="events-schedule" ref={containerRef}>
      <button
        className="events-schedule-button"
        title={t("events")}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((wasOpen) => !wasOpen)}
      >
        <img
          src="/assets/ui/sands_of_time.svg"
          width={28}
          height={28}
          alt=""
        />
      </button>
      {isOpen && (
        <div className="events-schedule-popup my-container">
          <ul>
            {getDailyEvents(now).map((event) => {
              const isLive = event.start <= now && event.end !== undefined
              return (
                <li key={event.id}>
                  <img
                    className="events-schedule-icon"
                    src={event.icon}
                    width={36}
                    height={36}
                    alt=""
                  />
                  <b>{event.name}</b>
                  <span className="events-schedule-countdown">
                    {isLive ? (
                      <span className="events-schedule-live">
                        {t("daily_events.live")}
                      </span>
                    ) : (
                      t("daily_duel_in", {
                        time: formatTimeUntil(
                          event.start.getTime() - now.getTime()
                        )
                      })
                    )}
                  </span>
                  <p>
                    <img src="/assets/ui/calendar.svg" alt="" />
                    {event.when}
                  </p>
                  <p title={event.reward}>
                    <img src="/assets/ui/reward.svg" alt="" />
                    {event.rewardParts.map((part) => (
                      <span
                        key={part.amount}
                        className="events-schedule-reward"
                      >
                        {part.winnerOnly && (
                          <span className="events-schedule-win">
                            {t("daily_events.win")}
                          </span>
                        )}
                        {part.amount}
                        {part.icon && <img src={part.icon} alt="" />}
                      </span>
                    ))}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
