export const RAINBOW_HOURS_TICKETS_PER_GAME = 20
export const RAINBOW_HOURS_TICKETS_PER_WIN = 30
export const RAINBOW_FINALE_WONDER_PICKS = 1
export const RAINBOW_FINALE_WINNER_BOOSTERS = 1
export const RAINBOW_FINALE_ROOM_NAME = "Smeargle Pack for a Pack"

// every day, UTC: the evening one opens with the Daily Duel, and each ends
// in its own finale. Keep in sync with RAINBOW_FINALE_LOBBY_CRON
export const RAINBOW_HOURS_WINDOWS_UTC = [
  { startHour: 3, endHour: 6 },
  { startHour: 21, endHour: 24 }
]

// the current Rainbow Hours, or the next ones
export function getNextRainbowHours(date = new Date()) {
  for (let dayOffset = 0; ; dayOffset++) {
    for (const window of RAINBOW_HOURS_WINDOWS_UTC) {
      const start = new Date(date)
      start.setUTCDate(start.getUTCDate() + dayOffset)
      start.setUTCHours(window.startHour, 0, 0, 0)
      const end = new Date(start)
      end.setUTCHours(window.endHour, 0, 0, 0)
      if (end > date) return { start, end }
    }
  }
}

export function isRainbowHours(date = new Date()) {
  return getNextRainbowHours(date).start <= date
}
