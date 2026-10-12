import { useMemo } from "react"
import { isPveStage } from "../../../../../core/guide/guide-stage"
import { getNextOpponentChances } from "../../../../../core/matchmaking"
import { GameMode, GamePhaseState } from "../../../../../types/enum/Game"
import { useAppSelector } from "../../../hooks"

const NO_CHANCES = new Map<string, number>()

// chance for each player to be the connected player's next PvP opponent,
// empty outside the picking phase of a PvP stage
export function useNextOpponentChances(): Map<string, number> {
  const uid = useAppSelector((state) => state.network.uid)
  const phase = useAppSelector((state) => state.game.phase)
  const stageLevel = useAppSelector((state) => state.game.stageLevel)
  const gameMode = useAppSelector((state) => state.game.gameMode)
  const guideSynergy = useAppSelector((state) => state.game.guideSynergy)
  const isFinale = useAppSelector((state) => state.game.finalistIds.length > 0)
  const players = useAppSelector((state) => state.game.players)
  // players is a new array on every money or board change, so the prediction
  // only reruns when one of its inputs changes
  const matchmakingInputs = useAppSelector((state) =>
    state.game.players
      .map((p) => `${p.id}:${p.life}:${p.history.length}:${p.doubleUpTeamId}`)
      .join("|")
  )

  return useMemo(() => {
    // the finale duel is already shown, and its life pills are hidden
    if (phase !== GamePhaseState.PICK || isFinale) return NO_CHANCES
    if (isPveStage({ gameMode, guideSynergy }, stageLevel)) return NO_CHANCES

    // the store never updates alive, life is what marks a player as KO
    const alivePlayers = players.filter((p) => p.life > 0)
    return getNextOpponentChances(
      alivePlayers,
      uid,
      gameMode === GameMode.DOUBLE_UP
    )
  }, [
    matchmakingInputs,
    uid,
    phase,
    stageLevel,
    gameMode,
    guideSynergy,
    isFinale
  ])
}
