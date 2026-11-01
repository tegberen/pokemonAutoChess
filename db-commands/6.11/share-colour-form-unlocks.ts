import dotenv from "dotenv"
import { connect } from "mongoose"
import UserMetadata from "../../app/models/mongo-models/user-metadata"
import { shareOwnedFormUnlocks } from "../../app/services/season-shop"
import type { IUserMetadataLean } from "../../app/types/interfaces/UserMetadata"
import { logger } from "../../app/utils/logger"

// Dry run unless called with --apply
const APPLY = process.argv.includes("--apply")
const BATCH_SIZE = 50

async function main() {
  dotenv.config()

  try {
    logger.info("Connecting to database...")
    const db = await connect(process.env.MONGO_URI!)
    logger.info(APPLY ? "APPLY mode: writing changes" : "DRY RUN: no writes")

    let usersSeen = 0
    let usersChanged = 0
    let formsFilled = 0
    let holosShared = 0
    let writesRefused = 0
    let operations: Parameters<typeof UserMetadata.bulkWrite>[0] = []

    const flush = async () => {
      if (operations.length === 0) return
      if (APPLY) {
        const result = await UserMetadata.bulkWrite(operations, {
          ordered: false
        })
        writesRefused += operations.length - result.matchedCount
      }
      operations = []
    }

    const cursor = UserMetadata.find(
      {},
      { uid: 1, holoIndexes: 1, pokemonCollection: 1 }
    )
      .lean<IUserMetadataLean>()
      .cursor()

    for await (const user of cursor) {
      usersSeen++
      const shared = shareOwnedFormUnlocks(user)
      if (!shared) continue
      usersChanged++
      const sets = (shared.update.$set ?? {}) as Record<string, unknown>
      formsFilled += Object.keys(sets).length
      const addedHolos = shared.update.$addToSet as
        | { holoIndexes: { $each: string[] } }
        | undefined
      holosShared += addedHolos?.holoIndexes.$each.length ?? 0

      operations.push({
        updateOne: {
          filter: { uid: user.uid, ...shared.guards },
          update: shared.update
        }
      })
      if (operations.length >= BATCH_SIZE) await flush()
    }
    await flush()

    logger.info(`Users: ${usersSeen}`)
    logger.info(`Users with forms to share: ${usersChanged}`)
    logger.info(`Form entries filled: ${formsFilled}`)
    logger.info(`Holos shared: ${holosShared}`)
    if (APPLY) {
      logger.info(`Writes refused by a concurrent change: ${writesRefused}`)
      if (writesRefused > 0) logger.info("Run again to share those too")
    }
    await db.disconnect()
    logger.info("Database connection closed")
  } catch (e) {
    logger.error("Error while sharing colour form unlocks:", e)
    process.exit(1)
  }
}

main()
