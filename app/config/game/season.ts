import { GameModification } from "../../types/enum/Game"
import {
  CraftableItems,
  Item,
  ItemComponentsNoFossilOrScarf,
  ItemRecipe
} from "../../types/enum/Item"
import { Pkm } from "../../types/enum/Pokemon"
import type { Synergy } from "../../types/enum/Synergy"
import type {
  ICasualPick,
  ISeasonProgress
} from "../../types/interfaces/UserMetadata"
import { ScholarSynergies } from "./synergies"
import type { Theme } from "./theme"

export type SeasonRewardKind = "booster" | "poke" | "ticket"

export interface SeasonReward {
  kind: SeasonRewardKind
  amount: number
}

export interface SeasonPortrait {
  id: string
  pokemon: Pkm
  label: string
  src: string
}

export const SEASON_PORTRAITS: SeasonPortrait[] = [
  {
    id: "ancient-mew",
    pokemon: Pkm.MEW,
    label: "Ancient Mew",
    src: "assets/season/ancient-mew.png"
  },
  {
    id: "ancient-mew-special",
    pokemon: Pkm.MEW,
    label: "Ancient Mew",
    src: "assets/season/ancient-mew-special.png"
  }
]

export function getSeasonPortrait(id: string) {
  return SEASON_PORTRAITS.find((portrait) => portrait.id === id)
}

export type SeasonCurrency = "poke" | "ticket"

export type SeasonShopItem =
  | "portrait"
  | "theme"
  | "wonder-pick"
  | "booster"

export interface SeasonShopOffer {
  id: string
  item: SeasonShopItem
  label: string
  price: { currency: SeasonCurrency; amount: number }
  oneTime: boolean
  seasonExclusive?: boolean
}

const SEASON_EVERGREEN_OFFERS: SeasonShopOffer[] = [
  {
    id: "wonder-pick",
    item: "wonder-pick",
    label: "Shiny Wonder Pick",
    price: { currency: "ticket", amount: 10 },
    oneTime: false
  },
  {
    id: "booster-poke",
    item: "booster",
    label: "Booster",
    price: { currency: "poke", amount: 100 },
    oneTime: false
  }
]

export type SeasonCroagunkTradeItem =
  | "shiny-ticket"
  | "booster"
  | "casual-pick"
  | "spinda-dish"

export interface SeasonCroagunkTradeOffer {
  id: string
  item: SeasonCroagunkTradeItem
  label: string
  price: number
  amount: number
}

export const SEASON_CROAGUNK_TRADE_INTERVAL_MS = 86_400_000

export const SEASON_CROAGUNK_OFFERS: SeasonCroagunkTradeOffer[] = [
  {
    id: "shiny-ticket",
    item: "shiny-ticket",
    label: "Shiny Ticket",
    price: 100,
    amount: 1
  },
  {
    id: "boosters",
    item: "booster",
    label: "Boosters",
    price: 100,
    amount: 2
  },
  {
    id: "casual-picks",
    item: "casual-pick",
    label: "Wonder Picks",
    price: 100,
    amount: 3
  },
  // eaten on the spot: the reaction it gets, an emote of the player's avatar,
  // is what the Tickets buy
  {
    id: "spinda-dish",
    item: "spinda-dish",
    label: "Spinda's Café Dish",
    price: 100,
    amount: 1
  }
]

export const SPINDA_CAFE_DISHES: Item[] = [
  Item.TEA,
  Item.CURRY,
  Item.POFFIN,
  Item.CASTELIACONE,
  Item.WHIPPED_DREAM,
  Item.HONEY,
  Item.FRUIT_JUICE,
  Item.MOOMOO_MILK,
  Item.SPINDA_COCKTAIL,
  Item.BERRY_JUICE,
  Item.BINDING_MOCHI,
  Item.STRAWBERRY_SWEET,
  Item.LOVE_SWEET,
  Item.BERRY_SWEET,
  Item.SANDWICH,
  Item.HEARTY_STEW
]

export function getCroagunkTradeOffer(id: string | undefined) {
  return SEASON_CROAGUNK_OFFERS.find((offer) => offer.id === id) ?? null
}

export interface SeasonDefinition {
  id: string
  name: string
  mascot: Pkm
  bannerSrc: string
  startsAt: number
  endsAt: number
  stepRewards: SeasonReward[]
  mysteryGiftPortraitIds: string[]
  mysteryTheme: Theme
}

const SEASON_MYSTERY_GIFT_OFFER_ID = "season-portrait"
const SEASON_MYSTERY_THEME_OFFER_ID = "season-theme"

// the exclusive offers sell the current season's mysteryGift and mysteryTheme
export const SEASON_SHOP_OFFERS: SeasonShopOffer[] = [
  {
    id: SEASON_MYSTERY_GIFT_OFFER_ID,
    item: "portrait",
    label: "Mystery Gift",
    price: { currency: "ticket", amount: 5 },
    oneTime: true,
    seasonExclusive: true
  },
  {
    id: SEASON_MYSTERY_THEME_OFFER_ID,
    item: "theme",
    label: "Mystery Theme",
    price: { currency: "ticket", amount: 5 },
    oneTime: true,
    seasonExclusive: true
  },
  ...SEASON_EVERGREEN_OFFERS
]

export const SEASON_BOOSTER_CARD_COUNT = 10
export const SEASON_BOOSTER_SHINY_CHANCE = 1 / 1000
export const SEASON_BOOSTER_HOLO_CHANCE = 1 / 5
export const SEASON_DUPLICATE_CARD_TICKETS = 5
export const SEASON_WONDER_PICK_CARD_COUNT = 5
export const SEASON_WONDER_PICK_FREE_REROLLS = 1
export const SEASON_CASUAL_PICK_INTERVAL_MS = 4 * 60 * 60 * 1000
export const SEASON_CASUAL_PICK_MAX_CHARGES = 2
export const SEASON_CASUAL_PICK_HOLO_CARDS = 1

// a player who never picked starts with one charge. The Croagunk Swap can grant
// charges above the cap: refills still stop at the cap and never take them away
export function getCasualPickCharges(
  casualPick: ICasualPick | undefined,
  now = Date.now()
) {
  const currentWindow = Math.floor(now / SEASON_CASUAL_PICK_INTERVAL_MS)
  if (!casualPick?.chargeWindow) return 1
  const elapsedWindows = currentWindow - casualPick.chargeWindow
  const refilled = Math.min(
    SEASON_CASUAL_PICK_MAX_CHARGES,
    casualPick.charges + Math.max(0, elapsedWindows)
  )
  return Math.max(casualPick.charges, refilled)
}

export function getNextCasualPickChargeAt(now = Date.now()) {
  const currentWindow = Math.floor(now / SEASON_CASUAL_PICK_INTERVAL_MS)
  return (currentWindow + 1) * SEASON_CASUAL_PICK_INTERVAL_MS
}

export const SEASON_MILESTONE_STEPS = [10, 15, 20]
export const SEASON_TICKETS_PER_LOGIN_AFTER_LAST_STEP = 50
export const SEASON_MIN_STAGE_FOR_CHALLENGES = 14
export const SEASON_SOLO_TOP_RANK = 4
export const SEASON_DUO_TOP_RANK = 2

export type SeasonChallengePeriod = "daily" | "weekly"

export type SeasonChallengeId =
  | "daily-play"
  | "daily-learn"
  | "daily-top"
  | "weekly-games"
  | "weekly-three-stars"
  | "weekly-win"

export interface SeasonChallengeDefinition {
  id: SeasonChallengeId
  period: SeasonChallengePeriod
  goal: number
  reward: SeasonReward
}

const WEEKLY_REWARD: SeasonReward = { kind: "poke", amount: 150 }

export const SEASON_DAILY_CHALLENGES: SeasonChallengeDefinition[] = [
  {
    id: "daily-play",
    period: "daily",
    goal: 1,
    reward: { kind: "booster", amount: 1 }
  },
  {
    id: "daily-learn",
    period: "daily",
    goal: 1,
    reward: { kind: "poke", amount: 20 }
  },
  {
    id: "daily-top",
    period: "daily",
    goal: 1,
    reward: { kind: "poke", amount: 20 }
  }
]

const SEASON_WEEKLY_CHALLENGES: SeasonChallengeDefinition[] = [
  { id: "weekly-games", period: "weekly", goal: 7, reward: WEEKLY_REWARD },
  {
    id: "weekly-three-stars",
    period: "weekly",
    goal: 15,
    reward: WEEKLY_REWARD
  },
  { id: "weekly-win", period: "weekly", goal: 1, reward: WEEKLY_REWARD }
]

export type SeasonLearnGoal =
  | { kind: "synergy"; synergy: Synergy }
  | { kind: "item"; item: Item }

export interface SeasonWinGoal {
  isDoubleUp: boolean
  modification: GameModification
}

// Solo or Duo with each mode: the weekly win rolls through all six
const SEASON_WIN_GOALS: SeasonWinGoal[] = [false, true].flatMap((isDoubleUp) =>
  Object.values(GameModification).map((modification) => ({
    isDoubleUp,
    modification
  }))
)

// only items built from two base components, never from a Fossil Stone or a
// Silk Scarf
const SEASON_LEARN_ITEMS = CraftableItems.filter((item) =>
  ItemRecipe[item]?.every((component) =>
    ItemComponentsNoFossilOrScarf.includes(component)
  )
)

export interface SeasonGameResult {
  modification: GameModification
  isDoubleUp: boolean
  rank: number
  stageReached: number
  threeStarEvolutions: number
  maxedSynergies: Synergy[]
  finalItems: Item[]
}

const DEFAULT_STEP_REWARDS: SeasonReward[] = [
  { kind: "poke", amount: 50 },
  { kind: "booster", amount: 1 },
  { kind: "poke", amount: 50 },
  { kind: "booster", amount: 1 },
  { kind: "booster", amount: 2 },
  { kind: "poke", amount: 75 },
  { kind: "booster", amount: 1 },
  { kind: "poke", amount: 75 },
  { kind: "booster", amount: 2 },
  { kind: "ticket", amount: 2 },
  { kind: "poke", amount: 100 },
  { kind: "booster", amount: 1 },
  { kind: "poke", amount: 100 },
  { kind: "booster", amount: 2 },
  { kind: "ticket", amount: 3 },
  { kind: "poke", amount: 150 },
  { kind: "booster", amount: 2 },
  { kind: "poke", amount: 150 },
  { kind: "booster", amount: 3 },
  { kind: "ticket", amount: 5 }
]

export const SEASONS: SeasonDefinition[] = [
  {
    id: "2026-11",
    name: "Wigglytuff's Guild",
    mascot: Pkm.WIGGLYTUFF,
    bannerSrc: "/assets/theme/newjourney/custombg.webp",
    // opens with the patch release, two days before its 1 November Patch Log
    startsAt: Date.UTC(2026, 9, 30),
    endsAt: Date.UTC(2026, 11, 1),
    stepRewards: DEFAULT_STEP_REWARDS,
    mysteryGiftPortraitIds: ["ancient-mew", "ancient-mew-special"],
    mysteryTheme: "onsen"
  }
]

const MS_PER_DAY = 86_400_000

export function getActiveSeason(now = Date.now()): SeasonDefinition | null {
  return (
    SEASONS.find((season) => season.startsAt <= now && now < season.endsAt) ??
    null
  )
}

export function getUpcomingSeason(now = Date.now()): SeasonDefinition | null {
  return SEASONS.find((season) => now < season.startsAt) ?? null
}

export function getSeasonById(id: string | undefined) {
  return SEASONS.find((season) => season.id === id) ?? null
}

export function getSeasonStepsReached(
  progress: ISeasonProgress,
  season: SeasonDefinition
) {
  return Math.min(progress.loginDays, season.stepRewards.length)
}

export function getUtcDayKey(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10)
}

export function getUtcWeekKey(now = Date.now()) {
  const date = new Date(now)
  const daysSinceMonday = (date.getUTCDay() + 6) % 7
  return getUtcDayKey(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() - daysSinceMonday
    )
  )
}

// alternates a synergy day and an item day. Synergy days use the Scholar
// title's list, so Baby and Prodigy are left out
export function getSeasonDailyLearnGoal(now = Date.now()): SeasonLearnGoal {
  const dayIndex = Math.floor(now / MS_PER_DAY)
  const rotation = Math.floor(dayIndex / 2)
  if (dayIndex % 2 === 0) {
    return {
      kind: "synergy",
      synergy: ScholarSynergies[rotation % ScholarSynergies.length]
    }
  }
  return {
    kind: "item",
    item: SEASON_LEARN_ITEMS[rotation % SEASON_LEARN_ITEMS.length]
  }
}

function getUtcWeekIndex(now: number) {
  return Math.floor(Date.parse(getUtcWeekKey(now)) / MS_PER_DAY / 7)
}

// the win goal turns once per full cycle of weekly challenges, so each time
// "Win a game" comes back it asks for a new format and mode
export function getSeasonWeeklyWinGoal(now = Date.now()): SeasonWinGoal {
  const cycle = Math.floor(
    getUtcWeekIndex(now) / SEASON_WEEKLY_CHALLENGES.length
  )
  return SEASON_WIN_GOALS[cycle % SEASON_WIN_GOALS.length]
}

export function getSeasonWeeklyChallenge(now = Date.now()) {
  const weekIndex = getUtcWeekIndex(now)
  return SEASON_WEEKLY_CHALLENGES[weekIndex % SEASON_WEEKLY_CHALLENGES.length]
}

export function getNextUtcMidnight(now = Date.now()) {
  return Math.floor(now / MS_PER_DAY) * MS_PER_DAY + MS_PER_DAY
}

export function getNextUtcMonday(now = Date.now()) {
  return Date.parse(getUtcWeekKey(now)) + 7 * MS_PER_DAY
}
