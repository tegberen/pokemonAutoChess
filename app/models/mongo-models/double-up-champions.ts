import { model, Schema } from "mongoose"

export interface IDoubleUpChampions {
  championUids: string[]
}

const doubleUpChampionsSchema = new Schema<IDoubleUpChampions>({
  championUids: [String]
})

export const DoubleUpChampions = model<IDoubleUpChampions>(
  "DoubleUpChampions",
  doubleUpChampionsSchema,
  "double-up-champions"
)

export default DoubleUpChampions

// Singleton document holding the (up to 2) manually-picked Double Up Tournament
// champions. Persisted so the town villagers survive server restarts.

export async function getDoubleUpChampionUids(): Promise<string[]> {
  const doc = await DoubleUpChampions.findOne().lean()
  return doc?.championUids ?? []
}

export async function setDoubleUpChampionUid(
  slot: number,
  uid: string
): Promise<string[]> {
  const championUids = await getDoubleUpChampionUids()
  // keep the array length at 2 so slots 0 (left) and 1 (right) are stable
  while (championUids.length < 2) championUids.push("")
  championUids[slot] = uid

  await DoubleUpChampions.updateOne({}, { championUids }, { upsert: true })
  return championUids
}
