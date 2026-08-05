import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  getNextBlessingEventStart,
  getNextScribbleWeekendStart,
  isBlessingEvent,
  isScribbleWeekend
} from "../../../../../config"
import { formatDate } from "../../utils/date"
import "./calendar.css"

const SMEARGLE_PACK_TOURNAMENT_ENABLED = true

function useCalendarNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])
  return now
}

function formatEventCountdown(milliseconds: number): string {
  const totalHours = Math.max(0, Math.ceil(milliseconds / 3_600_000))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`
}

function CalendarEventCard(props: {
  name: string
  description: string
  image: string
  variant: "whimsy" | "jirachi" | "smeargle"
  start: Date
  now: Date
  dateOnly?: boolean
}) {
  const { t } = useTranslation()
  return (
    <article className={`calendar-event-card ${props.variant}`}>
      <img src={`assets/ui/game_modes/${props.image}.png`} alt="" />
      <div className="calendar-event-content">
        <div className="calendar-event-copy">
          <h3>{props.name}</h3>
          <p>{props.description}</p>
        </div>
        <div className="calendar-event-timer">
          {!props.dateOnly && <img className="calendar-clock" src="assets/ui/clock.png" alt="" aria-hidden="true" />}
          <div>
            {!props.dateOnly && <p>
              {t("event_starts_in", {
                time: formatEventCountdown(props.start.getTime() - props.now.getTime())
              })}
            </p>}
            <time>{formatDate(props.start, { dateStyle: "long", timeStyle: undefined })}</time>
          </div>
        </div>
      </div>
    </article>
  )
}

export function Calendar() {
  const { t } = useTranslation()
  const now = useCalendarNow()
  return (
    <div className="events-calendar">
      {SMEARGLE_PACK_TOURNAMENT_ENABLED && (
        <CalendarEventCard
          name="Smeargle Pack Tournament"
          description="Back by popular demand! Sign up on Discord. Registration closes 24 hours before the tournament to allow time for bracket creation."
          image="scribble"
          variant="smeargle"
          start={new Date(2026, 7, 8)}
          now={now}
          dateOnly
        />
      )}
      {!isScribbleWeekend(now) && (
        <CalendarEventCard
          name={t("whimsy_weekend")}
          description={t("whimsy_weekend_description")}
          image="whimsy_weekend"
          variant="whimsy"
          start={getNextScribbleWeekendStart(now)}
          now={now}
        />
      )}
      {!isBlessingEvent(now) && (
        <CalendarEventCard
          name={t("blessing_event_title")}
          description={t("blessing_event_description")}
          image="blessing_event"
          variant="jirachi"
          start={getNextBlessingEventStart(now)}
          now={now}
        />
      )}
    </div>
  )
}
