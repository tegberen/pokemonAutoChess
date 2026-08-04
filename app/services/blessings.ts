import Player from "../models/colyseus-models/player"
import { PokemonClasses } from "../models/colyseus-models/pokemon"
import PokemonFactory from "../models/pokemon-factory"
import { getPokemonData } from "../models/precomputed/precomputed-pokemon-data"
import { PRECOMPUTED_POKEMONS_PER_RARITY } from "../models/precomputed/precomputed-rarity"
import type GameState from "../rooms/states/game-state"
import {
  Blessing,
  BlessingTrigger,
  LANGUAGE_BARRIER_UNOWNS_GRANTED,
  SELECTIVE_GENETICS_GOLDEN_EGG_CHANCE,
  MOVE_TUTOR_MAX_PP,
  BABY_OPENER_BABIES_GRANTED,
  BABY_OPENER_MAX_COST,
  SELECTIVE_GENETICS_BABIES_GRANTED,
  SELECTIVE_GENETICS_MAX_COST,
  HERO_BLESSING_GIFT,
  HERO_BLESSING_FAMILY,
  HERO_BLESSING_MOVES_REGION,
  HERO_BLESSING_ADDS_TO_POOL,
  PLUNDER_GOLD_MULTIPLIER
} from "../types/enum/Blessing"
import { BattleResult, Rarity } from "../types/enum/Game"
import {
  FAIRY_WANDS_BY_SYNERGY_LEVEL,
  RegionDetails,
  SynergyTiersThresholds
} from "../config"
import { RarityCost } from "../config/game/shop"
import { PRECOMPUTED_POKEMONS_PER_TYPE } from "../models/precomputed/precomputed-types"
import type { DungeonPMDO } from "../types/enum/Dungeon"
import {
  LAPRAS_TRAVEL_DURATION,
  WandererBehavior,
  WandererType
} from "../types/enum/Wanderer"
import { Transfer } from "../types"
import type GameRoom from "../rooms/game-room"
import { giveRandomEgg } from "../core/eggs"
import { getUnlockedFlowerPots } from "../core/flower-pots"
import { Awakening, AwakeningTypes } from "../types/enum/Awakening"
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
import { Pkm, PkmFamily, Unowns } from "../types/enum/Pokemon"
import { getSellPrice } from "../models/shop"
import { Synergy } from "../types/enum/Synergy"
import {
  BLESSING_SYNERGY_GATED_STAGE,
  SYNERGIES_WITH_BLESSINGS
} from "../config/game/blessings"
import {
  getFirstAvailablePositionInBench,
  getFreeSpaceOnBench
} from "../utils/board"
import { chance, pickNRandomIn, pickRandomIn } from "../utils/random"

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

function grantSynergyAwareItem(player: Player, item: Item) {
  if (SynergyGems.includes(item as (typeof SynergyGems)[number])) {
    const synergy = SynergyGivenByGem[item]
    player.bonusSynergies.set(
      synergy,
      (player.bonusSynergies.get(synergy) ?? 0) + 1
    )
    player.items.push(item)
    player.updateSynergies()
  } else {
    player.items.push(item)
  }
}

const GemBySynergy = Object.entries(SynergyGivenByGem).reduce(
  (acc, [gem, synergy]) => {
    acc[synergy as Synergy] = gem as Item
    return acc
  },
  {} as { [synergy in Synergy]?: Item }
)

function giftUncommonsOfSynergy(
  player: Player,
  synergy: Synergy,
  amount: number
) {
  const candidates = PRECOMPUTED_POKEMONS_PER_RARITY[Rarity.UNCOMMON].filter(
    (pkm: Pkm) => {
      const data = getPokemonData(pkm)
      return data.stars === 1 && data.types.includes(synergy)
    }
  )
  pickNRandomIn(candidates, amount).forEach((pkm) =>
    giftPokemonIfBenchHasRoom(player, pkm)
  )
}

function synergyGemFamilyEffects(
  family: "BADGE" | "CREST",
  pokemonGranted: number
) {
  return Object.fromEntries(
    SYNERGIES_WITH_BLESSINGS.map((synergy) => [
      `${synergy}_${family}_BLESSING`,
      (player: Player) => {
        if (getFreeSpaceOnBench(player.board) < pokemonGranted) return false
        const gem = GemBySynergy[synergy]
        if (gem) grantSynergyAwareItem(player, gem)
        giftUncommonsOfSynergy(player, synergy, pokemonGranted)
        return true
      }
    ])
  )
}

const CrownBlessingContent: {
  [blessing in Blessing]?: { items: Item[]; pokemon: Pkm }
} = {
  [Blessing.NORMAL_CROWN_BLESSING]: {
    items: [Item.FRIEND_BOW, Item.PROTECTIVE_PADS],
    pokemon: Pkm.IGGLYBUFF
  },
  [Blessing.FLYING_CROWN_BLESSING]: {
    items: [Item.AIR_BALLOON, Item.RAZOR_CLAW],
    pokemon: Pkm.QUAXLY
  },
  [Blessing.FIELD_CROWN_BLESSING]: {
    items: [Item.RUNNING_SHOES, Item.MUSCLE_BAND],
    pokemon: Pkm.LITTEN
  },
  [Blessing.DARK_CROWN_BLESSING]: {
    items: [Item.DUSK_STONE, Item.LOADED_DICE],
    pokemon: Pkm.DUSKULL
  },
  [Blessing.GROUND_CROWN_BLESSING]: {
    items: [Item.EXPLORER_KIT, Item.GREEN_ORB],
    pokemon: Pkm.NIDORANM
  },
  [Blessing.PSYCHIC_CROWN_BLESSING]: {
    items: [Item.DAWN_STONE, Item.SOUL_DEW],
    pokemon: Pkm.HATENNA
  },
  [Blessing.GRASS_CROWN_BLESSING]: {
    items: [Item.LEAF_STONE, Item.GREEN_ORB],
    pokemon: Pkm.TREECKO
  },
  [Blessing.BUG_CROWN_BLESSING]: {
    items: [Item.SHED_SHELL, Item.RELIC_CROWN],
    pokemon: Pkm.SEWADDLE
  },
  [Blessing.WATER_CROWN_BLESSING]: {
    items: [Item.WATER_STONE, Item.CHOICE_SPECS],
    pokemon: Pkm.FROAKIE
  },
  [Blessing.AQUATIC_CROWN_BLESSING]: {
    items: [Item.SURFBOARD, Item.STAR_DUST],
    pokemon: Pkm.PIKACHU
  },
  [Blessing.POISON_CROWN_BLESSING]: {
    items: [Item.POKERUS_VIAL, Item.LOADED_DICE],
    pokemon: Pkm.NIDORANF
  },
  [Blessing.FAIRY_CROWN_BLESSING]: {
    items: [Item.MOON_STONE, Item.DESTINY_KNOT],
    pokemon: Pkm.FLABEBE
  },
  [Blessing.FIGHTING_CROWN_BLESSING]: {
    items: [Item.MACHO_BRACE, Item.POKE_DOLL],
    pokemon: Pkm.MACHOP
  },
  [Blessing.FIRE_CROWN_BLESSING]: {
    items: [Item.FIRE_STONE, Item.RED_ORB],
    pokemon: Pkm.LITTEN
  },
  [Blessing.GHOST_CROWN_BLESSING]: {
    items: [Item.SPELL_TAG, Item.SMOKE_BALL],
    pokemon: Pkm.SNORUNT
  },
  [Blessing.ROCK_CROWN_BLESSING]: {
    items: [Item.EVER_STONE, Item.STICKY_BARB],
    pokemon: Pkm.NACLI
  },
  [Blessing.MONSTER_CROWN_BLESSING]: {
    items: [Item.BERSERK_GENE, Item.RELIC_CROWN],
    pokemon: Pkm.TREECKO
  },
  [Blessing.AMORPHOUS_CROWN_BLESSING]: {
    items: [Item.AMORPHOUS_GEM, Item.PUNCHING_GLOVE],
    pokemon: Pkm.GRUBBIN
  },
  [Blessing.WILD_CROWN_BLESSING]: {
    items: [Item.WHITE_FLUTE, Item.FLAME_ORB],
    pokemon: Pkm.AIPOM
  },
  [Blessing.SOUND_CROWN_BLESSING]: {
    items: [Item.METRONOME, Item.DEEP_SEA_TOOTH],
    pokemon: Pkm.IGGLYBUFF
  },
  [Blessing.FLORA_CROWN_BLESSING]: {
    items: [Item.INCENSE, Item.GRACIDEA_FLOWER],
    pokemon: Pkm.FLABEBE
  },
  [Blessing.STEEL_CROWN_BLESSING]: {
    items: [Item.METAL_COAT, Item.RED_ORB],
    pokemon: Pkm.MAGNEMITE
  },
  [Blessing.ELECTRIC_CROWN_BLESSING]: {
    items: [Item.THUNDER_STONE, Item.BLUE_ORB],
    pokemon: Pkm.GRUBBIN
  },
  [Blessing.ICE_CROWN_BLESSING]: {
    items: [Item.ICE_STONE, Item.POWER_LENS],
    pokemon: Pkm.SNORUNT
  },
  [Blessing.HUMAN_CROWN_BLESSING]: {
    items: [Item.HUMAN_GEM, Item.SAFETY_GOGGLES],
    pokemon: Pkm.MACHOP
  },
  [Blessing.DRAGON_CROWN_BLESSING]: {
    items: [Item.DRAGON_SCALE, Item.DEEP_SEA_TOOTH],
    pokemon: Pkm.CHARMANDER
  },
  [Blessing.LIGHT_CROWN_BLESSING]: {
    items: [Item.LIGHT_BALL, Item.STAR_DUST],
    pokemon: Pkm.CHERUBI
  },
  [Blessing.GOURMET_CROWN_BLESSING]: {
    items: [Item.COOKING_POT, Item.SOOTHE_BELL],
    pokemon: Pkm.NACLI
  },
  [Blessing.FOSSIL_CROWN_BLESSING]: {
    items: [Item.OLD_AMBER, Item.CLEAR_AMULET],
    pokemon: Pkm.PILOSWINE
  },
  [Blessing.ARTIFICIAL_CROWN_BLESSING]: {
    items: [Item.ARTIFICIAL_GEM, Item.WIDE_LENS],
    pokemon: Pkm.MAGNEMITE
  }
}

const crownEffects = Object.fromEntries(
  Object.entries(CrownBlessingContent).map(([blessing, content]) => [
    blessing,
    (player: Player) => {
      if (getFreeSpaceOnBench(player.board) < 1) return false
      content.items.forEach((item) => grantSynergyAwareItem(player, item))
      giftPokemonIfBenchHasRoom(player, content.pokemon)
      return true
    }
  ])
)

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

function giftBabiesUnderCost(
  player: Player,
  maxCost: number,
  count: number,
  excludeOwned = false
): boolean {
  if (getFreeSpaceOnBench(player.board) < count) return false
  const owned = new Set(
    [...player.board.values()].map((pokemon) => PkmFamily[pokemon.name])
  )
  const candidates = (PRECOMPUTED_POKEMONS_PER_TYPE[Synergy.BABY] ?? []).filter(
    (pkm) => {
      const data = getPokemonData(pkm)
      return (
        RarityCost[data.rarity] <= maxCost &&
        (excludeOwned === false || owned.has(PkmFamily[pkm]) === false)
      )
    }
  )
  if (candidates.length === 0) return false
  pickNRandomIn(candidates, Math.min(count, candidates.length)).forEach((pkm) =>
    giftPokemonIfBenchHasRoom(player, pkm)
  )
  return true
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

function moveToRegionWherePokemonIsFound(
  player: Player,
  state: GameState,
  room: GameRoom | undefined,
  pkm: Pkm
) {
  const previousMap = player.map
  const regionalMon = new PokemonClasses[pkm](pkm)
  if (
    previousMap !== "town" &&
    regionalMon.isInRegion(previousMap, state)
  ) {
    player.updateRegionalPool(state, true, previousMap)
    return
  }

  const candidateMaps = (Object.keys(RegionDetails) as DungeonPMDO[]).filter(
    (map) => map !== previousMap && regionalMon.isInRegion(map, state)
  )
  if (candidateMaps.length === 0) return

  // same travel sequence as the Lapras Passport item
  const newMap = pickRandomIn(candidateMaps)
  room?.broadcast(Transfer.PRELOAD_MAPS, [newMap])
  player.spawnWanderingPokemon({
    pkm: Pkm.LAPRAS,
    type: WandererType.DIALOG,
    behavior: WandererBehavior.SPECTATE,
    data: newMap
  })
  setTimeout(() => {
    player.map = newMap
    player.regions.push(newMap)
    player.updateRegionalPool(state, true, previousMap)
  }, LAPRAS_TRAVEL_DURATION)
}

function refundPlunderedGold(player: Player) {
  const spent = player.plunderGoldSpentThisFight ?? 0
  player.plunderGoldSpentThisFight = 0
  if (spent > 0 && player.history.at(-1)?.result === BattleResult.WIN) {
    player.addMoney(spent * PLUNDER_GOLD_MULTIPLIER, true, null)
  }
}

function heroBlessingEffect(
  blessing: Blessing,
  player: Player,
  state: GameState,
  room?: GameRoom
): boolean {
  const gift = HERO_BLESSING_GIFT[blessing]
  if (gift && giftPokemonIfBenchHasRoom(player, gift) === false) return false
  const family = HERO_BLESSING_FAMILY[blessing]
  if (!family) return true

  /* seeding the pool first matters: isInRegion refuses an additional-only mon
     until it is actually in the pool, so the region move would find no map */
  if (HERO_BLESSING_ADDS_TO_POOL.includes(blessing)) {
    state.shop.addAdditionalPokemon(family, state)
  }
  if (HERO_BLESSING_MOVES_REGION.includes(blessing)) {
    moveToRegionWherePokemonIsFound(player, state, room, family)
  }
  return true
}

const QUEST_REROLL_TARGET = 50
const QUEST_GROW_TARGET_HP = 1300
const QUEST_SHINE_LIGHT_TARGET = 7
const QUEST_EPIC_UNIQUE_TARGET = 7
const QUEST_EXPAND_TARGET = 8
const QUEST_EXPAND_MIN_SELL_PRICE = 5
const SHARD_DAMAGE_PER_GRANT = 15
const QUEST_REROLL_FREE_ROLLS = 10
const QUEST_EPIC_EXPERIENCE = 6
const QUEST_EXPAND_EXPERIENCE = 10
const QUEST_ASCEND_POKEMONS = 3

const blessingQuestConditions: {
  [blessing in Blessing]?: (player: Player) => boolean
} = {
  [Blessing.QUEST_REROLL]: (player) =>
    player.gameStats.rerollCount >= QUEST_REROLL_TARGET,

  [Blessing.QUEST_GROW]: (player) =>
    player.gameStats.maxHP >= QUEST_GROW_TARGET_HP,

  [Blessing.QUEST_SHINE]: (player) =>
    (player.synergies.get(Synergy.LIGHT) ?? 0) >= QUEST_SHINE_LIGHT_TARGET,

  [Blessing.QUEST_EPIC]: (player) => {
    const fielded = new Set<Pkm>()
    player.board.forEach((pokemon) => {
      if (
        pokemon.positionY > 0 &&
        (pokemon.rarity === Rarity.EPIC || pokemon.rarity === Rarity.ULTRA)
      ) {
        fielded.add(PkmFamily[pokemon.name] ?? pokemon.name)
      }
    })
    return fielded.size >= QUEST_EPIC_UNIQUE_TARGET
  },

  [Blessing.QUEST_EXPAND]: (player) => {
    let valuableFielded = 0
    player.board.forEach((pokemon) => {
      if (
        pokemon.positionY > 0 &&
        getSellPrice(pokemon, player.specialGameRule) >=
          QUEST_EXPAND_MIN_SELL_PRICE
      ) {
        valuableFielded++
      }
    })
    return valuableFielded >= QUEST_EXPAND_TARGET
  },

  [Blessing.QUEST_ASCEND]: (player) => {
    let ascended = false
    player.board.forEach((pokemon) => {
      if (
        pokemon.stars >= 3 &&
        [Rarity.UNCOMMON, Rarity.RARE, Rarity.EPIC, Rarity.ULTRA].includes(
          pokemon.rarity
        )
      ) {
        ascended = true
      }
    })
    return ascended
  }
}

const blessingQuestRewards: { [blessing in Blessing]?: Item } = {
  [Blessing.QUEST_REROLL]: Item.REPEAT_BALL,
  [Blessing.QUEST_GROW]: Item.DYNAMAX_BAND,
  [Blessing.QUEST_SHINE]: Item.SHINY_STONE,
  [Blessing.QUEST_EPIC]: Item.EVIOLITE,
  [Blessing.QUEST_EXPAND]: Item.GOLD_BOW,
  [Blessing.QUEST_ASCEND]: Item.STAR_PIECE
}

const blessingShardRewards: { [blessing in Blessing]?: Item } = {
  [Blessing.CHARGING_UP]: Item.CELL_BATTERY,
  [Blessing.BURNING_SHARDS]: Item.FIRE_SHARD
}

export function checkBlessingQuests(player: Player, state: GameState) {
  const owned = state.blessingsByPlayerId.get(player.id)
  if (!owned) return

  owned.blessings.forEach((blessing) => {
    const condition = blessingQuestConditions[blessing]
    if (
      condition &&
      !player.blessingQuestsCompleted.has(blessing) &&
      condition(player)
    ) {
      player.blessingQuestsCompleted.add(blessing)
      const reward = blessingQuestRewards[blessing]
      if (reward) player.items.push(reward)
    }

    const shardReward = blessingShardRewards[blessing]
    if (shardReward) {
      const earned = Math.floor(
        player.gameStats.totalPlayerDamageDealt / SHARD_DAMAGE_PER_GRANT
      )
      const alreadyGranted =
        player.blessingQuestThresholdsReached.get(blessing) ?? 0
      if (earned > alreadyGranted) {
        for (let i = alreadyGranted; i < earned; i++) {
          player.items.push(shardReward)
        }
        player.blessingQuestThresholdsReached.set(blessing, earned)
      }
    }
  })
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
  },

  [Blessing.PLUNDER]: {
    [BlessingTrigger.PVE_END]: (player) => refundPlunderedGold(player),
    [BlessingTrigger.PVP_END]: (player) => refundPlunderedGold(player)
  },

  [Blessing.GARDENING]: {
    [BlessingTrigger.PVP_END]: (player) => {
      if (player.history.at(-1)?.result !== BattleResult.DEFEAT) return
      const floraCount = player.synergies.get(Synergy.FLORA) ?? 0
      const mulchGained = [...SynergyTiersThresholds[Synergy.FLORA]]
        .reverse()
        .find((threshold) => floraCount >= threshold)
      if (mulchGained) player.collectMulch(mulchGained)
    }
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
  [blessing in Blessing]?: (
    player: Player,
    state: GameState,
    room?: GameRoom
  ) => boolean
} = {
  ...synergyGemFamilyEffects("BADGE", 1),
  ...synergyGemFamilyEffects("CREST", 2),
  ...crownEffects,

  [Blessing.QUEST_REROLL]: (player) => {
    player.shopFreeRolls += QUEST_REROLL_FREE_ROLLS
    return true
  },

  [Blessing.QUEST_GROW]: (player) => {
    player.items.push(Item.BERSERK_GENE)
    return true
  },

  [Blessing.QUEST_SHINE]: (player) => {
    player.items.push(Item.LIGHT_BALL)
    return true
  },

  [Blessing.QUEST_EPIC]: (player) => {
    if (!giftPokemonOfRarityAndStars(player, Rarity.EPIC, 1)) return false
    player.addExperience(QUEST_EPIC_EXPERIENCE)
    return true
  },

  [Blessing.QUEST_EXPAND]: (player) => {
    player.addExperience(QUEST_EXPAND_EXPERIENCE)
    return true
  },

  [Blessing.QUEST_ASCEND]: (player) => {
    if (getFreeSpaceOnBench(player.board) < QUEST_ASCEND_POKEMONS) return false
    for (let i = 0; i < QUEST_ASCEND_POKEMONS; i++) {
      giftPokemonOfRarityAndStars(player, Rarity.RARE, 1)
    }
    return true
  },

  [Blessing.CHARGING_UP]: (player) => {
    player.items.push(Item.CELL_BATTERY)
    return true
  },

  [Blessing.BURNING_SHARDS]: (player) => {
    player.items.push(Item.FIRE_SHARD)
    return true
  },

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

  [Blessing.CURSE_OF_TWO]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.SNORUNT),

  [Blessing.ARCANE_METALS]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.MAGNEMITE),

  [Blessing.GARDENING]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.GOSSIFLEUR),

  [Blessing.DOUBLE_WINDFALL]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.FLABEBE),

  [Blessing.FLYTRAP]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.GOSSIFLEUR),

  [Blessing.MEGA_SOL]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.GOSSIFLEUR),

  [Blessing.BABY_OPENER]: (player) =>
    giftBabiesUnderCost(player, BABY_OPENER_MAX_COST, BABY_OPENER_BABIES_GRANTED),

  [Blessing.SELECTIVE_GENETICS]: (player) => {
    // at most one of the three babies is swapped for a Golden Egg
    const golden = chance(SELECTIVE_GENETICS_GOLDEN_EGG_CHANCE)
    const babies = SELECTIVE_GENETICS_BABIES_GRANTED - (golden ? 1 : 0)
    if (getFreeSpaceOnBench(player.board) < SELECTIVE_GENETICS_BABIES_GRANTED) {
      return false
    }
    if (golden) giveRandomEgg(player, true)
    return giftBabiesUnderCost(
      player,
      SELECTIVE_GENETICS_MAX_COST,
      babies,
      true
    )
  },

  [Blessing.REPLICATOR]: (player) => {
    player.items.push(Item.DUBIOUS_DISC_BLESSING_ITEM)
    return giftPokemonIfBenchHasRoom(player, Pkm.VAROOM)
  },

  [Blessing.FIND_A_LOST_WAND]: (player) => {
    // only the FAIRY 2 roll, which is the first entry in the wand table
    const offered = player.fairyWandChoicesRolls[0]
    const lostWand = offered
      ? FAIRY_WANDS_BY_SYNERGY_LEVEL[0].find(
          (wand) => offered.includes(wand) === false
        )
      : undefined
    if (lostWand) {
      player.items.push(lostWand)
      player.blessingWands.push(lostWand)
    }
    return giftPokemonIfBenchHasRoom(player, Pkm.HATENNA)
  },

  [Blessing.FAST_FOOD_DELIVERY]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.NACLI),

  [Blessing.CHEFS_GREED]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.NACLI),

  [Blessing.BERRY_BREAKFAST]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.CHESPIN),

  [Blessing.DIGGING_EQUIPMENT]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.NIDORANM),

  [Blessing.CRYSTAL_CLUSTERS]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.SNORUNT),

  [Blessing.CRYSTAL_MUTATION]: (player) => {
    const rockUnique = [...player.board.values()].find(
      (pokemon) =>
        pokemon.types.has(Synergy.ROCK) &&
        pokemon.rarity === Rarity.UNIQUE &&
        pokemon.awakening === Awakening.NONE
    )
    if (!rockUnique) return false
    rockUnique.awakening = pickRandomIn(
      Object.keys(AwakeningTypes) as Awakening[]
    )
    rockUnique.awakeningRock = ""
    rockUnique.awakeningCharge = 0
    player.updateWeatherRocks()
    return true
  },

  [Blessing.ECHO_CHAMBER]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.IGGLYBUFF),

  [Blessing.ZAP]: (player) => giftPokemonIfBenchHasRoom(player, Pkm.GRUBBIN),

  [Blessing.SEEING_TRIPLE]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.GRUBBIN),

  [Blessing.SACRIFICE]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.BAGON),

  [Blessing.DRAGON_KING]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.CHARMANDER),

  [Blessing.ASCENSION]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.CHERUBI),

  [Blessing.SHARE_THE_SPOTLIGHT]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.MAREEP),

  [Blessing.SLIPSTREAM]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.QUAXLY),

  [Blessing.BIG_PECKS]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.QUAXLY),

  [Blessing.SHAPELESS_SYNERGIES]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.TYNAMO),

  [Blessing.LANGUAGE_BARRIER]: (player) => {
    if (getFreeSpaceOnBench(player.board) < LANGUAGE_BARRIER_UNOWNS_GRANTED) {
      return false
    }
    for (let i = 0; i < LANGUAGE_BARRIER_UNOWNS_GRANTED; i++) {
      giftPokemonIfBenchHasRoom(player, pickRandomIn(Unowns))
    }
    return true
  },

  /* MOVE_TUTOR also applies to TMs taught later, in the TM item effect */
  [Blessing.MOVE_TUTOR]: (player) => {
    player.board.forEach((pokemon) => {
      if (pokemon.tm) pokemon.maxPP = MOVE_TUTOR_MAX_PP
    })
    return true
  },

  [Blessing.ABNORMALITY]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.IGGLYBUFF),

  [Blessing.WRAPPED_UP]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.IGGLYBUFF),

  [Blessing.BRACE_FOR_IMPACT]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.MACHOP),

  [Blessing.FROST_BARRIER]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.SNORUNT),

  [Blessing.SECOND_WIND]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.LITTEN),

  [Blessing.RESURGENCE]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.PILOSWINE),

  [Blessing.TIDAL_SURGE]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.FROAKIE),

  [Blessing.HEX_MANIAC]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.SNORUNT),

  [Blessing.ABSOLUTE_DARKNESS]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.IMPIDIMP),

  [Blessing.TOXIC_BURST]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.SPINARAK),

  [Blessing.EXHAUSTING_FLAME]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.LITTEN),

  [Blessing.ETERNAL_RAGE]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.AIPOM),

  [Blessing.ATLANTEAN_MAGIC]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.SQUIRTLE),

  [Blessing.STAR_CROSSED_SEAS]: (player, state, room) => {
    const previousMap = player.map
    const isAmorphousRegion =
      previousMap !== "town" &&
      RegionDetails[previousMap]?.synergies.includes(Synergy.AMORPHOUS)

    if (isAmorphousRegion) {
      // already there, just let both Shellos into the pool
      player.updateRegionalPool(state, true, previousMap)
      return true
    }

    const amorphousMaps = (Object.keys(RegionDetails) as DungeonPMDO[]).filter(
      (map) =>
        map !== previousMap &&
        RegionDetails[map].synergies.includes(Synergy.AMORPHOUS)
    )
    if (amorphousMaps.length === 0) return true

    // same travel sequence as the Lapras Passport item
    const newMap = pickRandomIn(amorphousMaps)
    room?.broadcast(Transfer.PRELOAD_MAPS, [newMap])
    player.spawnWanderingPokemon({
      pkm: Pkm.LAPRAS,
      type: WandererType.DIALOG,
      behavior: WandererBehavior.SPECTATE,
      data: newMap
    })
    setTimeout(() => {
      player.map = newMap
      player.regions.push(newMap)
      player.updateRegionalPool(state, true, previousMap)
    }, LAPRAS_TRAVEL_DURATION)
    return true
  },

  [Blessing.FROST_BURST]: (player, state, room) =>
    heroBlessingEffect(Blessing.FROST_BURST, player, state, room),

  [Blessing.AURORA_BOREALIS]: (player, state, room) =>
    heroBlessingEffect(Blessing.AURORA_BOREALIS, player, state, room),

  [Blessing.RADIANCE]: (player, state, room) =>
    heroBlessingEffect(Blessing.RADIANCE, player, state, room),

  [Blessing.PACK_ATTACK]: (player, state, room) =>
    heroBlessingEffect(Blessing.PACK_ATTACK, player, state, room),

  [Blessing.MORTAR_SHELLS]: (player, state, room) =>
    heroBlessingEffect(Blessing.MORTAR_SHELLS, player, state, room),

  [Blessing.ICE_SPEAR]: (player, state, room) =>
    heroBlessingEffect(Blessing.ICE_SPEAR, player, state, room),

  [Blessing.FROST_GEAR]: (player, state, room) =>
    heroBlessingEffect(Blessing.FROST_GEAR, player, state, room),

  [Blessing.SHUTTLE_BUS]: (player, state, room) =>
    heroBlessingEffect(Blessing.SHUTTLE_BUS, player, state, room),

  [Blessing.PLUNDER]: (player, state, room) =>
    heroBlessingEffect(Blessing.PLUNDER, player, state, room),

  [Blessing.EMERALD_ORB]: (player) => {
    player.items.push(Item.GREEN_ORB)
    return true
  },

  [Blessing.SAPPHIRE_ORB]: (player) => {
    player.items.push(Item.BLUE_ORB)
    return true
  },

  [Blessing.RUBY_ORB]: (player) => {
    player.items.push(Item.RED_ORB)
    return true
  },

  [Blessing.LUCKY_DICE_BLESSING]: (player) => {
    player.items.push(Item.LOADED_DICE)
    return true
  },

  [Blessing.OLIVE_GARDEN]: (player, state, room) =>
    heroBlessingEffect(Blessing.OLIVE_GARDEN, player, state, room),

  [Blessing.ORBITAL_STRIKE]: (player, state, room) =>
    heroBlessingEffect(Blessing.ORBITAL_STRIKE, player, state, room),

  [Blessing.ROOSTING_FLOCK]: (player, state, room) =>
    heroBlessingEffect(Blessing.ROOSTING_FLOCK, player, state, room),

  [Blessing.SHELL_ARMOR_BLESSING]: (player, state, room) =>
    heroBlessingEffect(Blessing.SHELL_ARMOR_BLESSING, player, state, room),

  [Blessing.SPORE_CLOUDS]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.FLABEBE),

  [Blessing.AMAZING_GARDENING]: (player) => {
    const fullyEvolvedFlowers = getUnlockedFlowerPots(player).filter(
      (pot) => pot.evolution === Pkm.DEFAULT
    ).length
    for (let i = 0; i < 1 + fullyEvolvedFlowers; i++) {
      player.items.push(Item.AMAZE_MULCH)
    }
    return giftPokemonIfBenchHasRoom(player, Pkm.GOSSIFLEUR)
  },

  [Blessing.NOT_THE_BEES]: (player) => {
    if (getFreeSpaceOnBench(player.board) < 2) return false
    giftPokemonIfBenchHasRoom(player, Pkm.GOSSIFLEUR)
    giftPokemonIfBenchHasRoom(player, Pkm.FLABEBE)
    return true
  },

  [Blessing.RIVALRY]: (player, state) => {
    if (state.stageLevel >= BLESSING_SYNERGY_GATED_STAGE) {
      player.items.push(Item.RELIC_CROWN)
    }
    return true
  },

  [Blessing.SAFARI_ENCOUNTER]: (player, state) => {
    const [topSynergy] = player.synergies.getTopSynergies(1)
    const candidates = (Object.keys(PkmFamily) as Pkm[]).filter((pkm) => {
      const data = getPokemonData(pkm)
      return (
        data.additional &&
        data.stars === 1 &&
        data.types.includes(topSynergy) &&
        state.additionalPokemons.includes(pkm) === false
      )
    })
    if (candidates.length === 0) return false
    const encountered = pickRandomIn(candidates)
    state.shop.addAdditionalPokemon(encountered, state)
    return giftPokemonIfBenchHasRoom(player, encountered)
  },

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
