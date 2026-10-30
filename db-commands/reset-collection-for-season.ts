import dotenv from "dotenv"
import { connect } from "mongoose"
import {
  getShinyWonderPickMilestones,
  WELCOME_BUNDLE_BOOSTERS,
  WELCOME_BUNDLE_WONDER_PICKS
} from "../app/config/game/experience"
import { CollectionUtils } from "../app/core/collection"
import UserMetadata from "../app/models/mongo-models/user-metadata"
import { Emotion } from "../app/types/enum/Emotion"
import { PkmIndex } from "../app/types/enum/Pokemon"
import {
  getAvatarString,
  getPokemonCustomFromAvatar
} from "../app/utils/avatar"
import { logger } from "../app/utils/logger"

// Dry run unless called with --apply
const APPLY = process.argv.includes("--apply")
const BATCH_SIZE = 500

async function main() {
  dotenv.config()

  try {
    logger.info("Connecting to database...")
    const db = await connect(process.env.MONGO_URI!)
    logger.info(APPLY ? "APPLY mode: writing changes" : "DRY RUN: no writes")

    let usersSeen = 0
    let entriesReset = 0
    let avatarEmotesKept = 0
    let levelWonderPicksGranted = 0
    let operations: Parameters<typeof UserMetadata.bulkWrite>[0] = []

    const flush = async () => {
      if (operations.length === 0) return
      if (APPLY) await UserMetadata.bulkWrite(operations, { ordered: false })
      operations = []
    }

    const cursor = UserMetadata.find(
      {},
      { uid: 1, level: 1, avatar: 1, pokemonCollection: 1 }
    )
      .lean()
      .cursor()

    for await (const user of cursor) {
      usersSeen++
      const avatar = getPokemonCustomFromAvatar(user.avatar ?? "")
      const avatarIndex = avatar.name ? PkmIndex[avatar.name] : undefined
      const collection = Object.entries(user.pokemonCollection ?? {})

      const resetCollection = Object.fromEntries(
        collection.map(([index, item]) => {
          const unlocked = Buffer.alloc(5, 0)
          const isAvatar = index === avatarIndex
          if (isAvatar) {
            CollectionUtils.unlockEmotion(unlocked, Emotion.NORMAL, false)
            avatarEmotesKept++
          }
          return [
            index,
            {
              id: item.id ?? index,
              unlocked,
              dust: 0,
              selectedEmotion: Emotion.NORMAL,
              selectedShiny: false,
              played: item.played ?? 0
            }
          ]
        })
      )
      if (avatarIndex && !(avatarIndex in resetCollection)) {
        const unlocked = Buffer.alloc(5, 0)
        CollectionUtils.unlockEmotion(unlocked, Emotion.NORMAL, false)
        resetCollection[avatarIndex] = {
          id: avatarIndex,
          unlocked,
          dust: 0,
          selectedEmotion: Emotion.NORMAL,
          selectedShiny: false,
          played: 0
        }
        avatarEmotesKept++
      }
      entriesReset += collection.length
      const levelMilestones = getShinyWonderPickMilestones(user.level ?? 0)
      levelWonderPicksGranted += levelMilestones

      operations.push({
        updateOne: {
          filter: { uid: user.uid },
          update: {
            $set: {
              pokemonCollection: resetCollection,
              booster: WELCOME_BUNDLE_BOOSTERS,
              seasonTickets: 0,
              shinyTickets: 0,
              wonderPicks: WELCOME_BUNDLE_WONDER_PICKS + levelMilestones,
              shinyPickMilestonesClaimed: levelMilestones,
              holoIndexes: [],
              seasonPortraits: [],
              unlockedThemes: [],
              ...(avatarIndex && {
                avatar: getAvatarString(avatarIndex, false, Emotion.NORMAL)
              })
            },
            $unset: {
              season: "",
              wonderPickDraw: "",
              casualPick: "",
              croagunkTrade: "",
              welcomeBundleClaimed: ""
            }
          }
        }
      })
      if (operations.length >= BATCH_SIZE) await flush()
    }
    await flush()

    logger.info(`Users: ${usersSeen}`)
    logger.info(`Collection entries reset: ${entriesReset}`)
    logger.info(`Avatar Normal portraits kept: ${avatarEmotesKept}`)
    logger.info(
      `Welcome bundle per user: ${WELCOME_BUNDLE_BOOSTERS} boosters, ` +
        `${WELCOME_BUNDLE_WONDER_PICKS} Shiny Wonder Pick`
    )
    logger.info(`Level Shiny Wonder Picks granted: ${levelWonderPicksGranted}`)
    await db.disconnect()
    logger.info("Database connection closed")
  } catch (e) {
    logger.error("Error during collection reset:", e)
    process.exit(1)
  }
}

main()
