import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useAppSelector } from "../../../hooks"
import {
  getNextBlessingEventStart,
  getNextScribbleWeekendStart,
  isBlessingEvent,
  isScribbleWeekend
} from "../../../../../config"
import { formatDate } from "../../utils/date"
import "./calendar.css"

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
  variant: "whimsy" | "jirachi" | "smeargle" | "doubleup"
  start: Date
  now: Date
  dateOnly?: boolean
}) {
  const { t } = useTranslation()
  return (
    <article className={`calendar-event-card ${props.variant}`}>
      {props.image && <img src={`assets/ui/${props.image}`} alt="" />}
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
  const tournament = useAppSelector((state) => state.lobby.eventNpc)
  const tournamentStart = tournament.tournamentDate
    ? new Date(tournament.tournamentDate)
    : new Date(2026, 7, 8)
  return (
    <div className="events-calendar">
      {tournament.tournamentEnabled && (
        <CalendarEventCard
          name={tournament.tournamentTitle || "Smeargle Pack Tournament"}
          description={tournament.tournamentMessage}
          image="cards/smeargle_card.png"
          variant="smeargle"
          start={tournamentStart}
          now={now}
          dateOnly
        />
      )}
      {tournament.doubleUpEnabled && (
        <CalendarEventCard
          name={tournament.doubleUpTitle || "Double Up Tournament"}
          description={tournament.doubleUpMessage}
          image=""
          variant="doubleup"
          start={tournament.doubleUpDate ? new Date(tournament.doubleUpDate) : new Date()}
          now={now}
          dateOnly
        />
      )}
      {!isScribbleWeekend(now) && (
        <CalendarEventCard
          name={t("whimsy_weekend")}
          description={t("whimsy_weekend_description")}
          image="cards/whimsicott_card.png"
          variant="whimsy"
          start={getNextScribbleWeekendStart(now)}
          now={now}
        />
      )}
      {!isBlessingEvent(now) && (
        <CalendarEventCard
          name="Wish Festival"
          description={t("blessing_event_description")}
          image="cards/jirachi_card.png"
          variant="jirachi"
          start={getNextBlessingEventStart(now)}
          now={now}
        />
      )}
    </div>
  )
}
