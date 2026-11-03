import {
  RAINBOW_FINALE_WINNER_BOOSTERS,
  RAINBOW_FINALE_WONDER_PICKS,
  RAINBOW_HOURS_TICKETS_PER_GAME,
  RAINBOW_HOURS_TICKETS_PER_WIN
} from "../config/game/rainbow-hours"
import UserMetadata from "../models/mongo-models/user-metadata"
import { grantCasualPicks } from "./casual-pick"

// games played side by side in several tabs pay once: a game only pays if it
// started after the last paid game ended
function getNotOverlappingFilter(uid: string, gameStartedAt: number) {
  return {
    uid,
    $or: [
      { rainbowHoursRewardedUntil: { $exists: false } },
      { rainbowHoursRewardedUntil: { $lte: gameStartedAt } }
    ]
  }
}

export async function grantRainbowHoursRewards(
  uid: string,
  result: { rank: number; isFinale: boolean; gameStartedAt: number },
  now = Date.now()
) {
  const isWin = result.rank === 1
  const increments = {
    seasonTickets:
      RAINBOW_HOURS_TICKETS_PER_GAME +
      (isWin ? RAINBOW_HOURS_TICKETS_PER_WIN : 0),
    booster: result.isFinale && isWin ? RAINBOW_FINALE_WINNER_BOOSTERS : 0
  }
  if (!result.isFinale) {
    await UserMetadata.updateOne(
      getNotOverlappingFilter(uid, result.gameStartedAt),
      { $inc: increments, $set: { rainbowHoursRewardedUntil: now } }
    )
    return
  }

  await grantCasualPicks(
    getNotOverlappingFilter(uid, result.gameStartedAt),
    RAINBOW_FINALE_WONDER_PICKS,
    { $inc: increments, $set: { rainbowHoursRewardedUntil: now } },
    now
  )
}
