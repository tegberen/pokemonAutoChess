import {
  COMMUNITY_GOAL_MIN_PERSONAL_GAMES,
  COMMUNITY_GOAL_REWARD_TICKETS,
  getCommunityGoalGames,
  isCommunityGoalWeekday,
  type ICommunityGoalStatus
} from "../config/game/community-goal"
import { getUtcWeekKey } from "../config/game/season"
import CommunityGoalWeek from "../models/mongo-models/community-goal-week"
import UserMetadata from "../models/mongo-models/user-metadata"

const MS_PER_WEEK = 7 * 86_400_000
const STATUS_CACHE_MS = 30_000
const DUPLICATE_KEY_ERROR_CODE = 11000

let cachedStatus: {
  weekKey: string
  fetchedAt: number
  status: ICommunityGoalStatus
} | null = null

export async function getCommunityGoalStatus(
  now = Date.now(),
  skipCache = false
): Promise<ICommunityGoalStatus> {
  const weekKey = getUtcWeekKey(now)
  if (
    !skipCache &&
    cachedStatus?.weekKey === weekKey &&
    now - cachedStatus.fetchedAt < STATUS_CACHE_MS
  ) {
    return cachedStatus.status
  }
  const [current, previous] = await Promise.all([
    CommunityGoalWeek.findOne({ weekKey }).lean(),
    CommunityGoalWeek.findOne({
      weekKey: getUtcWeekKey(now - MS_PER_WEEK)
    }).lean()
  ])
  const goalGames = getCommunityGoalGames(previous?.weekdayGames ?? null)
  const games = current?.games ?? 0
  const status = {
    fillRatio: Math.min(1, games / goalGames),
    isReached: games >= goalGames
  }
  cachedStatus = { weekKey, fetchedAt: now, status }
  return status
}

async function addGameToWeek(weekKey: string, isWeekday: boolean) {
  await CommunityGoalWeek.updateOne(
    { weekKey },
    { $inc: isWeekday ? { games: 1, weekdayGames: 1 } : { games: 1 } },
    { upsert: true }
  )
}

// games played side by side count once: the filter only matches a game that
// started after the last counted one ended, so a concurrent end cannot slip in
async function addGameToPlayer(
  uid: string,
  weekKey: string,
  gameStartedAt: number,
  now: number
) {
  const notOverlapping = {
    "communityGoal.countedUntil": { $not: { $gt: gameStartedAt } }
  }
  const counted = await UserMetadata.updateOne(
    { uid, "communityGoal.weekKey": weekKey, ...notOverlapping },
    {
      $inc: { "communityGoal.games": 1 },
      $set: { "communityGoal.countedUntil": now }
    }
  )
  if (counted.matchedCount > 0) return true
  const started = await UserMetadata.updateOne(
    { uid, "communityGoal.weekKey": { $ne: weekKey }, ...notOverlapping },
    {
      $set: {
        communityGoal: { weekKey, games: 1, claimed: false, countedUntil: now }
      }
    }
  )
  return started.matchedCount > 0
}

// a finished game of a human player adds one to that player's own count,
// which decides who can claim, and then to the week's shared total
export async function recordCommunityGoalGame(
  uid: string,
  gameStartedAt: number,
  now = Date.now()
) {
  const weekKey = getUtcWeekKey(now)
  if (!(await addGameToPlayer(uid, weekKey, gameStartedAt, now))) return
  const isWeekday = isCommunityGoalWeekday(now)
  try {
    await addGameToWeek(weekKey, isWeekday)
  } catch (error) {
    // two first games of the week racing to create its document
    if ((error as { code?: number }).code !== DUPLICATE_KEY_ERROR_CODE) {
      throw error
    }
    await addGameToWeek(weekKey, isWeekday)
  }
}

export async function claimCommunityGoal(uid: string, now = Date.now()) {
  const status = await getCommunityGoalStatus(now, true)
  if (!status.isReached) return null
  return UserMetadata.findOneAndUpdate(
    {
      uid,
      "communityGoal.weekKey": getUtcWeekKey(now),
      "communityGoal.games": { $gte: COMMUNITY_GOAL_MIN_PERSONAL_GAMES },
      "communityGoal.claimed": { $ne: true }
    },
    {
      $set: { "communityGoal.claimed": true },
      $inc: { seasonTickets: COMMUNITY_GOAL_REWARD_TICKETS }
    },
    { returnDocument: "after" }
  )
}
