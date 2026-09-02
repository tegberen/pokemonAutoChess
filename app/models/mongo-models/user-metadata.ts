import { model, Schema } from "mongoose"
import { ExpThreshold } from "../../config"
import { GADGETS_UNLOCKED_BY_LEVEL } from "../../config/game/gadgets"
import { CollectionUtils } from "../../core/collection"
import { notificationsService } from "../../services/notifications"
import { Emotion, Role, Title } from "../../types"
import { AVATAR_COSMETIC_IDS } from "../../types/enum/AvatarCosmetic"
import { Pkm, PkmIndex } from "../../types/enum/Pokemon"
import { Synergy } from "../../types/enum/Synergy"
import type {
  IPokemonCollectionItemClient,
  IPokemonCollectionItemMongo,
  IUserMetadataJSON,
  IUserMetadataLean,
  IUserMetadataMongo
} from "../../types/interfaces/UserMetadata"
import { getAvailableEmotions } from "../precomputed/precomputed-emotions"

const userMetadataSchema = new Schema({
  uid: {
    type: String
  },
  displayName: {
    type: String
  },
  twitchUserId: {
    type: String
  },
  twitchLogin: {
    type: String,
    lowercase: true,
    trim: true
  },
  twitchDisplayName: {
    type: String
  },
  twitchVerifiedAt: {
    type: Date
  },
  twitchVerificationRevokedAt: {
    type: Date
  },
  language: {
    type: String,
    default: "en"
  },
  avatar: {
    type: String,
    default: "0019/Normal"
  },
  wins: {
    type: Number,
    default: 0
  },
  games: {
    type: Number,
    default: 0
  },
  activeWeeks: {
    type: Number,
    default: 0
  },
  lastActiveWeek: {
    type: String,
    default: ""
  },
  // TEMP: no default, so undefined means never seeded from history
  currentFirstPlaceStreak: {
    type: Number
  },
  highestFirstPlaceStreak: {
    type: Number
  },
  exp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 0
  },
  elo: {
    type: Number,
    default: 1000
  },
  maxElo: {
    type: Number,
    default: 1000
  },
  eventPoints: {
    type: Number,
    default: 0
  },
  maxEventPoints: {
    type: Number,
    default: 0
  },
  eventFinishTime: {
    type: Date,
    sparse: true
  },
  booster: {
    type: Number,
    default: 0
  },
  title: {
    type: String
  },
  role: {
    type: String,
    enum: Role,
    default: Role.BASIC
  },
  banned: {
    type: Boolean,
    default: false
  },
  titles: [
    {
      type: String,
      enum: Title
    }
  ],
  guideLessonsCompleted: [{ type: String, enum: Synergy }],
  unlockedAvatarCosmetics: [{ type: String, enum: AVATAR_COSMETIC_IDS }],
  pokemonCollection: {
    type: Map,
    of: {
      dust: {
        type: Number
      },
      // OPTIMIZED: Single 5-byte field instead of multiple arrays for emotions and shiny emotions unlocked
      unlocked: {
        type: Buffer,
        default: () => Buffer.alloc(5, 0)
      },
      selectedEmotion: {
        type: String,
        enum: Emotion
      },
      selectedShiny: {
        type: Boolean
      },
      id: {
        type: String
      },
      played: {
        type: Number,
        default: 0
      }
    }
  }
})

userMetadataSchema.index(
  { displayName: 1 },
  { collation: { locale: "en", strength: 2 } }
)
userMetadataSchema.index({ elo: 1 })
userMetadataSchema.index({ titles: 1 })
userMetadataSchema.index({ twitchUserId: 1 }, { unique: true, sparse: true })
userMetadataSchema.index({ twitchLogin: 1 }, { unique: true, sparse: true })

export default model<IUserMetadataMongo>("UserMetadata", userMetadataSchema)

export function toLeanUserMetadata(
  user: IUserMetadataLean | IUserMetadataMongo
): IUserMetadataMongo {
  const pokemonCollection = new Map<string, IPokemonCollectionItemMongo>()
  const collectionEntries =
    user.pokemonCollection instanceof Map
      ? user.pokemonCollection.entries()
      : Object.entries(user.pokemonCollection ?? {})

  for (const [key, item] of collectionEntries) {
    pokemonCollection.set(key, {
      ...item,
      unlocked: Buffer.isBuffer(item?.unlocked)
        ? item.unlocked
        : item?.unlocked?.buffer
          ? Buffer.from(item.unlocked.buffer)
          : Buffer.alloc(5, 0)
    })
  }
  return {
    ...user,
    pokemonCollection
  } as IUserMetadataMongo
}

// When UNLOCK_ALL_COLLECTION is enabled, every player's profile is served with a
// fully-unlocked collection. This is computed in-memory at read time and is never
// persisted, so the database is left untouched.
const UNLOCK_ALL_COLLECTION = process.env.UNLOCK_ALL_COLLECTION === "true"

let fullUnlockedCollectionCache: {
  [index: string]: IPokemonCollectionItemClient
} | null = null

// Build (once) a client collection with every available emote + shiny unlocked
// for every collectible Pokemon. getEmotionMask maps via CollectionEmotions
// ordering, matching the on-disk bit layout and skipping shiny-unavailable mons.
function getFullUnlockedCollection(): {
  [index: string]: IPokemonCollectionItemClient
} {
  if (fullUnlockedCollectionCache) return fullUnlockedCollectionCache
  const full: { [index: string]: IPokemonCollectionItemClient } = {}
  for (const pkm of Object.values(Pkm)) {
    const index = PkmIndex[pkm]
    if (!index || index in full) continue
    const normal = getAvailableEmotions(index, false)
    const shiny = getAvailableEmotions(index, true)
    if (normal.length === 0 && shiny.length === 0) continue // no portrait
    const mask = CollectionUtils.getEmotionMask(normal, shiny)
    full[index] = {
      id: index,
      dust: 0,
      played: 0,
      selectedEmotion: Emotion.NORMAL,
      selectedShiny: false,
      unlockedb64: CollectionUtils.encodeBase64(mask)
    }
  }
  fullUnlockedCollectionCache = full
  return full
}

export function toUserMetadataJSON(user): IUserMetadataJSON {
  const pokemonCollection: {
    [index: string]: IUserMetadataJSON["pokemonCollection"][string]
  } = {}
  if (UNLOCK_ALL_COLLECTION) {
    // Seed with the fully-unlocked collection, then overlay the player's real
    // dust / played / selection below while keeping the full unlocked mask.
    const full = getFullUnlockedCollection()
    for (const index in full) {
      pokemonCollection[index] = { ...full[index] }
    }
  }
  user.pokemonCollection.forEach((item, index) => {
    const client = CollectionUtils.toCollectionItemClient(item)
    if (UNLOCK_ALL_COLLECTION && pokemonCollection[index]) {
      client.unlockedb64 = pokemonCollection[index].unlockedb64
    }
    pokemonCollection[index] = client
  })
  return {
    ...user.toObject(),
    pokemonCollection
  }
}

export function giveUserExp(user: IUserMetadataMongo, exp: number) {
  if (user.exp + exp >= ExpThreshold) {
    user.level += 1
    user.booster += 1
    user.exp = user.exp + exp - ExpThreshold

    if (user.level <= 2) {
      // Add level up notification
      notificationsService.addNotification(
        user.uid,
        "level_up",
        user.level.toString()
      )
    }

    if (user.level in GADGETS_UNLOCKED_BY_LEVEL) {
      notificationsService.addNotification(
        user.uid,
        "new_gadget",
        GADGETS_UNLOCKED_BY_LEVEL[user.level].name
      )
    }
  } else {
    user.exp = user.exp + exp
  }
  user.exp = !isNaN(user.exp) ? user.exp : 0
}
