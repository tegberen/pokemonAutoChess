import { model, Schema } from "mongoose"
import { Blessing } from "../../types/enum/Blessing"
import { DungeonPMDO } from "../../types/enum/Dungeon"
import type { GameMode } from "../../types/enum/Game"
import { Item } from "../../types/enum/Item"
import { Pkm } from "../../types/enum/Pokemon"
import type { Synergy } from "../../types/enum/Synergy"

export interface Pokemon {
  name: string
  avatar: string
  items: Item[]
}

export interface IDetailledStatistic {
  playerId: string
  elo: number
  time: number
  name: string
  rank: number
  nbplayers: number
  avatar: string
  pokemons: Pokemon[]
  synergies: Map<Synergy, number>
  regions: DungeonPMDO[]
  gameMode: GameMode
  whimsy?: boolean
  unholdableItems: Item[]
  blessings: Blessing[]
}

const pokemon = new Schema({
  name: {
    type: String,
    enum: Object.values(Pkm)
  },
  avatar: {
    type: String
  },
  items: [
    {
      type: String,
      enum: Item
    }
  ]
})

const statisticSchema = new Schema({
  playerId: {
    type: String
  },
  elo: {
    type: Number
  },
  time: {
    type: Number
  },
  name: {
    type: String
  },
  rank: {
    type: Number
  },
  nbplayers: {
    type: Number
  },
  avatar: {
    type: String
  },
  pokemons: [pokemon],
  synergies: {
    type: Map,
    of: Number
  },
  regions: [
    {
      type: String,
      enum: DungeonPMDO
    }
  ],
  gameMode: {
    type: String
  },
  whimsy: {
    type: Boolean
  },
  unholdableItems: [
    {
      type: String,
      enum: Item
    }
  ],
  blessings: [
    {
      type: String,
      enum: Blessing
    }
  ]
})

export default model<IDetailledStatistic>(
  "DetailledStatisticV2",
  statisticSchema
)
