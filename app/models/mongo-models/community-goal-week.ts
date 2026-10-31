import { model, Schema } from "mongoose"

export interface ICommunityGoalWeek {
  weekKey: string
  games: number
  weekdayGames?: number
}

const communityGoalWeekSchema = new Schema<ICommunityGoalWeek>({
  weekKey: { type: String, required: true, unique: true },
  games: { type: Number, default: 0 },
  weekdayGames: { type: Number }
})

export const CommunityGoalWeek = model<ICommunityGoalWeek>(
  "CommunityGoalWeek",
  communityGoalWeekSchema,
  "community-goal-weeks"
)

export default CommunityGoalWeek
