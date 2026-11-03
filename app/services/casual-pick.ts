import {
  getCasualPickCharges,
  SEASON_CASUAL_PICK_INTERVAL_MS
} from "../config/game/season"
import UserMetadata from "../models/mongo-models/user-metadata"
import type { IUserMetadataLean } from "../types/interfaces/UserMetadata"

const MAX_ATTEMPTS = 3

// a Wonder Pick charge is stored with its refill window, so the update only
// lands if nothing refilled or spent one in between; a gift can pass the cap
export async function grantCasualPicks(
  filter: Record<string, unknown>,
  count: number,
  update: {
    $inc?: Record<string, number>
    $set?: Record<string, unknown>
  } = {},
  now = Date.now()
) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const user = await UserMetadata.findOne(filter).lean<IUserMetadataLean>()
    if (!user) return
    const updatedUser = await UserMetadata.findOneAndUpdate(
      {
        ...filter,
        "casualPick.charges": user.casualPick?.charges ?? null,
        "casualPick.chargeWindow": user.casualPick?.chargeWindow ?? null
      },
      {
        ...(update.$inc ? { $inc: update.$inc } : {}),
        $set: {
          ...update.$set,
          "casualPick.charges":
            getCasualPickCharges(user.casualPick, now) + count,
          "casualPick.chargeWindow": Math.floor(
            now / SEASON_CASUAL_PICK_INTERVAL_MS
          )
        }
      }
    )
    if (updatedUser) return
  }
}
