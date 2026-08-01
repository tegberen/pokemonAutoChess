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

export function getCurrentGameEvent(): GameEvent {
  // Implementation for determining the current event
  const month = new Date().getUTCMonth()
  return GameEvents[month % GameEvents.length]
}
