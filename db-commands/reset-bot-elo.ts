import dotenv from "dotenv"
import { connect } from "mongoose"
import {
  estimateElo,
  rewriteBotRoundsRequiredto1
} from "../app/core/bot-logic"
import { BotV2 } from "../app/models/mongo-models/bot-v2"
import type { IBot } from "../app/types/models/bot-v2"
import { logger } from "../app/utils/logger"

const UNTOUCHED_BOT_ELO = 2000

async function main() {
  dotenv.config()

  try {
    logger.info("Connecting to database...")
    const db = await connect(process.env.MONGO_URI!)

    // bots set to 2000 and above are hand-placed, so they keep their elo
    const bots = await BotV2.find({ elo: { $lt: UNTOUCHED_BOT_ELO } })
    let changed = 0
    for (const bot of bots) {
      // the builder estimates on one step per stage, so old bots match it
      const startingElo = estimateElo(
        rewriteBotRoundsRequiredto1(bot.toObject() as unknown as IBot)
      )
      if (bot.elo === startingElo) continue
      logger.info(`${bot.name}: ${bot.elo} -> ${startingElo}`)
      await BotV2.updateOne({ id: bot.id }, { $set: { elo: startingElo } })
      changed++
    }

    logger.info(
      `Reset ${changed} of ${bots.length} bots under ${UNTOUCHED_BOT_ELO} elo`
    )
    await db.disconnect()
    logger.info("Database connection closed")
  } catch (e) {
    logger.error("Error during bot elo reset:", e)
    process.exit(1)
  }
}

main()
