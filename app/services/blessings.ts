import Player from "../models/colyseus-models/player"
import PokemonFactory from "../models/pokemon-factory"
import { getPokemonData } from "../models/precomputed/precomputed-pokemon-data"
import { PRECOMPUTED_POKEMONS_PER_RARITY } from "../models/precomputed/precomputed-rarity"
import type GameState from "../rooms/states/game-state"
import { Blessing, BlessingTrigger } from "../types/enum/Blessing"
import { Rarity } from "../types/enum/Game"
import { giveRandomEgg } from "../core/eggs"
import { type Awakening, AwakeningTypes } from "../types/enum/Awakening"
import {
  Berries,
  Item,
  ItemComponents,
  ItemRecipe,
  Sweets,
  SynergyGems,
  SynergyGivenByGem,
  WeatherRocks
} from "../types/enum/Item"
import { Pkm } from "../types/enum/Pokemon"
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
const POTION_LIFE_HEALED = 15
const TRANSFORM_STAGE = 20
const TAXES_GOLD_GAINED = 7
const TAXES_GOLD_TAKEN_FROM_OTHERS = 1
const ROCKY_BEGINNINGS_POKEMONS = 2
const BABYLESS_STAGE = 14
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

const SONG_REINFORCEMENT_STAGES = [17, 22]

const SongBlessingContent: {
  [blessing in Blessing]?: { instrument: Item; reinforcement: Pkm }
} = {
  [Blessing.HEATRANS_SONG]: {
    instrument: Item.FIERY_DRUM,
    reinforcement: Pkm.FLETCHLING
  },
  [Blessing.RAYQUAZAS_SONG]: {
    instrument: Item.SKY_MELODICA,
    reinforcement: Pkm.FLETCHLING
  },
  [Blessing.MEWS_SONG]: {
    instrument: Item.GRASS_CORNET,
    reinforcement: Pkm.GROOKEY
  },
  [Blessing.GROUDONS_SONG]: {
    instrument: Item.TERRA_CYMBAL,
    reinforcement: Pkm.RHYHORN
  },
  [Blessing.ARTICUNOS_SONG]: {
    instrument: Item.ICY_FLUTE,
    reinforcement: Pkm.FRIGIBAX
  },
  [Blessing.GIRATINAS_SONG]: {
    instrument: Item.ROCK_HORN,
    reinforcement: Pkm.RHYHORN
  },
  [Blessing.KYOGRES_SONG]: {
    instrument: Item.AQUA_MONICA,
    reinforcement: Pkm.SOBBLE
  }
}

function pickSongBlessing(
  player: Player,
  state: GameState,
  blessing: Blessing
): boolean {
  const song = SongBlessingContent[blessing]
  if (!song) return false
  player.items.push(song.instrument)
  scheduleBlessingGrant(player, state, blessing, SONG_REINFORCEMENT_STAGES)
  return true
}

function grantSongReinforcement(player: Player, blessing: Blessing) {
  const song = SongBlessingContent[blessing]
  if (song) giftPokemonIfBenchHasRoom(player, song.reinforcement)
}

function giftPokemonIfBenchHasRoom(player: Player, pkm: Pkm): boolean {
  const freeCellX = getFirstAvailablePositionInBench(player.board)
  if (freeCellX === null) return false
  const pokemon = PokemonFactory.createPokemonFromName(pkm, player)
  pokemon.positionX = freeCellX
  pokemon.positionY = 0
  player.board.set(pokemon.id, pokemon)
  pokemon.onAcquired(player)
  return true
}

export function applyBlessingTrigger(
  player: Player,
  state: GameState,
  trigger: BlessingTrigger
) {
  const owned = state.blessingsByPlayerId.get(player.id)
  if (!owned) return
  owned.blessings.forEach((blessing) => {
    blessingTriggerEffectService[blessing]?.[trigger]?.(player, state)
  })
}

export const blessingTriggerEffectService: {
  [blessing in Blessing]?: {
    [trigger in BlessingTrigger]?: (player: Player, state: GameState) => void
  }
} = {
  [Blessing.BERRY_POUCH]: {
    [BlessingTrigger.PVE_END]: (player) =>
      player.items.push(pickRandomIn(Berries))
  },

  [Blessing.SCHOOL_BUS]: {
    [BlessingTrigger.PVE_END]: (player) => {
      giftPokemonIfBenchHasRoom(player, Pkm.WISHIWASHI)
    }
  },

  [Blessing.BANANA_BUSINESS]: {
    [BlessingTrigger.PVE_END]: (player) => player.items.push(Item.NANAB_BERRY)
  },

  [Blessing.SWEET_SUBSCRIPTION]: {
    [BlessingTrigger.PVE_END]: (player) => player.items.push(pickRandomIn(Sweets))
  },

  [Blessing.MUNCHLAX_DELIVERY]: {
    [BlessingTrigger.CAROUSEL_END]: (player) =>
      player.items.push(Item.PICNIC_SET)
  }
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
  },

  [Blessing.TRANSFORM]: (player) => {
    giftPokemonIfBenchHasRoom(player, Pkm.DITTO)
  },

  [Blessing.BABYLESS]: (player) => {
    giveRandomEgg(player, true)
  },

  [Blessing.HEATRANS_SONG]: (player) =>
    grantSongReinforcement(player, Blessing.HEATRANS_SONG),

  [Blessing.RAYQUAZAS_SONG]: (player) =>
    grantSongReinforcement(player, Blessing.RAYQUAZAS_SONG),

  [Blessing.MEWS_SONG]: (player) =>
    grantSongReinforcement(player, Blessing.MEWS_SONG),

  [Blessing.GROUDONS_SONG]: (player) =>
    grantSongReinforcement(player, Blessing.GROUDONS_SONG),

  [Blessing.ARTICUNOS_SONG]: (player) =>
    grantSongReinforcement(player, Blessing.ARTICUNOS_SONG),

  [Blessing.GIRATINAS_SONG]: (player) =>
    grantSongReinforcement(player, Blessing.GIRATINAS_SONG),

  [Blessing.KYOGRES_SONG]: (player) =>
    grantSongReinforcement(player, Blessing.KYOGRES_SONG)
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

  [Blessing.POTION]: (player) => {
    player.life = Math.min(player.maxLife, player.life + POTION_LIFE_HEALED)
    return true
  },

  [Blessing.POCKET_DAYCARE]: (player) => giveRandomEgg(player, false) != null,

  [Blessing.TRANSFORM]: (player, state) => {
    if (!giftPokemonIfBenchHasRoom(player, Pkm.DITTO)) return false
    scheduleBlessingGrant(player, state, Blessing.TRANSFORM, [TRANSFORM_STAGE])
    return true
  },

  [Blessing.TAXES]: (player, state) => {
    player.addMoney(TAXES_GOLD_GAINED, true, null)
    state.players.forEach((otherPlayer) => {
      if (otherPlayer.id !== player.id && otherPlayer.alive) {
        otherPlayer.addMoney(-TAXES_GOLD_TAKEN_FROM_OTHERS, false, null)
      }
    })
    return true
  },

  [Blessing.ROCKY_BEGINNINGS]: (player) => {
    if (getFreeSpaceOnBench(player.board) < ROCKY_BEGINNINGS_POKEMONS) {
      return false
    }
    const weatherRock = pickRandomIn(WeatherRocks)
    player.items.push(weatherRock)
    const rockSynergy = AwakeningTypes[weatherRock as unknown as Awakening]
    const matching = PRECOMPUTED_POKEMONS_PER_RARITY[Rarity.COMMON]
      .concat(PRECOMPUTED_POKEMONS_PER_RARITY[Rarity.UNCOMMON])
      .filter((pkm: Pkm) => {
        const data = getPokemonData(pkm)
        return data.stars === 1 && rockSynergy && data.types.includes(rockSynergy)
      })
    pickNRandomIn(matching, ROCKY_BEGINNINGS_POKEMONS).forEach((pkm) =>
      giftPokemonIfBenchHasRoom(player, pkm)
    )
    return true
  },

  [Blessing.BABYLESS]: (player, state) => {
    scheduleBlessingGrant(player, state, Blessing.BABYLESS, [BABYLESS_STAGE])
    return true
  },

  [Blessing.HEATRANS_SONG]: (player, state) =>
    pickSongBlessing(player, state, Blessing.HEATRANS_SONG),

  [Blessing.RAYQUAZAS_SONG]: (player, state) =>
    pickSongBlessing(player, state, Blessing.RAYQUAZAS_SONG),

  [Blessing.MEWS_SONG]: (player, state) =>
    pickSongBlessing(player, state, Blessing.MEWS_SONG),

  [Blessing.GROUDONS_SONG]: (player, state) =>
    pickSongBlessing(player, state, Blessing.GROUDONS_SONG),

  [Blessing.ARTICUNOS_SONG]: (player, state) =>
    pickSongBlessing(player, state, Blessing.ARTICUNOS_SONG),

  [Blessing.GIRATINAS_SONG]: (player, state) =>
    pickSongBlessing(player, state, Blessing.GIRATINAS_SONG),

  [Blessing.KYOGRES_SONG]: (player, state) =>
    pickSongBlessing(player, state, Blessing.KYOGRES_SONG),

  [Blessing.BERRY_POUCH]: (player) => {
    player.items.push(pickRandomIn(Berries))
    return true
  },

  [Blessing.SCHOOL_BUS]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.WISHIWASHI),

  [Blessing.BANANA_BUSINESS]: (player) => {
    player.items.push(Item.NANAB_BERRY)
    return true
  },

  [Blessing.SWEET_SUBSCRIPTION]: (player) => {
    player.items.push(pickRandomIn(Sweets))
    return true
  },

  [Blessing.MUNCHLAX_DELIVERY]: (player) => {
    player.items.push(Item.PICNIC_SET)
    return true
  },

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
