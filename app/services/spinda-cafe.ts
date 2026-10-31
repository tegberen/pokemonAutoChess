import type { HydratedDocument } from "mongoose"
import {
  getUtcDayKey,
  getUtcWeekKey,
  isSpindaCafeOpen,
  SEASON_MIN_STAGE_FOR_CHALLENGES
} from "../config/game/season"
import {
  getCurrentSpindaGuestSlot,
  getSpindaGuestGamePoints,
  getSpindaGuests
} from "../config/game/spinda-guest"
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

// a weekend game adds points to that day's guest; the guards make a
// concurrent game end retry instead of overwriting
export async function recordSpindaGuestGame(
  uid: string,
  result: {
    stageReached: number
    finalPokemon: Pkm[]
    gameStartedAt: number
  },
  now = Date.now()
) {
  const slot = getCurrentSpindaGuestSlot(now)
  if (!slot || result.stageReached < SEASON_MIN_STAGE_FOR_CHALLENGES) return
  const weekKey = getUtcWeekKey(now)
  const guest = getSpindaGuests(now)[slot]
  const gain = getSpindaGuestGamePoints(guest, result.finalPokemon)
  const pointsPath = `spindaCafe.guestPoints.${slot}`

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const user = await UserMetadata.findOne({ uid }).lean<IUserMetadataLean>()
    if (!user) return
    const cafe = user.spindaCafe
    // games played side by side count once: a game only counts if it started
    // after the last counted game ended
    if ((cafe?.guestCountedUntil ?? 0) > result.gameStartedAt) return
    const isSameWeek = cafe?.guestWeekKey === weekKey
    const pointsBefore = isSameWeek ? (cafe.guestPoints?.[slot] ?? 0) : 0
    if (pointsBefore >= guest.goalPoints) return
    const pointsAfter = Math.min(guest.goalPoints, pointsBefore + gain)

    const sets: Record<string, unknown> = {
      "spindaCafe.guestCountedUntil": now
    }
    if (isSameWeek) {
      sets[pointsPath] = pointsAfter
    } else {
      sets["spindaCafe.guestWeekKey"] = weekKey
      sets["spindaCafe.guestPoints"] = { [slot]: pointsAfter }
      sets["spindaCafe.guestClaimed"] = {}
    }
    const updatedUser = await UserMetadata.findOneAndUpdate(
      {
        uid,
        "spindaCafe.guestWeekKey": cafe?.guestWeekKey ?? null,
        [pointsPath]: cafe?.guestPoints?.[slot] ?? null,
        "spindaCafe.guestCountedUntil": cafe?.guestCountedUntil ?? null
      },
      { $set: sets }
    )
    if (updatedUser) return
  }
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
