export const CRON_HISTORY_CLEANUP_DELAY = 86400 * 1000 * 30 // 30 days

export const DAILY_DUEL_LOBBY_CRON = "0 0 21 * * *" // every day 21:00 UTC
export const DAILY_DUEL_ROOM_NAME = "Daily Duel"
// every day 00:00 and 06:00 UTC: the end of each Rainbow Hours window
export const RAINBOW_FINALE_LOBBY_CRON = "0 0 0,6 * * *"
export const WILD_CARD_LOBBY_CRON = "0 0 8,12,16 * * *" // every day, UTC
