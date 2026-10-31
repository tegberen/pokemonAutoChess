import type { ICommunityGoal } from "../../types/interfaces/UserMetadata"
import { getUtcWeekKey } from "./season"

export const COMMUNITY_GOAL_FIRST_WEEK_GAMES = 2500
export const COMMUNITY_GOAL_MIN_GAMES = 1500
export const COMMUNITY_GOAL_GROWTH_FACTOR = 1.05
export const COMMUNITY_GOAL_REWARD_TICKETS = 100
export const COMMUNITY_GOAL_MIN_PERSONAL_GAMES = 1
export const COMMUNITY_GOAL_SEGMENTS = 10

export interface ICommunityGoalStatus {
  fillRatio: number
  isReached: boolean
}

export function isCommunityGoalWeekday(now = Date.now()) {
  const day = new Date(now).getUTCDay()
  return day >= 1 && day <= 5
}

// a week must beat the last one's Monday to Friday, so a steady week fills
// the bar early on Saturday and leaves the weekend to claim, while a
// shrinking player base still shows
export function getCommunityGoalGames(previousWeekdayGames: number | null) {
  if (previousWeekdayGames === null) return COMMUNITY_GOAL_FIRST_WEEK_GAMES
  return Math.max(
    COMMUNITY_GOAL_MIN_GAMES,
    Math.ceil(previousWeekdayGames * COMMUNITY_GOAL_GROWTH_FACTOR)
  )
}

export function canClaimCommunityGoal(
  goal: ICommunityGoal | undefined,
  status: ICommunityGoalStatus | null,
  now = Date.now()
) {
  return (
    status?.isReached === true &&
    goal?.weekKey === getUtcWeekKey(now) &&
    (goal.games ?? 0) >= COMMUNITY_GOAL_MIN_PERSONAL_GAMES &&
    goal.claimed !== true
  )
}
