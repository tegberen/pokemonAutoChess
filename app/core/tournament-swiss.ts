import { shuffleArray } from "../utils/random"

// pure functions over a minimal team shape, so they run without a room or a
// schema

export const TEAM_PLACEMENT_POINTS: { [placement: number]: number } = {
  1: 8,
  2: 4,
  3: 2,
  4: 1
}

export const TEAMS_PER_LOBBY = 4
export const SWISS_ROUNDS = 3
export const SEMIFINALISTS = 8
export const TOURNAMENT_LOBBY_START_DELAY_IN_SECONDS = 15 * 60
export const FINAL_BRACKET_NAME = "Final"

export function skipsSemifinals(teamCount: number): boolean {
  return teamCount <= SEMIFINALISTS
}

export type SwissTeam = {
  id: string
  points: number
  placements: number[]
  opponents: string[]
  // the team ids of every lobby this team has sat in, one entry per round
  lobbyHistory: string[][]
}

export function buchholz(team: SwissTeam, teams: SwissTeam[]): number {
  const byId = new Map(teams.map((t) => [t.id, t]))
  return team.opponents.reduce(
    (sum, id) => sum + (byId.get(id)?.points ?? 0),
    0
  )
}

// negated so every tiebreak sorts the same way: higher is better
function averagePlacement(team: SwissTeam): number {
  if (team.placements.length === 0) return -99
  return -(
    team.placements.reduce((sum, p) => sum + p, 0) / team.placements.length
  )
}

function bestPlacement(team: SwissTeam): number {
  if (team.placements.length === 0) return -99
  return -Math.min(...team.placements)
}

// net times `team` finished ahead of `rival` in the lobbies they shared
function headToHead(team: SwissTeam, rival: SwissTeam): number {
  let score = 0
  team.lobbyHistory.forEach((lobby, round) => {
    if (!lobby.includes(rival.id)) return
    const rivalRound = rival.lobbyHistory.findIndex(
      (rivalLobby) =>
        [...rivalLobby].sort().join() === [...lobby].sort().join()
    )
    if (rivalRound === -1) return
    const own = team.placements[round]
    const other = rival.placements[rivalRound]
    if (own < other) score += 1
    else if (own > other) score -= 1
  })
  return score
}

export function standings(teams: SwissTeam[]): SwissTeam[] {
  const keyOf = (team: SwissTeam) => [
    team.points,
    buchholz(team, teams),
    averagePlacement(team),
    bestPlacement(team)
  ]
  return [...teams].sort((a, b) => {
    const keyA = keyOf(a)
    const keyB = keyOf(b)
    for (let i = 0; i < keyA.length; i++) {
      if (keyA[i] !== keyB[i]) return keyB[i] - keyA[i]
    }
    const decided = headToHead(a, b)
    if (decided !== 0) return -decided
    return a.id.localeCompare(b.id)
  })
}

function hasPlayed(team: SwissTeam, other: SwissTeam): boolean {
  return team.lobbyHistory.some((lobby) => lobby.includes(other.id))
}

function countRepeats(lobby: SwissTeam[]): number {
  let repeats = 0
  for (let i = 0; i < lobby.length; i++) {
    for (let j = i + 1; j < lobby.length; j++) {
      if (hasPlayed(lobby[i], lobby[j])) repeats++
    }
  }
  return repeats
}

// seat the strongest team of each lobby first, then fill every seat with
// whichever remaining team brings the fewest rematches
function buildLowRepeatLobbies(ordered: SwissTeam[]): SwissTeam[][] {
  const remaining = [...ordered]
  const lobbies: SwissTeam[][] = Array.from(
    { length: ordered.length / TEAMS_PER_LOBBY },
    () => []
  )
  lobbies.forEach((lobby) => lobby.push(remaining.shift()!))
  lobbies.forEach((lobby) => {
    while (lobby.length < TEAMS_PER_LOBBY) {
      let bestIndex = 0
      let bestRepeats = Number.POSITIVE_INFINITY
      for (let i = 0; i < remaining.length; i++) {
        const repeats = lobby.filter((seated) =>
          hasPlayed(seated, remaining[i])
        ).length
        if (repeats < bestRepeats) {
          bestIndex = i
          bestRepeats = repeats
          if (repeats === 0) break
        }
      }
      lobby.push(remaining.splice(bestIndex, 1)[0])
    }
  })
  return reduceRepeatsBySwapping(lobbies)
}

function reduceRepeatsBySwapping(
  lobbies: SwissTeam[][],
  maxPasses = 25
): SwissTeam[][] {
  const total = () => lobbies.reduce((sum, l) => sum + countRepeats(l), 0)
  let current = total()
  for (let pass = 0; pass < maxPasses && current > 0; pass++) {
    let improved = false
    for (let i = 0; i < lobbies.length; i++) {
      for (let j = i + 1; j < lobbies.length; j++) {
        for (let a = 0; a < lobbies[i].length; a++) {
          for (let b = 0; b < lobbies[j].length; b++) {
            const teamA = lobbies[i][a]
            const teamB = lobbies[j][b]
            lobbies[i][a] = teamB
            lobbies[j][b] = teamA
            const swapped = total()
            if (swapped < current) {
              current = swapped
              improved = true
            } else {
              lobbies[i][a] = teamA
              lobbies[j][b] = teamB
            }
          }
        }
      }
    }
    if (!improved) break
  }
  return lobbies
}

export function makeSwissLobbies(
  teams: SwissTeam[],
  roundNumber: number
): SwissTeam[][] {
  if (teams.length % TEAMS_PER_LOBBY !== 0) {
    throw new Error(
      `${teams.length} teams cannot fill whole lobbies of ${TEAMS_PER_LOBBY}`
    )
  }
  if (roundNumber <= 1) return chunk(shuffleArray([...teams]))
  return buildLowRepeatLobbies(standings(teams))
}

// cross-seeded so the top qualifiers cannot meet before the final
export function makeSemifinalLobbies(topEight: SwissTeam[]): SwissTeam[][] {
  return [
    [topEight[0], topEight[3], topEight[4], topEight[7]],
    [topEight[1], topEight[2], topEight[5], topEight[6]]
  ]
}

function chunk(teams: SwissTeam[]): SwissTeam[][] {
  const lobbies: SwissTeam[][] = []
  for (let i = 0; i < teams.length; i += TEAMS_PER_LOBBY) {
    lobbies.push(teams.slice(i, i + TEAMS_PER_LOBBY))
  }
  return lobbies
}
