import type { IGameRecord } from "../../models/colyseus-models/game-record"

export interface IVictoryWinner {
  playerId: string
  playerName: string
  playerAvatar: string
  game: IGameRecord
}

// one first-place finish for the lobby newspaper. Double Up ranks per team, so a
// match can crown two winners, each with their own board
export interface IRecentVictory {
  winners: IVictoryWinner[]
}
