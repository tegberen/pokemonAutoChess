import { ArraySchema } from "@colyseus/schema"
import type {
  ITournament,
  ITournamentBracket,
  ITournamentTeam
} from "../types/interfaces/Tournament"
import {
  FINAL_BRACKET_NAME,
  makeSemifinalLobbies,
  makeSwissLobbies,
  SEMIFINALISTS,
  standings,
  SWISS_ROUNDS,
  type SwissTeam,
  TEAMS_PER_LOBBY
} from "./tournament-swiss"

type RankedTeam = SwissTeam & { name: string; eliminated: boolean }

function toSwissTeam(id: string, team: ITournamentTeam): RankedTeam {
  return {
    id,
    name: team.name,
    eliminated: team.eliminated,
    points: team.points,
    placements: [...team.placements],
    opponents: [...team.opponents],
    lobbyHistory: [...team.lobbyHistory].map((lobby) => lobby.split(","))
  }
}

function getRemainingTeams(tournament: ITournament): RankedTeam[] {
  const teams: RankedTeam[] = []
  tournament.teams.forEach((team, id) => {
    if (!team.eliminated) teams.push(toSwissTeam(id, team))
  })
  return teams
}

export function getTeamStandings(tournament: ITournament): RankedTeam[] {
  const all: RankedTeam[] = []
  tournament.teams.forEach((team, id) => all.push(toSwissTeam(id, team)))
  return standings(all) as RankedTeam[]
}

function teamBracket(
  tournament: ITournament,
  name: string,
  lobby: SwissTeam[]
): ITournamentBracket {
  const playersId = new ArraySchema<string>()
  const teamsId = new ArraySchema<string>()
  lobby.forEach((team) => {
    teamsId.push(team.id)
    tournament.teams.get(team.id)?.playersId.forEach((id) => playersId.push(id))
  })
  return { name, playersId, teamsId, finished: false }
}

export function makeTeamBrackets(
  tournament: ITournament
): ITournamentBracket[] {
  if (tournament.stage === "semifinals") {
    const topEight = getTeamStandings(tournament).slice(0, SEMIFINALISTS)
    return makeSemifinalLobbies(topEight).map((lobby, index) =>
      teamBracket(tournament, `Semi-Final ${index + 1}`, lobby)
    )
  }

  if (tournament.stage === "final") {
    const finalists = getRemainingTeams(tournament)
    return [teamBracket(tournament, FINAL_BRACKET_NAME, standings(finalists))]
  }

  const round = tournament.roundNumber + 1
  const lobbies = makeSwissLobbies(getRemainingTeams(tournament), round)
  return lobbies.map((lobby, index) =>
    teamBracket(
      tournament,
      `Qualification Round ${round} - Lobby ${index + 1}`,
      lobby
    )
  )
}

export function getTeamTournamentStage(tournament: ITournament): string {
  switch (tournament.stage) {
    case "semifinals":
      return "Semi-Finals"
    case "final":
      return FINAL_BRACKET_NAME
    case "finished":
      return "Finished"
    default:
      return `Qualification Round ${tournament.roundNumber + 1} of ${SWISS_ROUNDS}`
  }
}

// knockout standings are not the Swiss table: a team that farmed points in
// qualification still places below one that went further
export function getTeamFinalRanking(tournament: ITournament): RankedTeam[] {
  const bySwiss = getTeamStandings(tournament)
  const swissOrder = new Map(bySwiss.map((team, index) => [team.id, index]))
  return [...bySwiss].sort((a, b) => {
    if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1
    if (a.placements.length !== b.placements.length) {
      return b.placements.length - a.placements.length
    }
    // the Swiss table already weighed qualification placements, so only a
    // knockout placement splits teams here
    const playedKnockout = a.placements.length > SWISS_ROUNDS
    if (playedKnockout) {
      const lastA = a.placements.at(-1) ?? TEAMS_PER_LOBBY
      const lastB = b.placements.at(-1) ?? TEAMS_PER_LOBBY
      if (lastA !== lastB) return lastA - lastB
    }
    return (swissOrder.get(a.id) ?? 0) - (swissOrder.get(b.id) ?? 0)
  })
}
