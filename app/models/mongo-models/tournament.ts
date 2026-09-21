import { model, Schema } from "mongoose"
import type { ITournament } from "../../types/interfaces/Tournament"

const tournamentPlayerSchema = new Schema({
  name: String,
  avatar: String,
  elo: Number,
  ranks: [Number],
  eliminated: Boolean,
  partnerId: String,
  invitedPartnerId: String
})

const tournamentTeamSchema = new Schema({
  name: String,
  playersId: [String],
  points: Number,
  placements: [Number],
  opponents: [String],
  lobbyHistory: [String],
  eliminated: Boolean
})

const tournamentBracketSchema = new Schema({
  name: String,
  playersId: [String],
  teamsId: [String],
  finished: Boolean
})

// documents written before team tournaments have no teams or stage
const tournamentSchema = new Schema({
  name: String,
  startDate: String,
  players: {
    type: Map,
    of: tournamentPlayerSchema
  },
  teams: {
    type: Map,
    of: tournamentTeamSchema
  },
  brackets: {
    type: Map,
    of: tournamentBracketSchema
  },
  stage: { type: String, default: "registration" },
  roundNumber: { type: Number, default: 0 },
  wishesEnabled: { type: Boolean, default: false },
  finished: Boolean
})

export const Tournament = model<ITournament>("Tournament", tournamentSchema)

export default Tournament
