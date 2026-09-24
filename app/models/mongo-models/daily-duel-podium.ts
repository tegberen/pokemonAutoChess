import { model, Schema } from "mongoose"

export interface IDailyDuelPodium {
  uids: string[]
}

const dailyDuelPodiumSchema = new Schema<IDailyDuelPodium>({
  uids: [String]
})

export const DailyDuelPodium = model<IDailyDuelPodium>(
  "DailyDuelPodium",
  dailyDuelPodiumSchema,
  "daily-duel-podium"
)

export default DailyDuelPodium

export async function getDailyDuelPodiumUids(): Promise<string[]> {
  const doc = await DailyDuelPodium.findOne().lean()
  return doc?.uids ?? []
}

export async function setDailyDuelPodiumUids(uids: string[]) {
  await DailyDuelPodium.updateOne({}, { uids }, { upsert: true })
}
