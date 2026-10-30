import { getShinyWonderPickMilestones } from "../config/game/experience"
import UserMetadata from "../models/mongo-models/user-metadata"
import type { IUserMetadataLean } from "../types/interfaces/UserMetadata"

const MAX_ATTEMPTS = 3

// pays one Shiny Wonder Pick per 100 levels reached since the last sync. The
// season reset script and account creation set the starting tier, so a player
// without one only gets it recorded, never back-paid twice.
export async function syncLevelRewards(uid: string) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const user = await UserMetadata.findOne({ uid }).lean<IUserMetadataLean>()
    if (!user) return null

    const tier = getShinyWonderPickMilestones(user.level ?? 0)
    const claimedTier = user.shinyPickMilestonesClaimed ?? null
    if (claimedTier !== null && claimedTier >= tier) return user

    const milestonePicks = claimedTier === null ? 0 : tier - claimedTier
    const updatedUser = await UserMetadata.findOneAndUpdate(
      { uid, shinyPickMilestonesClaimed: claimedTier },
      {
        $set: { shinyPickMilestonesClaimed: tier },
        ...(milestonePicks > 0 && { $inc: { wonderPicks: milestonePicks } })
      },
      { returnDocument: "after" }
    )
    if (updatedUser) return updatedUser
  }
  return null
}
