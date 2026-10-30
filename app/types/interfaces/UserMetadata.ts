import type { Emotion, Role, Title } from ".."
import type { Blessing } from "../enum/Blessing"
import type { Language } from "../enum/Language"
import type { Synergy } from "../enum/Synergy"
import type { AvatarCosmeticId } from "../enum/AvatarCosmetic"
import type { Item } from "../enum/Item"
import type { Pkm } from "../enum/Pokemon"
import type { SeasonChallengeId } from "../../config/game/season"
import type { Theme } from "../../config/game/theme"

interface IUserMetadata {
  uid: string
  displayName: string
  twitchUserId?: string
  twitchLogin?: string
  twitchDisplayName?: string
  twitchVerifiedAt?: Date | null
  twitchVerificationRevokedAt?: Date | null
  language: Language | ""
  avatar: string
  games: number
  wins: number
  activeWeeks?: number
  lastActiveWeek?: string
  currentFirstPlaceStreak?: number
  highestFirstPlaceStreak?: number
  exp: number
  level: number
  elo: number
  maxElo: number
  eventPoints: number
  maxEventPoints: number
  eventFinishTime: Date | null
  booster: number
  titles: Title[]
  guideLessonsCompleted?: Synergy[]
  // one entry per top finish with that synergy maxed, for the SCHOLAR title
  scholarFinishes?: Synergy[]
  // Prismatic Ultra Hero Wishes won a game with, for the ULTRA title
  ultraHeroesWon?: Blessing[]
  dailyDuelWins?: number
  unlockedAvatarCosmetics?: AvatarCosmeticId[]
  title: "" | Title
  role: Role
  banned?: boolean
  seasonTickets?: number
  rainbowHoursRewardedUntil?: number
  shinyTickets?: number
  wonderPicks?: number
  unlockedThemes?: Theme[]
  seasonPortraits?: string[]
  holoIndexes?: string[]
  wonderPickDraw?: IWonderPickDraw
  casualPick?: ICasualPick
  croagunkTrade?: ICroagunkTrade
  shinyPickMilestonesClaimed?: number
  season?: ISeasonProgress
  pokemonCollection: Map<string, IPokemonCollectionItem>
}

export interface ICroagunkTrade {
  offerId: string
  chosenAt: number
  expiresAt: number
  purchasedAt?: number
  dish?: Item
}

export interface ICasualPick {
  charges: number
  chargeWindow: number
  candidates: { pokemon: Pkm; holo: boolean }[]
  rerollsLeft: number
}

// kept outside the season so a draw survives the season rollover
export interface IWonderPickDraw {
  candidates: Pkm[]
  rerollsLeft: number
}

export interface ISeasonProgress {
  id: string
  loginDays: number
  lastLoginDay: string
  claimedSteps: number[]
  wonderPickGiftClaimed: boolean
  purchasedOfferIds: string[]
  challengeRevision: number
  dailyKey: string
  dailyProgress: Partial<Record<SeasonChallengeId, number>>
  weeklyKey: string
  weeklyProgress: number
}

interface IPokemonCollectionItem {
  id: string
  selectedEmotion: Emotion | null
  selectedShiny: boolean
  dust: number
  played: number
}

export interface IUserMetadataMongo extends IUserMetadata {
  pokemonCollection: Map<string, IPokemonCollectionItemMongo>
}

export interface IPokemonCollectionItemMongo extends IPokemonCollectionItem {
  // OPTIMIZED: Single field to store all unlocked emotions data in 5 bytes (40 bits used)
  unlocked: Uint8Array
}

// When using .lean(), Mongoose returns BSON Binary objects instead of Buffer
export type IPokemonCollectionItemLean = Omit<
  IPokemonCollectionItemMongo,
  "unlocked"
> & {
  unlocked: Uint8Array | { buffer: ArrayBuffer } | undefined
}

export type IUserMetadataLean = Omit<
  IUserMetadataMongo,
  "pokemonCollection"
> & {
  pokemonCollection: Record<string, IPokemonCollectionItemLean>
}

// used in JSON responses and client-side before unpacking
export interface IUserMetadataClient extends IUserMetadata {
  pokemonCollection: Map<string, IPokemonCollectionItemClient>
}

export interface IPokemonCollectionItemClient extends IPokemonCollectionItem {
  unlockedb64: string // 40 bits encoded as base64 string
}

// used after unpacking the base64 string into emotions and shinyEmotions
export type IPokemonCollectionItemUnpacked = Omit<
  IPokemonCollectionItem,
  "unlockedb64"
> & {
  emotions: Emotion[]
  shinyEmotions: Emotion[]
}

export interface IUserMetadataUnpacked extends IUserMetadata {
  pokemonCollection: Map<string, IPokemonCollectionItemUnpacked>
}

export type IUserMetadataJSON = Omit<
  IUserMetadataClient,
  "pokemonCollection"
> & { pokemonCollection: { [index: string]: IPokemonCollectionItemClient } }
