import {
  BOARD_SIDE_HEIGHT,
  BOARD_WIDTH,
  FAIRY_WANDS_BY_SYNERGY_LEVEL,
  getHighestReachableSynergyTier,
  RegionDetails,
  SynergyTiersThresholds
} from "../config"
import {
  BLESSING_SYNERGY_GATED_STAGE,
  SYNERGIES_WITH_BLESSINGS,
  WATER_FOUNTAIN_REGIONS
} from "../config/game/blessings"
import { getAltFormForPlayer } from "../config/game/pokemons"
import { RarityCost } from "../config/game/shop"
import { rollWaterPonds } from "../config/game/water-ponds"
import { giveRandomEgg } from "../core/eggs"
import { EvolutionManager } from "../core/evolution-logic/evolution-manager"
import { getUnlockedFlowerPots } from "../core/flower-pots"
import type Player from "../models/colyseus-models/player"
import { PlayerBlessings } from "../models/colyseus-models/player-blessings"
import { PlayerChoice } from "../models/colyseus-models/player-choice"
import type { Pokemon } from "../models/colyseus-models/pokemon"
import { PokemonClasses } from "../models/colyseus-models/pokemon"
import { WaterPond } from "../models/colyseus-models/water-pond"
import PokemonFactory from "../models/pokemon-factory"
import {
  getPokemonData,
  getRegularsTier1
} from "../models/precomputed/precomputed-pokemon-data"
import { PRECOMPUTED_POKEMONS_PER_RARITY } from "../models/precomputed/precomputed-rarity"
import { PRECOMPUTED_POKEMONS_PER_TYPE } from "../models/precomputed/precomputed-types"
import { getSellPrice } from "../models/shop"
import type GameRoom from "../rooms/game-room"
import type GameState from "../rooms/states/game-state"
import { Title, Transfer } from "../types"
import { EvolutionRuleType } from "../types/EvolutionRules"
import { Awakening, AwakeningTypes } from "../types/enum/Awakening"
import {
  ADOPTION_FALLBACK,
  ADOPTION_STARTERS,
  ALL_FOR_ONE_MAX_HP_RATIO,
  ARCHEOLOGY_RARITY_WEIGHTS,
  ARCHEOLOGY_TWO_STAR_CHANCE,
  BABY_OPENER_BABIES_GRANTED,
  BABY_OPENER_MAX_COST,
  BEING_OF_KNOWLEDGE_MAX_LEVEL,
  BERRY_GROWTH_GOLDEN_BERRIES_GRANTED,
  BERRY_GROWTH_GOLDEN_BERRIES_STAGE,
  Blessing,
  BlessingTrigger,
  BP_REWARDS_COMPONENTS,
  BP_REWARDS_RECURRING_COMPONENTS,
  BP_REWARDS_ROUND_INTERVAL,
  CALCULATED_LOSS_GOLD,
  CALLED_SHOT_GOLD,
  CALLED_SHOT_STREAK,
  CLIMBING_THE_LADDER_EXP_DISCOUNT,
  CLIMBING_THE_LADDER_MAX_LEVEL,
  CLIMBING_THE_LADDER_MIN_LEVEL,
  FERTILE_SOIL_ABSORB_ROUNDS,
  FLEXIBILITY_COMPONENTS,
  FLEXIBILITY_FOSSIL_STONES,
  HARD_COMMIT_STAGES,
  HERO_BLESSING_ADDS_TO_POOL,
  HERO_BLESSING_FAMILY,
  HERO_BLESSING_GIFT,
  HERO_BLESSING_MOVES_REGION,
  LANCES_ACE_DELAY,
  LANGUAGE_BARRIER_UNOWNS_GRANTED,
  MANIFESTATION_UNLOCK_STAGE,
  MIX_AND_MATCH_I_FIELD_CAP,
  MIX_AND_MATCH_I_UNIQUES,
  MIX_AND_MATCH_II_FIELD_CAP,
  MIX_AND_MATCH_II_UNIQUES,
  MORE_EQUAL_THAN_OTHERS_GOLD,
  MORE_EQUAL_THAN_OTHERS_GOLD_FOR_OTHERS,
  MOVE_TUTOR_MAX_PP,
  PLUNDER_GOLD_MULTIPLIER,
  QUEST_ABSORB_DAMAGE_BLOCKED_TARGET,
  QUEST_CRIT_POWER_TARGET,
  QUEST_EVOLVE_II_TARGET,
  QUEST_INDECISION_SYNERGIES_TARGET,
  QUEST_PILLAGE_GOLD_TARGET,
  QUEST_REVIVE_TARGET,
  QUICK_CLAW_COMPENSATION_STAGE,
  RAINBOW_HOUR_EEVEELUTIONS_TARGET,
  RAINBOW_HOUR_FOSSIL_STONES,
  RAINBOW_HOUR_GOLD_REWARD,
  SELECTIVE_GENETICS_BABIES_GRANTED,
  SELECTIVE_GENETICS_GOLDEN_EGG_CHANCE,
  SELECTIVE_GENETICS_MAX_COST,
  SINGULARITY_I_STAGES,
  SINGULARITY_II_STAGES,
  SINGULARITY_OPTIONS,
  STARTER_CHOICE_EXTRA_ROUNDS,
  STARTER_CHOICE_OPTIONS,
  SYNARCH_GEMS_PER_UNIQUE,
  TRASH_TO_TREASURE_ROUNDS_BY_STAR,
  TRASH_TO_TREASURE_TRASH_GRANTED_MAX,
  TRASH_TO_TREASURE_TRASH_GRANTED_MIN,
  WAITING_GAME_FREE_ROLLS,
  WAITING_GAME_FREE_ROLLS_WITHOUT_REROLLING,
  WOBBUFFETS_GOLD_PRIZE_RECYCLE_TICKETS
} from "../types/enum/Blessing"
import type { DungeonPMDO } from "../types/enum/Dungeon"
import { BattleResult, PokemonActionState, Rarity } from "../types/enum/Game"
import {
  Berries,
  Dishes,
  DishesGoingToInventory,
  GoldenBerries,
  HerbaMysticas,
  Item,
  ItemComponents,
  ItemRecipe,
  Sweets,
  SynergyGems,
  SynergyGivenByGem,
  SynergyStones,
  Tools,
  WeatherRocks
} from "../types/enum/Item"
import {
  Pkm,
  PkmFamily,
  PkmRegionalVariants,
  Unowns
} from "../types/enum/Pokemon"
import { Synergy } from "../types/enum/Synergy"
import {
  LAPRAS_TRAVEL_DURATION,
  WandererBehavior,
  WandererType
} from "../types/enum/Wanderer"
import { isIn } from "../utils/array"
import {
  getFirstAvailablePositionInBench,
  getFirstAvailablePositionOnBoard,
  getFreeSpaceOnBench,
  getLastAvailablePositionInBench,
  isOnBench
} from "../utils/board"
import { healPlayerLife } from "../utils/player-life"
import {
  chance,
  pickNRandomIn,
  pickRandomIn,
  randomBetween,
  randomWeighted
} from "../utils/random"
import { schemaValues } from "../utils/schemas"

const PEARL_GOLD_GAINED = 10
const CROAGUNKS_AID_EXCHANGE_TICKETS = 3
const BAG_OF_SWEETS_AMOUNT = 10
const BANANA_BUSINESS_NANAB_BERRIES = 3
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

function giftRandomItems(
  player: Player,
  amount: number,
  pool: Item[]
): boolean {
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
    getAltFormForPlayer(pickRandomIn(candidates), player),
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
    if (stage > state.stageLevel) {
      player.scheduledBlessingGrants.push({ stage, blessing, value })
      return
    }
    const granted = blessingScheduledEffectService[blessing]?.(
      player,
      state,
      value
    )
    if (granted === false) {
      player.scheduledBlessingGrants.push({
        stage: state.stageLevel + 1,
        blessing,
        value
      })
    }
  })
}

function nextStages(state: GameState, count: number): number[] {
  return Array.from(
    { length: count },
    (_, index) => state.stageLevel + index + 1
  )
}

export function applyScheduledBlessingGrants(player: Player, state: GameState) {
  const dueGrants = player.scheduledBlessingGrants.filter(
    (grant) => grant.stage <= state.stageLevel
  )
  player.scheduledBlessingGrants = player.scheduledBlessingGrants.filter(
    (grant) => grant.stage > state.stageLevel
  )
  dueGrants.forEach((grant) => {
    const granted = blessingScheduledEffectService[grant.blessing]?.(
      player,
      state,
      grant.value
    )
    /* a gift that could not land on a full bench is owed, not forfeited: every
       scheduled blessing promises its reward outright */
    if (granted === false) {
      player.scheduledBlessingGrants.push({
        ...grant,
        stage: state.stageLevel + 1
      })
    }
  })
}

export function grantSynergyAwareItem(player: Player, item: Item) {
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

export const GemBySynergy = Object.entries(SynergyGivenByGem).reduce(
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
    pokemon: Pkm.FROAKIE
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
    pokemon: Pkm.GRUBBIN
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
    pokemon: Pkm.MARILL
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
    pokemon: Pkm.SLIGOO
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
    pokemon: Pkm.CHERRIM
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
const SUPPORTIVE_SOUL_ITEM_STAGES = [8, 16]
const SUPPORTIVE_SOUL_ITEMS = [
  Item.GRACIDEA_FLOWER,
  Item.ABILITY_SHIELD,
  Item.EFFICIENT_BANDANNA,
  Item.GREEN_ORB
]

function grantSupportiveSoulItem(player: Player) {
  const companion = schemaValues(player.board).find(
    (pokemon) => pokemon.supportiveSoul
  )
  if (!companion || companion.items.size >= 3) return
  const availableItems = SUPPORTIVE_SOUL_ITEMS.filter(
    (item) => !companion.items.has(item)
  )
  if (availableItems.length === 0) return
  companion.items.add(pickRandomIn(availableItems))
}

function updateSupportiveSoulRoundsLeft(player: Player, state: GameState) {
  const companion = schemaValues(player.board).find(
    (pokemon) => pokemon.supportiveSoul
  )
  const nextItemStage = player.scheduledBlessingGrants
    .filter((grant) => grant.blessing === Blessing.SUPPORTIVE_SOUL)
    .map((grant) => grant.stage)
    .sort((a, b) => a - b)[0]
  if (!companion || companion.items.size >= 3 || nextItemStage === undefined) {
    player.blessingsRef?.questProgress.delete(Blessing.SUPPORTIVE_SOUL)
    return
  }
  player.blessingsRef?.questProgress.set(
    Blessing.SUPPORTIVE_SOUL,
    Math.max(0, nextItemStage - state.stageLevel)
  )
}

function recycleTrashToTreasure(player: Player) {
  schemaValues(player.board)
    .filter((pokemon) => PkmFamily[pokemon.name] === Pkm.BELDUM)
    .forEach((pokemon) => {
      if (!pokemon.items.has(Item.TRASH)) {
        pokemon.trashToTreasureRounds = 0
        return
      }
      pokemon.trashToTreasureRounds += 1
      const roundsRequired =
        TRASH_TO_TREASURE_ROUNDS_BY_STAR[Math.min(pokemon.stars, 3) - 1] ?? 1
      if (pokemon.trashToTreasureRounds < roundsRequired) return
      pokemon.removeItem(Item.TRASH, player)
      pokemon.addItem(pickRandomIn(Tools), player)
      pokemon.trashToTreasureRounds = 0
    })
}

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

function grantSongReinforcement(player: Player, blessing: Blessing): boolean {
  const song = SongBlessingContent[blessing]
  if (!song) return true
  return giftPokemonIfBenchHasRoom(player, song.reinforcement)
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

export function isWaterFountainRegion(map: DungeonPMDO | "town"): boolean {
  return map !== "town" && WATER_FOUNTAIN_REGIONS.includes(map)
}

/* the ponds need a region whose water tiles look like water, so picking the
   blessing travels there first, and getWaterFountainPortalMap keeps every later
   region change inside the list. The ponds are rolled on arrival, otherwise they
   would show up in the region being left behind for the length of the travel */
export function applyWaterFountain(
  player: Player,
  state: GameState,
  room: GameRoom | undefined
) {
  const previousMap = player.map
  if (isWaterFountainRegion(previousMap)) {
    rollWaterFountainPonds(player)
    return
  }

  const newMap = pickRandomIn(
    WATER_FOUNTAIN_REGIONS.filter((map) => map !== previousMap)
  )
  // same travel sequence as the Lapras Passport item
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
    grantRegionalTreasuresOnRegionChange(player)
    rollWaterFountainPonds(player)
  }, LAPRAS_TRAVEL_DURATION)
}

/* A WATER_FOUNTAIN player can only travel to regions where ponds render, so the
   portal they took is swapped for an eligible one among those offered. Only the
   offered maps are preloaded by the client, so when none of them is eligible the
   player stays where they are rather than landing on a map with no tileset */
export function getWaterFountainPortalMap(
  player: Player,
  portalMap: DungeonPMDO,
  offeredMaps: DungeonPMDO[]
): DungeonPMDO | null {
  if (
    player.blessings?.includes(Blessing.WATER_FOUNTAIN) !== true ||
    isWaterFountainRegion(portalMap)
  ) {
    return portalMap
  }
  const eligible = offeredMaps.filter(
    (map) => isWaterFountainRegion(map) && map !== player.map
  )
  return eligible.length > 0 ? pickRandomIn(eligible) : null
}

/* a non ground pokemon standing on a fully dug hole for long enough absorbs the
   soil, turning it into a Ground type with the matching awakening */
export function absorbFertileSoil(player: Player) {
  if (player.blessings?.includes(Blessing.FERTILE_SOIL) !== true) return
  schemaValues(player.board).forEach((pokemon) => {
    const holeIndex = (pokemon.positionY - 1) * BOARD_WIDTH + pokemon.positionX
    const isRooted =
      isOnBench(pokemon) === false &&
      player.groundHoles[holeIndex] === 5 &&
      pokemon.types.has(Synergy.GROUND) === false
    if (!isRooted) {
      player.fertileSoilRounds.delete(pokemon.id)
      return
    }
    const rounds = (player.fertileSoilRounds.get(pokemon.id) ?? 0) + 1
    player.fertileSoilRounds.set(pokemon.id, rounds)
    if (rounds >= FERTILE_SOIL_ABSORB_ROUNDS) {
      pokemon.types.add(Synergy.GROUND)
      pokemon.awakening = Awakening.SMOOTH_ROCK
      player.fertileSoilRounds.delete(pokemon.id)
      player.updateSynergies()
    }
  })
}

/* Babies in a fixed cheapest first order, so the adoption queue is the same
   every game and cannot be skipped ahead by buying one yourself */
export function getAdoptionOrder(): Pkm[] {
  return (PRECOMPUTED_POKEMONS_PER_TYPE[Synergy.BABY] ?? [])
    .filter((pkm) => getPokemonData(pkm).stars === 1)
    .sort((a, b) => {
      const costDifference =
        RarityCost[getPokemonData(a).rarity] -
        RarityCost[getPokemonData(b).rarity]
      return costDifference !== 0 ? costDifference : a.localeCompare(b)
    })
}

/* aggregates like SWEETS are placeholders resolved at cook time, inventory
   dishes are never eaten, and herba mysticas pick a flavour per eater */
const FESTIVE_PICNIC_DISHES = Dishes.filter(
  (dish) =>
    dish !== Item.SWEETS &&
    dish !== Item.MUSHROOMS &&
    dish !== Item.BERRIES &&
    isIn(DishesGoingToInventory, dish) === false &&
    isIn(HerbaMysticas, dish) === false
)

export function serveFestivePicnicDishes(player: Player) {
  if (player.blessings?.includes(Blessing.FESTIVE_PICNIC) !== true) return
  player.board.forEach((pokemon) => {
    if (pokemon.dishes.size > 0 || !pokemon.canEat) return
    const dish = pickRandomIn(FESTIVE_PICNIC_DISHES)
    pokemon.dishes.add(dish)
    pokemon.festivePicnicDish = dish
  })
}

export function grantAdoptionBaby(player: Player) {
  if (player.blessings?.includes(Blessing.ADOPTION) !== true) return
  const next = getAdoptionOrder().find(
    (pkm) => player.adoptedBabies.includes(pkm) === false
  )
  const baby = next ?? ADOPTION_FALLBACK
  if (giftPokemonIfBenchHasRoom(player, baby) && next) {
    player.adoptedBabies.push(next)
  }
}

/* megas are earned by stacking their base form, so digging one up would hand
   over the payoff for free. Carbink, Diancie and Aerodactyl stay diggable */
const ARCHEOLOGY_EXCLUDED_FOSSILS: Pkm[] = [
  Pkm.MEGA_AERODACTYL,
  Pkm.MEGA_DIANCIE
]

function pickArcheologyFossil(rarity: Rarity, stars?: number): Pkm | null {
  const candidates = (
    PRECOMPUTED_POKEMONS_PER_TYPE[Synergy.FOSSIL] ?? []
  ).filter((pkm) => {
    if (ARCHEOLOGY_EXCLUDED_FOSSILS.includes(pkm)) return false
    const data = getPokemonData(pkm)
    return (
      data.rarity === rarity && (stars === undefined || data.stars === stars)
    )
  })
  return candidates.length > 0 ? pickRandomIn(candidates) : null
}

/* digging out a hole unearths a fossil, a whole row a fossil unique, and the
   whole board a fossil legendary. Each row and the board only ever pay once */
export function grantArcheologyRewards(player: Player, index: number) {
  if (player.blessings?.includes(Blessing.ARCHEOLOGY) !== true) return

  const rarity = randomWeighted<Rarity>(ARCHEOLOGY_RARITY_WEIGHTS)
  if (rarity) {
    const stars = chance(ARCHEOLOGY_TWO_STAR_CHANCE) ? 2 : 1
    const fossil =
      pickArcheologyFossil(rarity, stars) ?? pickArcheologyFossil(rarity, 1)
    if (fossil) giftPokemonIfBenchHasRoom(player, fossil)
  }

  const row = Math.floor(index / BOARD_WIDTH)
  const rowStart = row * BOARD_WIDTH
  const isRowDug = player.groundHoles
    .slice(rowStart, rowStart + BOARD_WIDTH)
    .every((hole) => hole === 5)
  if (isRowDug && player.archeologyRowsRewarded.includes(row) === false) {
    player.archeologyRowsRewarded.push(row)
    const unique = pickArcheologyFossil(Rarity.UNIQUE)
    if (unique) giftPokemonIfBenchHasRoom(player, unique)
  }

  const isBoardDug = player.groundHoles
    .slice(0, BOARD_WIDTH * (BOARD_SIDE_HEIGHT - 1))
    .every((hole) => hole === 5)
  if (isBoardDug && player.archeologyBoardRewarded === false) {
    player.archeologyBoardRewarded = true
    const legendary = pickArcheologyFossil(Rarity.LEGENDARY)
    if (legendary) giftPokemonIfBenchHasRoom(player, legendary)
  }
}

export function rollWaterFountainPonds(player: Player) {
  const ponds = player.blessingsRef?.waterPonds
  if (!ponds) return
  ponds.clear()
  rollWaterPonds().forEach(({ pondType, cells }) => {
    ponds.push(new WaterPond(pondType, cells))
  })
}

function giftPokemonIfBenchHasRoom(player: Player, pkm: Pkm): boolean {
  const freeCellX = getFirstAvailablePositionInBench(player.board)
  if (freeCellX === null) return false
  const pokemon = PokemonFactory.createPokemonFromName(
    getAltFormForPlayer(pkm, player),
    player
  )
  pokemon.positionX = freeCellX
  pokemon.positionY = 0
  player.board.set(pokemon.id, pokemon)
  pokemon.onAcquired(player)
  /* gifted copies have to merge like bought ones, or a blessing handing out
     repeats of the same line leaves three 1-stars sitting on the bench */
  player.board.forEach((boardPokemon) => {
    if (
      boardPokemon.hasEvolution &&
      boardPokemon.evolutionRule.type === EvolutionRuleType.COUNT &&
      boardPokemon.action !== PokemonActionState.EXPLORING
    ) {
      EvolutionManager.tryEvolve(boardPokemon, player)
    }
  })
  return true
}

function grantPanicButtonUnown(player: Player): boolean {
  const freeCellX = getFirstAvailablePositionInBench(player.board)
  if (freeCellX === null) return false
  const unown = PokemonFactory.createPokemonFromName(Pkm.UNOWN_Q, player)
  unown.maxPP = 10
  unown.baseMaxPP = 10
  unown.positionX = freeCellX
  unown.positionY = 0
  player.board.set(unown.id, unown)
  unown.onAcquired(player)
  return true
}

const RAINBOW_KEY_NEXT_RARITY: Partial<Record<Rarity, Rarity>> = {
  [Rarity.COMMON]: Rarity.UNCOMMON,
  [Rarity.UNCOMMON]: Rarity.RARE,
  [Rarity.RARE]: Rarity.EPIC,
  [Rarity.EPIC]: Rarity.ULTRA
}

function createPokemonWithStars(pkm: Pkm, stars: number, player: Player) {
  let pokemon = PokemonFactory.createPokemonFromName(
    getAltFormForPlayer(pkm, player),
    player
  )
  while (pokemon.stars < stars && pokemon.hasEvolution) {
    const evolution = EvolutionManager.getEvolution(pokemon, player)
    if (evolution === pokemon.name) break
    pokemon = PokemonFactory.createPokemonFromName(evolution, player)
  }
  return pokemon
}

function applyAllForOne(
  player: Player,
  state: GameState,
  room?: GameRoom
): boolean {
  const sacrificed = schemaValues(player.board).filter(
    // a locked manifestation is not the player's to spend yet
    (pokemon) =>
      pokemon.rarity !== Rarity.UNIQUE && pokemon.manifestationLocked === false
  )
  if (sacrificed.length === 0) return false
  const maxHP = Math.round(
    sacrificed.reduce((total, pokemon) => total + pokemon.maxHP, 0) *
      ALL_FOR_ONE_MAX_HP_RATIO
  )
  const fieldPosition = sacrificed.find((pokemon) => pokemon.positionY > 0)
  sacrificed.forEach((pokemon) => {
    player.board.delete(pokemon.id)
    state.shop.releasePokemon(pokemon.name, player, state)
    pokemon.items.forEach((item) => player.items.push(item))
  })
  const substitute = PokemonFactory.createPokemonFromName(
    Pkm.SUBSTITUTE,
    player
  )
  substitute.hp = maxHP
  substitute.maxHP = maxHP
  substitute.positionX =
    fieldPosition?.positionX ??
    getFirstAvailablePositionInBench(player.board) ??
    0
  substitute.positionY = fieldPosition?.positionY ?? 0
  player.board.set(substitute.id, substitute)
  substitute.onAcquired(player)
  player.updateSynergies()
  if (room) player.boardSize = room.getTeamSize(player.board, player.blessings)
  return true
}

function applyRainbowKey(
  player: Player,
  state: GameState,
  room?: GameRoom
): boolean {
  const transformations = schemaValues(player.board).flatMap((pokemon) => {
    if (
      pokemon.rarity === Rarity.UNIQUE ||
      pokemon.rarity === Rarity.HATCH ||
      pokemon.action === PokemonActionState.EXPLORING ||
      // transforming it would hand back an unlocked unit before stage 20
      pokemon.manifestationLocked
    )
      return []
    const nextRarity = RAINBOW_KEY_NEXT_RARITY[pokemon.rarity]
    if (!nextRarity) return []
    const rarityPool = PRECOMPUTED_POKEMONS_PER_RARITY[nextRarity]
    const candidates = getRegularsTier1(rarityPool).filter(
      (pkm) =>
        rarityPool.some(
          (evolution) =>
            PkmFamily[evolution] === PkmFamily[pkm] &&
            getPokemonData(evolution).stars === pokemon.stars
        ) && player.canFindRegionalPokemon(pkm)
    )
    if (candidates.length === 0) return []
    return [{ pokemon, replacement: pickRandomIn(candidates) }]
  })
  if (transformations.length === 0) return false
  const expectedPokemonIds = new Set(
    schemaValues(player.board)
      .filter(
        (pokemon) =>
          transformations.some(
            (transformation) => transformation.pokemon.id === pokemon.id
          ) === false
      )
      .map((pokemon) => pokemon.id)
  )
  const transformedPokemons: Pokemon[] = []
  transformations.forEach(({ pokemon, replacement }) => {
    const transformed = createPokemonWithStars(
      replacement,
      pokemon.stars,
      player
    )
    transformed.positionX = pokemon.positionX
    transformed.positionY = pokemon.positionY
    transformed.shiny = pokemon.shiny
    transformed.emotion = pokemon.emotion
    pokemon.items.forEach((item) => transformed.items.add(item))
    player.board.delete(pokemon.id)
    state.shop.releasePokemon(pokemon.name, player, state)
    player.board.set(transformed.id, transformed)
    expectedPokemonIds.add(transformed.id)
    transformedPokemons.push(transformed)
  })
  transformedPokemons.forEach((pokemon) => pokemon.onAcquired(player))
  player.board.forEach((pokemon) => {
    if (!expectedPokemonIds.has(pokemon.id)) player.board.delete(pokemon.id)
  })
  player.updateSynergies()
  if (room) {
    room.checkEvolutionsAfterPokemonAcquired(player.id)
  } else {
    player.board.forEach((pokemon) => {
      if (
        pokemon.hasEvolution &&
        pokemon.evolutionRule.type === EvolutionRuleType.COUNT &&
        pokemon.action !== PokemonActionState.EXPLORING
      ) {
        EvolutionManager.tryEvolve(pokemon, player)
      }
    })
  }
  return true
}

/* the five Gold quest blessings only hand out an existing Mission Order; the
   mission's own completion logic already pays it out */
function grantMissionOrderQuest(player: Player, missionOrder: Item): boolean {
  player.items.push(missionOrder)
  const commons = PRECOMPUTED_POKEMONS_PER_RARITY.COMMON.filter(
    (pkm) =>
      getPokemonData(pkm).stars === 2 && player.canFindRegionalPokemon(pkm)
  )
  if (commons.length > 0) {
    giftPokemonIfBenchHasRoom(player, pickRandomIn(commons))
  }
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
  if (previousMap !== "town" && regionalMon.isInRegion(previousMap, state)) {
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
    grantRegionalTreasuresOnRegionChange(player)
  }, LAPRAS_TRAVEL_DURATION)
}

function grantSinnohsCoolest(
  player: Player,
  state: GameState,
  room?: GameRoom
): boolean {
  if (!giftPokemonIfBenchHasRoom(player, Pkm.STARAVIA)) return false
  moveToRegionWherePokemonIsFound(player, state, room, Pkm.STARLY)
  const hasStaraptor = schemaValues(player.board).some(
    (pokemon) => PkmFamily[pokemon.name] === Pkm.STARLY && pokemon.stars >= 3
  )
  if (hasStaraptor && !player.sinnohsCoolestRewardGranted) {
    player.items.push(Item.SAFETY_GOGGLES)
    player.sinnohsCoolestRewardGranted = true
  }
  return true
}

export const MANIFESTATION_AP_POKEMONS = [
  Pkm.DUOSION,
  Pkm.THWACKEY,
  Pkm.DRIZZILE
]
export const MANIFESTATION_AD_POKEMONS = [
  Pkm.PORYGON_2,
  Pkm.FLETCHINDER,
  Pkm.BISHARP
]

export function grantRainbowHourEevee(player: Player, craftedItem: Item) {
  if (
    !player.blessings?.includes(Blessing.RAINBOW_HOUR) ||
    !isIn(SynergyStones, craftedItem)
  )
    return
  giftPokemonIfBenchHasRoom(player, Pkm.EEVEE)
}

/* the bounty is checked whenever the board changes, and pays out once */
export function checkRainbowHourReward(player: Player) {
  if (
    player.rainbowHourRewarded ||
    !player.blessings?.includes(Blessing.RAINBOW_HOUR)
  )
    return
  const fieldedEeveelutions = new Set(
    schemaValues(player.board)
      .filter(
        (pokemon) =>
          pokemon.positionY !== 0 && PkmFamily[pokemon.name] === Pkm.EEVEE
      )
      .map((pokemon) => pokemon.name)
  )
  if (fieldedEeveelutions.size >= RAINBOW_HOUR_EEVEELUTIONS_TARGET) {
    player.rainbowHourRewarded = true
    player.addMoney(RAINBOW_HOUR_GOLD_REWARD, true, null)
    player.titles.add(Title.PRIDE)
  }
}

export function isPokemonManifestationLocked(
  player: Player,
  pokemonId: string
): boolean {
  return player.manifestedPokemonIds.includes(pokemonId)
}

export function getUniqueFieldCap(player: Player): number | null {
  if (player.blessings?.includes(Blessing.MIX_AND_MATCH_II))
    return MIX_AND_MATCH_II_FIELD_CAP
  if (player.blessings?.includes(Blessing.MIX_AND_MATCH_I))
    return MIX_AND_MATCH_I_FIELD_CAP
  return null
}

export function isUniqueFieldCapReached(
  player: Player,
  pokemonBeingPlaced: Pokemon,
  pokemonLeavingBoard?: Pokemon
): boolean {
  const cap = getUniqueFieldCap(player)
  if (cap === null || pokemonBeingPlaced.rarity !== Rarity.UNIQUE) return false
  /* a swap frees the slot the other unit is vacating, so a one-for-one unique
     trade stays legal even while sitting exactly on the cap */
  const fieldedUniques = schemaValues(player.board).filter(
    (pokemon) =>
      pokemon.positionY !== 0 &&
      pokemon.rarity === Rarity.UNIQUE &&
      pokemon.id !== pokemonBeingPlaced.id &&
      pokemon.id !== pokemonLeavingBoard?.id
  ).length
  return fieldedUniques >= cap
}

function regionSynergies(player: Player): Synergy[] {
  return player.map === "town"
    ? []
    : (RegionDetails[player.map]?.synergies ?? [])
}

/* called from every place that moves a player to a new region */
export function grantRegionalTreasuresOnRegionChange(player: Player) {
  if (player.blessings?.includes(Blessing.REGIONAL_TREASURES)) {
    grantRegionalGem(player)
  }
  if (player.blessings?.includes(Blessing.REGIONAL_TREASURES_II)) {
    grantRegionalTreasures2(player)
  }
}

/* STARTER_CHOICE copies are minted fresh rather than drawn from the pool, so
   nine of them never starve the lobby of that common line */
// false only when a copy is still owed but could not land on a full bench
export function giftStarterChoiceCopy(player: Player): boolean {
  if (!player.starterChoicePokemon) return true
  return giftPokemonIfBenchHasRoom(player, player.starterChoicePokemon)
}

/* called at every round start for the recurring halves of chunk E */
export function applyRecurringBlessingGrants(player: Player, state: GameState) {
  if (player.starterChoiceRoundsLeft > 0 && giftStarterChoiceCopy(player)) {
    player.starterChoiceRoundsLeft -= 1
  }

  const singularityStages = player.blessings?.includes(Blessing.SINGULARITY_II)
    ? SINGULARITY_II_STAGES
    : player.blessings?.includes(Blessing.SINGULARITY_I)
      ? SINGULARITY_I_STAGES
      : null
  if (
    singularityStages?.includes(state.stageLevel) &&
    player.singularityComponent
  ) {
    player.items.push(player.singularityComponent)
  }

  if (
    player.blessings?.includes(Blessing.BP_REWARDS) &&
    state.stageLevel >= player.bpRewardsNextStage
  ) {
    player.items.push(
      ...pickNRandomIn(ItemComponents, BP_REWARDS_RECURRING_COMPONENTS)
    )
    player.bpRewardsNextStage += BP_REWARDS_ROUND_INTERVAL
  }
  if (player.blessings?.includes(Blessing.BP_REWARDS)) {
    player.blessingsRef?.questProgress.set(
      Blessing.BP_REWARDS,
      Math.max(0, player.bpRewardsNextStage - state.stageLevel)
    )
  }
  if (player.blessings?.includes(Blessing.SUPPORTIVE_SOUL)) {
    updateSupportiveSoulRoundsLeft(player, state)
  }
  if (player.blessings?.includes(Blessing.TRASH_TO_TREASURE)) {
    recycleTrashToTreasure(player)
  }
}

export function grantSweetTreat(player: Player) {
  // A treat left in inventory for one full round becomes Leftovers before the
  // next round's fresh treat is granted. Consumed treats are simply absent.
  if (player.sweetTreat) {
    const staleTreatIndex = player.items.indexOf(player.sweetTreat)
    if (staleTreatIndex >= 0) {
      // ArraySchema does not reliably synchronize an in-place splice
      // replacement to clients. Remove and add as two tracked mutations.
      player.items.splice(staleTreatIndex, 1)
      player.items.push(Item.LEFTOVERS)
    }
  }
  player.sweetTreat = pickRandomIn([Item.CASTELIACONE, Item.WHIPPED_DREAM])
  player.items.push(player.sweetTreat)
}

/* TREASURE_TRAIL: point at an undug tile that still holds something, or clear
   the marker once the board has nothing left to find */
export function revealNextBuriedTreasure(
  player: Player,
  state: GameState,
  // the on-pick call runs before the blessing is registered on the player
  skipBlessingCheck = false
) {
  const owned = state.blessingsByPlayerId.get(player.id)
  if (!owned) return
  if (
    !skipBlessingCheck &&
    !player.blessings?.includes(Blessing.TREASURE_TRAIL)
  )
    return
  if (
    owned.treasureTrailHighlight >= 0 &&
    player.buriedItems[owned.treasureTrailHighlight] != null &&
    player.groundHoles[owned.treasureTrailHighlight] < 5
  ) {
    return // the current marker is still pointing at something
  }
  const candidates = player.buriedItems
    .map((item, index) => ({ item, index }))
    .filter(({ item, index }) => item != null && player.groundHoles[index] < 5)
    .map(({ index }) => index)
  owned.treasureTrailHighlight =
    candidates.length > 0 ? pickRandomIn(candidates) : -1
}

export function grantRegionalGem(player: Player) {
  const gems = regionSynergies(player)
    .map((synergy) => GemBySynergy[synergy])
    .filter((gem): gem is Item => gem != null)
  if (gems.length > 0) grantSynergyAwareItem(player, pickRandomIn(gems))
}

export function grantRegionalTreasures2(player: Player) {
  regionSynergies(player).forEach((synergy) => {
    const gem = GemBySynergy[synergy]
    if (gem) grantSynergyAwareItem(player, gem)
    giftUncommonsOfSynergy(player, synergy, 1)
  })
}

function grantManifestation(
  player: Player,
  state: GameState,
  blessing: Blessing,
  candidates: Pkm[],
  heldItem: Item
): boolean {
  // parked on the far right, out of the way of the bench the player actually uses
  const freeCellX = getLastAvailablePositionInBench(player.board)
  if (freeCellX === null) return false
  const pokemon = PokemonFactory.createPokemonFromName(
    pickRandomIn(candidates),
    player
  )
  pokemon.positionX = freeCellX
  pokemon.positionY = 0
  pokemon.items.add(heldItem)
  pokemon.manifestationLocked = true
  player.board.set(pokemon.id, pokemon)
  pokemon.onAcquired(player)
  player.manifestedPokemonIds.push(pokemon.id)
  scheduleBlessingGrant(player, state, blessing, [MANIFESTATION_UNLOCK_STAGE])
  return true
}

function releaseManifestedPokemons(player: Player) {
  player.manifestedPokemonIds.forEach((id) => {
    const pokemon = player.board.get(id)
    if (pokemon) pokemon.manifestationLocked = false
  })
  player.manifestedPokemonIds = []
  /* the copies the lock held apart may now be a complete set */
  player.board.forEach((pokemon) => {
    if (
      pokemon.hasEvolution &&
      pokemon.evolutionRule.type === EvolutionRuleType.COUNT &&
      pokemon.action !== PokemonActionState.EXPLORING
    ) {
      EvolutionManager.tryEvolve(pokemon, player)
    }
  })
}

function giftRandomUniques(player: Player, amount: number): boolean {
  if (getFreeSpaceOnBench(player.board) < amount) return false
  const candidates = PRECOMPUTED_POKEMONS_PER_RARITY[Rarity.UNIQUE].filter(
    (pkm) => PkmFamily[pkm] !== Pkm.COSMOG
  )
  pickNRandomIn(candidates, amount).forEach((pkm: Pkm) =>
    giftPokemonIfBenchHasRoom(player, pkm)
  )
  return true
}

/* the delta since the previous round end is what the player rolled during the
   prep phase that just finished */
function grantWaitingGameRerolls(player: Player) {
  const rerollsThisRound =
    player.gameStats.rerollCount - player.rerollCountAtLastRoundEnd
  player.rerollCountAtLastRoundEnd = player.gameStats.rerollCount
  player.shopFreeRolls +=
    rerollsThisRound === 0
      ? WAITING_GAME_FREE_ROLLS_WITHOUT_REROLLING
      : WAITING_GAME_FREE_ROLLS
}

function grantCalculatedLoss(player: Player) {
  if (player.history.at(-1)?.result !== BattleResult.DEFEAT) return
  player.addBlessingGold(CALCULATED_LOSS_GOLD)
  player.shopFreeRolls += 1
}

function refundPlunderedGold(player: Player) {
  const spent = player.plunderGoldSpentThisFight ?? 0
  player.plunderGoldSpentThisFight = 0
  if (spent > 0 && player.history.at(-1)?.result === BattleResult.WIN) {
    player.addMoney(spent * PLUNDER_GOLD_MULTIPLIER, true, null)
  }
}

export function grantRobinGemsReward(player: Player, state: GameState) {
  if (!state.hasBlessing(player.id, Blessing.ROBIN_GEMS)) return
  const latestBattle = player.history.at(-1)
  if (!latestBattle || latestBattle.result !== BattleResult.WIN) return
  if (
    player.history
      .slice(0, -1)
      .some(
        (battle) =>
          battle.id === latestBattle.id && battle.result === BattleResult.WIN
      )
  ) {
    return
  }
  const opponent = state.players.get(latestBattle.id)
  if (!opponent) return
  const gemSynergies = [...opponent.synergies.entries()].filter(
    ([synergy, count]) => count > 0 && GemBySynergy[synergy] !== undefined
  )
  if (gemSynergies.length === 0) return
  const activeGemSynergies = gemSynergies.filter(
    ([synergy, count]) => count >= SynergyTiersThresholds[synergy][0]
  )
  const eligibleGemSynergies =
    activeGemSynergies.length > 0 ? activeGemSynergies : gemSynergies
  const highestCount = Math.max(
    ...eligibleGemSynergies.map(([, count]) => count)
  )
  const highestSynergies = eligibleGemSynergies
    .filter(([, count]) => count === highestCount)
    .map(([synergy]) => synergy)
  const gem = GemBySynergy[pickRandomIn(highestSynergies)]
  if (gem) grantSynergyAwareItem(player, gem)
}

function heroBlessingEffect(
  blessing: Blessing,
  player: Player,
  state: GameState,
  room?: GameRoom
): boolean {
  const gift = HERO_BLESSING_GIFT[blessing]
  if (
    gift &&
    giftPokemonIfBenchHasRoom(player, getAltFormForPlayer(gift, player)) ===
      false
  )
    return false
  const family = HERO_BLESSING_FAMILY[blessing]
  if (!family) return true

  if (HERO_BLESSING_ADDS_TO_POOL.includes(blessing)) {
    const normalForm = (Object.keys(PkmRegionalVariants) as Pkm[]).find((pkm) =>
      PkmRegionalVariants[pkm]!.includes(family)
    )
    state.shop.addAdditionalPokemon(normalForm ?? family, state)
  }
  if (HERO_BLESSING_MOVES_REGION.includes(blessing)) {
    moveToRegionWherePokemonIsFound(player, state, room, family)
  }
  return true
}

const QUEST_REROLL_TARGET = 50
const QUEST_GROW_TARGET_HP = 1300
const QUEST_SHINE_LIGHT_TARGET = 7
const QUEST_EPIC_RARITY_TARGET = 7
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
    const fieldedByRarity = {
      [Rarity.UNIQUE]: 0,
      [Rarity.EPIC]: 0,
      [Rarity.ULTRA]: 0
    }
    player.board.forEach((pokemon) => {
      if (
        pokemon.positionY > 0 &&
        (pokemon.rarity === Rarity.UNIQUE ||
          pokemon.rarity === Rarity.EPIC ||
          pokemon.rarity === Rarity.ULTRA)
      ) {
        fieldedByRarity[pokemon.rarity]++
      }
    })
    return Object.values(fieldedByRarity).some(
      (fielded) => fielded >= QUEST_EPIC_RARITY_TARGET
    )
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
  },

  [Blessing.QUEST_CRIT]: (player) =>
    player.getBlessingQuestProgress(Blessing.QUEST_CRIT) >=
    QUEST_CRIT_POWER_TARGET,

  [Blessing.QUEST_ABSORB]: (player) =>
    player.getBlessingQuestProgress(Blessing.QUEST_ABSORB) >=
    QUEST_ABSORB_DAMAGE_BLOCKED_TARGET,

  [Blessing.QUEST_REVIVE]: (player) =>
    player.getBlessingQuestProgress(Blessing.QUEST_REVIVE) >=
    QUEST_REVIVE_TARGET,

  [Blessing.QUEST_PILLAGE]: (player) =>
    player.getBlessingQuestProgress(Blessing.QUEST_PILLAGE) >=
    QUEST_PILLAGE_GOLD_TARGET,

  [Blessing.QUEST_EVOLVE_II]: (player) =>
    player.getBlessingQuestProgress(Blessing.QUEST_EVOLVE_II) >=
    QUEST_EVOLVE_II_TARGET,

  [Blessing.QUEST_INDECISION]: (player) =>
    player.getBlessingQuestProgress(Blessing.QUEST_INDECISION) >=
    QUEST_INDECISION_SYNERGIES_TARGET
}

/* QUEST_INDECISION counts synergies whose FINAL tier has been reached at any
   point, so the three do not have to be active together */
export function checkIndecisionSynergies(player: Player) {
  if (!player.blessings?.includes(Blessing.QUEST_INDECISION)) return
  Object.values(Synergy).forEach((synergy) => {
    const maxTier = getHighestReachableSynergyTier(synergy, player.gameMode)
    if (
      maxTier !== undefined &&
      (player.synergies.get(synergy) ?? 0) >= maxTier &&
      !player.indecisionSynergiesReached.has(synergy)
    ) {
      player.indecisionSynergiesReached.add(synergy)
      player.advanceBlessingQuest(Blessing.QUEST_INDECISION)
    }
  })
}

const blessingQuestRewards: { [blessing in Blessing]?: Item } = {
  [Blessing.QUEST_INDECISION]: Item.GOLD_MASK,
  [Blessing.QUEST_CRIT]: Item.GOLD_BOTTLE_CAP,
  [Blessing.QUEST_ABSORB]: Item.ABSORB_BULB,
  [Blessing.QUEST_REVIVE]: Item.SACRED_ASH,
  [Blessing.QUEST_PILLAGE]: Item.BOOSTER_ENERGY,
  [Blessing.QUEST_EVOLVE_II]: Item.RARE_CANDY,
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
      player.items.push(pickRandomIn(Berries)),
    [BlessingTrigger.PVP_END]: (player) =>
      player.items.push(pickRandomIn(Berries))
  },

  [Blessing.SCHOOL_BUS]: {
    [BlessingTrigger.PVE_END]: (player) => {
      giftPokemonIfBenchHasRoom(player, Pkm.WISHIWASHI)
    }
  },

  [Blessing.BANANA_BUSINESS]: {
    [BlessingTrigger.PVE_END]: (player) => {
      for (let i = 0; i < BANANA_BUSINESS_NANAB_BERRIES; i++) {
        player.items.push(Item.NANAB_BERRY)
      }
    }
  },

  [Blessing.SWEET_SUBSCRIPTION]: {
    [BlessingTrigger.PVE_END]: (player) =>
      player.items.push(pickRandomIn(Sweets)),
    [BlessingTrigger.PVP_END]: (player) =>
      player.items.push(pickRandomIn(Sweets))
  },

  [Blessing.MUNCHLAX_DELIVERY]: {
    [BlessingTrigger.CAROUSEL_END]: (player) =>
      player.items.push(Item.PICNIC_SET)
  },

  [Blessing.PLUNDER]: {
    [BlessingTrigger.PVE_END]: (player) => refundPlunderedGold(player),
    [BlessingTrigger.PVP_END]: (player) => refundPlunderedGold(player)
  },

  [Blessing.WAITING_GAME]: {
    [BlessingTrigger.PVE_END]: (player) => grantWaitingGameRerolls(player),
    [BlessingTrigger.PVP_END]: (player) => grantWaitingGameRerolls(player)
  },

  [Blessing.CALCULATED_LOSS]: {
    [BlessingTrigger.PVE_END]: (player) => grantCalculatedLoss(player),
    [BlessingTrigger.PVP_END]: (player) => grantCalculatedLoss(player)
  },

  [Blessing.CURSE_OF_CORAL]: {
    [BlessingTrigger.PVP_END]: (player) =>
      giftPokemonIfBenchHasRoom(player, Pkm.CORSOLA)
  },

  [Blessing.TEMPLE_OF_LANGUAGE]: {
    [BlessingTrigger.PVP_END]: (player) =>
      giftPokemonIfBenchHasRoom(player, pickRandomIn(Unowns))
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
    // false means the grant could not land and is re-queued for the next stage
  ) => void | boolean
} = {
  [Blessing.HARD_COMMIT]: (player, state, value) => {
    const gem = SynergyGems[value ?? 0]
    if (gem) grantSynergyAwareItem(player, gem)
  },

  [Blessing.MANIFESTATION_AP]: (player) => releaseManifestedPokemons(player),

  [Blessing.MANIFESTATION_AD]: (player) => releaseManifestedPokemons(player),

  /* items always land, so these return void rather than a grant result: an
     expression body would leak the push's number into the union */
  [Blessing.CINCCINOS_GIFTS_I]: (player) => {
    player.items.push(Item.SILK_SCARF)
  },

  [Blessing.CINCCINOS_GIFTS_II]: (player) => {
    player.items.push(Item.SILK_SCARF)
  },

  [Blessing.RELIC_FRAGMENT]: (player) => {
    player.items.push(Item.LAPRAS_PASSPORT)
  },

  [Blessing.ITEMFINDER_I]: (player) => {
    player.items.push(pickRandomIn(ItemComponents))
  },

  [Blessing.ITEMFINDER_II]: (player) => {
    player.items.push(pickRandomIn(ItemComponents))
  },

  [Blessing.ITEMFINDER_III]: (player) => {
    player.items.push(pickRandomIn(ItemComponents))
  },

  [Blessing.LEGENDARY_GAMBIT]: (player) =>
    giftLegendaryMatchingTopSynergy(player),

  [Blessing.DEEP_INVESTMENTS]: (player, _state, value) => {
    player.addMoney(value ?? 0, true, null)
  },

  [Blessing.TRANSFORM]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.DITTO),

  [Blessing.BABYLESS]: (player) => giveRandomEgg(player, true) != null,

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
    grantSongReinforcement(player, Blessing.KYOGRES_SONG),

  [Blessing.SUPPORTIVE_SOUL]: (player) => grantSupportiveSoulItem(player),

  [Blessing.LANCES_ACE]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.DRATINI)
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

  [Blessing.LUNCH_MONEY]: () => true,
  [Blessing.CALCULATED_LOSS]: () => true,
  [Blessing.A_NEW_FRIEND]: (player) => {
    const candidates = PRECOMPUTED_POKEMONS_PER_RARITY[Rarity.UNCOMMON].filter(
      (pkm) =>
        getPokemonData(pkm).stars === 1 && player.canFindRegionalPokemon(pkm)
    )
    if (candidates.length === 0) return false
    const pokemon = getAltFormForPlayer(pickRandomIn(candidates), player)
    player.aNewFriendPokemon = pokemon
    if (player.giftAnewFriendCopy()) return true
    player.aNewFriendPokemon = null
    return false
  },
  [Blessing.BP_REWARDS]: (player, state) => {
    player.items.push(...pickNRandomIn(ItemComponents, BP_REWARDS_COMPONENTS))
    player.bpRewardsNextStage = state.stageLevel + BP_REWARDS_ROUND_INTERVAL
    const owned =
      state.blessingsByPlayerId.get(player.id) ?? new PlayerBlessings()
    state.blessingsByPlayerId.set(player.id, owned)
    player.blessingsRef = owned
    owned.questProgress.set(Blessing.BP_REWARDS, BP_REWARDS_ROUND_INTERVAL)
    return true
  },
  [Blessing.GREEDY_WISH]: (player) => {
    player.greedyWishPending = true
    return true
  },
  [Blessing.CALLED_SHOT]: (player) => {
    player.streak = CALLED_SHOT_STREAK
    player.calledShotPending = true
    player.addBlessingGold(CALLED_SHOT_GOLD)
    return true
  },
  [Blessing.VAMPIRIC]: () => true,
  [Blessing.PROTECT_THE_WEAK]: () => true,
  [Blessing.STURDY]: () => true,
  [Blessing.ALL_FOR_ONE]: (player, state, room) =>
    applyAllForOne(player, state, room),
  [Blessing.RAINBOW_KEY]: (player, state, room) =>
    applyRainbowKey(player, state, room),
  [Blessing.PLUSHIFY]: (player) => {
    player.items.push(Item.POKE_DOLL)
    return true
  },
  [Blessing.SUPPORTIVE_SOUL]: (player, state, room) => {
    const substitute = PokemonFactory.createPokemonFromName(
      Pkm.SUBSTITUTE,
      player
    )
    const fieldPosition = getFirstAvailablePositionOnBoard(
      player.board,
      substitute.range
    )
    if (!fieldPosition) return false
    substitute.supportiveSoul = true
    substitute.canBeBenched = false
    substitute.positionX = fieldPosition[0]
    substitute.positionY = fieldPosition[1]
    player.board.set(substitute.id, substitute)
    grantSupportiveSoulItem(player)
    scheduleBlessingGrant(
      player,
      state,
      Blessing.SUPPORTIVE_SOUL,
      SUPPORTIVE_SOUL_ITEM_STAGES.map((rounds) => state.stageLevel + rounds)
    )
    const owned =
      state.blessingsByPlayerId.get(player.id) ?? new PlayerBlessings()
    owned.questProgress.set(
      Blessing.SUPPORTIVE_SOUL,
      SUPPORTIVE_SOUL_ITEM_STAGES[0]
    )
    state.blessingsByPlayerId.set(player.id, owned)
    player.blessingsRef = owned
    player.updateSynergies()
    if (room)
      player.boardSize = room.getTeamSize(player.board, player.blessings)
    return true
  },
  [Blessing.LANCES_ACE]: (player, state) => {
    scheduleBlessingGrant(player, state, Blessing.LANCES_ACE, [
      state.stageLevel + LANCES_ACE_DELAY
    ])
    return true
  },
  [Blessing.PANIC_BUTTON]: (player) => grantPanicButtonUnown(player),
  [Blessing.HAIL_TO_THE_KING]: (player) => {
    player.items.push(Item.RELIC_STATUE)
    return true
  },
  [Blessing.TRASH_TO_TREASURE]: (player) => {
    if (getFreeSpaceOnBench(player.board) < 2) return false
    giftPokemonIfBenchHasRoom(player, Pkm.TRUBBISH)
    giftPokemonIfBenchHasRoom(player, Pkm.BELDUM)
    const trashGranted = randomBetween(
      TRASH_TO_TREASURE_TRASH_GRANTED_MIN,
      TRASH_TO_TREASURE_TRASH_GRANTED_MAX
    )
    for (let i = 0; i < trashGranted; i++) {
      player.items.push(Item.TRASH)
    }
    return true
  },
  [Blessing.CHARGING_MY_BUG]: (player, state, room) =>
    heroBlessingEffect(Blessing.CHARGING_MY_BUG, player, state, room),
  [Blessing.NEUROFORCE]: () => true,
  [Blessing.SINNOHS_COOLEST]: (player, state, room) =>
    grantSinnohsCoolest(player, state, room),
  [Blessing.AXE_BLAST]: (player, state, room) =>
    heroBlessingEffect(Blessing.AXE_BLAST, player, state, room),
  [Blessing.SWEET_TREATS]: (player) => {
    grantSweetTreat(player)
    return true
  },
  [Blessing.SNIFFER_DOG]: (player, state, room) =>
    heroBlessingEffect(Blessing.SNIFFER_DOG, player, state, room),
  [Blessing.JESTER]: (player, state, room) =>
    heroBlessingEffect(Blessing.JESTER, player, state, room),
  [Blessing.TOXIC_RESONANCE]: (player, state, room) =>
    heroBlessingEffect(Blessing.TOXIC_RESONANCE, player, state, room),
  [Blessing.GRAND_IGNITION]: (player, state, room) =>
    heroBlessingEffect(Blessing.GRAND_IGNITION, player, state, room),
  [Blessing.VALOR]: (player, state, room) =>
    heroBlessingEffect(Blessing.VALOR, player, state, room),
  [Blessing.COLONY]: (player, state, room) =>
    heroBlessingEffect(Blessing.COLONY, player, state, room),
  [Blessing.SAND_BUDDIES]: (player, state, room) =>
    heroBlessingEffect(Blessing.SAND_BUDDIES, player, state, room),
  [Blessing.YOU_FORGOT_SOMETHING]: () => true,
  [Blessing.THINK_FAST]: (player, state) => {
    const owned =
      state.blessingsByPlayerId.get(player.id) ?? new PlayerBlessings()
    state.blessingsByPlayerId.set(player.id, owned)
    player.blessingsRef = owned
    owned.thinkFastActive = true
    return true
  },
  [Blessing.WISE_SPENDING]: () => true,
  [Blessing.BIRTHDAY_PRESENT]: () => true,
  [Blessing.UP_IS_UP]: () => true,

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
    if (giftPokemonIfBenchHasRoom(player, Pkm.MAREEP) === false) return false
    player.items.push(Item.CELL_BATTERY)
    return true
  },

  [Blessing.BURNING_SHARDS]: (player) => {
    if (giftPokemonIfBenchHasRoom(player, Pkm.SCORBUNNY) === false) return false
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

  [Blessing.CURSE_OF_TWO]: () => true,

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
    giftBabiesUnderCost(
      player,
      BABY_OPENER_MAX_COST,
      BABY_OPENER_BABIES_GRANTED
    ),

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

  /* the gift goes first in every effect that also hands out an item: a refused
     pick is retried, and the item would be paid out on each attempt */
  [Blessing.REPLICATOR]: (player) => {
    if (!giftPokemonIfBenchHasRoom(player, Pkm.VAROOM)) return false
    player.items.push(Item.DUBIOUS_DISC_BLESSING_ITEM)
    return true
  },

  [Blessing.FIND_A_LOST_WAND]: (player) => {
    if (!giftPokemonIfBenchHasRoom(player, Pkm.HATENNA)) return false
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
    return true
  },

  [Blessing.FAST_FOOD_DELIVERY]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.NACLI),

  [Blessing.CHEFS_GREED]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.NACLI),

  [Blessing.BERRY_BREAKFAST]: (player) => {
    if (!giftPokemonIfBenchHasRoom(player, Pkm.CHESPIN)) return false
    player.items.push(...pickNRandomIn(Berries, 3))
    return true
  },

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
    /* GEM_HARVEST: a mutation is a crystallisation that skipped the charging,
       so it leaves the same gem behind */
    if (player.blessings?.includes(Blessing.GEM_HARVEST)) {
      const crystalSynergy = AwakeningTypes[rockUnique.awakening]
      const gem = crystalSynergy ? GemBySynergy[crystalSynergy] : null
      if (gem) grantSynergyAwareItem(player, gem)
    }
    return true
  },

  [Blessing.ECHO_CHAMBER]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.IGGLYBUFF),

  [Blessing.ZAP]: (player) => giftPokemonIfBenchHasRoom(player, Pkm.GRUBBIN),

  [Blessing.SEEING_TRIPLE]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.GRUBBIN),

  [Blessing.SACRIFICE]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.LAIRON),

  [Blessing.DRAGON_KING]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.CHARMANDER),

  [Blessing.ASCENSION]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.CHERRIM),

  [Blessing.SHARE_THE_SPOTLIGHT]: () => true,

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

  [Blessing.FIRST_WIND]: () => true,

  [Blessing.RESURGENCE]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.PILOSWINE),

  [Blessing.TIDAL_SURGE]: () => true,

  [Blessing.ARCHEOLOGY]: () => true,

  [Blessing.MONSTER_KING]: () => true,

  [Blessing.ADOPTION]: () => true,

  [Blessing.GRUDGE]: () => true,

  [Blessing.TIDAL_GUARDIAN]: () => true,

  [Blessing.OVERLOAD]: () => true,

  [Blessing.BULL_LEAPING]: () => true,

  [Blessing.ICY_REFLECTION]: () => true,

  [Blessing.GUARD_FORMATION]: () => true,

  [Blessing.BRAVE_FORMATION]: () => true,

  [Blessing.TOUGH_FORMATION]: () => true,

  [Blessing.MYSTOGAN]: () => true,

  [Blessing.MAGNETOSPHERE]: () => true,

  [Blessing.GEM_HARVEST]: () => true,

  [Blessing.FURIOUS_FABRIC]: () => true,

  [Blessing.LIMIT_BREAKER]: () => true,

  [Blessing.CHAMPIONS_MASK]: (player) => {
    player.items.push(Item.CHAMPIONS_MASK)
    return true
  },

  [Blessing.AUTO_CRAFTING]: (player) => {
    player.items.push(...pickNRandomIn(ItemComponents, 2))
    return true
  },

  [Blessing.CENTER_STAGE]: () => true,

  [Blessing.HIEROGLYPHS]: () => true,

  [Blessing.BURNING_FORCE]: () => true,
  [Blessing.SPIKY_GUARD]: () => true,
  [Blessing.DRILL_I]: () => true,
  [Blessing.DRILL_II]: () => true,
  [Blessing.SHATTER_I]: () => true,
  [Blessing.SHATTER_II]: () => true,
  [Blessing.SURGE_I]: () => true,
  [Blessing.SURGE_II]: () => true,
  [Blessing.GEAR_SHIELD_I]: () => true,
  [Blessing.GEAR_SHIELD_II]: () => true,
  [Blessing.MAGIC_SHIELD_I]: () => true,
  [Blessing.MAGIC_SHIELD_II]: () => true,
  [Blessing.BRUTE_SHIELD_I]: () => true,
  [Blessing.BRUTE_SHIELD_II]: () => true,
  [Blessing.STAR_GUARD]: () => true,
  [Blessing.MACHINE_RESIDUE]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.KLANG),
  [Blessing.CALCULATED_OFFENCE]: () => true,
  [Blessing.ROBIN_GEMS]: () => true,

  [Blessing.FESTIVE_PICNIC]: (player) => {
    serveFestivePicnicDishes(player)
    return true
  },

  [Blessing.FOGBOUND_LAKE]: () => true,

  [Blessing.WATER_FOUNTAIN]: (player, state, room) => {
    applyWaterFountain(player, state, room)
    return true
  },

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
      grantRegionalTreasuresOnRegionChange(player)
    }, LAPRAS_TRAVEL_DURATION)
    return true
  },

  [Blessing.WOBBUFFETS_GOLD_PRIZE]: (player) => {
    player.items.push(pickRandomIn(ItemComponents))
    for (let i = 0; i < WOBBUFFETS_GOLD_PRIZE_RECYCLE_TICKETS; i++) {
      player.items.push(Item.RECYCLE_TICKET)
    }
    return true
  },

  [Blessing.HARD_COMMIT]: (player, state) => {
    const gem = pickRandomIn(SynergyGems)
    grantSynergyAwareItem(player, gem)
    // the roll is remembered as its index, the only shape a scheduled grant carries
    scheduleBlessingGrant(
      player,
      state,
      Blessing.HARD_COMMIT,
      HARD_COMMIT_STAGES,
      SynergyGems.indexOf(gem)
    )
    return true
  },

  [Blessing.REGIONAL_TREASURES]: (player) => {
    grantRegionalGem(player)
    return true
  },

  [Blessing.REGIONAL_TREASURES_II]: (player) => {
    grantRegionalTreasures2(player)
    return true
  },

  [Blessing.SYNARCH]: (player) => {
    const uniques = schemaValues(player.board).filter(
      (pokemon) => pokemon.rarity === Rarity.UNIQUE
    )
    const baseSynergies = uniques.flatMap((unique) => [
      ...getPokemonData(unique.name).types
    ])
    const gems = baseSynergies
      .map((synergy) => GemBySynergy[synergy])
      .filter((gem): gem is Item => gem != null)
    while (gems.length < SYNARCH_GEMS_PER_UNIQUE) {
      gems.push(pickRandomIn(SynergyGems))
    }
    gems.forEach((gem) => grantSynergyAwareItem(player, gem))
    return true
  },

  [Blessing.FLEXIBILITY]: (player) => {
    for (let i = 0; i < FLEXIBILITY_FOSSIL_STONES; i++) {
      player.items.push(Item.FOSSIL_STONE)
    }
    pickNRandomIn(ItemComponents, FLEXIBILITY_COMPONENTS).forEach((component) =>
      player.items.push(component)
    )
    return true
  },

  [Blessing.RAINBOW_HOUR]: (player) => {
    for (let i = 0; i < RAINBOW_HOUR_FOSSIL_STONES; i++) {
      player.items.push(Item.FOSSIL_STONE)
    }
    return true
  },

  [Blessing.MANIFESTATION_AP]: (player, state) =>
    grantManifestation(
      player,
      state,
      Blessing.MANIFESTATION_AP,
      MANIFESTATION_AP_POKEMONS,
      Item.SOUL_DEW
    ),

  [Blessing.MANIFESTATION_AD]: (player, state) =>
    grantManifestation(
      player,
      state,
      Blessing.MANIFESTATION_AD,
      MANIFESTATION_AD_POKEMONS,
      Item.RED_ORB
    ),

  [Blessing.MIX_AND_MATCH_I]: (player) =>
    giftRandomUniques(player, MIX_AND_MATCH_I_UNIQUES),

  [Blessing.MIX_AND_MATCH_II]: (player) =>
    giftRandomUniques(player, MIX_AND_MATCH_II_UNIQUES),

  [Blessing.MORE_EQUAL_THAN_OTHERS]: (player, state) => {
    player.addMoney(MORE_EQUAL_THAN_OTHERS_GOLD, true, null)
    player.items.push(pickRandomIn(ItemComponents))
    state.players.forEach((otherPlayer) => {
      if (otherPlayer.id !== player.id && otherPlayer.alive) {
        otherPlayer.addMoney(MORE_EQUAL_THAN_OTHERS_GOLD_FOR_OTHERS, true, null)
      }
    })
    return true
  },

  [Blessing.QUEST_EVOLVE]: (player) =>
    grantMissionOrderQuest(player, Item.MISSION_ORDER_PINK),
  [Blessing.QUEST_DESTROY]: (player) =>
    grantMissionOrderQuest(player, Item.MISSION_ORDER_RED),
  [Blessing.QUEST_LEVEL_UP]: (player) =>
    grantMissionOrderQuest(player, Item.MISSION_ORDER_BLUE),
  [Blessing.QUEST_DIVERSIFY]: (player) =>
    grantMissionOrderQuest(player, Item.MISSION_ORDER_GREEN),
  [Blessing.QUEST_PROSPER]: (player) =>
    grantMissionOrderQuest(player, Item.MISSION_ORDER_GOLD),

  [Blessing.QUEST_INDECISION]: (player) => {
    pickNRandomIn([...SynergyGems], 2).forEach((gem) =>
      grantSynergyAwareItem(player, gem)
    )
    return true
  },

  [Blessing.QUEST_CRIT]: (player) => {
    player.items.push(Item.BLACK_GLASSES, Item.BLACK_GLASSES)
    return true
  },

  [Blessing.QUEST_ABSORB]: (player) => {
    player.items.push(Item.HEART_SCALE, Item.NEVER_MELT_ICE)
    return true
  },

  [Blessing.QUEST_REVIVE]: (player) => {
    player.items.push(Item.MAX_REVIVE)
    return true
  },

  [Blessing.QUEST_PILLAGE]: (player) => {
    player.items.push(Item.AMULET_COIN)
    return true
  },

  [Blessing.QUEST_EVOLVE_II]: (player) => {
    giftPokemonIfBenchHasRoom(player, Pkm.EEVEE)
    const rares = PRECOMPUTED_POKEMONS_PER_RARITY.RARE.filter(
      (pkm) =>
        getPokemonData(pkm).stars === 1 && player.canFindRegionalPokemon(pkm)
    )
    pickNRandomIn(rares, 2).forEach((pkm) =>
      giftPokemonIfBenchHasRoom(player, pkm)
    )
    return true
  },

  [Blessing.IMPENDING_DOOM]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.DARTIX),

  [Blessing.SYNCHRONICITY]: (player) => {
    player.items.push(Item.SYNCHRO_MASHINE)
    return true
  },

  /* the sub-choice is pushed onto player.choices; pickChoice removes the
     blessing choice straight after, so it becomes the next thing shown */
  [Blessing.SINGULARITY_I]: (player) => {
    player.choices.push(
      new PlayerChoice({
        type: "singularity",
        items: pickNRandomIn(ItemComponents, SINGULARITY_OPTIONS)
      })
    )
    return true
  },

  [Blessing.SINGULARITY_II]: (player) => {
    player.choices.push(
      new PlayerChoice({
        type: "singularity",
        items: pickNRandomIn(ItemComponents, SINGULARITY_OPTIONS)
      })
    )
    return true
  },

  [Blessing.STARTER_CHOICE]: (player) => {
    const commons = PRECOMPUTED_POKEMONS_PER_RARITY.COMMON.filter(
      (pkm) =>
        getPokemonData(pkm).stars === 1 && player.canFindRegionalPokemon(pkm)
    )
    if (commons.length === 0) return false
    player.choices.push(
      new PlayerChoice({
        type: "starter_choice",
        pokemons: pickNRandomIn(commons, STARTER_CHOICE_OPTIONS)
      })
    )
    return true
  },

  [Blessing.CURSE_OF_CORAL]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.CORSOLA),

  [Blessing.TRAINING_MONTAGE]: (player) => {
    player.items.push(Item.BRONZE_DOJO_TICKET)
    return true
  },

  [Blessing.TREASURE_TRAIL]: (player, state) => {
    // pickChoice reuses this entry when it registers the blessing right after
    const owned =
      state.blessingsByPlayerId.get(player.id) ?? new PlayerBlessings()
    state.blessingsByPlayerId.set(player.id, owned)
    player.blessingsRef = owned
    revealNextBuriedTreasure(player, state, true)
    return true
  },

  [Blessing.ALL_FOURS]: (player, state) => {
    state.shop.assignAllEpicShop(player, state)
    player.allFoursFreeBuyPending = true
    // the themed shop can be rolled away without paying for it
    player.shopFreeRolls += 1
    return true
  },

  [Blessing.BEING_OF_KNOWLEDGE]: (player) => {
    player.experienceManager.maxLevel = BEING_OF_KNOWLEDGE_MAX_LEVEL
    player.tryGrantBeingOfKnowledgeUxie(true)
    return true
  },

  [Blessing.HYPER_HYPER_ROLL]: (player) => {
    player.hyperHyperRollPending = true
    return true
  },

  [Blessing.QUICK_CLAW]: (player, state) => {
    if (state.stageLevel >= QUICK_CLAW_COMPENSATION_STAGE) {
      player.items.push(pickRandomIn(ItemComponents))
    }
    return true
  },

  [Blessing.CLIMBING_THE_LADDER]: (player) => {
    player.experienceManager.maxLevel = CLIMBING_THE_LADDER_MAX_LEVEL
    player.experienceManager.expDiscount = CLIMBING_THE_LADDER_EXP_DISCOUNT
    if (player.experienceManager.level < CLIMBING_THE_LADDER_MIN_LEVEL) {
      player.experienceManager.level = CLIMBING_THE_LADDER_MIN_LEVEL
      player.experienceManager.experience = 0
    }
    player.experienceManager.expNeeded =
      player.experienceManager.expNeededAtLevel(player.experienceManager.level)
    return true
  },

  [Blessing.SOUL_DRAIN]: (player, state, room) =>
    heroBlessingEffect(Blessing.SOUL_DRAIN, player, state, room),

  [Blessing.FLOWER_QUEEN]: (player, state, room) => {
    if (
      heroBlessingEffect(Blessing.FLOWER_QUEEN, player, state, room) === false
    )
      return false
    player.items.push(Item.METRONOME)
    return true
  },

  [Blessing.LEAF_TORNADO]: (player, state, room) =>
    heroBlessingEffect(Blessing.LEAF_TORNADO, player, state, room),

  [Blessing.MARIACHI_MAYHEM]: (player, state, room) =>
    heroBlessingEffect(Blessing.MARIACHI_MAYHEM, player, state, room),

  [Blessing.ICEBREAKER]: (player, state, room) =>
    heroBlessingEffect(Blessing.ICEBREAKER, player, state, room),

  [Blessing.RAMPAGE]: (player, state, room) =>
    heroBlessingEffect(Blessing.RAMPAGE, player, state, room),

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
    if (!giftPokemonIfBenchHasRoom(player, Pkm.GOSSIFLEUR)) return false
    const fullyEvolvedFlowers = getUnlockedFlowerPots(player).filter(
      (pot) => pot.evolution === Pkm.DEFAULT
    ).length
    for (let i = 0; i < 1 + fullyEvolvedFlowers; i++) {
      player.items.push(Item.AMAZE_MULCH)
    }
    return true
  },

  [Blessing.NOT_THE_BEES]: () => true,

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
    /* seeding the pool is lobby-wide and cannot be undone, so refuse before it
       rather than after the gift fails */
    if (getFreeSpaceOnBench(player.board) < 1) return false
    const encountered = pickRandomIn(candidates)
    state.shop.addAdditionalPokemon(encountered, state)
    return giftPokemonIfBenchHasRoom(player, encountered)
  },

  [Blessing.POTION]: (player, state) => {
    healPlayerLife(player, POTION_LIFE_HEALED, state)
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
        // money is a uint16: a broke player taxed below zero wraps to 65535
        const taxed = Math.min(TAXES_GOLD_TAKEN_FROM_OTHERS, otherPlayer.money)
        otherPlayer.addMoney(-taxed, false, null)
      }
    })
    return true
  },

  [Blessing.ROCKY_BEGINNINGS]: (player) => {
    if (getFreeSpaceOnBench(player.board) < ROCKY_BEGINNINGS_POKEMONS) {
      return false
    }
    const matching = PRECOMPUTED_POKEMONS_PER_RARITY[Rarity.COMMON]
      .concat(PRECOMPUTED_POKEMONS_PER_RARITY[Rarity.UNCOMMON])
      .concat(PRECOMPUTED_POKEMONS_PER_RARITY[Rarity.RARE])
      .filter((pkm: Pkm) => {
        const data = getPokemonData(pkm)
        return data.stars === 1 && data.types.includes(Synergy.ROCK)
      })
    pickNRandomIn(matching, ROCKY_BEGINNINGS_POKEMONS).forEach((pkm) =>
      giftPokemonIfBenchHasRoom(player, pkm)
    )
    player.weatherRocks.push(pickRandomIn(WeatherRocks))
    player.updateWeatherRocks()
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

  /* taken late there is little time left to grow anything, so the golden
     berries are the compensation for picking it on the last selection */
  [Blessing.BERRY_GROWTH]: (player, state) => {
    if (state.stageLevel >= BERRY_GROWTH_GOLDEN_BERRIES_STAGE) {
      for (let i = 0; i < BERRY_GROWTH_GOLDEN_BERRIES_GRANTED; i++) {
        player.items.push(pickRandomIn(GoldenBerries))
      }
    }
    return true
  },

  [Blessing.SCHOOL_BUS]: (player) =>
    giftPokemonIfBenchHasRoom(player, Pkm.WISHIWASHI),

  [Blessing.BANANA_BUSINESS]: (player) => {
    for (let i = 0; i < BANANA_BUSINESS_NANAB_BERRIES; i++) {
      player.items.push(Item.NANAB_BERRY)
    }
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
    scheduleBlessingGrant(
      player,
      state,
      Blessing.ITEMFINDER_I,
      nextStages(state, 1)
    )
    return true
  },

  [Blessing.ITEMFINDER_II]: (player, state) => {
    player.items.push(pickRandomIn(ItemComponents))
    scheduleBlessingGrant(
      player,
      state,
      Blessing.ITEMFINDER_II,
      nextStages(state, 2)
    )
    return true
  },

  [Blessing.ITEMFINDER_III]: (player, state) => {
    player.items.push(pickRandomIn(ItemComponents))
    scheduleBlessingGrant(
      player,
      state,
      Blessing.ITEMFINDER_III,
      nextStages(state, 6)
    )
    return true
  },

  [Blessing.LEGENDARY_GAMBIT]: (player, state) => {
    scheduleBlessingGrant(player, state, Blessing.LEGENDARY_GAMBIT, [
      LEGENDARY_GAMBIT_STAGE
    ])
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
