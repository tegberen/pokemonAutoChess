import { model, Schema } from "mongoose"

export interface ISmeargleScribbleChampion {
  championUid: string
}

const smeargleScribbleChampionSchema = new Schema<ISmeargleScribbleChampion>({
  championUid: String
})

export const SmeargleScribbleChampion = model<ISmeargleScribbleChampion>(
  "SmeargleScribbleChampion",
  smeargleScribbleChampionSchema,
  "smeargle-scribble-champion"
)

export default SmeargleScribbleChampion

// Singleton document holding the (single) manually-picked Smeargle Scribble
// champion. Persisted so the town podium survives server restarts.

export async function getSmeargleScribbleChampionUid(): Promise<string> {
  const doc = await SmeargleScribbleChampion.findOne().lean()
  return doc?.championUid ?? ""
}

export async function setSmeargleScribbleChampionUid(
  uid: string
): Promise<string> {
  await SmeargleScribbleChampion.updateOne(
    {},
    { championUid: uid },
    { upsert: true }
  )
  return uid
}
