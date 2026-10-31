import { useEffect, useState } from "react"
import {
  canClaimCommunityGoal,
  COMMUNITY_GOAL_REWARD_TICKETS,
  COMMUNITY_GOAL_SEGMENTS,
  type ICommunityGoalStatus
} from "../../../../../config/game/community-goal"
import { getUtcWeekKey } from "../../../../../config/game/season"
import type { IUserMetadataUnpacked } from "../../../../../types/interfaces/UserMetadata"
import { useAppDispatch } from "../../../hooks"
import { claimCommunityGoal, fetchCommunityGoalStatus } from "../../../network"
import { setErrorAlertMessage } from "../../../stores/NetworkStore"
import { cc } from "../../utils/jsx"

const COMMUNITY_GOAL_RULES =
  "Every game anyone plays to stage 14 fills this bar. Once it is full, " +
  "everyone who played this week can claim the reward. Games played at the " +
  "same time count once."
const REFRESH_MS = 60_000

export default function SeasonCommunityGoal(props: {
  profile: IUserMetadataUnpacked
  now: number
  rewardIcon: string
}) {
  const { profile, now, rewardIcon } = props
  const dispatch = useAppDispatch()
  const [status, setStatus] = useState<ICommunityGoalStatus | null>(null)
  const [isWaiting, setIsWaiting] = useState(false)

  useEffect(() => {
    let isCurrent = true
    const refresh = () =>
      fetchCommunityGoalStatus()
        .then((fetched) => isCurrent && setStatus(fetched))
        .catch(() => {})
    refresh()
    const interval = setInterval(refresh, REFRESH_MS)
    return () => {
      isCurrent = false
      clearInterval(interval)
    }
  }, [])

  const isReached = status?.isReached === true
  const filledSegments = Math.floor(
    (status?.fillRatio ?? 0) * COMMUNITY_GOAL_SEGMENTS
  )
  const isClaimed =
    profile.communityGoal?.weekKey === getUtcWeekKey(now) &&
    profile.communityGoal.claimed === true

  async function claim() {
    if (isWaiting) return
    setIsWaiting(true)
    try {
      await claimCommunityGoal()
    } catch (error) {
      dispatch(setErrorAlertMessage((error as Error).message))
    } finally {
      setIsWaiting(false)
    }
  }

  return (
    <li
      className={cc("season-challenge season-community-goal", {
        done: isReached
      })}
    >
      <div className="season-challenge-top">
        <span className="season-challenge-period">Community</span>
        <span className="season-challenge-label">
          Play together
        </span>
        <span className="season-chip">
          +{COMMUNITY_GOAL_REWARD_TICKETS}
          <img src={rewardIcon} width={16} height={16} alt="Tickets" />
        </span>
      </div>
      <div className="season-challenge-progress">
        <div className="season-challenge-bar">
          {Array.from({ length: COMMUNITY_GOAL_SEGMENTS }, (_, i) => (
            <span key={i} className={cc({ filled: i < filledSegments })} />
          ))}
        </div>
        <span className="season-community-slot">
          <span
            className={cc("season-wonder-info", { hidden: isReached })}
            tabIndex={isReached ? -1 : 0}
            title={COMMUNITY_GOAL_RULES}
            aria-label={COMMUNITY_GOAL_RULES}
          >
            <img src="assets/ui/help.svg" width={16} height={16} alt="" />
          </span>
          <button
            className={cc("season-croagunk-button season-community-claim", {
              hidden: !isReached
            })}
            disabled={
              !canClaimCommunityGoal(profile.communityGoal, status, now) ||
              isWaiting
            }
            onClick={claim}
          >
            <span className="season-avatar-button-labels">
              <span hidden={isClaimed}>Claim</span>
              <span hidden={!isClaimed}>Claimed</span>
            </span>
          </button>
        </span>
      </div>
    </li>
  )
}
