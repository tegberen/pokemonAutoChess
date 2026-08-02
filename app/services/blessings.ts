import Player from "../models/colyseus-models/player"
import PokemonFactory from "../models/pokemon-factory"
import { getPokemonData } from "../models/precomputed/precomputed-pokemon-data"
import { PRECOMPUTED_POKEMONS_PER_RARITY } from "../models/precomputed/precomputed-rarity"
import type GameState from "../rooms/states/game-state"
import { Blessing } from "../types/enum/Blessing"
import { Rarity } from "../types/enum/Game"
import {
  Item,
  ItemComponents,
  ItemRecipe,
  Sweets,
  SynergyGems,
  SynergyGivenByGem
} from "../types/enum/Item"
import type { Pkm } from "../types/enum/Pokemon"
import {
  getFirstAvailablePositionInBench,
  getFreeSpaceOnBench
} from "../utils/board"
import { pickNRandomIn, pickRandomIn } from "../utils/random"

const PEARL_GOLD_GAINED = 10
const CROAGUNKS_AID_EXCHANGE_TICKETS = 3
const BAG_OF_SWEETS_AMOUNT = 4
const WOBBUFFETS_SILVER_PRIZE_RECYCLE_TICKETS = 2
const TREASURE_HUNT_I_GEMS = 2
const STARTER_PACK_CONTENT: { rarity: Rarity; stars: number }[] = [
  { rarity: Rarity.COMMON, stars: 2 },
  { rarity: Rarity.UNCOMMON, stars: 1 },
  { rarity: Rarity.RARE, stars: 1 }
]
const NUGGET_GOLD_GAINED = 15
const TREASURE_HUNT_II_GEMS = 3
const GIMMIGHOULS_TREASURE_COINS = 2
const GIMMIGHOUL_COIN_GOLD_ON_ACQUIRE = 5
const LEGENDARY_GAMBIT_STAGE = 20
const DEEP_INVESTMENTS_PAYOUT_STAGE = 16
const DEEP_INVESTMENTS_PROFIT = 30
const CINCCINOS_GIFTS_III_CRAFTED_ITEMS = 2
const ITEMS_CRAFTED_FROM_SILK_SCARF = (
  Object.keys(ItemRecipe) as Item[]
).filter((item) => ItemRecipe[item]?.includes(Item.SILK_SCARF))

function giftRandomItems(player: Player, amount: number, pool: Item[]): boolean {
  pickNRandomIn(pool, amount).forEach((item) => player.items.push(item))
  return true
}

function giftRandomSynergyGems(player: Player, amount: number): boolean {
  pickNRandomIn(SynergyGems, amount).forEach((gem) => {
    const synergy = SynergyGivenByGem[gem]
    player.bonusSynergies.set(
      synergy,
      (player.bonusSynergies.get(synergy) ?? 0) + 1
    )
    player.items.push(gem)
  })
  player.updateSynergies()
  return true
}

function giftPokemonOfRarityAndStars(
  player: Player,
  rarity: Rarity,
  stars: number
): boolean {
  const candidates = PRECOMPUTED_POKEMONS_PER_RARITY[rarity].filter(
    (pkm: Pkm) => getPokemonData(pkm).stars === stars
  )
  if (candidates.length === 0) return false

  const freeCellX = getFirstAvailablePositionInBench(player.board)
  if (freeCellX === null) return false

  const pokemon = PokemonFactory.createPokemonFromName(
    pickRandomIn(candidates),
    player
  )
  pokemon.positionX = freeCellX
  pokemon.positionY = 0
  player.board.set(pokemon.id, pokemon)
  pokemon.onAcquired(player)
  return true
}

function giftLegendaryMatchingTopSynergy(player: Player): boolean {
  const [topSynergy] = player.synergies.getTopSynergies(1)
  const legendaries = PRECOMPUTED_POKEMONS_PER_RARITY[Rarity.LEGENDARY]
  const matching = legendaries.filter((pkm: Pkm) =>
    getPokemonData(pkm).types.includes(topSynergy)
  )
  const candidates = matching.length > 0 ? matching : legendaries

  const freeCellX = getFirstAvailablePositionInBench(player.board)
  if (freeCellX === null) return false

  const pokemon = PokemonFactory.createPokemonFromName(
    pickRandomIn(candidates),
    player
  )
  pokemon.positionX = freeCellX
  pokemon.positionY = 0
  player.board.set(pokemon.id, pokemon)
  pokemon.onAcquired(player)
  return true
}

function scheduleBlessingGrant(
  player: Player,
  state: GameState,
  blessing: Blessing,
  stages: number[],
  value?: number
) {
  stages.forEach((stage) => {
    if (stage <= state.stageLevel) {
      blessingScheduledEffectService[blessing]?.(player, state, value)
    } else {
      player.scheduledBlessingGrants.push({ stage, blessing, value })
    }
  })
}

function nextStages(state: GameState, count: number): number[] {
  return Array.from({ length: count }, (_, index) => state.stageLevel + index + 1)
}

export function applyScheduledBlessingGrants(player: Player, state: GameState) {
  const dueGrants = player.scheduledBlessingGrants.filter(
    (grant) => grant.stage <= state.stageLevel
  )
  player.scheduledBlessingGrants = player.scheduledBlessingGrants.filter(
    (grant) => grant.stage > state.stageLevel
  )
  dueGrants.forEach((grant) =>
    blessingScheduledEffectService[grant.blessing]?.(player, state, grant.value)
  )
}

export const blessingScheduledEffectService: {
  [blessing in Blessing]?: (
    player: Player,
    state: GameState,
    value?: number
  ) => void
} = {
  [Blessing.CINCCINOS_GIFTS_I]: (player) => player.items.push(Item.SILK_SCARF),

  [Blessing.CINCCINOS_GIFTS_II]: (player) => player.items.push(Item.SILK_SCARF),

  [Blessing.RELIC_FRAGMENT]: (player) =>
    player.items.push(Item.LAPRAS_PASSPORT),

  [Blessing.ITEMFINDER_I]: (player) =>
    player.items.push(pickRandomIn(ItemComponents)),

  [Blessing.ITEMFINDER_II]: (player) =>
    player.items.push(pickRandomIn(ItemComponents)),

  [Blessing.ITEMFINDER_III]: (player) =>
    player.items.push(pickRandomIn(ItemComponents)),

  [Blessing.LEGENDARY_GAMBIT]: (player) => {
    giftLegendaryMatchingTopSynergy(player)
  },

  [Blessing.DEEP_INVESTMENTS]: (player, _state, value) => {
    player.addMoney(value ?? 0, true, null)
  }
}

export const blessingEffectService: {
  [blessing in Blessing]?: (player: Player, state: GameState) => boolean
} = {
  [Blessing.PEARL]: (player) => {
    player.addMoney(PEARL_GOLD_GAINED, true, null)
    return true
  },

  [Blessing.CROAGUNKS_AID]: (player) => {
    for (let i = 0; i < CROAGUNKS_AID_EXCHANGE_TICKETS; i++) {
      player.items.push(Item.EXCHANGE_TICKET)
    }
    return true
  },

  [Blessing.BAG_OF_SWEETS]: (player) =>
    giftRandomItems(player, BAG_OF_SWEETS_AMOUNT, Sweets),

  [Blessing.WOBBUFFETS_SILVER_PRIZE]: (player) => {
    player.items.push(pickRandomIn(ItemComponents))
    for (let i = 0; i < WOBBUFFETS_SILVER_PRIZE_RECYCLE_TICKETS; i++) {
      player.items.push(Item.RECYCLE_TICKET)
    }
    return true
  },

  [Blessing.TREASURE_HUNT_I]: (player) =>
    giftRandomSynergyGems(player, TREASURE_HUNT_I_GEMS),

  [Blessing.STARTER_PACK]: (player) => {
    if (getFreeSpaceOnBench(player.board) < STARTER_PACK_CONTENT.length) {
      return false
    }
    STARTER_PACK_CONTENT.forEach(({ rarity, stars }) =>
      giftPokemonOfRarityAndStars(player, rarity, stars)
    )
    return true
  },

  [Blessing.NUGGET]: (player) => {
    player.addMoney(NUGGET_GOLD_GAINED, true, null)
    return true
  },

  [Blessing.GOLDEN_TICKET]: (player) => {
    player.items.push(Item.GOLD_DOJO_TICKET)
    return true
  },

  [Blessing.TREASURE_HUNT_II]: (player) =>
    giftRandomSynergyGems(player, TREASURE_HUNT_II_GEMS),

  [Blessing.GIMMIGHOULS_TREASURE]: (player) => {
    player.items.push(Item.AMULET_COIN)
    for (let i = 0; i < GIMMIGHOULS_TREASURE_COINS; i++) {
      player.items.push(Item.GIMMIGHOUL_COIN)
      player.addMoney(GIMMIGHOUL_COIN_GOLD_ON_ACQUIRE, true, null)
    }
    return true
  },

  [Blessing.INSTANT_HYPER_ROLL]: (player) =>
    giftPokemonOfRarityAndStars(player, Rarity.COMMON, 3),

  [Blessing.CINCCINOS_GIFTS_I]: (player, state) => {
    player.items.push(Item.SILK_SCARF)
    scheduleBlessingGrant(player, state, Blessing.CINCCINOS_GIFTS_I, [12])
    return true
  },

  [Blessing.CINCCINOS_GIFTS_II]: (player, state) => {
    player.items.push(Item.SILK_SCARF)
    player.items.push(Item.SILK_SCARF)
    scheduleBlessingGrant(player, state, Blessing.CINCCINOS_GIFTS_II, [12])
    return true
  },

  [Blessing.RELIC_FRAGMENT]: (player, state) => {
    player.items.push(Item.LAPRAS_PASSPORT)
    scheduleBlessingGrant(player, state, Blessing.RELIC_FRAGMENT, [10, 20])
    return true
  },

  [Blessing.ITEMFINDER_I]: (player, state) => {
    player.items.push(pickRandomIn(ItemComponents))
    scheduleBlessingGrant(player, state, Blessing.ITEMFINDER_I, nextStages(state, 1))
    return true
  },

  [Blessing.ITEMFINDER_II]: (player, state) => {
    player.items.push(pickRandomIn(ItemComponents))
    scheduleBlessingGrant(player, state, Blessing.ITEMFINDER_II, nextStages(state, 2))
    return true
  },

  [Blessing.ITEMFINDER_III]: (player, state) => {
    player.items.push(pickRandomIn(ItemComponents))
    scheduleBlessingGrant(player, state, Blessing.ITEMFINDER_III, nextStages(state, 6))
    return true
  },

  [Blessing.LEGENDARY_GAMBIT]: (player, state) => {
    scheduleBlessingGrant(
      player,
      state,
      Blessing.LEGENDARY_GAMBIT,
      [LEGENDARY_GAMBIT_STAGE]
    )
    return true
  },

  [Blessing.DEEP_INVESTMENTS]: (player, state) => {
    const investedGold = player.money
    player.addMoney(-investedGold, false, null)
    scheduleBlessingGrant(
      player,
      state,
      Blessing.DEEP_INVESTMENTS,
      [DEEP_INVESTMENTS_PAYOUT_STAGE],
      investedGold + DEEP_INVESTMENTS_PROFIT
    )
    return true
  },

  [Blessing.CINCCINOS_GIFTS_III]: (player) => {
    player.items.push(Item.SILK_SCARF)
    pickNRandomIn(
      ITEMS_CRAFTED_FROM_SILK_SCARF,
      CINCCINOS_GIFTS_III_CRAFTED_ITEMS
    ).forEach((item) => player.items.push(item))
    return true
  }
}
