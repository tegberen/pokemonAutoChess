import type { HydratedDocument } from "mongoose"
import { getUtcDayKey, isSpindaCafeOpen } from "../config/game/season"
import { CollectionUtils } from "../core/collection"
import UserMetadata from "../models/mongo-models/user-metadata"
import { getAvailableEmotions } from "../models/precomputed/precomputed-emotions"
import { Emotion } from "../types/enum/Emotion"
import { type Pkm, PkmIndex } from "../types/enum/Pokemon"
import type {
  IPokemonCollectionItemLean,
  IPokemonCollectionItemMongo,
  IUserMetadataLean,
  IUserMetadataMongo
} from "../types/interfaces/UserMetadata"
import { getPokemonCustomFromAvatar } from "../utils/avatar"
import { checkTitlesAfterEmotionUnlocked } from "./booster"

const MAX_ATTEMPTS = 3

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

// one free tasting a UTC day while the café is open: the reaction it gets, a
// missing emote of the player's avatar, is unlocked
export async function tasteSpindaDish(
  uid: string,
  reaction: unknown,
  now = Date.now()
) {
  if (!isSpindaCafeOpen(now)) return null
  const dayKey = getUtcDayKey(now)

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const user = await UserMetadata.findOne({ uid }).lean<IUserMetadataLean>()
    if (!user || user.spindaCafe?.tastedDayKey === dayKey) return null

    const reactions = getAvatarReactions(user)
    if (!reactions || !reactions.missing.includes(reaction as Emotion)) {
      return null
    }

    const path = `pokemonCollection.${reactions.index}`
    const filter: Record<string, unknown> = {
      uid,
      "spindaCafe.tastedDayKey": { $ne: dayKey }
    }
    const sets: Record<string, unknown> = {
      "spindaCafe.tastedDayKey": dayKey
    }
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

    const updatedUser = await UserMetadata.findOneAndUpdate(
      filter,
      { $set: sets },
      { returnDocument: "after" }
    )
    if (updatedUser) {
      await checkTitlesAfterReaction(
        updatedUser,
        reactions.pokemon,
        reaction as Emotion,
        reactions.shiny
      )
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
