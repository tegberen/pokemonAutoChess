import { type GameEvent, GameEvents } from "../../types/events"

export const VICTORY_ROAD_MAX_EVENT_POINTS = 500

export const VictoryRoadPointsPerRank = [
  +15, // 1st
  +8, // 2nd
  +5, // 3rd
  +1, // 4th
  -1, // 5th
  -3, // 6th
  -5, // 7th
  -8 // 8th
]

export const TOURNAMENT_REGISTRATION_TIME = 60 * 60 * 1000 // 1 hour
export const TOURNAMENT_CLEANUP_DELAY = 24 * 60 * 60 * 1000 // 1 day

export function getGameEventResetDate(): Date {
  // midnight UTC on the first day of each month
  const now = new Date()
  const resetDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0)
  )
  return resetDate
}

/* One global window, not per-player local time: a lobby is shared, so it cannot
   be open for one player and shut for the next. The window is the union of "it
   is the weekend" across these zones, listed east to west — the easternmost sets
   the opening, the westernmost the closing. Add a zone to widen it. */
export const SCRIBBLE_WEEKEND_TIMEZONES = [
  "Australia/Sydney",
  "Asia/Tokyo",
  "Europe/Paris",
  "America/Los_Angeles"
]

function isWeekendInTimezone(date: Date, timeZone: string): boolean {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short"
  }).format(date)
  return weekday === "Sat" || weekday === "Sun"
}

/** Saturday midnight in the earliest region through Sunday midnight in the latest. */
export function isScribbleWeekend(date = new Date()): boolean {
  return SCRIBBLE_WEEKEND_TIMEZONES.some((tz) => isWeekendInTimezone(date, tz))
}

/* Every boundary falls on an hour and all the zones above are whole-hour offsets
   from UTC, so stepping by hours finds the edge exactly. */
function findScribbleWeekendEdge(from: Date, lookingFor: boolean): Date | null {
  const cursor = new Date(from)
  cursor.setUTCMinutes(0, 0, 0)
  for (let i = 1; i <= 24 * 8; i++) {
    const next = new Date(cursor.getTime() + i * 3600_000)
    if (isScribbleWeekend(next) === lookingFor) return next
  }
  return null
}

/** When the current Whimsy Weekend ends, or null if one isn't running. */
export function getScribbleWeekendEnd(from = new Date()): Date | null {
  if (!isScribbleWeekend(from)) return null
  return findScribbleWeekendEdge(from, false)
}

/* The Blessing event is a rule layer applied on top of any game mode, not a mode
   of its own. Anchor is the UTC midnight a window opens; move it to reschedule. */
export const BLESSING_EVENT_ANCHOR = Date.UTC(2026, 7, 3)
export const BLESSING_EVENT_INTERVAL_DAYS = 14
export const BLESSING_EVENT_DURATION_DAYS = 2

export function isBlessingEvent(date = new Date()): boolean {
  const elapsedDays = Math.floor(
    (date.getTime() - BLESSING_EVENT_ANCHOR) / 86_400_000
  )
  if (elapsedDays < 0) return false
  return (
    elapsedDays % BLESSING_EVENT_INTERVAL_DAYS < BLESSING_EVENT_DURATION_DAYS
  )
}

/** When the running Blessing event ends, or null if one isn't running. */
export function getBlessingEventEnd(from = new Date()): Date | null {
  if (!isBlessingEvent(from)) return null
  const elapsedDays = Math.floor(
    (from.getTime() - BLESSING_EVENT_ANCHOR) / 86_400_000
  )
  const daysIntoWindow = elapsedDays % BLESSING_EVENT_INTERVAL_DAYS
  const windowStart =
    from.getTime() - daysIntoWindow * 86_400_000 - (from.getTime() % 86_400_000)
  return new Date(windowStart + BLESSING_EVENT_DURATION_DAYS * 86_400_000)
}

export function getCurrentGameEvent(): GameEvent {
  // Implementation for determining the current event
  const month = new Date().getUTCMonth()
  return GameEvents[month % GameEvents.length]
}
