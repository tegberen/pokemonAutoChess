import { t } from "i18next"
import {
  getCroagunkTradeOffer,
  getGymLeadersPair,
  getNextUtcMidnight,
  getNextUtcMonday,
  getSeasonDailyLearnGoal,
  getSeasonWeeklyWinGoal,
  getSeasonById,
  getSeasonPortrait,
  getSeasonStepsReached,
  getSeasonWeeklyChallenge,
  getUtcDayKey,
  getUtcWeekKey,
  SEASON_DAILY_CHALLENGES,
  SEASON_DUO_TOP_RANK,
  SEASON_MILESTONE_STEPS,
  SEASON_SHOP_OFFERS,
  SEASON_SOLO_TOP_RANK,
  SEASON_TICKETS_PER_LOGIN_AFTER_LAST_STEP,
  type GymLeadersPair,
  type SeasonChallengeDefinition,
  type SeasonChallengePeriod,
  type SeasonCroagunkTradeOffer,
  type SeasonLearnGoal,
  type SeasonPortrait,
  type SeasonReward,
  type SeasonRewardKind,
  type SeasonShopOffer
} from "../../../../../config/game/season"
import {
  getShinyWonderPickMilestones,
  SHINY_WONDER_PICK_LEVEL_STEP
} from "../../../../../config/game/experience"
import { SynergyTiersThresholds } from "../../../../../config/game/synergies"
import type { Theme } from "../../../../../config/game/theme"
import type { Pkm } from "../../../../../types/enum/Pokemon"
import type { Synergy } from "../../../../../types/enum/Synergy"
import type {
  ICroagunkTrade,
  IUserMetadataUnpacked
} from "../../../../../types/interfaces/UserMetadata"

export interface SeasonRewardView extends SeasonReward {
  label: string
}

export interface SeasonStep {
  index: number
  reward: SeasonRewardView
  milestone: boolean
}

export interface SeasonChallenge {
  id: string
  period: SeasonChallengePeriod
  label: string
  learnGoal?: SeasonLearnGoal
  gymLeaders?: { pair: GymLeadersPair; info: string }
  progress: number
  goal: number
  reward: SeasonReward
}

export interface SeasonState {
  name: string
  mascot: Pkm
  bannerSrc: string
  endsAt: string
  dailyResetsAt: string
  weeklyResetsAt: string
  stepsReached: number
  claimedSteps: number[]
  pokeBalance: number
  ticketBalance: number
  boosterBalance: number
  extraWonderPicks: number
  isWonderPickGiftClaimed: boolean
  pokePerLoginAfterLastStep: number
  shopOffers: SeasonShopOffer[]
  purchasedOfferIds: string[]
  croagunkTrade?: ICroagunkTrade
  croagunkOffer: SeasonCroagunkTradeOffer | null
  level: number
  nextShinyPickLevel: number
  shinyPickMilestoneProgress: number
  mysteryGiftPortraits: SeasonPortrait[]
  mysteryTheme: Theme
  steps: SeasonStep[]
  challenges: SeasonChallenge[]
}

const REWARD_NAMES: Record<SeasonRewardKind, [string, string]> = {
  booster: ["Booster", "Boosters"],
  poke: ["Ticket", "Tickets"],
  ticket: ["Shiny Ticket", "Shiny Tickets"]
}

function getRewardLabel(reward: SeasonReward) {
  const [singular, plural] = REWARD_NAMES[reward.kind]
  if (reward.amount !== 1) return `${reward.amount} ${plural}`
  return reward.kind === "poke" ? `1 ${singular}` : singular
}

function getGymLeadersView(uid: string, now: number) {
  const pair = getGymLeadersPair(uid, now)
  const [first, second] = pair
  const describeSide = (highest: Synergy, lowest: Synergy) =>
    `${t(`synergy.${highest}`)} ` +
    `min ${SynergyTiersThresholds[highest].at(-1)}, ` +
    `${t(`synergy.${lowest}`)} ` +
    `min ${SynergyTiersThresholds[lowest][0]}`
  const info =
    "Gym Leaders: win a Duo game with your pair or your partner's. One " +
    "partner needs the highest tier of one synergy and the lowest tier of " +
    "the other, the other partner the reverse.\n\n" +
    `A: ${describeSide(first, second)}\nB: ${describeSide(second, first)}`
  return { pair, info }
}

function getChallengeLabel(
  challenge: SeasonChallengeDefinition,
  uid: string,
  now: number
) {
  switch (challenge.id) {
    case "gym-leaders": {
      const [first, second] = getGymLeadersPair(uid, now)
      return (
        `Win a Duo game with ${t(`synergy.${first}`)} ` +
        `and ${t(`synergy.${second}`)} or your partner's pair`
      )
    }
    case "daily-play":
      return "Play a game"
    case "daily-learn": {
      const learnGoal = getSeasonDailyLearnGoal(now)
      return learnGoal.kind === "synergy"
        ? `Finish a game with ${t(`synergy.${learnGoal.synergy}`)} ` +
          "at its highest tier"
        : `Finish a game holding a ${t(`item.${learnGoal.item}`)}`
    }
    case "daily-top":
      return (
        `Finish Top ${SEASON_SOLO_TOP_RANK} in Solo ` +
        `or Top ${SEASON_DUO_TOP_RANK} in Duo`
      )
    case "weekly-games":
      return `Play ${challenge.goal} games`
    case "weekly-three-stars":
      return `Evolve ${challenge.goal} Pokémon to 3 stars`
    case "weekly-win": {
      const winGoal = getSeasonWeeklyWinGoal(now)
      const format = winGoal.isDoubleUp ? "Duo" : "Solo"
      const mode = t(`game_modification.${winGoal.modification}`)
      return `Win a ${format} ${mode} game`
    }
  }
}

// null while no season pass exists for this player, e.g. between seasons
export function getSeasonView(
  profile: IUserMetadataUnpacked,
  now: number
): SeasonState | null {
  const progress = profile.season
  const season = getSeasonById(progress?.id)
  if (!progress || !season) return null

  const isToday = progress.dailyKey === getUtcDayKey(now)
  const isThisWeek = progress.weeklyKey === getUtcWeekKey(now)
  const weeklyChallenge = getSeasonWeeklyChallenge(now)
  const level = profile.level ?? 0
  const shinyPickMilestones = getShinyWonderPickMilestones(level)
  const challenges: SeasonChallenge[] = [
    ...SEASON_DAILY_CHALLENGES.map((challenge) => ({
      id: challenge.id,
      period: challenge.period,
      label: getChallengeLabel(challenge, profile.uid, now),
      learnGoal:
        challenge.id === "daily-learn"
          ? getSeasonDailyLearnGoal(now)
          : undefined,
      gymLeaders:
        challenge.id === "gym-leaders"
          ? getGymLeadersView(profile.uid, now)
          : undefined,
      progress: isToday ? (progress.dailyProgress?.[challenge.id] ?? 0) : 0,
      goal: challenge.goal,
      reward: challenge.reward
    })),
    {
      id: weeklyChallenge.id,
      period: weeklyChallenge.period,
      label: getChallengeLabel(weeklyChallenge, profile.uid, now),
      progress: isThisWeek ? progress.weeklyProgress : 0,
      goal: weeklyChallenge.goal,
      reward: weeklyChallenge.reward
    }
  ]

  return {
    name: season.name,
    mascot: season.mascot,
    bannerSrc: season.bannerSrc,
    endsAt: new Date(season.endsAt).toISOString(),
    dailyResetsAt: new Date(getNextUtcMidnight(now)).toISOString(),
    weeklyResetsAt: new Date(getNextUtcMonday(now)).toISOString(),
    stepsReached: getSeasonStepsReached(progress, season),
    claimedSteps: progress.claimedSteps,
    pokeBalance: profile.seasonTickets ?? 0,
    ticketBalance: profile.shinyTickets ?? 0,
    boosterBalance: profile.booster,
    extraWonderPicks: profile.wonderPicks ?? 0,
    isWonderPickGiftClaimed: progress.wonderPickGiftClaimed,
    pokePerLoginAfterLastStep: SEASON_TICKETS_PER_LOGIN_AFTER_LAST_STEP,
    shopOffers: SEASON_SHOP_OFFERS,
    purchasedOfferIds: progress.purchasedOfferIds,
    croagunkTrade: profile.croagunkTrade,
    croagunkOffer: getCroagunkTradeOffer(profile.croagunkTrade?.offerId),
    level,
    nextShinyPickLevel:
      (shinyPickMilestones + 1) * SHINY_WONDER_PICK_LEVEL_STEP,
    shinyPickMilestoneProgress:
      (level % SHINY_WONDER_PICK_LEVEL_STEP) / SHINY_WONDER_PICK_LEVEL_STEP,
    mysteryGiftPortraits: season.mysteryGiftPortraitIds.flatMap(
      (portraitId) => getSeasonPortrait(portraitId) ?? []
    ),
    mysteryTheme: season.mysteryTheme,
    steps: season.stepRewards.map((reward, i) => ({
      index: i + 1,
      reward: { ...reward, label: getRewardLabel(reward) },
      milestone: SEASON_MILESTONE_STEPS.includes(i + 1)
    })),
    challenges
  }
}
