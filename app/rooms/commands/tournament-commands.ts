import { Command } from "@colyseus/command"
import { type Client, matchMaker } from "colyseus"
import { GADGETS } from "../../config/game/gadgets"
import {
  getTeamFinalRanking,
  getTeamStandings,
  getTeamTournamentStage,
  makeTeamBrackets
} from "../../core/tournament-logic"
import {
  SEMIFINALISTS,
  skipsSemifinals,
  SWISS_ROUNDS,
  TEAM_PLACEMENT_POINTS,
  TEAMS_PER_LOBBY,
  TOURNAMENT_LOBBY_START_DELAY_IN_SECONDS
} from "../../core/tournament-swiss"
import {
  TournamentBracketSchema,
  TournamentPlayerSchema,
  TournamentTeamSchema
} from "../../models/colyseus-models/tournament"
import { Tournament } from "../../models/mongo-models/tournament"
import UserMetadata from "../../models/mongo-models/user-metadata"
import { Role, Transfer } from "../../types"
import { GameMode } from "../../types/enum/Game"
import type {
  ITournament,
  ITournamentBracket
} from "../../types/interfaces/Tournament"
import { logger } from "../../utils/logger"
import { shuffleArray } from "../../utils/random"
import { convertSchemaToRawObject, schemaValues } from "../../utils/schemas"
import type CustomLobbyRoom from "../custom-lobby-room"

export class OnCreateTournamentCommand extends Command<
  CustomLobbyRoom,
  { client: Client; name: string; startDate: string }
> {
  async execute({
    client,
    name,
    startDate
  }: {
    client: Client
    name: string
    startDate: string
  }) {
    try {
      const user = this.room.users.get(client.auth.uid)
      if (user && user.role && user.role === Role.ADMIN) {
        await this.state.createTournament(name, startDate)
        await this.room.fetchTournaments()
        this.room.presence.publish(
          "announcement",
          `Registrations are open for the tournament "${name}"!`
        )
      }
    } catch (error) {
      logger.error(error)
    }
  }
}

export class DeleteTournamentCommand extends Command<
  CustomLobbyRoom,
  { client: Client; tournamentId: string }
> {
  execute({ client, tournamentId }: { client: Client; tournamentId: string }) {
    try {
      const user = this.room.users.get(client.auth.uid)
      if (user && user.role && user.role === Role.ADMIN) {
        this.state.removeTournament(tournamentId)
      }
    } catch (error) {
      logger.error(error)
    }
  }
}

export class RenameTournamentCommand extends Command<
  CustomLobbyRoom,
  { client: Client; tournamentId: string; name: string }
> {
  async execute({
    client,
    tournamentId,
    name
  }: {
    client: Client
    tournamentId: string
    name: string
  }) {
    try {
      const user = this.room.users.get(client.auth.uid)
      if (!user || user.role !== Role.ADMIN) return
      const tournament = this.state.tournaments.find(
        (t) => t.id === tournamentId
      )
      const trimmed = name.trim()
      if (!tournament || !trimmed) return

      tournament.name = trimmed
      const mongoTournament = await Tournament.findById(tournamentId)
      if (mongoTournament) {
        mongoTournament.name = trimmed
        mongoTournament.save()
      }
    } catch (error) {
      logger.error(error)
    }
  }
}

// takes effect on the next lobbies opened, not on ones already waiting
export class SetTournamentWishesCommand extends Command<
  CustomLobbyRoom,
  { client: Client; tournamentId: string; enabled: boolean }
> {
  async execute({
    client,
    tournamentId,
    enabled
  }: {
    client: Client
    tournamentId: string
    enabled: boolean
  }) {
    try {
      const user = this.room.users.get(client.auth.uid)
      if (!user || user.role !== Role.ADMIN) return
      const tournament = this.state.tournaments.find(
        (t) => t.id === tournamentId
      )
      if (!tournament) return

      tournament.wishesEnabled = enabled === true
      const mongoTournament = await Tournament.findById(tournamentId)
      if (mongoTournament) {
        mongoTournament.wishesEnabled = tournament.wishesEnabled
        mongoTournament.save()
      }
    } catch (error) {
      logger.error(error)
    }
  }
}

// before the start a team cannot play a player short: it is dissolved and the
// partner freed to find another
function releaseTournamentPlayer(tournament: ITournament, playerId: string) {
  const leaving = tournament.players.get(playerId)
  if (leaving?.partnerId) {
    const partner = tournament.players.get(leaving.partnerId)
    if (partner) partner.partnerId = ""
  }
  tournament.players.forEach((player) => {
    if (player.invitedPartnerId === playerId) player.invitedPartnerId = ""
  })
  tournament.teams.forEach((team, teamId) => {
    if ([...team.playersId].includes(playerId)) {
      tournament.teams.delete(teamId)
    }
  })
}

export class ParticipateInTournamentCommand extends Command<
  CustomLobbyRoom,
  { client: Client; tournamentId: string; participate: boolean }
> {
  async execute({
    client,
    tournamentId,
    participate
  }: {
    client: Client
    tournamentId: string
    participate: boolean
  }) {
    try {
      if (!client.auth.uid || this.room.users.has(client.auth.uid) === false)
        return
      const tournament = this.state.tournaments.find(
        (t) => t.id === tournamentId
      )

      if (!tournament)
        return logger.error(`Tournament not found: ${tournamentId}`)

      const user = await UserMetadata.findOne({ uid: client.auth.uid })
      if (!user) return

      if (participate) {
        if (user.level < GADGETS.certificate.levelRequired) {
          client.send(
            Transfer.ALERT,
            `You need to reach level ${GADGETS.certificate.levelRequired} to participate in tournaments.`
          )
          return
        }
        //logger.debug(`${user.uid} participates in tournament ${tournamentId}`)
        const tournamentPlayer = new TournamentPlayerSchema(
          user.displayName,
          user.avatar,
          user.elo
        )

        tournament.players.set(user.uid, tournamentPlayer)
      } else if (tournament.players.has(user.uid)) {
        const inATeam = schemaValues(tournament.teams).some((team) =>
          team.playersId.includes(user.uid)
        )
        if (tournament.stage !== "registration" && inATeam) {
          return client.send(
            Transfer.ALERT,
            "The tournament has started, you can no longer withdraw."
          )
        }
        /*logger.debug(
          `${user.uid} no longer participates in tournament ${tournamentId}`
        )*/
        releaseTournamentPlayer(tournament, user.uid)
        tournament.players.delete(user.uid)
      }

      const mongoTournament = await Tournament.findById(tournamentId)
      if (mongoTournament) {
        mongoTournament.players = convertSchemaToRawObject(tournament.players)
        mongoTournament.teams = convertSchemaToRawObject(tournament.teams)
        mongoTournament.save()
      }
    } catch (error) {
      logger.error(error)
    }
  }
}

// qualification runs a fixed number of Swiss rounds rather than cutting teams
// each round, so the stage decides what comes next, not the teams left
function advanceTeamTournament(tournament: ITournament, tournamentId: string) {
  // starting comes through here too, before any round is played, so it must
  // not consume a round number
  if (tournament.stage === "registration") {
    tournament.stage = "qualification"
    return [new CreateTournamentLobbiesCommand().setPayload({ tournamentId })]
  }

  if (tournament.stage === "final") {
    tournament.stage = "finished"
    return [new EndTournamentCommand().setPayload({ tournamentId })]
  }

  if (tournament.stage === "semifinals") {
    // the top two of each semifinal lobby reach the final
    tournament.brackets.forEach((bracket) => {
      const ranked = [...bracket.teamsId]
        .map((id) => ({ id, team: tournament.teams.get(id) }))
        .filter(({ team }) => team != null)
        .sort(
          (a, b) =>
            (a.team!.placements.at(-1) ?? 99) -
            (b.team!.placements.at(-1) ?? 99)
        )
      ranked.slice(2).forEach(({ team }) => {
        team!.eliminated = true
      })
    })
    tournament.stage = "final"
    return [new CreateTournamentLobbiesCommand().setPayload({ tournamentId })]
  }

  tournament.roundNumber += 1
  if (tournament.roundNumber >= SWISS_ROUNDS) {
    // with no more teams than semifinal seats, the semifinals would cut
    // nobody, so the top of the table goes straight to the final
    const skipSemifinals = skipsSemifinals(tournament.teams.size)
    const qualified = new Set(
      getTeamStandings(tournament)
        .slice(0, skipSemifinals ? TEAMS_PER_LOBBY : SEMIFINALISTS)
        .map((team) => team.id)
    )
    tournament.teams.forEach((team, id) => {
      if (!qualified.has(id)) team.eliminated = true
    })
    tournament.stage = skipSemifinals ? "final" : "semifinals"
  } else {
    tournament.stage = "qualification"
  }
  return [new CreateTournamentLobbiesCommand().setPayload({ tournamentId })]
}

export class RegisterTournamentTeamsCommand extends Command<
  CustomLobbyRoom,
  { client: Client; tournamentId: string; pairs: string[][] }
> {
  async execute({
    client,
    tournamentId,
    pairs
  }: {
    client: Client
    tournamentId: string
    pairs: string[][]
  }) {
    try {
      const user = this.room.users.get(client.auth.uid)
      if (!user || user.role !== Role.ADMIN) {
        return client.send(
          Transfer.ALERT,
          "Registering teams failed: you are not recognised as an admin in this lobby. Reload the page and try again."
        )
      }

      const tournament = this.state.tournaments.find(
        (t) => t.id === tournamentId
      )
      if (!tournament) {
        logger.error(`Tournament not found: ${tournamentId}`)
        return client.send(
          Transfer.ALERT,
          "Registering teams failed: this tournament was not found on the server. Reload the page and try again."
        )
      }

      if (tournament.stage !== "registration") {
        return client.send(
          Transfer.ALERT,
          "Teams can only be registered before the tournament starts."
        )
      }

      const seen = new Set<string>()
      for (const pair of pairs) {
        if (pair.length !== 2) {
          return client.send(Transfer.ALERT, "Every team needs exactly 2 players.")
        }
        for (const playerId of pair) {
          if (!tournament.players.has(playerId)) {
            return client.send(
              Transfer.ALERT,
              `${playerId} has not joined this tournament.`
            )
          }
          if (seen.has(playerId)) {
            return client.send(
              Transfer.ALERT,
              `${playerId} is registered in two teams.`
            )
          }
          seen.add(playerId)
        }
      }
      if (pairs.length % TEAMS_PER_LOBBY !== 0) {
        return client.send(
          Transfer.ALERT,
          `${pairs.length} teams cannot fill whole lobbies of ${TEAMS_PER_LOBBY}.`
        )
      }

      tournament.teams.clear()
      pairs.forEach((pair, index) => {
        const name = pair
          .map((id) => tournament.players.get(id)?.name ?? id)
          .join(" & ")
        tournament.teams.set(
          `team-${index}`,
          new TournamentTeamSchema(name, pair)
        )
      })

      const mongoTournament = await Tournament.findById(tournamentId)
      if (mongoTournament) {
        mongoTournament.teams = convertSchemaToRawObject(tournament.teams)
        mongoTournament.save()
      }
      logger.debug(
        `Registered ${pairs.length} teams for tournament ${tournamentId}`
      )
    } catch (error) {
      logger.error(error)
      client.send(
        Transfer.ALERT,
        `Registering teams failed: ${error instanceof Error ? error.message : error}`
      )
    }
  }
}

export class TournamentPartnerCommand extends Command<
  CustomLobbyRoom,
  {
    client: Client
    tournamentId: string
    targetId: string
    action: "invite" | "accept" | "decline" | "cancel" | "leave"
  }
> {
  async execute({
    client,
    tournamentId,
    targetId,
    action
  }: {
    client: Client
    tournamentId: string
    targetId: string
    action: "invite" | "accept" | "decline" | "cancel" | "leave"
  }) {
    try {
      const uid = client.auth.uid
      const tournament = this.state.tournaments.find(
        (t) => t.id === tournamentId
      )
      if (!tournament)
        return logger.error(`Tournament not found: ${tournamentId}`)
      if (tournament.stage !== "registration") {
        return client.send(
          Transfer.ALERT,
          "Teams are locked once the tournament has started."
        )
      }

      const me = tournament.players.get(uid)
      if (!me) return

      if (action === "leave") {
        const partner = tournament.players.get(me.partnerId)
        if (partner) partner.partnerId = ""
        me.partnerId = ""
        me.invitedPartnerId = ""
      } else if (action === "cancel") {
        me.invitedPartnerId = ""
      } else if (action === "invite") {
        const target = tournament.players.get(targetId)
        if (!target || targetId === uid) return
        if (me.partnerId || target.partnerId) {
          return client.send(Transfer.ALERT, "That player already has a team.")
        }
        me.invitedPartnerId = targetId
      } else if (action === "decline") {
        const inviter = tournament.players.get(targetId)
        if (inviter && inviter.invitedPartnerId === uid) {
          inviter.invitedPartnerId = ""
        }
      } else if (action === "accept") {
        const inviter = tournament.players.get(targetId)
        if (!inviter || inviter.invitedPartnerId !== uid) {
          return client.send(Transfer.ALERT, "That invitation has expired.")
        }
        if (me.partnerId || inviter.partnerId) {
          return client.send(Transfer.ALERT, "That player already has a team.")
        }
        me.partnerId = targetId
        inviter.partnerId = uid
        me.invitedPartnerId = ""
        inviter.invitedPartnerId = ""
        tournament.players.forEach((player) => {
          if (
            player.invitedPartnerId === uid ||
            player.invitedPartnerId === targetId
          ) {
            player.invitedPartnerId = ""
          }
        })
      }

      const mongoTournament = await Tournament.findById(tournamentId)
      if (mongoTournament) {
        mongoTournament.players = convertSchemaToRawObject(tournament.players)
        mongoTournament.save()
      }
    } catch (error) {
      logger.error(error)
    }
  }
}

export class KickTournamentParticipantCommand extends Command<
  CustomLobbyRoom,
  { client: Client; tournamentId: string; playerId: string }
> {
  async execute({
    client,
    tournamentId,
    playerId
  }: {
    client: Client
    tournamentId: string
    playerId: string
  }) {
    try {
      const user = this.room.users.get(client.auth.uid)
      if (!user || user.role !== Role.ADMIN) return

      const tournament = this.state.tournaments.find(
        (t) => t.id === tournamentId
      )
      if (!tournament)
        return logger.error(`Tournament not found: ${tournamentId}`)
      if (tournament.stage !== "registration") {
        return client.send(
          Transfer.ALERT,
          "Participants can only be removed before the tournament starts."
        )
      }

      releaseTournamentPlayer(tournament, playerId)
      tournament.players.delete(playerId)

      const mongoTournament = await Tournament.findById(tournamentId)
      if (mongoTournament) {
        mongoTournament.players = convertSchemaToRawObject(tournament.players)
        mongoTournament.teams = convertSchemaToRawObject(tournament.teams)
        mongoTournament.save()
      }
    } catch (error) {
      logger.error(error)
    }
  }
}

// the team keeps its points and history, and a lobby still waiting for the
// outgoing player lets the substitute in instead
export class ReplaceTournamentPlayerCommand extends Command<
  CustomLobbyRoom,
  {
    client: Client
    tournamentId: string
    teamId: string
    outgoingId: string
    incomingId: string
  }
> {
  async execute({
    client,
    tournamentId,
    teamId,
    outgoingId,
    incomingId
  }: {
    client: Client
    tournamentId: string
    teamId: string
    outgoingId: string
    incomingId: string
  }) {
    try {
      const user = this.room.users.get(client.auth.uid)
      if (!user || user.role !== Role.ADMIN) return

      const tournament = this.state.tournaments.find(
        (t) => t.id === tournamentId
      )
      if (!tournament)
        return logger.error(`Tournament not found: ${tournamentId}`)
      const team = tournament.teams.get(teamId)
      const outgoingIndex = team ? [...team.playersId].indexOf(outgoingId) : -1
      if (!team || outgoingIndex === -1 || tournament.finished) return

      const onBench =
        tournament.players.has(incomingId) &&
        !schemaValues(tournament.teams).some((t) =>
          t.playersId.includes(incomingId)
        )
      if (!onBench) {
        return client.send(
          Transfer.ALERT,
          "The substitute must be a participant without a team."
        )
      }

      team.playersId[outgoingIndex] = incomingId
      team.name = [...team.playersId]
        .map((id) => tournament.players.get(id)?.name ?? id)
        .join(" & ")
      const partnerId = [...team.playersId].find((id) => id !== incomingId)
      const outgoing = tournament.players.get(outgoingId)
      const incoming = tournament.players.get(incomingId)!
      if (outgoing) outgoing.partnerId = ""
      incoming.partnerId = partnerId ?? ""
      incoming.invitedPartnerId = ""
      const partner = partnerId ? tournament.players.get(partnerId) : undefined
      if (partner) partner.partnerId = incomingId

      tournament.brackets.forEach((bracket, bracketId) => {
        if (bracket.finished || !bracket.teamsId.includes(teamId)) return
        const index = [...bracket.playersId].indexOf(outgoingId)
        if (index !== -1) bracket.playersId[index] = incomingId
        this.room.presence.publish("tournament-lobby-update", {
          bracketId,
          teams: lobbyTeams(tournament, bracket.teamsId)
        })
      })

      const mongoTournament = await Tournament.findById(tournamentId)
      if (mongoTournament) {
        mongoTournament.players = convertSchemaToRawObject(tournament.players)
        mongoTournament.teams = convertSchemaToRawObject(tournament.teams)
        mongoTournament.brackets = convertSchemaToRawObject(tournament.brackets)
        mongoTournament.save()
      }
    } catch (error) {
      logger.error(error)
    }
  }
}

export class StartTournamentLobbyNowCommand extends Command<
  CustomLobbyRoom,
  { client: Client; bracketId: string }
> {
  execute({ client, bracketId }: { client: Client; bracketId: string }) {
    const user = this.room.users.get(client.auth.uid)
    if (!user || user.role !== Role.ADMIN) return
    this.room.presence.publish("tournament-lobby-start", { bracketId })
  }
}

export class StartTournamentCommand extends Command<
  CustomLobbyRoom,
  { client: Client; tournamentId: string }
> {
  execute({ client, tournamentId }: { client: Client; tournamentId: string }) {
    try {
      const user = this.room.users.get(client.auth.uid)
      if (!user || user.role !== Role.ADMIN) return

      const tournament = this.state.tournaments.find(
        (t) => t.id === tournamentId
      )
      if (!tournament)
        return logger.error(`Tournament not found: ${tournamentId}`)

      if (tournament.finished || tournament.stage !== "registration") {
        return client.send(
          Transfer.ALERT,
          "This tournament has already started."
        )
      }
      if (tournament.teams.size === 0) {
        return client.send(Transfer.ALERT, "Register the teams first.")
      }
      if (tournament.teams.size % TEAMS_PER_LOBBY !== 0) {
        return client.send(
          Transfer.ALERT,
          `${tournament.teams.size} teams cannot fill whole lobbies of ${TEAMS_PER_LOBBY}. Re-register the teams.`
        )
      }

      logger.info(`Tournament ${tournamentId} started by ${user.displayName}`)
      return [new NextTournamentStageCommand().setPayload({ tournamentId })]
    } catch (error) {
      logger.error(error)
    }
  }
}

export class NextTournamentStageCommand extends Command<
  CustomLobbyRoom,
  { tournamentId: string }
> {
  async execute({ tournamentId }: { tournamentId: string }) {
    try {
      logger.debug(`Tournament ${tournamentId} is moving to next stage`)
      const tournament = this.state.tournaments.find(
        (t) => t.id === tournamentId
      )
      if (!tournament)
        return logger.error(`Tournament not found: ${tournamentId}`)

      return advanceTeamTournament(tournament, tournamentId)
    } catch (error) {
      logger.error(error)
    }
  }
}

function lobbyTeams(tournament: ITournament, teamsId: Iterable<string>) {
  return [...teamsId].flatMap((teamId) => {
    const team = tournament.teams.get(teamId)
    if (!team) return []
    return [
      {
        name: team.name,
        playersId: [...team.playersId],
        playersName: [...team.playersId].map(
          (id) => tournament.players.get(id)?.name ?? id
        )
      }
    ]
  })
}

async function createTournamentLobby(
  tournament: ITournament,
  bracketId: string,
  bracket: ITournamentBracket
) {
  const lobby = await matchMaker.createRoom("preparation", {
    gameMode: GameMode.DOUBLE_UP,
    noElo: true,
    ownerId: null,
    roomName: bracket.name,
    autoStartDelayInSeconds: TOURNAMENT_LOBBY_START_DELAY_IN_SECONDS,
    blessingsEnabled: tournament.wishesEnabled,
    whitelist: [...bracket.playersId],
    tournamentTeams: lobbyTeams(tournament, bracket.teamsId),
    tournamentId: tournament.id,
    bracketId
  })
  logger.info(
    `Tournament ${tournament.id} lobby "${bracket.name}" (bracket ${bracketId}) opened as room ${lobby.roomId} on process ${lobby.processId}`
  )
}

export class CreateTournamentLobbiesCommand extends Command<
  CustomLobbyRoom,
  { client?: Client; tournamentId: string }
> {
  async execute({
    tournamentId,
    client
  }: {
    tournamentId: string
    client?: Client
  }) {
    try {
      if (client) {
        const user = this.room.users.get(client.auth.uid)
        if (!user || !user.role || user.role !== Role.ADMIN) {
          return
        }
      }

      logger.debug(`Creating tournament lobbies for tournament ${tournamentId}`)
      const tournament = this.state.tournaments.find(
        (t) => t.id === tournamentId
      )
      if (!tournament)
        return logger.error(`Tournament not found: ${tournamentId}`)

      this.state.addAnnouncement(
        `${tournament.name}: ${getTeamTournamentStage(tournament)} is starting, join your lobby!`
      )

      const brackets = makeTeamBrackets(tournament)
      tournament.brackets.clear()

      for (const bracket of brackets) {
        const bracketId = crypto.randomUUID()
        logger.info(`Creating tournament game ${bracket.name} id: ${bracketId}`)
        tournament.brackets.set(
          bracketId,
          new TournamentBracketSchema(
            bracket.name,
            bracket.playersId,
            bracket.teamsId
          )
        )

        await createTournamentLobby(tournament, bracketId, bracket)
      }

      // the Swiss state lives in memory, so a restart would lose it unsaved
      const mongoTournament = await Tournament.findById(tournamentId)
      if (mongoTournament) {
        mongoTournament.brackets = convertSchemaToRawObject(tournament.brackets)
        mongoTournament.teams = convertSchemaToRawObject(tournament.teams)
        mongoTournament.stage = tournament.stage
        mongoTournament.roundNumber = tournament.roundNumber
        await mongoTournament.save()
      }

      tournament.pendingLobbiesCreation = false
    } catch (error) {
      logger.error(error)
    }
  }
}

export class RemakeTournamentLobbyCommand extends Command<
  CustomLobbyRoom,
  { client?: Client; tournamentId: string; bracketId: string }
> {
  async execute({
    tournamentId,
    bracketId,
    client
  }: {
    tournamentId: string
    bracketId: string
    client?: Client
  }) {
    try {
      if (client) {
        const user = this.room.users.get(client.auth.uid)
        if (!user || !user.role || user.role !== Role.ADMIN) {
          return
        }
      }

      const tournament = this.state.tournaments.find(
        (t) => t.id === tournamentId
      )
      if (!tournament)
        return logger.error(`Tournament not found: ${tournamentId}`)

      const bracket = tournament.brackets.get(bracketId)
      if (!bracket)
        return logger.error(`Tournament bracket not found: ${bracketId}`)

      // its result is already counted, so playing it again would count twice
      if (bracket.finished) return

      logger.info(`Remaking tournament game ${bracket.name} id: ${bracketId}`)
      await createTournamentLobby(tournament, bracketId, bracket)
    } catch (error) {
      logger.error(error)
    }
  }
}

// both partners of a Double Up team share the same rank, so a lobby's four
// team placements are read straight off the players
function recordTeamResults(
  tournament: ITournament,
  bracket: { teamsId: { forEach: (fn: (id: string) => void) => void } },
  players: { id: string; rank: number }[]
) {
  const rankByPlayer = new Map(players.map((p) => [p.id, p.rank]))
  const lobbyTeamIds: string[] = []
  bracket.teamsId.forEach((id) => lobbyTeamIds.push(id))

  lobbyTeamIds.forEach((teamId) => {
    const team = tournament.teams.get(teamId)
    if (!team) return
    const placement = [...team.playersId]
      .map((playerId) => rankByPlayer.get(playerId))
      .find((rank) => rank !== undefined)
    // a forfeit is recorded as last place for the tiebreaks, but scores nothing
    team.placements.push(placement ?? TEAMS_PER_LOBBY)
    if (placement !== undefined) {
      team.points += TEAM_PLACEMENT_POINTS[placement] ?? 0
    }
    team.lobbyHistory.push(lobbyTeamIds.join(","))
    lobbyTeamIds
      .filter((id) => id !== teamId)
      .forEach((id) => team.opponents.push(id))
  })
}

export class EndTournamentMatchCommand extends Command<
  CustomLobbyRoom,
  {
    tournamentId: string
    bracketId: string
    players: { id: string; rank: number }[]
  }
> {
  async execute({
    tournamentId,
    bracketId,
    players
  }: {
    tournamentId: string
    bracketId: string
    players: { id: string; rank: number }[]
  }) {
    logger.debug(`Tournament ${tournamentId} bracket ${bracketId} has ended`)
    try {
      const tournament = this.state.tournaments.find(
        (t) => t.id === tournamentId
      )
      if (!tournament)
        return logger.error(`Tournament not found: ${tournamentId}`)

      const bracket = tournament.brackets.get(bracketId)
      if (!bracket)
        return logger.error(`Tournament bracket not found: ${bracketId}`)

      // the lobby timer can still report a bracket the simulation already ended
      if (bracket.finished) return
      bracket.finished = true

      recordTeamResults(tournament, bracket, players)
      logger.info(
        `Tournament ${tournamentId} lobby "${bracket.name}" (bracket ${bracketId}) result: ${[
          ...bracket.teamsId
        ]
          .map((teamId) => {
            const team = tournament.teams.get(teamId)
            return `${team?.name ?? teamId} ${team?.placements.at(-1) ?? "?"}`
          })
          .join(", ")}`
      )

      // a result that never went through a game leaves its lobby waiting, and
      // tournament lobbies never dispose on their own
      const waitingLobbies = await matchMaker.query({ name: "preparation" })
      waitingLobbies
        .filter((lobby) => lobby.metadata?.bracketId === bracketId)
        .forEach((lobby) =>
          this.room.presence.publish("room-deleted", lobby.roomId)
        )

      if (
        !tournament.pendingLobbiesCreation &&
        schemaValues(tournament.brackets).every((b) => b.finished)
      ) {
        tournament.pendingLobbiesCreation = true // prevent executing command multiple times
        const mongoTournament = await Tournament.findById(tournamentId)
        if (mongoTournament) {
          mongoTournament.teams = convertSchemaToRawObject(tournament.teams)
          mongoTournament.brackets = convertSchemaToRawObject(
            tournament.brackets
          )
          mongoTournament.save()
        }

        return [new NextTournamentStageCommand().setPayload({ tournamentId })]
      }
    } catch (error) {
      logger.error(error)
    }
  }
}

// test tooling: stand-ins so a bracket runs without a client per player
export class AddTournamentTestPlayersCommand extends Command<
  CustomLobbyRoom,
  { client: Client; tournamentId: string; count: number }
> {
  async execute({
    client,
    tournamentId,
    count
  }: {
    client: Client
    tournamentId: string
    count: number
  }) {
    try {
      const user = this.room.users.get(client.auth.uid)
      if (!user || user.role !== Role.ADMIN) return

      const tournament = this.state.tournaments.find(
        (t) => t.id === tournamentId
      )
      if (!tournament)
        return logger.error(`Tournament not found: ${tournamentId}`)

      for (let i = 0; i < count; i++) {
        const id = `test-${crypto.randomUUID()}`
        tournament.players.set(
          id,
          new TournamentPlayerSchema(
            `Test ${tournament.players.size + 1}`,
            "0019/Normal",
            1000
          )
        )
      }

      const mongoTournament = await Tournament.findById(tournamentId)
      if (mongoTournament) {
        mongoTournament.players = convertSchemaToRawObject(tournament.players)
        mongoTournament.save()
      }
    } catch (error) {
      logger.error(error)
    }
  }
}

// test tooling: random placements through the same path a played round takes
export class SimulateTournamentRoundCommand extends Command<
  CustomLobbyRoom,
  { client: Client; tournamentId: string }
> {
  execute({ client, tournamentId }: { client: Client; tournamentId: string }) {
    try {
      const user = this.room.users.get(client.auth.uid)
      if (!user || user.role !== Role.ADMIN) return

      const tournament = this.state.tournaments.find(
        (t) => t.id === tournamentId
      )
      if (!tournament)
        return logger.error(`Tournament not found: ${tournamentId}`)

      const commands: Command[] = []
      tournament.brackets.forEach((bracket, bracketId) => {
        if (bracket.finished) return
        const placements = shuffleArray(
          [...bracket.teamsId].map((_, index) => index + 1)
        )
        const players: { id: string; rank: number }[] = []
        ;[...bracket.teamsId].forEach((teamId, index) => {
          const team = tournament.teams.get(teamId)
          team?.playersId.forEach((playerId) =>
            players.push({ id: playerId, rank: placements[index] })
          )
        })
        commands.push(
          new EndTournamentMatchCommand().setPayload({
            tournamentId,
            bracketId,
            players
          })
        )
      })
      return commands
    } catch (error) {
      logger.error(error)
    }
  }
}

export class EndTournamentCommand extends Command<
  CustomLobbyRoom,
  { tournamentId: string }
> {
  async execute({ tournamentId }: { tournamentId: string }) {
    try {
      logger.debug(`Tournament ${tournamentId} is finished`)
      const tournament = this.state.tournaments.find(
        (t) => t.id === tournamentId
      )
      if (!tournament)
        return logger.error(`Tournament not found: ${tournamentId}`)

      // rewards are the admin's to hand out; the server only announces
      const winner = getTeamFinalRanking(tournament)[0]
      if (winner) {
        this.room.presence.publish(
          "announcement",
          `${winner.name} won the tournament "${tournament.name}"!`
        )
      }

      tournament.brackets.clear()
      tournament.finished = true

      const mongoTournament = await Tournament.findById(tournamentId)
      if (mongoTournament) {
        mongoTournament.finished = true
        mongoTournament.stage = tournament.stage
        mongoTournament.teams = convertSchemaToRawObject(tournament.teams)
        mongoTournament.brackets = convertSchemaToRawObject(tournament.brackets)
        await mongoTournament.save()
      }
    } catch (error) {
      logger.error(error)
    }
  }
}
