import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { GameUser, IGameUser } from "../../../models/colyseus-models/game-user"
import Message from "../../../models/colyseus-models/message"
import { IBot } from "../../../models/mongo-models/bot-v2"
import { IChatV2 } from "../../../types"
import { DungeonPMDO } from "../../../types/enum/Dungeon"
import { GameMode } from "../../../types/enum/Game"

interface IUserPreparationState {
  users: IGameUser[]
  gameStarted: boolean
  ownerId: string
  ownerName: string
  messages: IChatV2[]
  name: string
  password: string | null
  noElo: boolean
  user: GameUser | undefined
  botsList: IBot[] | null
  gameMode: GameMode
}

const initialState: IUserPreparationState = {
  users: [],
  gameStarted: false,
  ownerId: "",
  ownerName: "",
  messages: [],
  name: "",
  user: undefined,
  password: null,
  noElo: false,
  botsList: null,
  gameMode: GameMode.NORMAL
}

export const preparationSlice = createSlice({
  name: "preparation",
  initialState: initialState,
  reducers: {
    setUser: (state, action: PayloadAction<GameUser>) => {
      const u: GameUser = JSON.parse(JSON.stringify(action.payload))
      state.user = u
    },
    pushMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(structuredClone(action.payload))
    },
    removeMessage: (state, action: PayloadAction<Message>) => {
      state.messages = state.messages.filter(
        (m) => m.payload !== action.payload.payload
      )
    },
    addUser: (state, action: PayloadAction<IGameUser>) => {
      const u: IGameUser = JSON.parse(JSON.stringify(action.payload))
      state.users.push(u)
    },
    changeUser: (
      state,
      action: PayloadAction<{ id: string; field: string; value: any }>
    ) => {
      state.users[state.users.findIndex((u) => u.id == action.payload.id)][
        action.payload.field
      ] = action.payload.value
    },
    removeUser: (state, action: PayloadAction<string>) => {
      state.users.splice(
        state.users.findIndex((u) => u.id == action.payload),
        1
      )
    },
    setGameStarted: (state, action: PayloadAction<boolean>) => {
      state.gameStarted = action.payload
    },
    setOwnerId: (state, action: PayloadAction<string>) => {
      state.ownerId = action.payload
    },
    setOwnerName: (state, action: PayloadAction<string>) => {
      state.ownerName = action.payload
    },
    setName: (state, action: PayloadAction<string>) => {
      state.name = action.payload
    },
    setPassword: (state, action: PayloadAction<string | null>) => {
      state.password = action.payload
    },
    setNoELO: (state, action: PayloadAction<boolean>) => {
      state.noElo = action.payload
    },
    setGameMode: (state, action: PayloadAction<GameMode>) => {
      state.gameMode = action.payload
    },
    leavePreparation: () => initialState,
    setBotsList: (state, action: PayloadAction<IBot[] | null>) => {
      state.botsList = action.payload
    }
  }
})

export const {
  setUser,
  setName,
  setBotsList,
  pushMessage,
  removeMessage,
  addUser,
  changeUser,
  removeUser,
  setGameStarted,
  setOwnerId,
  setOwnerName,
  setPassword,
  setNoELO,
  setGameMode,
  leavePreparation
} = preparationSlice.actions

export default preparationSlice.reducer
