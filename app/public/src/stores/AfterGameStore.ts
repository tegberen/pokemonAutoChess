import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { IAfterGamePlayer } from "../../../types"
import { GameMode } from "../../../types/enum/Game"
import type { Synergy } from "../../../types/enum/Synergy"

export interface IUserAfterState {
  players: IAfterGamePlayer[]
  eligibleToXP: boolean
  eligibleToELO: boolean
  gameMode: GameMode
  guideSynergy: Synergy | null
}

const initialState: IUserAfterState = {
  players: new Array<IAfterGamePlayer>(),
  eligibleToXP: false,
  eligibleToELO: false,
  gameMode: GameMode.CUSTOM_LOBBY,
  guideSynergy: null
}

const afterSlice = createSlice({
  name: "after",
  initialState: initialState,
  reducers: {
    addPlayer: (state, action: PayloadAction<IAfterGamePlayer>) => {
      state.players.push(action.payload)
    },
    leaveAfter: () => initialState,
    setElligibilityToXP: (state, action: PayloadAction<boolean>) => {
      state.eligibleToXP = action.payload
    },
    setElligibilityToELO: (state, action: PayloadAction<boolean>) => {
      state.eligibleToELO = action.payload
    },
    setGameMode: (state, action: PayloadAction<GameMode>) => {
      state.gameMode = action.payload
    },
    setGuideSynergy: (state, action: PayloadAction<Synergy | null>) => {
      state.guideSynergy = action.payload
    }
  }
})

export const {
  addPlayer,
  leaveAfter,
  setElligibilityToXP,
  setElligibilityToELO,
  setGameMode,
  setGuideSynergy
} = afterSlice.actions

export default afterSlice.reducer
