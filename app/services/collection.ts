import { CollectionUtils } from "../core/collection"
import UserMetadata from "../models/mongo-models/user-metadata"
import { getAvailableEmotions } from "../models/precomputed/precomputed-emotions"
import { Emotion } from "../types"
import { PkmByIndex } from "../types/enum/Pokemon"
import type {
  IPokemonCollectionItemMongo,
  IUserMetadataMongo
} from "../types/interfaces/UserMetadata"

export type CollectionMutationResult = {
  userDoc: IUserMetadataMongo
}

const UNLOCK_ALL_COLLECTION = process.env.UNLOCK_ALL_COLLECTION === "true"

/**
 * Returns the user's collection item for an index, creating a fully-unlocked one
 * on demand when UNLOCK_ALL_COLLECTION is enabled and the player has no entry yet.
 * This lets write paths (equip / buy) succeed for Pokemon the player never owned,
 * persisting only the single Pokemon they interact with (no bulk DB migration).
 */
function ensureUnlockedCollectionItem(
  mongoUser: IUserMetadataMongo,
  index: string
): IPokemonCollectionItemMongo | undefined {
  let item = mongoUser.pokemonCollection.get(index)
  if (!item && UNLOCK_ALL_COLLECTION && PkmByIndex.hasOwnProperty(index)) {
    item = {
      id: index,
      unlocked: CollectionUtils.getEmotionMask(
        getAvailableEmotions(index, false),
        getAvailableEmotions(index, true)
      ),
      dust: 0,
      selectedEmotion: Emotion.NORMAL,
      selectedShiny: false,
      played: 0
    }
    mongoUser.pokemonCollection.set(index, item)
  }
  return item
}

export async function changeSelectedEmotionForUser(
  uid: string,
  index: string,
  emotion: Emotion | null,
  shiny: boolean
): Promise<CollectionMutationResult | null> {
  const mongoUser = await UserMetadata.findOne({ uid })
  if (!mongoUser) return null

  const mongoItem = ensureUnlockedCollectionItem(mongoUser, index)
  if (!mongoItem) return null

  if (
    emotion === mongoItem.selectedEmotion &&
    shiny === mongoItem.selectedShiny
  ) {
    return { userDoc: mongoUser }
  }

  if (
    emotion !== null &&
    !CollectionUtils.hasUnlocked(mongoItem.unlocked, emotion, shiny)
  ) {
    return null
  }

  mongoItem.selectedEmotion = emotion
  mongoItem.selectedShiny = shiny
  await mongoUser.save()

  return { userDoc: mongoUser }
}

export async function resetSelectedEmotionsForUser(
  uid: string
): Promise<CollectionMutationResult | null> {
  const mongoUser = await UserMetadata.findOne({ uid })
  if (!mongoUser) return null
  const resets: Record<string, unknown> = {}
  mongoUser.pokemonCollection.forEach((item, index) => {
    if (item.selectedEmotion === null && !item.selectedShiny) return
    resets[`pokemonCollection.${index}.selectedEmotion`] = null
    resets[`pokemonCollection.${index}.selectedShiny`] = false
  })
  if (Object.keys(resets).length === 0) return { userDoc: mongoUser }
  const userDoc = await UserMetadata.findOneAndUpdate(
    { uid },
    { $set: resets },
    { returnDocument: "after" }
  )
  return userDoc ? { userDoc } : null
}
