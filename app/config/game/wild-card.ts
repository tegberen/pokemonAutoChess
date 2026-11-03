import { Rarity } from "../../types/enum/Game"

export const WILD_CARD_ROOM_NAME = "Wild Card"
// keep in sync with WILD_CARD_LOBBY_CRON
export const WILD_CARD_LOBBY_HOURS_UTC = [4, 8, 12, 16]
export const WILD_CARD_CANDIDATES = 5
export const WILD_CARD_WONDER_PICKS = 1
// the whole lobby draws its leaders from one of these, rolled per game
export const WILD_CARD_RARITIES = [
  Rarity.COMMON,
  Rarity.UNCOMMON,
  Rarity.RARE,
  Rarity.EPIC
]
// the Wonder Pick result stays on screen this long before the choice closes
export const WILD_CARD_REVEAL_DURATION = 3500

export function getNextWildCardTime(date = new Date()) {
  const next = new Date(date)
  const hour = WILD_CARD_LOBBY_HOURS_UTC.find(
    (lobbyHour) => lobbyHour > date.getUTCHours()
  )
  if (hour === undefined) {
    next.setUTCDate(next.getUTCDate() + 1)
    next.setUTCHours(WILD_CARD_LOBBY_HOURS_UTC[0], 0, 0, 0)
  } else {
    next.setUTCHours(hour, 0, 0, 0)
  }
  return next
}
