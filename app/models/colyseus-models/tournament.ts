import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema"
import type {
  ITournament,
  ITournamentBracket,
  ITournamentPlayer,
  ITournamentTeam,
  TournamentStage
} from "../../types/interfaces/Tournament"
import { resetArraySchema } from "../../utils/schemas"

export class TournamentPlayerSchema
  extends Schema
  implements ITournamentPlayer
{
  @type("string") name: string
  @type("string") avatar: string
  @type("number") elo: number
  @type(["number"]) ranks = new ArraySchema<number>()
  @type("boolean") eliminated: boolean
  @type("string") partnerId: string
  @type("string") invitedPartnerId: string

  constructor(
    name: string,
    avatar: string,
    elo: number,
    ranks: number[] | ArraySchema<number> = [],
    eliminated: boolean = false,
    partnerId: string = "",
    invitedPartnerId: string = ""
  ) {
    super()
    this.name = name
    this.avatar = avatar
    this.elo = elo
    resetArraySchema(this.ranks, ranks)
    this.eliminated = eliminated
    this.partnerId = partnerId
    this.invitedPartnerId = invitedPartnerId
  }
}

export class TournamentTeamSchema extends Schema implements ITournamentTeam {
  @type("string") name: string
  @type(["string"]) playersId = new ArraySchema<string>()
  @type("number") points: number
  @type(["number"]) placements = new ArraySchema<number>()
  @type(["string"]) opponents = new ArraySchema<string>()
  @type(["string"]) lobbyHistory = new ArraySchema<string>()
  @type("boolean") eliminated: boolean

  constructor(
    name: string,
    playersId: string[] | ArraySchema<string>,
    points: number = 0,
    placements: number[] | ArraySchema<number> = [],
    opponents: string[] | ArraySchema<string> = [],
    lobbyHistory: string[] | ArraySchema<string> = [],
    eliminated: boolean = false
  ) {
    super()
    this.name = name
    this.points = points
    this.eliminated = eliminated
    resetArraySchema(this.playersId, playersId)
    resetArraySchema(this.placements, placements)
    resetArraySchema(this.opponents, opponents)
    resetArraySchema(this.lobbyHistory, lobbyHistory)
  }
}

export class TournamentBracketSchema
  extends Schema
  implements ITournamentBracket
{
  @type("string") name: string
  @type(["string"]) playersId = new ArraySchema<string>()
  @type(["string"]) teamsId = new ArraySchema<string>()
  @type("boolean") finished: boolean

  constructor(
    name: string,
    playersId: string[] | ArraySchema<string>,
    teamsId: string[] | ArraySchema<string> = [],
    finished: boolean = false
  ) {
    super()
    this.name = name
    this.finished = finished
    resetArraySchema(this.playersId, playersId)
    resetArraySchema(this.teamsId, teamsId)
  }
}

export class TournamentSchema extends Schema implements ITournament {
  @type("string") id: string
  @type("string") name: string
  @type("string") startDate: string
  @type({ map: TournamentPlayerSchema }) players =
    new MapSchema<TournamentPlayerSchema>()
  @type({ map: TournamentTeamSchema }) teams =
    new MapSchema<TournamentTeamSchema>()
  @type({ map: TournamentBracketSchema }) brackets =
    new MapSchema<TournamentBracketSchema>()
  @type("string") stage: TournamentStage
  @type("number") roundNumber: number
  @type("boolean") wishesEnabled: boolean
  @type("boolean") finished: boolean
  pendingLobbiesCreation: boolean = false

  constructor(
    id: string,
    name: string,
    startDate: string,
    players: MapSchema<ITournamentPlayer, string>,
    brackets: MapSchema<ITournamentBracket, string>,
    finished: boolean = false,
    teams?: MapSchema<ITournamentTeam, string>,
    stage: TournamentStage = "registration",
    roundNumber: number = 0,
    wishesEnabled: boolean = false
  ) {
    super()
    this.id = id
    this.name = name
    this.startDate = startDate
    this.finished = finished
    this.stage = stage
    this.roundNumber = roundNumber
    this.wishesEnabled = wishesEnabled

    if (players && players.size) {
      players.forEach((p, key) => {
        this.players.set(
          key,
          new TournamentPlayerSchema(
            p.name,
            p.avatar,
            p.elo,
            p.ranks,
            p.eliminated,
            p.partnerId,
            p.invitedPartnerId
          )
        )
      })
    }

    if (teams && teams.size) {
      teams.forEach((t, key) => {
        this.teams.set(
          key,
          new TournamentTeamSchema(
            t.name,
            t.playersId,
            t.points,
            t.placements,
            t.opponents,
            t.lobbyHistory,
            t.eliminated
          )
        )
      })
    }

    if (brackets && brackets.size) {
      brackets.forEach((b, bracketId) => {
        this.brackets.set(
          bracketId,
          new TournamentBracketSchema(
            b.name,
            b.playersId,
            b.teamsId,
            b.finished
          )
        )
      })
    }
  }
}
