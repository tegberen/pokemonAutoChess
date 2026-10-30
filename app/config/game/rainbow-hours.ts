const RAINBOW_HOURS_START_HOUR_UTC = 20
export const RAINBOW_HOURS_TICKETS_PER_GAME = 20
export const RAINBOW_HOURS_TICKETS_PER_WIN = 30
export const RAINBOW_FINALE_WONDER_PICKS = 1
export const RAINBOW_FINALE_WINNER_BOOSTERS = 1
export const RAINBOW_FINALE_ROOM_NAME = "Smeargle Pack for a Pack"

// Monday to Friday: weekends keep their tournaments
const RAINBOW_HOURS_UTC_DAYS = [1, 2, 3, 4, 5]

// from the Daily Duel until midnight UTC, when the finale opens
export function isRainbowHours(date = new Date()) {
  return (
    RAINBOW_HOURS_UTC_DAYS.includes(date.getUTCDay()) &&
    date.getUTCHours() >= RAINBOW_HOURS_START_HOUR_UTC
  )
}

export function getRainbowFinaleTime(date = new Date()) {
  const finale = new Date(date)
  finale.setUTCHours(24, 0, 0, 0)
  return finale
}
