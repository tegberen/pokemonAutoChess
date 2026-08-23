import { useEffect, useState } from "react"
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector
} from "react-redux"
import { getGameEventResetDate } from "../../config"
import type { AppDispatch, RootState } from "./stores"
import type { IFossilUnlocksState } from "./stores/GameStore"

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// the player that is currently spectated
export const selectSpectatedPlayer = (state: RootState) =>
  state.game.players.find((p) => p.id === state.game.playerIdSpectated)

// the player that is linked to current user session (undefined when spectating another lobby)
export const selectConnectedPlayer = (state: RootState) =>
  state.game.players.find((p) => p.id === state.network.uid)

const NO_FOSSIL_UNLOCKS: IFossilUnlocksState = {
  revealed: false,
  galarFossils: [],
  restoredPokemon: "",
  unlocked: [],
  progress: {},
  pendingGuarantees: [],
  shopWeight: {}
}

// fossil unlock state of the player linked to the current user session
export const selectFossilUnlocks = (state: RootState): IFossilUnlocksState =>
  state.game.fossilUnlocksByPlayerId[state.network.uid] ?? NO_FOSSIL_UNLOCKS

/* lock state and restored form of whoever is being spectated. Never used for
   quest progress, which stays private to its owner. */
export const selectSpectatedFossilUnlocks = (
  state: RootState
): IFossilUnlocksState =>
  state.game.fossilUnlocksByPlayerId[state.game.playerIdSpectated] ??
  NO_FOSSIL_UNLOCKS

export const useGameEventResetCountdown = () => {
  const now = new Date()
  const resetDate = getGameEventResetDate()
  const [resetCountdown, setResetCountdown] = useState(
    Math.round((resetDate.getTime() - now.getTime()) / 1000)
  )

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setResetCountdown(
        Math.round((resetDate.getTime() - now.getTime()) / 1000)
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [resetDate])

  return resetCountdown
}
