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
const SYDNEY_TIME_ZONE = "Australia/Sydney"
const LOS_ANGELES_TIME_ZONE = "America/Los_Angeles"
const FESTIVAL_INTERVAL_DAYS = 14
const WHIMSY_WEEKEND_ANCHOR = { year: 2026, month: 7, day: 8 }
const JIRACHI_FESTIVAL_OFFSET_DAYS = 4

function getTimeZoneOffset(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date)
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second")) - date.getTime()
}

function localMidnightToUtc(year: number, month: number, day: number, timeZone: string): Date {
  const localMidnight = new Date(Date.UTC(year, month, day))
  return new Date(localMidnight.getTime() - getTimeZoneOffset(localMidnight, timeZone))
}

function addCalendarDays(anchor: { year: number; month: number; day: number }, days: number) {
  const date = new Date(Date.UTC(anchor.year, anchor.month, anchor.day + days))
  return { year: date.getUTCFullYear(), month: date.getUTCMonth(), day: date.getUTCDate() }
}

function getFestivalWindowForCycle(
  cycle: number,
  startOffsetDays: number,
  durationDays: number
): { start: Date; end: Date } {
  const startDate = addCalendarDays(WHIMSY_WEEKEND_ANCHOR, cycle * FESTIVAL_INTERVAL_DAYS + startOffsetDays)
  const endDate = addCalendarDays(startDate, durationDays)
  return {
    start: localMidnightToUtc(startDate.year, startDate.month, startDate.day, SYDNEY_TIME_ZONE),
    end: localMidnightToUtc(endDate.year, endDate.month, endDate.day, LOS_ANGELES_TIME_ZONE)
  }
}

function getFestivalWindow(
  date: Date,
  startOffsetDays: number,
  durationDays: number
): { start: Date; end: Date } | null {
  const anchorStart = localMidnightToUtc(WHIMSY_WEEKEND_ANCHOR.year, WHIMSY_WEEKEND_ANCHOR.month, WHIMSY_WEEKEND_ANCHOR.day, SYDNEY_TIME_ZONE)
  const cycle = Math.floor((date.getTime() - anchorStart.getTime()) / (FESTIVAL_INTERVAL_DAYS * 86_400_000))
  return cycle < 0 ? null : getFestivalWindowForCycle(cycle, startOffsetDays, durationDays)
}

function getNextFestivalStart(
  from: Date,
  startOffsetDays: number,
  durationDays: number
): Date {
  const anchorStart = localMidnightToUtc(WHIMSY_WEEKEND_ANCHOR.year, WHIMSY_WEEKEND_ANCHOR.month, WHIMSY_WEEKEND_ANCHOR.day, SYDNEY_TIME_ZONE)
  const cycle = Math.max(0, Math.floor((from.getTime() - anchorStart.getTime()) / (FESTIVAL_INTERVAL_DAYS * 86_400_000)))
  const window = getFestivalWindowForCycle(cycle, startOffsetDays, durationDays)
  return from < window.start
    ? window.start
    : getFestivalWindowForCycle(cycle + 1, startOffsetDays, durationDays).start
}

function isFestivalActive(
  date: Date,
  startOffsetDays: number,
  durationDays: number
): boolean {
  const window = getFestivalWindow(date, startOffsetDays, durationDays)
  return window !== null && date >= window.start && date < window.end
}

/** Saturday midnight in the earliest region through Sunday midnight in the latest. */
export function isScribbleWeekend(date = new Date()): boolean {
  return isFestivalActive(date, 0, 1)
}

/** When the current Whimsy Weekend ends, or null if one isn't running. */
export function getScribbleWeekendEnd(from = new Date()): Date | null {
  const window = getFestivalWindow(from, 0, 1)
  return window && from >= window.start && from < window.end ? window.end : null
}

export function getNextScribbleWeekendStart(from = new Date()): Date {
  return getNextFestivalStart(from, 0, 1)
}

/* The Blessing event is a rule layer applied on top of any game mode, not a mode
   of its own. Anchor is the UTC midnight a window opens; move it to reschedule. */
export function isBlessingEvent(date = new Date()): boolean {
  return isFestivalActive(date, JIRACHI_FESTIVAL_OFFSET_DAYS, 4)
}

/** When the running Blessing event ends, or null if one isn't running. */
export function getBlessingEventEnd(from = new Date()): Date | null {
  const window = getFestivalWindow(from, JIRACHI_FESTIVAL_OFFSET_DAYS, 4)
  return window && from >= window.start && from < window.end ? window.end : null
}

export function getNextBlessingEventStart(from = new Date()): Date {
  return getNextFestivalStart(from, JIRACHI_FESTIVAL_OFFSET_DAYS, 4)
}

export function getCurrentGameEvent(): GameEvent {
  // Implementation for determining the current event
  const month = new Date().getUTCMonth()
  return GameEvents[month % GameEvents.length]
}
