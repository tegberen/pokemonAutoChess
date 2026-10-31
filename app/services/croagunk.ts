import {
  getCasualPickCharges,
  getCroagunkTradeOffer,
  SEASON_CASUAL_PICK_INTERVAL_MS,
  SEASON_CROAGUNK_OFFERS,
  SEASON_CROAGUNK_TRADE_INTERVAL_MS,
  type SeasonCroagunkTradeItem
} from "../config/game/season"
import UserMetadata from "../models/mongo-models/user-metadata"
import type {
  ICroagunkTrade,
  IUserMetadataLean
} from "../types/interfaces/UserMetadata"

const MAX_ATTEMPTS = 3

const PROFILE_FIELD_BY_ITEM: Record<SeasonCroagunkTradeItem, string | null> = {
  "shiny-ticket": "shinyTickets",
  booster: "booster",
  "casual-pick": null
}

function pickOffer(previousOfferId: string | undefined) {
  const pool = SEASON_CROAGUNK_OFFERS.filter(
    (offer) => offer.id !== previousOfferId
  )
  const offers = pool.length > 0 ? pool : SEASON_CROAGUNK_OFFERS
  return offers[Math.floor(Math.random() * offers.length)]
}

function createTrade(
  now: number,
  previousOfferId: string | undefined
): ICroagunkTrade {
  const offer = pickOffer(previousOfferId)
  return {
    offerId: offer.id,
    chosenAt: now,
    expiresAt: now + SEASON_CROAGUNK_TRADE_INTERVAL_MS
  }
}

export async function getOrCreateCroagunkTrade(
  uid: string,
  now = Date.now()
) {
  const user = await UserMetadata.findOne({ uid }).lean<IUserMetadataLean>()
  if (!user) return null
  const trade = user.croagunkTrade
  const currentOffer = getCroagunkTradeOffer(trade?.offerId)
  if (trade && currentOffer && trade.expiresAt > now) {
    return UserMetadata.findOne({ uid })
  }

  const next = createTrade(now, trade?.offerId)
  const updatedUser = await UserMetadata.findOneAndUpdate(
    {
      uid,
      $or: [
        { "croagunkTrade.expiresAt": { $lte: now } },
        {
          "croagunkTrade.offerId": {
            $nin: SEASON_CROAGUNK_OFFERS.map((offer) => offer.id)
          }
        }
      ]
    },
    { $set: { croagunkTrade: next } },
    { returnDocument: "after" }
  )
  if (updatedUser) return updatedUser

  // the trade was missing or rotated by a concurrent request
  const fallback = await UserMetadata.findOneAndUpdate(
    { uid, croagunkTrade: null },
    { $set: { croagunkTrade: next } },
    { returnDocument: "after" }
  )
  return fallback ?? UserMetadata.findOne({ uid })
}

export async function buyCroagunkTrade(uid: string, now = Date.now()) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const user = await UserMetadata.findOne({ uid }).lean<IUserMetadataLean>()
    if (!user) return null
    const trade = user.croagunkTrade
    if (!trade || trade.expiresAt <= now) {
      await getOrCreateCroagunkTrade(uid, now)
      continue
    }
    if (trade.purchasedAt !== undefined && trade.purchasedAt !== null) {
      return null
    }

    const offer = getCroagunkTradeOffer(trade.offerId)
    if (!offer) {
      await getOrCreateCroagunkTrade(uid, now)
      continue
    }
    if ((user.seasonTickets ?? 0) < offer.price) return null

    const isCasualPick = offer.item === "casual-pick"
    const profileField = PROFILE_FIELD_BY_ITEM[offer.item]
    const filter: Record<string, unknown> = {
      uid,
      "croagunkTrade.offerId": trade.offerId,
      "croagunkTrade.purchasedAt": { $exists: false },
      "croagunkTrade.expiresAt": { $gt: now },
      seasonTickets: { $gte: offer.price }
    }
    const sets: Record<string, unknown> = {
      "croagunkTrade.purchasedAt": now,
      "croagunkTrade.expiresAt": now + SEASON_CROAGUNK_TRADE_INTERVAL_MS
    }
    if (isCasualPick) {
      filter["casualPick.charges"] = user.casualPick?.charges ?? null
      filter["casualPick.chargeWindow"] = user.casualPick?.chargeWindow ?? null
      sets["casualPick.charges"] =
        getCasualPickCharges(user.casualPick, now) + offer.amount
      sets["casualPick.chargeWindow"] = Math.floor(
        now / SEASON_CASUAL_PICK_INTERVAL_MS
      )
    }

    const updatedUser = await UserMetadata.findOneAndUpdate(
      filter,
      {
        $inc: {
          seasonTickets: -offer.price,
          ...(profileField ? { [profileField]: offer.amount } : {})
        },
        $set: sets
      },
      { returnDocument: "after" }
    )
    if (updatedUser) return updatedUser
  }
  return null
}
