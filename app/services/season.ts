import {
  getActiveSeason,
  getSeasonDailyLearnGoal,
  getSeasonWeeklyWinGoal,
  getSeasonWeeklyChallenge,
  getUpcomingSeason,
  getUtcDayKey,
  getUtcWeekKey,
  SEASON_DAILY_CHALLENGES,
  SEASON_DUO_TOP_RANK,
  SEASON_MIN_STAGE_FOR_CHALLENGES,
  SEASON_SOLO_TOP_RANK,
  SEASON_TICKETS_PER_LOGIN_AFTER_LAST_STEP,
  type SeasonChallengeDefinition,
  type SeasonChallengeId,
  type SeasonDefinition,
  type SeasonGameResult,
  type SeasonRewardKind
} from "../config/game/season"
import UserMetadata from "../models/mongo-models/user-metadata"
import type {
  ISeasonProgress,
  IUserMetadataMongo
} from "../types/interfaces/UserMetadata"
import { logger } from "../utils/logger"
import { syncLevelRewards } from "./level-rewards"

const isDevelopment = process.env.MODE === "dev"

// in development the next season is playable early so it can be tested
export function getCurrentSeasonForServer(
  now = Date.now()
): SeasonDefinition | null {
  return (
    getActiveSeason(now) ?? (isDevelopment ? getUpcomingSeason(now) : null)
  )
}

function createSeasonProgress(seasonId: string): ISeasonProgress {
  return {
    id: seasonId,
    loginDays: 0,
    lastLoginDay: "",
    claimedSteps: [],
    wonderPickGiftClaimed: false,
    purchasedOfferIds: [],
    challengeRevision: 0,
    dailyKey: "",
    dailyProgress: {},
    weeklyKey: "",
    weeklyProgress: 0
  }
}

// the wallet lives outside `season`, so it carries over to the next season
export async function ensureCurrentSeasonProgress(
  uid: string,
  season: SeasonDefinition
) {
  await UserMetadata.updateOne(
    { uid, "season.id": { $ne: season.id } },
    { $set: { season: createSeasonProgress(season.id) } }
  )
}

export async function recordSeasonLogin(
  uid: string,
  now = Date.now()
): Promise<IUserMetadataMongo | null> {
  await syncLevelRewards(uid).catch((error) =>
    logger.error("Error syncing level rewards", error)
  )
  const season = getCurrentSeasonForServer(now)
  if (!season) return UserMetadata.findOne({ uid })
  await ensureCurrentSeasonProgress(uid, season)

  const today = getUtcDayKey(now)
  const stepCount = season.stepRewards.length
  const notLoggedInToday = {
    uid,
    "season.id": season.id,
    "season.lastLoginDay": { $ne: today }
  }

  const userReachingNextStep = await UserMetadata.findOneAndUpdate(
    { ...notLoggedInToday, "season.loginDays": { $lt: stepCount } },
    {
      $set: { "season.lastLoginDay": today },
      $inc: { "season.loginDays": 1 }
    },
    { returnDocument: "after" }
  )
  if (userReachingNextStep) return userReachingNextStep

  const userPastLastStep = await UserMetadata.findOneAndUpdate(
    { ...notLoggedInToday, "season.loginDays": { $gte: stepCount } },
    {
      $set: { "season.lastLoginDay": today },
      $inc: {
        "season.loginDays": 1,
        seasonTickets: SEASON_TICKETS_PER_LOGIN_AFTER_LAST_STEP
      }
    },
    { returnDocument: "after" }
  )
  if (userPastLastStep) return userPastLastStep

  return UserMetadata.findOne({ uid })
}

const PROFILE_FIELD_BY_REWARD_KIND: Record<SeasonRewardKind, string> = {
  booster: "booster",
  poke: "seasonTickets",
  ticket: "shinyTickets"
}

const MAX_OPTIMISTIC_UPDATE_ATTEMPTS = 3

export async function claimSeasonSteps(
  uid: string,
  requestedSteps: number[]
): Promise<IUserMetadataMongo | null> {
  const season = getCurrentSeasonForServer()
  if (!season) return null
  const stepCount = season.stepRewards.length
  const validSteps = [...new Set(requestedSteps)].filter(
    (step) => Number.isInteger(step) && step >= 1 && step <= stepCount
  )
  if (validSteps.length === 0) return null

  // a concurrent claim of an overlapping step makes the guard miss: re-read
  // and claim only what is still unclaimed
  for (let attempt = 0; attempt < MAX_OPTIMISTIC_UPDATE_ATTEMPTS; attempt++) {
    const user = await UserMetadata.findOne({ uid, "season.id": season.id })
    const progress = user?.season
    if (!progress) return null
    const stepsToClaim = validSteps.filter(
      (step) =>
        step <= progress.loginDays && !progress.claimedSteps.includes(step)
    )
    if (stepsToClaim.length === 0) return null

    const rewardIncrements: Record<string, number> = {}
    for (const step of stepsToClaim) {
      const reward = season.stepRewards[step - 1]
      const field = PROFILE_FIELD_BY_REWARD_KIND[reward.kind]
      rewardIncrements[field] = (rewardIncrements[field] ?? 0) + reward.amount
    }

    const updatedUser = await UserMetadata.findOneAndUpdate(
      {
        uid,
        "season.id": season.id,
        "season.loginDays": { $gte: Math.max(...stepsToClaim) },
        "season.claimedSteps": { $nin: stepsToClaim }
      },
      {
        $addToSet: { "season.claimedSteps": { $each: stepsToClaim } },
        $inc: rewardIncrements
      },
      { returnDocument: "after" }
    )
    if (updatedUser) return updatedUser
  }
  return null
}

export async function claimSeasonWonderPickGift(
  uid: string
): Promise<IUserMetadataMongo | null> {
  const season = getCurrentSeasonForServer()
  if (!season) return null
  return UserMetadata.findOneAndUpdate(
    {
      uid,
      "season.id": season.id,
      "season.loginDays": { $gte: season.stepRewards.length },
      "season.wonderPickGiftClaimed": false
    },
    {
      $set: { "season.wonderPickGiftClaimed": true },
      $inc: { wonderPicks: 1 }
    },
    { returnDocument: "after" }
  )
}

function getChallengeProgressGain(
  challengeId: SeasonChallengeId,
  result: SeasonGameResult,
  now: number
): number {
  switch (challengeId) {
    case "daily-play":
    case "weekly-games":
      return 1
    case "daily-learn": {
      const learnGoal = getSeasonDailyLearnGoal(now)
      const isLearnGoalMet =
        learnGoal.kind === "synergy"
          ? result.maxedSynergies.includes(learnGoal.synergy)
          : result.finalItems.includes(learnGoal.item)
      return isLearnGoalMet ? 1 : 0
    }
    case "daily-top": {
      const topRank = result.isDoubleUp
        ? SEASON_DUO_TOP_RANK
        : SEASON_SOLO_TOP_RANK
      return result.rank <= topRank ? 1 : 0
    }
    case "weekly-win": {
      const winGoal = getSeasonWeeklyWinGoal(now)
      const isWinGoalMet =
        result.rank === 1 &&
        result.isDoubleUp === winGoal.isDoubleUp &&
        result.modification === winGoal.modification
      return isWinGoalMet ? 1 : 0
    }
    case "weekly-three-stars":
      return result.threeStarEvolutions
  }
}

export async function recordSeasonGame(
  uid: string,
  result: SeasonGameResult,
  now = Date.now()
): Promise<IUserMetadataMongo | null> {
  const season = getCurrentSeasonForServer(now)
  if (!season || result.stageReached < SEASON_MIN_STAGE_FOR_CHALLENGES) {
    return null
  }
  await ensureCurrentSeasonProgress(uid, season)

  const dayKey = getUtcDayKey(now)
  const weekKey = getUtcWeekKey(now)
  const weeklyChallenge = getSeasonWeeklyChallenge(now)

  for (let attempt = 0; attempt < MAX_OPTIMISTIC_UPDATE_ATTEMPTS; attempt++) {
    const user = await UserMetadata.findOne({ uid, "season.id": season.id })
    const progress = user?.season
    if (!progress) return null

    const isSameDay = progress.dailyKey === dayKey
    const isSameWeek = progress.weeklyKey === weekKey
    const dailyProgress = isSameDay ? { ...progress.dailyProgress } : {}

    const rewardIncrements: Record<string, number> = {}
    const advance = (challenge: SeasonChallengeDefinition, before: number) => {
      const gain = getChallengeProgressGain(challenge.id, result, now)
      const after = Math.min(challenge.goal, before + Math.max(0, gain))
      if (before < challenge.goal && after >= challenge.goal) {
        const field = PROFILE_FIELD_BY_REWARD_KIND[challenge.reward.kind]
        rewardIncrements[field] =
          (rewardIncrements[field] ?? 0) + challenge.reward.amount
      }
      return after
    }

    for (const challenge of SEASON_DAILY_CHALLENGES) {
      dailyProgress[challenge.id] = advance(
        challenge,
        dailyProgress[challenge.id] ?? 0
      )
    }
    const weeklyProgress = advance(
      weeklyChallenge,
      isSameWeek ? progress.weeklyProgress : 0
    )

    // the revision makes this read-modify-write safe against a concurrent
    // game end; documents from before challenges existed have no revision
    const revision = progress.challengeRevision
    const updatedUser = await UserMetadata.findOneAndUpdate(
      {
        uid,
        "season.id": season.id,
        "season.challengeRevision": revision ? revision : { $in: [0, null] }
      },
      {
        $set: {
          "season.dailyKey": dayKey,
          "season.dailyProgress": dailyProgress,
          "season.weeklyKey": weekKey,
          "season.weeklyProgress": weeklyProgress
        },
        $inc: { "season.challengeRevision": 1, ...rewardIncrements }
      },
      { returnDocument: "after" }
    )
    if (updatedUser) return updatedUser
  }
  return null
}
