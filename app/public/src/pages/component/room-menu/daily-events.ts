import { t } from "i18next"
import {
  getNextRainbowHoursStart,
  getRainbowFinaleTime,
  RAINBOW_FINALE_ROOM_NAME,
  RAINBOW_FINALE_WINNER_BOOSTERS,
  RAINBOW_FINALE_WONDER_PICKS,
  RAINBOW_HOURS_START_HOUR_UTC,
  RAINBOW_HOURS_TICKETS_PER_GAME,
  RAINBOW_HOURS_TICKETS_PER_WIN,
  RAINBOW_HOURS_UTC_DAYS
} from "../../../../../config/game/rainbow-hours"
import {
  getNextWildCardTime,
  WILD_CARD_LOBBY_HOURS_UTC,
  WILD_CARD_ROOM_NAME,
  WILD_CARD_WONDER_PICKS
} from "../../../../../config/game/wild-card"
import { SpecialGameRule } from "../../../../../types/enum/SpecialGameRule"

export const DAILY_DUEL_HOUR_UTC = 20
export const WILD_CARD_ICON = "/assets/ui/wild_card_cards.svg"
// the mascot is kept for the preparation lobby
export const WILD_CARD_MASCOT = "/assets/ui/game_modes/wild_card.png"
export const DAILY_DUEL_ICON = "/assets/ui/daily_duel.svg"
export const RAINBOW_HOURS_ICON = "/assets/ui/rainbow_hours.svg"
export const SMEARGLE_PACK_ICON = "/assets/ui/smeargle_packs.svg"

// one icon per event, wherever its room shows up
export function getEventRoomIcon(room: {
  dailyDuel?: boolean
  rainbowFinale?: boolean
  specialGameRule?: SpecialGameRule | null
}) {
  if (room.rainbowFinale) return SMEARGLE_PACK_ICON
  if (room.specialGameRule === SpecialGameRule.WILD_CARD) return WILD_CARD_ICON
  if (room.dailyDuel) return DAILY_DUEL_ICON
  return "/assets/icons/fire_week_streak.svg"
}
// 4 January 2026 is a Sunday, so a UTC day number is a day offset from it
const REFERENCE_SUNDAY_UTC = Date.UTC(2026, 0, 4)

export function getNextDailyDuel(now: Date) {
  const next = new Date(now)
  next.setUTCHours(DAILY_DUEL_HOUR_UTC, 0, 0, 0)
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1)
  return next
}

export function formatLocalTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function atUtc(utcDay: number, utcHour: number) {
  return new Date(REFERENCE_SUNDAY_UTC + (utcDay * 24 + utcHour) * 3600000)
}

// a schedule set on UTC days, written in the viewer's own days and clock
function formatLocalWeekdays(utcDays: number[], utcHour: number) {
  const weekday = (utcDay: number) =>
    atUtc(utcDay, utcHour).toLocaleDateString([], { weekday: "short" })
  return `${weekday(utcDays[0])}–${weekday(utcDays[utcDays.length - 1])}`
}

const formatUtcHour = (utcHour: number) => formatLocalTime(atUtc(0, utcHour))

const TICKETS_ICON = "/assets/icons/season_poke.svg"
const WONDER_PICK_ICON = "/assets/ui/pokecard.png"
const BOOSTER_ICON = "/assets/ui/booster.png"

// written like the banner: an amount and its icon, the winner's after "Win"
export type RewardPart = {
  amount: string
  icon?: string
  winnerOnly?: boolean
}

export type DailyEvent = {
  id: "wild-card" | "daily-duel" | "rainbow-hours" | "rainbow-finale"
  name: string
  icon: string
  start: Date
  // only Rainbow Hours last: the others are a lobby opening
  end?: Date
  when: string
  reward: string
  rewardParts: RewardPart[]
}

export function getDailyEvents(now: Date): DailyEvent[] {
  const rainbowStart = getNextRainbowHoursStart(now)
  const everyDay = t("daily_events.every_day")
  const events: DailyEvent[] = [
    {
      id: "wild-card",
      name: WILD_CARD_ROOM_NAME,
      icon: WILD_CARD_ICON,
      start: getNextWildCardTime(now),
      when: `${everyDay} · ${WILD_CARD_LOBBY_HOURS_UTC.map(formatUtcHour).join(
        ", "
      )}`,
      reward: t("daily_events.wild_card_reward", {
        wonderPicks: WILD_CARD_WONDER_PICKS
      }),
      rewardParts: [
        { amount: `+${WILD_CARD_WONDER_PICKS}`, icon: WONDER_PICK_ICON }
      ]
    },
    {
      id: "daily-duel",
      name: "Daily Duel",
      icon: DAILY_DUEL_ICON,
      start: getNextDailyDuel(now),
      when: `${everyDay} · ${formatUtcHour(DAILY_DUEL_HOUR_UTC)}`,
      reward: t("daily_events.daily_duel_reward"),
      rewardParts: [{ amount: t("daily_events.podium") }]
    },
    {
      id: "rainbow-hours",
      name: "Rainbow Hours",
      icon: RAINBOW_HOURS_ICON,
      start: rainbowStart,
      end: getRainbowFinaleTime(rainbowStart),
      when: `${formatLocalWeekdays(
        RAINBOW_HOURS_UTC_DAYS,
        RAINBOW_HOURS_START_HOUR_UTC
      )} · ${formatUtcHour(RAINBOW_HOURS_START_HOUR_UTC)}–${formatUtcHour(0)}`,
      reward: t("daily_events.rainbow_hours_reward", {
        ticketsPerGame: RAINBOW_HOURS_TICKETS_PER_GAME,
        ticketsPerWin: RAINBOW_HOURS_TICKETS_PER_WIN
      }),
      rewardParts: [
        { amount: `+${RAINBOW_HOURS_TICKETS_PER_GAME}`, icon: TICKETS_ICON },
        {
          amount: `+${RAINBOW_HOURS_TICKETS_PER_WIN}`,
          icon: TICKETS_ICON,
          winnerOnly: true
        }
      ]
    },
    {
      id: "rainbow-finale",
      name: RAINBOW_FINALE_ROOM_NAME,
      icon: SMEARGLE_PACK_ICON,
      start: getRainbowFinaleTime(rainbowStart),
      // it closes the evening's Rainbow Hours, so it is listed on their days
      when: `${formatLocalWeekdays(
        RAINBOW_HOURS_UTC_DAYS,
        RAINBOW_HOURS_START_HOUR_UTC
      )} · ${formatUtcHour(0)}`,
      reward: t("daily_events.rainbow_finale_reward", {
        wonderPicks: RAINBOW_FINALE_WONDER_PICKS,
        boosters: RAINBOW_FINALE_WINNER_BOOSTERS
      }),
      rewardParts: [
        { amount: `+${RAINBOW_FINALE_WONDER_PICKS}`, icon: WONDER_PICK_ICON },
        {
          amount: `+${RAINBOW_FINALE_WINNER_BOOSTERS}`,
          icon: BOOSTER_ICON,
          winnerOnly: true
        }
      ]
    }
  ]
  return events.sort((a, b) => a.start.getTime() - b.start.getTime())
}
