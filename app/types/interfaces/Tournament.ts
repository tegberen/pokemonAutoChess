import type { ArraySchema, MapSchema } from "@colyseus/schema"
import type {
  TournamentBracketSchema,
  TournamentPlayerSchema,
  TournamentTeamSchema
} from "../../models/colyseus-models/tournament"

export type TournamentStage =
  | "registration"
  | "qualification"
  | "semifinals"
  | "final"
  | "finished"

// duo plays Double Up Classic in teams of 2; solo plays Smeargle Pack Scribble
// with every player as a team of 1
export type TournamentFormat = "duo" | "solo"

export interface ITournament {
  id: string
  name: string
  startDate: string
  format: TournamentFormat
  players: MapSchema<TournamentPlayerSchema>
  teams: MapSchema<TournamentTeamSchema>
  brackets: MapSchema<TournamentBracketSchema>
  stage: TournamentStage
  roundNumber: number
  wishesEnabled: boolean
  finished: boolean
}

export interface ITournamentPlayer {
  name: string
  avatar: string
  elo: number
  ranks: ArraySchema<number>
  eliminated: boolean
  partnerId: string
  // asked, but has not answered yet
  invitedPartnerId: string
}

export interface ITournamentTeam {
  name: string
  playersId: ArraySchema<string>
  points: number
  placements: ArraySchema<number>
  opponents: ArraySchema<string>
  // comma-joined team ids per round: Colyseus cannot nest arrays
  lobbyHistory: ArraySchema<string>
  eliminated: boolean
}

export interface ITournamentBracket {
  name: string
  playersId: ArraySchema<string>
  teamsId: ArraySchema<string>
  finished: boolean
}
