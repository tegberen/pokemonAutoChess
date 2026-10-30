import type { HydratedDocument } from "mongoose"
import {
  getCasualPickCharges,
  getCroagunkTradeOffer,
  SEASON_CASUAL_PICK_INTERVAL_MS,
  SEASON_CROAGUNK_OFFERS,
  SEASON_CROAGUNK_TRADE_INTERVAL_MS,
  type SeasonCroagunkTradeItem,
  SPINDA_CAFE_DISHES
} from "../config/game/season"
import { CollectionUtils } from "../core/collection"
import UserMetadata from "../models/mongo-models/user-metadata"
import { getAvailableEmotions } from "../models/precomputed/precomputed-emotions"
import { Emotion } from "../types/enum/Emotion"
import { type Pkm, PkmIndex } from "../types/enum/Pokemon"
import type {
  ICroagunkTrade,
  IPokemonCollectionItemLean,
  IPokemonCollectionItemMongo,
  IUserMetadataLean,
  IUserMetadataMongo
} from "../types/interfaces/UserMetadata"
import { getPokemonCustomFromAvatar } from "../utils/avatar"
import { pickRandomIn } from "../utils/random"
import { checkTitlesAfterEmotionUnlocked } from "./booster"

const MAX_ATTEMPTS = 3

const PROFILE_FIELD_BY_ITEM: Record<SeasonCroagunkTradeItem, string | null> = {
  "shiny-ticket": "shinyTickets",
  booster: "booster",
  "casual-pick": null,
  "spinda-dish": null
}

function toBuffer(unlocked: IPokemonCollectionItemLean["unlocked"]) {
  if (unlocked === undefined) return undefined
  if (unlocked instanceof Uint8Array) return Buffer.from(unlocked)
  return Buffer.from(unlocked.buffer)
}

// the emotes the player's current avatar can still react with; read from the
// bits, since CollectionUtils.hasUnlocked owns everything under
// UNLOCK_ALL_COLLECTION
function getAvatarReactions(user: IUserMetadataLean) {
  const avatar = getPokemonCustomFromAvatar(user.avatar ?? "")
  const index = avatar.name ? PkmIndex[avatar.name] : undefined
  if (!index) return null
  const item = user.pokemonCollection?.[index]
  const original = item ? toBuffer(item.unlocked) : undefined
  const mask = original ? Buffer.from(original) : Buffer.alloc(5, 0)
  const getMissing = (shiny: boolean) =>
    getAvailableEmotions(index, shiny).filter((emotion) => {
      const emotionBit = CollectionUtils.getEmotionMask(
        shiny ? [] : [emotion],
        shiny ? [emotion] : []
      )
      return emotionBit.every((byte, i) => (mask[i] & byte) === 0)
    })
  // a shiny avatar with every shiny emote, from a Shiny Wonder Pick, reacts
  // with its regular emotes instead
  const shinyMissing = avatar.shiny ? getMissing(true) : []
  const shiny = shinyMissing.length > 0
  const missing = shiny ? shinyMissing : getMissing(false)
  return { pokemon: avatar.name, index, shiny, item, original, mask, missing }
}

// Spinda's dish is a surprise and rolls for everyone: a player whose avatar
// already has every emote is told to switch avatar, not skipped
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
    expiresAt: now + SEASON_CROAGUNK_TRADE_INTERVAL_MS,
    ...(offer.item === "spinda-dish" && {
      dish: pickRandomIn(SPINDA_CAFE_DISHES)
    })
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

export async function buyCroagunkTrade(
  uid: string,
  reaction: unknown,
  now = Date.now()
) {
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

    // the dish is paid for with the reaction it gets: one of the avatar's
    // emotes the player does not own yet
    const reactions =
      offer.item === "spinda-dish" ? getAvatarReactions(user) : null
    if (offer.item === "spinda-dish") {
      if (!reactions || !reactions.missing.includes(reaction as Emotion)) {
        return null
      }
      const path = `pokemonCollection.${reactions.index}`
      CollectionUtils.unlockEmotion(
        reactions.mask,
        reaction as Emotion,
        reactions.shiny
      )
      if (reactions.item) {
        filter[`${path}.unlocked`] = reactions.original
        sets[`${path}.unlocked`] = reactions.mask
      } else {
        filter[path] = { $exists: false }
        const newItem: IPokemonCollectionItemMongo = {
          id: reactions.index,
          unlocked: reactions.mask,
          dust: 0,
          selectedEmotion: Emotion.NORMAL,
          selectedShiny: false,
          played: 0
        }
        sets[path] = newItem
      }
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
    if (updatedUser) {
      if (reactions) {
        await checkTitlesAfterReaction(
          updatedUser,
          reactions.pokemon,
          reaction as Emotion,
          reactions.shiny
        )
      }
      return updatedUser
    }
  }
  return null
}

async function checkTitlesAfterReaction(
  userDoc: HydratedDocument<IUserMetadataMongo>,
  pokemon: Pkm,
  emotion: Emotion,
  shiny: boolean
) {
  checkTitlesAfterEmotionUnlocked(userDoc, [{ name: pokemon, emotion, shiny }])
  await userDoc.save()
}
