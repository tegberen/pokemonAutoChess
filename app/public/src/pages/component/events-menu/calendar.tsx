import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useAppSelector } from "../../../hooks"
import {
  getNextBlessingEventStart,
  getNextWishFestivalFinaleStart,
  getNextScribbleWeekendStart,
  isBlessingEvent,
  isScribbleWeekend,
  isWishFestivalFinale
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

type CalendarEvent = {
  id: string
  name: string
  description: string
  image: string
  variant: "whimsy" | "jirachi" | "jirachi_finale" | "smeargle" | "doubleup"
  start: Date
}

function CalendarEventCard(props: Omit<CalendarEvent, "id"> & {
  now: Date
}) {
  const { t } = useTranslation()
  return (
    <article className={`calendar-event-card ${props.variant}${props.variant === "whimsy" ? " whimsy-v2" : ""}`}>
      {props.image && <img src={`assets/ui/${props.image}`} alt="" />}
      <div className="calendar-event-content">
        <div className="calendar-event-copy">
          <h3>{props.name}</h3>
          <p>{props.description}</p>
        </div>
        <div className="calendar-event-timer">
          <img className="calendar-clock" src="assets/ui/clock.png" alt="" aria-hidden="true" />
          <div>
            <p>
              {t("event_starts_in", {
                time: formatEventCountdown(props.start.getTime() - props.now.getTime())
              })}
            </p>
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
  const events: CalendarEvent[] = []

  if (tournament.tournamentEnabled) {
    events.push({
      id: "smeargle",
      name: tournament.tournamentTitle || "Smeargle Pack Tournament",
      description: tournament.tournamentMessage,
      image: "",
      variant: "smeargle",
      start: tournamentStart
    })
  }

  if (tournament.doubleUpEnabled) {
    events.push({
      id: "doubleup",
      name: tournament.doubleUpTitle || "Double Up Tournament",
      description: tournament.doubleUpMessage,
      image: "",
      variant: "doubleup",
      start: tournament.doubleUpDate
        ? new Date(tournament.doubleUpDate)
        : new Date()
    })
  }

  if (!isScribbleWeekend(now)) {
    events.push({
      id: "whimsy",
      name: t("whimsy_weekend"),
      description: t("whimsy_weekend_description"),
      image: "",
      variant: "whimsy",
      start: getNextScribbleWeekendStart(now)
    })
  }

  if (!isBlessingEvent(now)) {
    events.push({
      id: "jirachi",
      name: "Wish Festival",
      description: t("blessing_event_description"),
      image: "",
      variant: "jirachi",
      start: getNextBlessingEventStart(now)
    })
  }

  if (!isWishFestivalFinale(now) && isBlessingEvent(now)) {
    events.push({
      id: "wish-festival-finale",
      name: "Wish Festival Finale",
      description: "Prismatic Wishes are granted more often.",
      image: "",
      variant: "jirachi_finale",
      start: getNextWishFestivalFinaleStart(now)
    })
  }

  events.sort((a, b) => a.start.getTime() - b.start.getTime())

  return (
    <div className="events-calendar">
      {events.map(({ id, ...event }) => (
        <CalendarEventCard key={id} {...event} now={now} />
      ))}
    </div>
  )
}
