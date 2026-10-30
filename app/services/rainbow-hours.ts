import {
  RAINBOW_FINALE_WINNER_BOOSTERS,
  RAINBOW_FINALE_WONDER_PICKS,
  RAINBOW_HOURS_TICKETS_PER_GAME,
  RAINBOW_HOURS_TICKETS_PER_WIN
} from "../config/game/rainbow-hours"
import {
  getCasualPickCharges,
  SEASON_CASUAL_PICK_INTERVAL_MS
} from "../config/game/season"
import UserMetadata from "../models/mongo-models/user-metadata"
import type { IUserMetadataLean } from "../types/interfaces/UserMetadata"

const MAX_ATTEMPTS = 3

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

  // a Wonder Pick is a casual pick charge, stored with its refill window
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const user = await UserMetadata.findOne(
      getNotOverlappingFilter(uid, result.gameStartedAt)
    ).lean<IUserMetadataLean>()
    if (!user) return
    const updatedUser = await UserMetadata.findOneAndUpdate(
      {
        ...getNotOverlappingFilter(uid, result.gameStartedAt),
        "casualPick.charges": user.casualPick?.charges ?? null,
        "casualPick.chargeWindow": user.casualPick?.chargeWindow ?? null
      },
      {
        $inc: increments,
        $set: {
          rainbowHoursRewardedUntil: now,
          "casualPick.charges":
            getCasualPickCharges(user.casualPick, now) +
            RAINBOW_FINALE_WONDER_PICKS,
          "casualPick.chargeWindow": Math.floor(
            now / SEASON_CASUAL_PICK_INTERVAL_MS
          )
        }
      }
    )
    if (updatedUser) return
  }
}
