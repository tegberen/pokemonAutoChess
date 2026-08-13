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
const JIRACHI_FESTIVAL_DURATION_DAYS = 4
const JIRACHI_FINALE_DURATION_DAYS = 1
const WHIMSY_WEEKEND_DURATION_DAYS = 1

/* TEMP this week's Whimsy Weekend closes a day early to hand the stage to the
   extended Wish Festival start phase, see JIRACHI_EXTENDED_START_CYCLE. Delete
   this and getWhimsyWeekendDurationDays together with it. */
const WHIMSY_EARLY_END_CYCLE = 0
const WHIMSY_EARLY_END_DURATION_DAYS = 0

// TEMP see WHIMSY_EARLY_END_CYCLE
function getWhimsyWeekendDurationDays(cycle: number) {
  return cycle === WHIMSY_EARLY_END_CYCLE
    ? WHIMSY_EARLY_END_DURATION_DAYS
    : WHIMSY_WEEKEND_DURATION_DAYS
}

/* TEMP the community voted to bring the first festival forward, so cycle 0 opens
   with the Whimsy Weekend instead of 4 days later and keeps its scheduled end:
   an extended start phase. Delete this and getBlessingFestivalSchedule once the
   August 2026 window has passed, so every cycle uses the regular offset again. */
const JIRACHI_EXTENDED_START_CYCLE = 0

// TEMP see JIRACHI_EXTENDED_START_CYCLE
function getBlessingFestivalSchedule(cycle: number) {
  return cycle === JIRACHI_EXTENDED_START_CYCLE
    ? {
        offsetDays: 0,
        durationDays:
          JIRACHI_FESTIVAL_OFFSET_DAYS + JIRACHI_FESTIVAL_DURATION_DAYS
      }
    : {
        offsetDays: JIRACHI_FESTIVAL_OFFSET_DAYS,
        durationDays: JIRACHI_FESTIVAL_DURATION_DAYS
      }
}

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

/** Which 14-day cycle a date falls in; negative before the anchor. */
function getFestivalCycle(date: Date): number {
  const anchorStart = localMidnightToUtc(WHIMSY_WEEKEND_ANCHOR.year, WHIMSY_WEEKEND_ANCHOR.month, WHIMSY_WEEKEND_ANCHOR.day, SYDNEY_TIME_ZONE)
  return Math.floor((date.getTime() - anchorStart.getTime()) / (FESTIVAL_INTERVAL_DAYS * 86_400_000))
}

function getFestivalWindow(
  date: Date,
  startOffsetDays: number,
  durationDays: number
): { start: Date; end: Date } | null {
  const cycle = getFestivalCycle(date)
  return cycle < 0 ? null : getFestivalWindowForCycle(cycle, startOffsetDays, durationDays)
}

// TEMP the duration varies by cycle, see WHIMSY_EARLY_END_CYCLE
function getWhimsyWindow(date: Date): { start: Date; end: Date } | null {
  const cycle = getFestivalCycle(date)
  if (cycle < 0) return null
  return getFestivalWindowForCycle(cycle, 0, getWhimsyWeekendDurationDays(cycle))
}

// TEMP the offset varies by cycle, see JIRACHI_EXTENDED_START_CYCLE
function getBlessingWindow(date: Date): { start: Date; end: Date } | null {
  const cycle = getFestivalCycle(date)
  if (cycle < 0) return null
  const { offsetDays, durationDays } = getBlessingFestivalSchedule(cycle)
  return getFestivalWindowForCycle(
    cycle,
    offsetDays,
    durationDays + JIRACHI_FINALE_DURATION_DAYS
  )
}

function getWishFestivalFinaleWindow(date: Date): { start: Date; end: Date } | null {
  const cycle = getFestivalCycle(date)
  if (cycle < 0) return null
  const { offsetDays, durationDays } = getBlessingFestivalSchedule(cycle)
  return getFestivalWindowForCycle(
    cycle,
    offsetDays + durationDays,
    JIRACHI_FINALE_DURATION_DAYS
  )
}

function getNextFestivalStart(
  from: Date,
  startOffsetDays: number,
  durationDays: number
): Date {
  const cycle = Math.max(0, getFestivalCycle(from))
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
  const window = getWhimsyWindow(date)
  return window !== null && date >= window.start && date < window.end
}

/** When the current Whimsy Weekend ends, or null if one isn't running. */
export function getScribbleWeekendEnd(from = new Date()): Date | null {
  const window = getWhimsyWindow(from)
  return window && from >= window.start && from < window.end ? window.end : null
}

/* the start never moves, only the duration, so the regular schedule applies */
export function getNextScribbleWeekendStart(from = new Date()): Date {
  return getNextFestivalStart(from, 0, WHIMSY_WEEKEND_DURATION_DAYS)
}

/* The Blessing event is a rule layer applied on top of any game mode, not a mode
   of its own. Anchor is the UTC midnight a window opens; move it to reschedule. */
export function isBlessingEvent(date = new Date()): boolean {
  const window = getBlessingWindow(date)
  return window !== null && date >= window.start && date < window.end
}

export function isWishFestivalFinale(date = new Date()): boolean {
  const window = getWishFestivalFinaleWindow(date)
  return window !== null && date >= window.start && date < window.end
}

export function getNextWishFestivalFinaleStart(from = new Date()): Date {
  const cycle = Math.max(0, getFestivalCycle(from))
  const current = getBlessingFestivalSchedule(cycle)
  const currentStart = getFestivalWindowForCycle(
    cycle,
    current.offsetDays + current.durationDays,
    JIRACHI_FINALE_DURATION_DAYS
  ).start
  if (from < currentStart) return currentStart
  const next = getBlessingFestivalSchedule(cycle + 1)
  return getFestivalWindowForCycle(
    cycle + 1,
    next.offsetDays + next.durationDays,
    JIRACHI_FINALE_DURATION_DAYS
  ).start
}

/** When the running Blessing event ends, or null if one isn't running. */
export function getBlessingEventEnd(from = new Date()): Date | null {
  const window = getBlessingWindow(from)
  return window && from >= window.start && from < window.end ? window.end : null
}

export function getNextBlessingEventStart(from = new Date()): Date {
  const cycle = Math.max(0, getFestivalCycle(from))
  const current = getBlessingFestivalSchedule(cycle)
  const window = getFestivalWindowForCycle(
    cycle,
    current.offsetDays,
    current.durationDays
  )
  if (from < window.start) return window.start
  const next = getBlessingFestivalSchedule(cycle + 1)
  return getFestivalWindowForCycle(cycle + 1, next.offsetDays, next.durationDays)
    .start
}

export function getCurrentGameEvent(): GameEvent {
  // Implementation for determining the current event
  const month = new Date().getUTCMonth()
  return GameEvents[month % GameEvents.length]
}
