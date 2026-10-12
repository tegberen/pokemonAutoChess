import type Player from "../models/colyseus-models/player"
import type GameState from "../rooms/states/game-state"
import type { IPlayer } from "../types"
import { sum } from "../utils/array"
import { pickRandomIn, shuffleArray } from "../utils/random"
import { schemaValues } from "../utils/schemas"

// the server matches Player, the client predicts with the synced IPlayer
export type Matchup<P extends IPlayer = Player> = {
  bluePlayer: P
  redPlayer: P
  count: number
  distance: number
  rematch: boolean
  ghost?: boolean
}

// builds every matchup, so count, distance and rematch are always filled in
function createMatchup<P extends IPlayer>(
  bluePlayer: P,
  redPlayer: P,
  ghost = false
): Matchup<P> {
  return {
    bluePlayer,
    redPlayer,
    ghost,
    count: getCount(bluePlayer, redPlayer, ghost),
    distance: getDistance(bluePlayer, redPlayer, ghost),
    rematch: isRematch(bluePlayer, redPlayer, ghost)
  }
}

function getAllPossibleMatchups<P extends IPlayer>(
  remainingPlayers: P[]
): Matchup<P>[] {
  const matchups: Matchup<P>[] = []
  for (let i = 0; i < remainingPlayers.length; i++) {
    for (let j = i + 1; j < remainingPlayers.length; j++) {
      matchups.push(createMatchup(remainingPlayers[i], remainingPlayers[j]))
    }
  }
  return matchups
}

// recursively lists every way to pair up all the players: each call adds one
// matchup between two players not yet paired in the combination, until
// everyone has an opponent
function completeMatchupCombination<P extends IPlayer>(
  combination: Matchup<P>[],
  matchups: Matchup<P>[],
  players: P[]
): Matchup<P>[][] {
  const remainingPlayers: P[] = players.filter(
    (p) => !combination.some((m) => m.bluePlayer === p || m.redPlayer === p)
  )
  // combination is complete
  if (remainingPlayers.length === 0) return [combination]
  if (remainingPlayers.length === 1) {
    // player count is odd, so we need to add one ghost matchup at the end of
    // each combination
    const remainingPlayer = remainingPlayers[0]
    return matchups
      .filter(
        (m) =>
          m.bluePlayer === remainingPlayer || m.redPlayer === remainingPlayer
      )
      .map((m) => {
        const playerToGhost =
          m.bluePlayer === remainingPlayer ? m.redPlayer : m.bluePlayer
        // ensure remaining player is blue player and ghost is red player in
        // ghost matchups
        return [
          ...combination,
          createMatchup(remainingPlayer, playerToGhost, true)
        ]
      })
  }
  // if no matchup is left among the remaining players, no combination is
  // returned
  const remainingMatchups = matchups.filter(
    (m) =>
      remainingPlayers.includes(m.bluePlayer) &&
      remainingPlayers.includes(m.redPlayer)
  )
  return remainingMatchups.flatMap((m) =>
    completeMatchupCombination([...combination, m], matchups, players)
  )
}

// keeps every combination tied for the lowest score, so the next step can
// break the tie
function keepLowest<P extends IPlayer>(
  combinations: Matchup<P>[][],
  score: (combination: Matchup<P>[]) => number
): Matchup<P>[][] {
  const scores = combinations.map(score)
  const lowestScore = Math.min(...scores)
  return combinations.filter((_, index) => scores[index] === lowestScore)
}

// step 1) establish all the matchups possible with players alive and their
// associated count, distance and rematch. In Double Up, teammates are never
// paired
function getPossibleMatchups<P extends IPlayer>(
  players: P[],
  isDoubleUp: boolean
): Matchup<P>[] {
  const matchups = getAllPossibleMatchups(players)
  if (!isDoubleUp) return matchups
  return matchups.filter(
    (m) => m.bluePlayer.doubleUpTeamId !== m.redPlayer.doubleUpTeamId
  )
}

// steps 2 to 5, shared by the server pick and the client prediction
function getBestCombinations<P extends IPlayer>(
  players: P[],
  matchups: Matchup<P>[]
): Matchup<P>[][] {
  // step 2) establish all the matchup combinations possible
  let combinations = completeMatchupCombination([], matchups, players)

  // step 3) get matchup combinations that have the fewest back-to-back
  // rematches. This step is new: steps 4 and 5 compare totals over the whole
  // lobby, so they could still pick a rematch whenever it lowered the total.
  // A ghost matchup only counts one side, so its count is lower and it was
  // the most frequent rematch
  combinations = keepLowest(
    combinations,
    (combination) => combination.filter((m) => m.rematch).length
  )

  // step 4) get matchup combinations that have the lowest total count
  combinations = keepLowest(combinations, (combination) =>
    sum(combination.map((m) => m.count))
  )

  // step 5) get matchup combinations that have the largest total distance.
  // The distance is negated, so keeping the lowest keeps the largest
  combinations = keepLowest(
    combinations,
    (combination) => -sum(combination.map((m) => m.distance))
  )

  return combinations
}

// shuffled so blue and red sides, and the order of tied combinations, are
// random
function getAlivePlayersInRandomOrder(state: GameState): Player[] {
  return shuffleArray(schemaValues(state.players).filter((p) => p.alive))
}

export function selectDoubleUpMatchups(state: GameState): Matchup[] {
  const players = getAlivePlayersInRandomOrder(state)
  if (players.length <= 1) return []

  // the finale is a single duel between the last two players
  if (state.finale) {
    const [bluePlayer, redPlayer] = players
    return [createMatchup(bluePlayer, redPlayer)]
  }

  const matchups = getPossibleMatchups(players, true)
  // step 6) pick a random matchup combination among the remaining ones
  return pickRandomIn(getBestCombinations(players, matchups))
}

export function selectMatchups(state: GameState): Matchup[] {
  const players = getAlivePlayersInRandomOrder(state)
  if (players.length <= 1) return []

  const matchups = getPossibleMatchups(players, false)
  // step 6) pick a random matchup combination among the remaining ones
  return pickRandomIn(getBestCombinations(players, matchups))
}

// chance between 0 and 1 for each player to be playerId's next opponent, or
// their ghost. It runs steps 1 to 5 like the server, then reads who playerId
// faces in each remaining combination. Step 6 picks one of them at random,
// each as likely, so the share of combinations is the exact chance. A player
// who is the ghost in someone else's matchup still fights their own matchup,
// so only the matchup where playerId is blue, or the real red player, is theirs
export function getNextOpponentChances<P extends IPlayer>(
  alivePlayers: P[],
  playerId: string,
  isDoubleUp: boolean
): Map<string, number> {
  const chances = new Map<string, number>()
  if (alivePlayers.length <= 1) return chances
  if (!alivePlayers.some((p) => p.id === playerId)) return chances

  const matchups = getPossibleMatchups(alivePlayers, isDoubleUp)
  const combinations = getBestCombinations(alivePlayers, matchups)
  const combinationCountByOpponentId = new Map<string, number>()
  combinations.forEach((combination) => {
    const ownMatchup = combination.find(
      (m) =>
        m.bluePlayer.id === playerId ||
        (m.redPlayer.id === playerId && !m.ghost)
    )
    if (!ownMatchup) return
    const opponentId =
      ownMatchup.bluePlayer.id === playerId
        ? ownMatchup.redPlayer.id
        : ownMatchup.bluePlayer.id
    combinationCountByOpponentId.set(
      opponentId,
      (combinationCountByOpponentId.get(opponentId) ?? 0) + 1
    )
  })
  combinationCountByOpponentId.forEach((count, opponentId) => {
    chances.set(opponentId, count / combinations.length)
  })
  return chances
}

// PvE rounds are skipped, so a PvE round in between does not reset a rematch
function getLastPvpOpponentId(player: IPlayer): string | undefined {
  const index = player.history.findLastIndex((h) => h.id !== "pve")
  return index === -1 ? undefined : player.history[index].id
}

// rematch(A,B) = (B or his ghost was A's last PvP opponent) or (A or his ghost
// was B's last PvP opponent). Against a ghost only A is checked, since B is
// not really fighting
function isRematch(a: IPlayer, b: IPlayer, bIsGhost: boolean): boolean {
  return (
    getLastPvpOpponentId(a) === b.id ||
    (!bIsGhost && getLastPvpOpponentId(b) === a.id)
  )
}

// count(A,B) = (number of times A fought B or his ghost) + (number of times B
// fought A or his ghost). A ghost fight is recorded in the history under the
// ghost owner's id, so it is already included. Read from the synced history,
// the client counts exactly like the server. Against a ghost only A's side
// counts, which makes a ghost matchup look cheaper than a real one
function getCount(a: IPlayer, b: IPlayer, bIsGhost: boolean): number {
  const countA = a.history.filter((h) => h.id === b.id).length
  const countB = b.history.filter((h) => h.id === a.id).length
  return bIsGhost ? countA : countA + countB
}

// distance(A,B) = (number of stages ago A fought B or his ghost) + (number of
// stages ago B fought A or his ghost). Two players who never fought get the
// whole history length plus one, so they always count as the most distant
function getDistance(a: IPlayer, b: IPlayer, bIsGhost: boolean): number {
  const distanceA =
    a.history.length - a.history.findLastIndex((h) => h.id === b.id)
  const distanceB =
    b.history.length - b.history.findLastIndex((h) => h.id === a.id)
  return bIsGhost ? distanceA : distanceA + distanceB
}
