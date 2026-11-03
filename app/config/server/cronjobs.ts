export const CRON_HISTORY_CLEANUP_DELAY = 86400 * 1000 * 30 // 30 days

export const DAILY_DUEL_LOBBY_CRON = "0 0 20 * * *" // every day 20:00 UTC
export const DAILY_DUEL_ROOM_NAME = "Daily Duel"
// Tuesday to Saturday 00:00 UTC: the end of each weekday's Rainbow Hours
export const RAINBOW_FINALE_LOBBY_CRON = "0 0 0 * * 2-6"
export const WILD_CARD_LOBBY_CRON = "0 0 4,8,12,16 * * *" // every day, UTC
