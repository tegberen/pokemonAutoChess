import { ArraySchema, MapSchema, Schema, type, view } from "@colyseus/schema"
import {
  AdditionalPicksStages,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  FAIRY_WANDS_BY_SYNERGY_LEVEL,
  RegionDetails,
  SynergyTiersThresholds
} from "../../config"
import type { ScribbleShapeType } from "../../config/game/scribble-shapes"
import { CollectionUtils } from "../../core/collection"
import { getAvailableEmotions } from "../precomputed/precomputed-emotions"
import { ScribbleShape } from "./scribble-shape"
import { OnSpotlightChangeEffect } from "../../core/effects/effect"
import { PassiveEffects } from "../../core/effects/passives"
import { carryOverPermanentStats } from "../../core/evolution-logic/evolution-handler"
import { EvolutionManager } from "../../core/evolution-logic/evolution-manager"
import { MulchStockCaps } from "../../core/flower-pots"
import type { PokemonEntity } from "../../core/pokemon-entity"
import type GameState from "../../rooms/states/game-state"
import {
  type FlowerPot,
  FlowerPots,
  type IPlayer,
  type Role,
  SYNTHETIC_DPS_IDS,
  Title
} from "../../types"
import { EvolutionRuleType } from "../../types/EvolutionRules"
import { Ability } from "../../types/enum/Ability"
import {
  Blessing,
  CRYSTAL_CLUSTERS_ROCKS_GRANTED
} from "../../types/enum/Blessing"
import { ROCK_AWAKENING_TIER } from "../../types/enum/Awakening"
import type { ScheduledBlessingGrant } from "../../types/enum/Blessing"
import type { DungeonPMDO } from "../../types/enum/Dungeon"
import {
  BattleResult,
  GameMode,
  PokemonActionState,
  Rarity,
  Team
} from "../../types/enum/Game"
import {
  AbilityPerTM,
  ArtificialItems,
  Item,
  ItemComponentsNoFossilOrScarf,
  type MissionOrder,
  NonSpecialBerries,
  type ScarfItem,
  Seeds,
  SynergyGemsBuried,
  SynergyGivenByItem,
  TMsBronze,
  TMsGold,
  TMsSilver,
  ToolsBuried,
  Wands,
  WeatherRocks
} from "../../types/enum/Item"
import { Passive } from "../../types/enum/Passive"
import {
  Pillars,
  Pkm,
  PkmFamily,
  PkmIndex,
  PkmRegionalBaseVariants,
  PkmRegionalVariants
} from "../../types/enum/Pokemon"
import { SpecialGameRule } from "../../types/enum/SpecialGameRule"
import { Synergy } from "../../types/enum/Synergy"
import { WandererBehavior, WandererType } from "../../types/enum/Wanderer"
import { Weather } from "../../types/enum/Weather"
import {
  type GameStats,
  initialGameStats
} from "../../types/interfaces/GameStats"
import type { IPokemonCollectionItemMongo } from "../../types/interfaces/UserMetadata"
import { isIn, removeInArray } from "../../utils/array"
import { getPokemonCustomFromAvatar } from "../../utils/avatar"
import {
  getFirstAvailablePositionInBench,
  getFirstAvailablePositionOnBoard,
  isOnBench
} from "../../utils/board"
import { max, min } from "../../utils/number"
import {
  chance,
  pickNRandomIn,
  pickRandomIn,
  shuffleArray
} from "../../utils/random"
import { resetArraySchema, schemaValues } from "../../utils/schemas"
import { Effects } from "../effects"
import PokemonFactory, { getPokemonBaseline } from "../pokemon-factory"
import {
  getPokemonData,
  PRECOMPUTED_REGIONAL_MONS
} from "../precomputed/precomputed-pokemon-data"
import ExperienceManager from "./experience-manager"
import { GameStatsSchema } from "./game-stats"
import HistoryItem from "./history-item"
import { PlayerChoice } from "./player-choice"
import { Pokemon, PokemonClasses } from "./pokemon"
import { PokemonCustoms } from "./pokemon-customs"
import Synergies, { computeSynergies, getSynergyTier } from "./synergies"
import { Wanderer } from "./wanderer"
import { ArmoryOptions } from "../../types/enum/ArmoryOptions"

export default class Player extends Schema implements IPlayer {
  @type("string") id: string
  @type("string") simulationId = ""
  @type("number") team: Team = Team.BLUE_TEAM
  @type("string") name: string
  @type("string") avatar: string
  @type({ map: Pokemon }) board = new MapSchema<Pokemon>()
  @view() @type(["string"]) shop = new ArraySchema<Pkm>()
  // JUGGERNAUT: stat (color) fed by each shop copy, parallel to `shop` ("" if not a copy)
  @view() @type(["string"]) shopJuggernautStats = new ArraySchema<string>()
  @type(ExperienceManager) experienceManager = new ExperienceManager()
  @type({ map: "uint8" }) synergies = new Synergies()
  @type("uint16") money = process.env.MODE == "dev" ? 999 : 5
  @type("int16") life = process.env.MODE == "dev" ? 1000 : 100
  @view() @type("boolean") shopLocked: boolean = false
  @view() @type("uint8") shopFreeRolls: number = 0
  @type("uint8") streak: number = 0
  @type("uint8") maxInterest: number = 5
  @type("uint8") interest: number = 0
  @type("string") opponentId: string = ""
  @type("string") opponentName: string = ""
  @type("string") opponentAvatar: string = ""
  @type("string") opponentTitle: Title | "WILD" | "" = ""
  @type("string") doubleUpPartnerId: string = ""
  @type("string") doubleUpTeamId: string = ""
  @type("uint8") doubleUpSendCooldown: number = 0
  @type("string") doubleUpTradeOffer: string = ""
  @type("uint8") doubleUpEliminationRound: number = 999
  @type(["string"]) doubleUpGifts = new ArraySchema<ArmoryOptions>()
  @type("string") spectatedPlayerId: string
  @type("uint8") boardSize: number = 0
  @type(["string"]) items = new ArraySchema<Item>()
  @type(["string"]) scarvesItems = new ArraySchema<Item>()
  @type(["string"]) fairyWands = new ArraySchema<Item>()
  @type("uint8") rank: number
  @type("uint16") elo: number
  @type("uint16") games: number // number of games played on this account
  @type("boolean") alive = true
  @type([HistoryItem]) history = new ArraySchema<HistoryItem>()
  @type({ map: "uint8" }) pokemonCustoms: PokemonCustoms =
    new MapSchema<number>()
  @type("string") emotesUnlocked = ""
  @type("string") title: Title | ""
  @type("string") role: Role
  @type([PlayerChoice]) choices = new ArraySchema<PlayerChoice>()
  @type(["string"]) pveRewards = new ArraySchema<Item>()
  @type(["string"]) pveRewardsPropositions = new ArraySchema<Item>()
  // SIX_PACK: second item paired with each reward proposition (same order)
  @type(["string"]) pveRewardsPropositions2 = new ArraySchema<Item>()
  @type(["string"]) scribbleShapesCollected = new ArraySchema<ScribbleShapeType>()
  @type([ScribbleShape]) scribbleShapes = new ArraySchema<ScribbleShape>()
  @type("float32") loadingProgress: number = 0
  @type(["string"]) berryTreesType: Item[] = pickNRandomIn(NonSpecialBerries, 3)
  @type(["uint8"]) berryTreesStages: number[] = [1, 1, 1]
  @type([Pokemon]) flowerPots: Pokemon[] = []
  @type("uint8") mulch: number = 0
  @type("uint8") mulchCap: number = MulchStockCaps[0]
  @type(["uint8"]) groundHoles: number[] = new Array(
    BOARD_WIDTH * BOARD_HEIGHT
  ).fill(0)
  @type("string") map: DungeonPMDO | "town"
  @type({ set: "string" }) effects: Effects = new Effects()
  @type(["string"]) regionalPokemons = new ArraySchema<Pkm>()
  @type("float32") eggChance: number = 0
  @type("float32") goldenEggChance: number = 0
  @type("uint8") cellBattery: number = 0
  @type({ map: Wanderer }) wanderers: Map<string, Wanderer> = new Map<
    string,
    Wanderer
  >()
  @type(GameStatsSchema) gameStats: GameStats = new GameStatsSchema({
    ...initialGameStats
  })
  commonRegionalPool: Pkm[] = new Array<Pkm>()
  uncommonRegionalPool: Pkm[] = new Array<Pkm>()
  rareRegionalPool: Pkm[] = new Array<Pkm>()
  epicRegionalPool: Pkm[] = new Array<Pkm>()
  ultraRegionalPool: Pkm[] = new Array<Pkm>()
  isBot: boolean
  opponents: Map<string, number> = new Map<string, number>()
  titles: Set<Title> = new Set<Title>()
  artificialItems: Item[] = pickNRandomIn(ArtificialItems, 3)
  buriedItems: (Item | null)[] = initBuriedItems()
  tms: Item[] = pickRandomTMs()
  weatherRocks: Item[] = []
  randomComponentsGiven: Item[] = []
  randomEggsGiven: Pkm[] = []
  flowerPotsSpawnOrder: FlowerPot[] = shuffleArray([...FlowerPots])
  fairyWandChoicesRolls: Item[][] = FAIRY_WANDS_BY_SYNERGY_LEVEL.map(
    (wandsForLevel) => pickNRandomIn(wandsForLevel, 3)
  )
  lightX: number
  lightY: number
  ghost: boolean = false
  @type("string") firstPartner: Pkm | undefined
  // BAZAAR: per-slot item offers, parallel to `shop`; each entry is a JSON-encoded
  // offer or "" when the slot has none. Declared LAST (highest field index) on
  // purpose: adding a @type field earlier in the class shifts the wire index of
  // every field after it, so clients still on an older bundle mis-decode those
  // shifted fields and desync until they refresh. Keeping it last preserves every
  // existing field's index. Primitive string array so client `.onChange` fires reliably.
  @view() @type(["string"]) bazaarSlots = new ArraySchema<string>()
  // server-only (undecorated): the client infers a bazaar shop from bazaarSlots content
  bazaarShop = false
  // server-only: shop key (stage + rerolls) of the last bazaar shown, so the free
  // replacement shop after a buy doesn't re-trigger one
  bazaarLastShopKey = -1
  berserkerLastShopKey = -1
  // server-only: dig rows already paid out by GEM_RUSH, so they pay once
  gemRushRowsRewarded: number[] = []
  crystalClustersRocksGranted = false
  // server-only: FAST_FOOD_DELIVERY dishes, tracked one round back so they rot
  fastFoodDishes: Item[] = []
  fastFoodDishesLastRound: Item[] = []
  fastFoodLeftoversToExpire = 0
  hasLeftGame: boolean = false
  bonusSynergies: Map<Synergy, number> = new Map<Synergy, number>()
  pokemonsExploring: {
    pokemonId: string
    returnStage: number
  }[] = []
  scheduledBlessingGrants: ScheduledBlessingGrant[] = []
  // server-only mirror of GameState.blessingsByPlayerId, so combat code can read
  // a player's blessings without reaching for the room state
  blessings: Blessing[] = []
  // server-only: wands granted by FIND_A_LOST_WAND, exempt from synergy removal
  blessingWands: Item[] = []
  // server-only: gold the PLUNDER champion spent casting Treasure Rush this fight
  plunderGoldSpentThisFight: number = 0
  bigPecksSharpBeakGranted = false
  blessingQuestsCompleted: Set<Blessing> = new Set<Blessing>()
  blessingQuestThresholdsReached: Map<Blessing, number> = new Map<
    Blessing,
    number
  >()
  pokemonsPlayed: Set<Pkm> = new Set<Pkm>()
  pokemonsTrainingInDojo: {
    pokemon: Pokemon
    returnStage: number
    ticketLevel: number
  }[] = []
  specialGameRule: SpecialGameRule | null = null // its easier to duplicate this here and in gamestate than passing gamestate everywhere we need it
  gameMode: GameMode = GameMode.CUSTOM_LOBBY // duplicated from gamestate for the same reason as specialGameRule
  avatarSynergy: Synergy | null = null // synergy given to all pokemon in Avatar scribble, rolled once per game
  shopsSinceLastUnownShop: number = 0
  regions: DungeonPMDO[] = []
  unownReminiscences: number = 0
  maxLife: number = 100

  constructor(
    id: string,
    name: string,
    elo: number,
    games: number,
    avatar: string,
    isBot: boolean,
    rank: number,
    pokemonCollection: Map<string, IPokemonCollectionItemMongo>,
    title: Title | "",
    role: Role,
    state: GameState
  ) {
    super()
    this.id = id
    this.spectatedPlayerId = id
    this.name = name
    this.elo = elo
    this.games = games
    this.avatar = avatar
    this.isBot = isBot
    this.rank = rank
    this.title = title
    this.role = role
    this.pokemonCustoms = new PokemonCustoms(pokemonCollection)
    this.specialGameRule = state.specialGameRule
    this.gameMode = state.gameMode
    if (state.scribbleExtended) {
      this.maxLife = 150
      this.life = this.maxLife
    }
    this.avatarSynergy = state.avatarSynergy
    this.flowerPots = initFlowerPots(this)
    const avatarCustom = getPokemonCustomFromAvatar(avatar)
    const avatarInCollection = pokemonCollection.get(
      PkmIndex[avatarCustom.name]
    )
    const emotesUnlocked =
      CollectionUtils.getEmotionsUnlocked(avatarInCollection)
    const unlockAllEmotes =
      typeof process !== "undefined" &&
      process.env.UNLOCK_ALL_COLLECTION === "true"
    this.emotesUnlocked = (
      unlockAllEmotes
        ? getAvailableEmotions(
            PkmIndex[avatarCustom.name],
            avatarCustom.shiny ?? false
          )
        : (avatarCustom.shiny
            ? emotesUnlocked.shinyEmotions
            : emotesUnlocked.emotions) ?? []
    ).join(",")

    this.lightX = state.lightX
    this.lightY = state.lightY
    this.map = "town"
    this.updateRegionalPool(state, true)

    if (isBot) {
      this.loadingProgress = 100
      this.lightX = 3
      this.lightY = 2
    }

    if (state.specialGameRule === SpecialGameRule.DITTO_PARTY) {
      for (let i = 0; i < 5; i++) {
        const ditto = PokemonFactory.createPokemonFromName(Pkm.DITTO, this)
        ditto.positionX = getFirstAvailablePositionInBench(this.board) ?? 0
        ditto.positionY = 0
        this.board.set(ditto.id, ditto)
        ditto.onAcquired(this)
      }
    }

    if (state.specialGameRule === SpecialGameRule.SLAMINGO) {
      for (let i = 0; i < 4; i++)
        this.items.push(pickRandomIn(ItemComponentsNoFossilOrScarf))
    }

    if (state.specialGameRule === SpecialGameRule.HALLOWEEN) {
      this.bonusSynergies.set(Synergy.GHOST, 8)
      this.updateSynergies()
    }

    if (state.specialGameRule === SpecialGameRule.OVERTIME) {
      this.life = 200
      this.experienceManager.maxLevel = 10
    }

    if (state.gameMode === GameMode.DOUBLE_UP && !isBot) {
      // used to request a pokemon to your partner
      this.items.push(Item.SPEAKER)
    }
  }

  addExperience(value: number) {
    this.experienceManager.addExperience(value)
    if (
      this.experienceManager.level >= 9 &&
      this.items.includes(Item.MISSION_ORDER_BLUE)
    ) {
      this.completeMissionOrder(Item.MISSION_ORDER_BLUE)
    }
  }

  addMoney(
    value: number,
    countTotalEarned: boolean,
    origin: PokemonEntity | null
  ) {
    if (origin?.isGhostOpponent) {
      return // do not count money earned by pokemons from a ghost player
    }
    this.money += value
    if (countTotalEarned && value > 0) this.gameStats.totalMoneyEarned += value
    this.board.forEach((pokemon) => {
      if (pokemon.evolutionRule.type === EvolutionRuleType.MONEY) {
        EvolutionManager.tryEvolve(pokemon, this, this.money)
      }
    })
    if (
      this.gameStats.totalMoneyEarned >= 200 &&
      this.items.includes(Item.MISSION_ORDER_GOLD)
    ) {
      this.completeMissionOrder(Item.MISSION_ORDER_GOLD)
    }
  }

  addBattleResult(
    id: string,
    name: string,
    result: BattleResult,
    avatar: string,
    weather: Weather | undefined
  ) {
    this.history.push(
      new HistoryItem(
        id,
        name,
        result,
        avatar,
        weather ? weather : Weather.NEUTRAL
      )
    )
  }

  getPokemonAt(x: number, y: number): Pokemon | undefined {
    return schemaValues(this.board).find(
      (pokemon) => pokemon.positionX == x && pokemon.positionY == y
    )
  }

  transformPokemon(pokemon: Pokemon, newEntry: Pkm): Pokemon {
    const newPokemon = PokemonFactory.createPokemonFromName(newEntry, this)
    carryOverPermanentStats(newPokemon, [pokemon])
    // JUGGERNAUT: a form change keeps the feed-copy flag and re-nulls copies
    newPokemon.juggernautStat = pokemon.juggernautStat
    if (
      newPokemon.juggernautStat !== "" &&
      (getPokemonData(newPokemon.name).rarity === Rarity.UNIQUE ||
        getPokemonData(newPokemon.name).rarity === Rarity.LEGENDARY)
    ) {
      newPokemon.atk = 0
      newPokemon.def = 0
      newPokemon.speDef = 0
      newPokemon.ap = -100
    }
    pokemon.items.forEach((item) => {
      newPokemon.addItem(item, this)
      if (item === Item.SHINY_CHARM) {
        newPokemon.shiny = true
      }
    })
    newPokemon.dishes = pokemon.dishes
    newPokemon.positionX = pokemon.positionX
    newPokemon.positionY = pokemon.positionY
    this.board.delete(pokemon.id)
    this.board.set(newPokemon.id, newPokemon)
    newPokemon.onAcquired(this)
    this.updateSynergies()
    this.pokemonsPlayed.add(newPokemon.name)
    return newPokemon
  }

  updateSynergies() {
    const pokemons: Pokemon[] = schemaValues(this.board)
    const previousSynergies = this.synergies.toMap()
    let updatedSynergies = computeSynergies(
      pokemons,
      this.bonusSynergies,
      this.specialGameRule,
      this.avatarSynergy
    )

    const normalNeedsRecomputing = this.updateScarves(
      previousSynergies,
      updatedSynergies
    )

    const artifNeedsRecomputing = this.updateArtificialItems(
      previousSynergies,
      updatedSynergies
    )
    if (artifNeedsRecomputing || normalNeedsRecomputing) {
      /* NOTE: computing twice is costly in performance but the safest way to get the synergies
      right after losing an artificial item or a scarf, since many edgecases may need to be 
      adressed when losing a type (Axew double dragon + artif item for example) ;
      it's not as easy as just decrementing by 1 in updatedSynergies map count
      */
      updatedSynergies = computeSynergies(pokemons, this.bonusSynergies)
    }

    if (this.gameMode === GameMode.DOUBLE_UP) {
      // In Double Up, the Baby synergy caps at its second tier (Baby 5):
      const babyCap = SynergyTiersThresholds[Synergy.BABY][1]
      const babyCount = updatedSynergies.get(Synergy.BABY) ?? 0
      if (babyCount > babyCap) {
        updatedSynergies.set(Synergy.BABY, babyCap)
      }
    }

    const previousLight = previousSynergies.get(Synergy.LIGHT) ?? 0
    const newLight = updatedSynergies.get(Synergy.LIGHT) ?? 0
    const minimumToGetLight = SynergyTiersThresholds[Synergy.LIGHT][0]
    const lightGained =
      previousLight < minimumToGetLight && newLight >= minimumToGetLight
    const lightLost =
      previousLight >= minimumToGetLight && newLight < minimumToGetLight

    updatedSynergies.forEach((value, synergy) =>
      this.synergies.set(synergy, value)
    )

    if (lightGained || lightLost) this.onLightChange(lightGained)

    if (
      previousSynergies.get(Synergy.WATER) !==
      updatedSynergies.get(Synergy.WATER)
    ) {
      this.updateFishingRods()
    }

    if (
      previousSynergies.get(Synergy.ROCK) !== updatedSynergies.get(Synergy.ROCK)
    ) {
      this.updateWeatherRocks()
    }

    if (
      previousSynergies.get(Synergy.HUMAN) !==
      updatedSynergies.get(Synergy.HUMAN)
    ) {
      this.updateTms(previousSynergies, updatedSynergies)
    }

    if (
      previousSynergies.get(Synergy.GOURMET) !==
      updatedSynergies.get(Synergy.GOURMET)
    ) {
      this.updateChefsHats()
    }

    if (
      previousSynergies.get(Synergy.BUG) !== updatedSynergies.get(Synergy.BUG)
    ) {
      this.updateBugNest()
    }

    if (
      previousSynergies.get(Synergy.FAIRY) !==
      updatedSynergies.get(Synergy.FAIRY)
    ) {
      this.updateFairyWands()
    }

    this.effects.update(this.synergies, this.board)

    if (
      this.items.includes(Item.MISSION_ORDER_GREEN) &&
      this.synergies.countActiveSynergies() >= 8
    ) {
      this.completeMissionOrder(Item.MISSION_ORDER_GREEN)
    }

    if (
      this.items.includes(Item.MISSION_ORDER_PINK) &&
      schemaValues(this.board).filter((p) => p.stars >= 3).length >= 4
    ) {
      this.completeMissionOrder(Item.MISSION_ORDER_PINK)
    }

    if (previousSynergies.get(Synergy.FLYING) != updatedSynergies.get(Synergy.FLYING)) {
      this.updateLetters(previousSynergies, updatedSynergies)
    } else if (getSynergyTier(updatedSynergies, Synergy.FLYING) === 4) {
      this.grantLetterIfEligible()
    }
  }

  grantLetterIfEligible() {
    const hasDragonite = schemaValues(this.board).some(
      (p) => p.name === Pkm.DRAGONITE
    )
    const maxConcurrent = hasDragonite ? 2 : 1
    const hasFlying8 = getSynergyTier(this.synergies, Synergy.FLYING) === 4
    if (!hasFlying8) return

    let granted = 0
    while (granted < maxConcurrent) {
      const totalActive =
        this.items.filter((i) => i === Item.LETTER).length +
        this.pokemonsExploring.length
      if (totalActive >= maxConcurrent) break
      this.items.push(Item.LETTER)
      granted++
    }
  }

  addSeedToBag(rolledSeed: Item): Seeds | null {
    const unowned = Seeds.filter((s) => !this.items.includes(s))
    if (unowned.length === 0) return null
    const seed: Seeds =
      isIn(Seeds, rolledSeed) && !this.items.includes(rolledSeed)
        ? rolledSeed
        : pickRandomIn(unowned)
    this.items.push(seed)
    return seed
  }

  get activeSeed(): Seeds | "" {
    const seed = this.items.find((i) => isIn(Seeds, i))
    return isIn(Seeds, seed) ? seed : ""
  }

  armSeed(seed: Seeds) {
    const i = this.items.indexOf(seed)
    if (i === -1) return
    const firstSeedIdx = this.items.findIndex((it) => isIn(Seeds, it))
    if (firstSeedIdx === -1 || firstSeedIdx === i) return
    const previouslyActive = this.items[firstSeedIdx]
    this.items[firstSeedIdx] = seed
    this.items[i] = previouslyActive
  }

  updateLetters(
    previousSynergies: Map<Synergy, number>,
    updatedSynergies: Map<Synergy, number>
  ) {
    const previousFlyingStep = getSynergyTier(previousSynergies, Synergy.FLYING)
    const newFlyingStep = getSynergyTier(updatedSynergies, Synergy.FLYING)
    if (newFlyingStep === 4 && previousFlyingStep < 4) {
      this.grantLetterIfEligible()
    } else if (newFlyingStep < 4 && previousFlyingStep === 4) {
      let safetyLimit = 10
      while (this.items.includes(Item.LETTER) && safetyLimit-- > 0) {
        removeInArray(this.items, Item.LETTER)
      }
    }
  }

  updateArtificialItems(
    previousSynergies: Map<Synergy, number>,
    updatedSynergies: Map<Synergy, number>
  ): boolean {
    let needsRecomputingSynergiesAgain = false

    const previousNbArtifItems = getSynergyTier(
      previousSynergies,
      Synergy.ARTIFICIAL
    )
    const newNbArtifItems = getSynergyTier(updatedSynergies, Synergy.ARTIFICIAL)

    if (newNbArtifItems > previousNbArtifItems) {
      // some artificial items are gained
      const gainedArtificialItems = this.artificialItems.slice(
        previousNbArtifItems,
        newNbArtifItems
      )
      gainedArtificialItems.forEach((item) => {
        this.items.push(item)
      })
    } else if (newNbArtifItems < previousNbArtifItems) {
      // some artificial items are lost
      const lostArtificialItems = this.artificialItems.slice(
        newNbArtifItems,
        previousNbArtifItems
      )

      const removeArtificialItem = (item: Item) => {
        // first check held items
        const pokemons = schemaValues(this.board)
        for (const pokemon of pokemons) {
          if (pokemon.items.has(item)) {
            pokemon.removeItem(item, this)

            if (item in SynergyGivenByItem && !isOnBench(pokemon)) {
              needsRecomputingSynergiesAgain = true
            }
            return // break for loop to remove only one
          }
        }

        // if not found check player item bench
        removeInArray<Item>(this.items, item)
      }

      lostArtificialItems.forEach(removeArtificialItem)
    }

    return needsRecomputingSynergiesAgain
  }

  getScarvesItemsWithNbScarves(n: number): Item[] {
    let i = 0
    const scarves: Item[] = []
    while (n > 0) {
      const scarf = this.scarvesItems[i] ?? Item.SILK_SCARF
      n -= scarf === Item.NULLIFY_BANDANNA ? 2 : 1
      if (n >= 0) {
        scarves.push(scarf)
        i++
      }
    }
    return scarves
  }

  updateScarves(
    previousSynergies: Map<Synergy, number>,
    updatedSynergies: Map<Synergy, number>
  ): boolean {
    let needsRecomputingSynergiesAgain = false
    const previousNbNormalScarves = getSynergyTier(
      previousSynergies,
      Synergy.NORMAL
    )
    const previousScarves = this.getScarvesItemsWithNbScarves(
      previousNbNormalScarves
    )
    const newNbNormalScarves = getSynergyTier(updatedSynergies, Synergy.NORMAL)
    const newScarves = this.getScarvesItemsWithNbScarves(newNbNormalScarves)

    if (newScarves.length > previousScarves.length) {
      // some scarves are gained
      const gainedScarves = newScarves.slice(
        previousScarves.length,
        newScarves.length
      )
      gainedScarves.forEach((item) => {
        this.items.push(item)
      })
    } else if (newScarves.length < previousScarves.length) {
      // some scarves are lost
      const lostScarves = [...previousScarves]
      newScarves.forEach((s) => removeInArray(lostScarves, s))
      const removeScarf = (item: ScarfItem) => {
        // first check held items
        const pokemons = schemaValues(this.board)
        for (const pokemon of pokemons) {
          if (pokemon.items.has(item)) {
            pokemon.removeItem(item, this)

            if (item in SynergyGivenByItem && !isOnBench(pokemon)) {
              needsRecomputingSynergiesAgain = true
            }
            return // break for loop to remove only one
          }
        }

        // if not found check player item bench
        removeInArray<Item>(this.items, item)
      }

      lostScarves.forEach(removeScarf)
    }

    return needsRecomputingSynergiesAgain
  }

  updateWeatherRocks() {
    const nbWeatherRocks = Math.min(
      3,
      getSynergyTier(this.synergies, Synergy.ROCK)
    )

    /* CRYSTAL_CLUSTERS: reaching the awakening tier for the first time hands
       over two extra rocks outright, so they join the collected pool rather
       than the tier-capped inventory slice below */
    if (
      this.blessings?.includes(Blessing.CRYSTAL_CLUSTERS) &&
      !this.crystalClustersRocksGranted &&
      getSynergyTier(this.synergies, Synergy.ROCK) >= ROCK_AWAKENING_TIER
    ) {
      this.crystalClustersRocksGranted = true
      for (let i = 0; i < CRYSTAL_CLUSTERS_ROCKS_GRANTED; i++) {
        this.weatherRocks.push(pickRandomIn(WeatherRocks))
      }
    }

    let weatherRockInInventory
    do {
      weatherRockInInventory = this.items.findIndex((item, index) =>
        isIn(WeatherRocks, item)
      )
      if (weatherRockInInventory != -1) {
        this.items.splice(weatherRockInInventory, 1)
      }
    } while (weatherRockInInventory != -1)

    if (nbWeatherRocks > 0) {
      // The rocks you're entitled to hold: the most-recently collected ones, up
      // to the tier cap (and never more than you've actually collected).
      const nbOwned = Math.min(nbWeatherRocks, this.weatherRocks.length)
      const inInventory = this.weatherRocks.slice(-nbOwned)
      // Remove the SPECIFIC rocks currently locked into an awakening charge, by
      // type — they're in use until the Pokémon shatters. Removing by type (not
      // just by count) matters when the collected rocks are mixed: dropping the
      // icy rock must keep your fossil fragments, not trim whichever is last.
      schemaValues(this.board).forEach((p) => {
        if (p.awakeningRock !== "") {
          const idx = inInventory.indexOf(p.awakeningRock as Item)
          if (idx !== -1) inInventory.splice(idx, 1)
        }
      })
      this.items.push(...inInventory)
    }
  }

  updateTms(
    previousSynergies: Map<Synergy, number>,
    updatedSynergies: Map<Synergy, number>
  ) {
    const previousNbTMs = getSynergyTier(previousSynergies, Synergy.HUMAN)
    const newNbTMs = getSynergyTier(updatedSynergies, Synergy.HUMAN)
    if (previousNbTMs < newNbTMs) {
      // some TMs are gained
      const gainedTMs = this.tms.slice(previousNbTMs, newNbTMs)
      this.items.push(...gainedTMs)
    } else if (newNbTMs < previousNbTMs) {
      // some TMs are lost, we need to remove them from the inventory and from the pokemons that hold them
      const lostTMs = this.tms.slice(newNbTMs, previousNbTMs)
      lostTMs.forEach((tm) => {
        removeInArray(this.items, tm)
        const pokemonWithThisTm = schemaValues(this.board).find(
          (p) => p.tm === AbilityPerTM[tm]
        )
        if (pokemonWithThisTm) {
          pokemonWithThisTm.tm = Ability.DEFAULT
          const baseData = getPokemonData(pokemonWithThisTm.name)
          pokemonWithThisTm.skill = baseData.skill
          pokemonWithThisTm.maxPP = baseData.pp
        }
      })
    }
  }

  updateFishingRods() {
    const fishingLevel = getSynergyTier(this.synergies, Synergy.WATER)

    if (this.items.includes(Item.OLD_ROD) && fishingLevel !== 1)
      removeInArray<Item>(this.items, Item.OLD_ROD)
    if (this.items.includes(Item.GOOD_ROD) && fishingLevel !== 2)
      removeInArray<Item>(this.items, Item.GOOD_ROD)
    if (this.items.includes(Item.SUPER_ROD) && fishingLevel !== 3)
      removeInArray<Item>(this.items, Item.SUPER_ROD)

    if (this.items.includes(Item.OLD_ROD) === false && fishingLevel === 1)
      this.items.push(Item.OLD_ROD)
    if (this.items.includes(Item.GOOD_ROD) === false && fishingLevel === 2)
      this.items.push(Item.GOOD_ROD)
    if (this.items.includes(Item.SUPER_ROD) === false && fishingLevel === 3)
      this.items.push(Item.SUPER_ROD)
  }

  updateChefsHats() {
    const gourmetLevel = getSynergyTier(this.synergies, Synergy.GOURMET)
    const newNbHats = [0, 1, 1, 2][gourmetLevel] ?? 0
    const hatHolders = schemaValues(this.board).filter((p) =>
      p.items.has(Item.CHEF_HAT)
    )
    let currentNbHats =
      this.items.filter((item) => item === Item.CHEF_HAT).length +
      hatHolders.length

    do {
      if (newNbHats > currentNbHats) {
        this.items.push(Item.CHEF_HAT)
        currentNbHats++
      } else if (newNbHats < currentNbHats) {
        if (this.items.includes(Item.CHEF_HAT)) {
          removeInArray<Item>(this.items, Item.CHEF_HAT)
          currentNbHats--
        } else {
          hatHolders.at(-1)?.removeItem(Item.CHEF_HAT, this)
          hatHolders.pop()
          currentNbHats--
        }
      }
    } while (newNbHats !== currentNbHats)
  }

  updateFairyWands() {
    const newFairyLevel = getSynergyTier(this.synergies, Synergy.FAIRY)
    const nbWandsByLevel = [0, 1, 2, 3, 4]
    const newNbWands = nbWandsByLevel[newFairyLevel] ?? 0
    /* wands granted by FIND_A_LOST_WAND are permanent, so they must not count
       towards the synergy total or a Fairy drop would strip one back out */
    const blessingWandsHeld = [...this.blessingWands]
    const currentNbWands = this.items.filter((item) => {
      if (!isIn(Wands, item)) return false
      const grantedIndex = blessingWandsHeld.indexOf(item)
      if (grantedIndex >= 0) {
        blessingWandsHeld.splice(grantedIndex, 1)
        return false
      }
      return true
    }).length
    const pendingChoices = this.choices.filter((c) => c.type === "wand")

    /* 4 cases to cover:
    - wands to be given
    - wands to be removed
    - wands choices to be given
    - wands choices to be removed
    */
    if (
      currentNbWands < newNbWands &&
      currentNbWands < this.fairyWands.length
    ) {
      // wands to be given
      const gainedWands = this.fairyWands.slice(currentNbWands, newNbWands)
      this.items.push(...gainedWands)
    }

    if (this.fairyWands.length + pendingChoices.length < newNbWands) {
      // player has to choose between wands
      for (
        let i = this.fairyWands.length + pendingChoices.length;
        i < newNbWands;
        i++
      ) {
        if (i in FAIRY_WANDS_BY_SYNERGY_LEVEL) {
          this.choices.push(
            new PlayerChoice({
              type: "wand",
              items: [...this.fairyWandChoicesRolls[i]]
            })
          )
        }
      }
    }

    if (
      pendingChoices.length > 0 &&
      newNbWands < currentNbWands + pendingChoices.length
    ) {
      // some pending choices need to be cancelled
      const nbChoicesToCancel = max(pendingChoices.length)(
        currentNbWands + pendingChoices.length - newNbWands
      )
      pendingChoices.slice(-nbChoicesToCancel).forEach((choiceToCancel) => {
        this.choices.splice(
          this.choices.findIndex((c) => c.id === choiceToCancel.id),
          1
        )
      })
    }

    if (newNbWands < currentNbWands) {
      // some wands are lost, we need to remove them from the inventory
      const lostWands = this.fairyWands.slice(newNbWands, currentNbWands)
      lostWands.forEach((wand) => {
        removeInArray(this.items, wand)
      })
    }
  }

  updatePillars() {
    const expectedNbPillarsByRank = [0, 0, 0]
    schemaValues(this.board)
      .filter(
        (p) => getPokemonBaseline(p.name) === Pkm.TIMBURR && !isOnBench(p)
      )
      .forEach((p) => {
        expectedNbPillarsByRank[p.stars - 1] +=
          p.name === Pkm.CONKELDURR ? 2 : 1
      })

    for (let rank = 0; rank < 3; rank++) {
      const currentPillars = schemaValues(this.board).filter(
        (p) => p.name === Pillars[rank]
      )
      const nbExpectedPillars = expectedNbPillarsByRank[rank]
      if (currentPillars.length < nbExpectedPillars) {
        const nbPillarsToAdd = nbExpectedPillars - currentPillars.length
        for (let i = 0; i < nbPillarsToAdd; i++) {
          const freeSpace = getFirstAvailablePositionOnBoard(this.board, 1)
          if (freeSpace) {
            const pillar = PokemonFactory.createPokemonFromName(
              Pillars[rank],
              this
            )
            pillar.positionX = freeSpace[0]
            pillar.positionY = freeSpace[1]
            this.board.set(pillar.id, pillar)
          }
        }
      } else if (nbExpectedPillars < currentPillars.length) {
        for (let i = 0; i < currentPillars.length - nbExpectedPillars; i++) {
          this.board.delete(currentPillars[i].id)
        }
      }
    }
  }

  updateBugNest() {
    const hasBugNest = getSynergyTier(this.synergies, Synergy.BUG) >= 4
    let nest = schemaValues(this.board).find((p) => p.name === Pkm.BUG_NEST)
    if (hasBugNest && !nest) {
      const freeSpace = getFirstAvailablePositionOnBoard(this.board, 1)
      if (freeSpace) {
        nest = PokemonFactory.createPokemonFromName(Pkm.BUG_NEST, this)
        nest.positionX = freeSpace[0]
        nest.positionY = freeSpace[1]
        this.board.set(nest.id, nest)
      }
    } else if (nest && !hasBugNest) {
      this.board.delete(nest.id)
    }
  }

  /* Single source of truth for "can this player encounter this regional mon".
     Every availability gate must go through this and not raw isInRegion, or a
     mon can end up seeded into the pool but filtered out of the shop roll */
  canFindRegionalPokemon(pkm: Pkm, state?: GameState): boolean {
    if (this.map === "town") return false
    if (new PokemonClasses[pkm](pkm).isInRegion(this.map, state!)) return true
    // the two Shellos have mutually exclusive region gates, so only
    // STAR_CROSSED_SEAS can make both findable at once
    return (
      (pkm === Pkm.SHELLOS_EAST_SEA || pkm === Pkm.SHELLOS_WEST_SEA) &&
      this.blessings?.includes(Blessing.STAR_CROSSED_SEAS) === true &&
      RegionDetails[this.map]?.synergies.includes(Synergy.AMORPHOUS) === true
    )
  }

  updateRegionalPool(
    state: GameState,
    mapChanged: boolean,
    previousMap?: string
  ) {
    if (this.map === "town") {
      resetArraySchema(this.regionalPokemons, [])
      return
    }

    const newRegionalPokemons = PRECOMPUTED_REGIONAL_MONS.filter((p) =>
      this.canFindRegionalPokemon(p, state)
    )

    if (mapChanged) {
      state.shop.resetRegionalPool(this)
      newRegionalPokemons.forEach((p) => {
        const isVariant = Object.values(PkmRegionalVariants).some((variants) =>
          variants.includes(p)
        )
        if (getPokemonData(p).stars === 1 && !isVariant) {
          state.shop.addRegionalPokemon(p, this)
        }
      })

      if (state.specialGameRule === SpecialGameRule.REGIONAL_SPECIALTIES) {
        if (previousMap) {
          const { synergies: previousSynergies } = RegionDetails[previousMap]
          previousSynergies.forEach((synergy) => {
            this.bonusSynergies.set(
              synergy,
              min(0)((this.bonusSynergies.get(synergy) ?? 0) - 1)
            )
          })
        }

        const { synergies, regionalSpeciality } = RegionDetails[this.map]
        synergies.forEach((synergy) => {
          this.bonusSynergies.set(
            synergy,
            (this.bonusSynergies.get(synergy) ?? 0) + 1
          )
        })
        this.updateSynergies()
        if (regionalSpeciality) {
          this.board.forEach((pokemon) => {
            if (pokemon.canEat && !pokemon.dishes.has(regionalSpeciality)) {
              pokemon.dishes.add(regionalSpeciality)
            }
          })
        }
      }

      // Cannot be a ConditionBasedEvolutionRule because it has another CountEvolutionRule for Wormadam
      const burmys = schemaValues(this.board).filter(
        (p) => p.passive === Passive.BURMY
      )
      if (burmys.length > 0 && state.stageLevel >= 20) {
        const cloakTypesByBurmy = new Map<Pkm, Synergy>([
          [Pkm.BURMY_PLANT, Synergy.GRASS],
          [Pkm.BURMY_SANDY, Synergy.GROUND],
          [Pkm.BURMY_TRASH, Synergy.ARTIFICIAL]
        ])
        const cloakTypes = burmys
          .map((burmy) => cloakTypesByBurmy.get(burmy.name))
          .filter((s): s is Synergy => s != null)
        if (
          cloakTypes.some(
            (type) =>
              RegionDetails[this.map]?.synergies.includes(type) === false
          )
        ) {
          const burmyEvolving = burmys[0]
          burmyEvolving.evolutionRule.divergentEvolution = () => Pkm.MOTHIM
          EvolutionManager.evolve(burmyEvolving, this)
        }
      }
    }

    newRegionalPokemons.sort(
      (a, b) => getPokemonData(a).stars - getPokemonData(b).stars
    )

    resetArraySchema(
      this.regionalPokemons,
      newRegionalPokemons.filter((p, index, array) => {
        const pkm = getPokemonData(PkmFamily[p])
        const evolution = pkm.evolution
        const baseVariant = PkmRegionalBaseVariants[p]
        if (baseVariant) {
          const basePkm = getPokemonData(baseVariant)
          if (basePkm.additional) {
            const addpickStages = {
              [Rarity.UNCOMMON]: AdditionalPicksStages[0],
              [Rarity.RARE]: AdditionalPicksStages[1],
              [Rarity.EPIC]: AdditionalPicksStages[2]
            }
            const addPickStage = addpickStages[basePkm.rarity]
            if (
              addPickStage > 0 &&
              (state.stageLevel < addPickStage ||
                state.additionalPokemons.includes(baseVariant) === false)
            ) {
              return false // do not show the regional variant if its base variant is not in additional picks
            }
          }
        }

        return (
          pkm.rarity !== Rarity.UNIQUE && // do not show uniques in regional pokemons
          pkm.rarity !== Rarity.LEGENDARY && // do not show legendaries in regional pokemons
          array.findIndex((p2) => PkmFamily[p] === PkmFamily[p2]) === index && // dedup same family
          !(
            evolution === p ||
            (evolution && getPokemonData(evolution).evolution === p)
          )
        ) // exclude non divergent evos
      })
    )
  }

  onLightChange(hasLightActive: boolean) {
    this.board.forEach((pokemon) => {
      const inSpotlight =
        hasLightActive &&
        ((pokemon.positionX === this.lightX &&
          pokemon.positionY === this.lightY) ||
          pokemon.items.has(Item.SHINY_STONE))

      PassiveEffects[pokemon.passive]?.forEach((effect) => {
        if (effect instanceof OnSpotlightChangeEffect) {
          effect.apply({ pokemon, player: this, inSpotlight })
        }
      })
    })
  }

  registerPlayedPokemons() {
    let legendaryCount = 0
    let count = 0
    this.board.forEach((pokemon) => {
        if (!isOnBench(pokemon) && pokemon.passive !== Passive.INANIMATE && pokemon.passive !== Passive.FIGHTING_SUBSTITUTE) {
        count++
        this.pokemonsPlayed.add(pokemon.name)
        if (pokemon.rarity === Rarity.LEGENDARY) {
          legendaryCount++
        }
      }
    })
    if (legendaryCount >= 3) {
      this.titles.add(Title.LEGEND)
    }
    if (count >= 10) {
      this.titles.add(Title.DECURION)
    }
  }

  collectMulch(amount: number) {
    this.mulch += amount
    if (this.mulch >= this.mulchCap) {
      this.mulch = this.mulch % this.mulchCap
      const index = MulchStockCaps.indexOf(this.mulchCap)
      this.mulchCap = MulchStockCaps[index + 1] ?? MulchStockCaps.at(-1)
      const mulchCollected =
        this.items.filter((i) => i === Item.RICH_MULCH).length +
        this.flowerPots.reduce((acc, pot) => acc + pot.stars, 0) -
        8
      this.items.push(mulchCollected >= 8 ? Item.AMAZE_MULCH : Item.RICH_MULCH)
    }
  }

  getFinalizedLines(): Set<Pkm> {
    if (this.specialGameRule === SpecialGameRule.FAMILY_OUTING) return new Set() // in family outing mode, do not remove finished lines from shop
    const finals = new Set(
      schemaValues(this.board)
        .filter((pokemon) => pokemon.final)
        .map((pokemon) => getPokemonBaseline(pokemon.name))
    )
    this.pokemonsTrainingInDojo.forEach((pokemonInDojo) => {
      if (pokemonInDojo.pokemon.final) {
        finals.add(getPokemonBaseline(pokemonInDojo.pokemon.name))
      }
    })
    // special case for burmy line because of the exclusive convergent evolution rule
    if (finals.has(Pkm.BURMY_PLANT)) {
      finals.add(Pkm.BURMY_TRASH)
      finals.add(Pkm.BURMY_SANDY)
    }
    return finals
  }

  completeMissionOrder(missionOrder: MissionOrder) {
    removeInArray<Item>(this.items, missionOrder)
    this.spawnWanderingPokemon({
      shiny: false,
      pkm: Pkm.CHATOT,
      type: WandererType.DIALOG,
      behavior: WandererBehavior.SPECTATE
    })
    setTimeout(() => {
      this.addMoney(30, true, null)
    }, 7000)
  }

  chargeCellBattery(amount: number) {
    this.cellBattery += amount
    if (this.cellBattery >= 100) {
      this.items.push(Item.CELL_BATTERY)
      this.cellBattery %= 100
    }
  }

  updateGameStats(state: GameState) {
    const simulation = state.simulations.get(this.simulationId)
    if (!simulation) return
    const team = simulation.entities.filter((e) => e.team === this.team)

    this.gameStats.maxAP = Math.max(
      this.gameStats.maxAP,
      ...team.flatMap((e) => e.ap)
    )
    this.gameStats.maxAttack = Math.max(
      this.gameStats.maxAttack,
      ...team.flatMap((e) => e.atk)
    )
    this.gameStats.maxDefense = Math.max(
      this.gameStats.maxDefense,
      ...team.flatMap((e) => e.def)
    )
    this.gameStats.maxSpecialDefense = Math.max(
      this.gameStats.maxSpecialDefense,
      ...team.flatMap((e) => e.speDef)
    )
    this.gameStats.maxHP = Math.max(
      this.gameStats.maxHP,
      ...team.flatMap((e) => e.hp)
    )
    this.gameStats.maxSpeed = Math.max(
      this.gameStats.maxSpeed,
      ...team.flatMap((e) => e.speed)
    )

    const dps = simulation.getDpsMeter(this.id)
    if (dps) {
      // These records track each Pokémon's personal best (most damage or
      // healing done by a single unit). Leave the synthetic effect rows
      // (Tidal Wave, Curse) out of it: they're team-wide totals, not real
      // Pokémon, so they shouldn't set one of these "best single unit" records.
      const dpsList = schemaValues(dps).filter(
        (d) => !SYNTHETIC_DPS_IDS.has(d.id)
      )
      this.gameStats.maxHeal = Math.max(
        this.gameStats.maxHeal,
        ...dpsList.map((d) => d.heal)
      )
      this.gameStats.maxShield = Math.max(
        this.gameStats.maxShield,
        ...dpsList.map((d) => d.shield)
      )
      this.gameStats.maxPhysicalDamage = Math.max(
        this.gameStats.maxPhysicalDamage,
        ...dpsList.map((d) => d.physicalDamage)
      )
      this.gameStats.maxSpecialDamage = Math.max(
        this.gameStats.maxSpecialDamage,
        ...dpsList.map((d) => d.specialDamage)
      )
      this.gameStats.maxTrueDamage = Math.max(
        this.gameStats.maxTrueDamage,
        ...dpsList.map((d) => d.trueDamage)
      )
    }

    if (this.history.at(-1)?.result === BattleResult.WIN) {
      this.gameStats.maxWinStreak = Math.max(
        this.gameStats.maxWinStreak,
        this.streak
      )
    }
  }

  spawnWanderingPokemon({
    pkm,
    type,
    behavior,
    data,
    delay = 0,
    shiny = chance(0.01)
  }: {
    pkm: Pkm
    type: WandererType
    behavior: WandererBehavior
    data?: string
    delay?: number
    shiny?: boolean
  }): Wanderer {
    const id = crypto.randomUUID()
    const wanderer = new Wanderer({
      id,
      pkm,
      type,
      behavior,
      data,
      shiny
    })
    setTimeout(() => {
      this.wanderers.set(id, wanderer)
    }, delay)
    return wanderer
  }
}

function pickRandomTMs() {
  const bronzeTM = pickRandomIn(TMsBronze)
  const silverTM = pickRandomIn(TMsSilver)
  const goldTM = pickRandomIn(TMsGold)
  return [bronzeTM, silverTM, goldTM]
}

function initBuriedItems() {
  const buriedItems: (Item | null)[] = new Array(24).fill(null)

  // 3 synergy gems
  for (let i = 0; i < 3; i++) {
    buriedItems[i] = pickRandomIn(SynergyGemsBuried)
  }

  // 4 trash (Trash, Leftovers, Coin, Nugget, Fossil Stone)
  for (let i = 3; i < 7; i++) {
    buriedItems[i] = pickRandomIn([
      Item.TRASH,
      Item.LEFTOVERS,
      Item.COIN,
      Item.NUGGET,
      Item.FOSSIL_STONE,
      Item.CELL_BATTERY
    ])
  }

  // 1 precious (tool, treasure box, big nugget)
  buriedItems[7] = chance(1 / 2)
    ? pickRandomIn(ToolsBuried)
    : pickRandomIn([Item.TREASURE_BOX, Item.BIG_NUGGET])

  shuffleArray(buriedItems)
  return buriedItems
}

function initFlowerPots(player: Player) {
  return [
    Pkm.HOPPIP,
    Pkm.BELLSPROUT,
    Pkm.CHIKORITA,
    Pkm.ODDISH,
    Pkm.BELLOSSOM
  ].map((pkm) => {
    const pokemon = PokemonFactory.createPokemonFromName(pkm, player)
    pokemon.action = PokemonActionState.SLEEP
    return pokemon
  })
}
