import { MapSchema, Schema, type } from "@colyseus/schema"
import { ARMOR_FACTOR, BENCH_GROUND_HOLES_OFFSET, BOARD_HEIGHT, BOARD_WIDTH, BOARD_SIDE_HEIGHT, getItemCapacity, packBoardCell } from "../config"
import {
  ScribbleShapeTint,
  ScribbleShapeType
} from "../config/game/scribble-shapes"
import {
  getWaterPondValue,
  WaterPondType
} from "../config/game/water-ponds"
import {
  AMORPHOUS_HP_BUFF_PER_SYNERGY_TIER,
  AMORPHOUS_SPEED_BUFF_PER_SYNERGY_TIER,
  MONSTER_ATTACK_BUFF_PER_SYNERGY_TIER,
  MONSTER_AP_BUFF_PER_SYNERGY_TIER,
  MONSTER_MAX_HP_BUFF_FACTOR_PER_SYNERGY_TIER,
  SynergyTiers
} from "../config/game/synergies"
import type Player from "../models/colyseus-models/player"
import { type Pokemon } from "../models/colyseus-models/pokemon"
import PokemonFactory from "../models/pokemon-factory"
import { getPokemonData } from "../models/precomputed/precomputed-pokemon-data"
import { PRECOMPUTED_POKEMONS_PER_TYPE } from "../models/precomputed/precomputed-types"
import type GameRoom from "../rooms/game-room"
import {
  DPS_METEOR_SHOWER_ID,
  DPS_STORM_ID,
  DPS_TIDAL_WAVE_ID,
  DPS_UNISON_ID,
  type IPokemon,
  type IPokemonEntity,
  type ISimulation,
  Title,
  Transfer
} from "../types"
import type { DisplayText } from "../types/strings/DisplayText"
import { Ability } from "../types/enum/Ability"
import { distanceC } from "../utils/distance"
import { Awakening } from "../types/enum/Awakening"
import { EffectEnum } from "../types/enum/Effect"
import {
  AttackType,
  BattleResult,
  Orientation,
  PokemonActionState,
  Rarity,
  Team,
  GameMode
} from "../types/enum/Game"
import {
  Berries,
  CraftableItemsNoScarves,
  Item,
  ItemComponents,
  ItemRecipe,
  NonSpecialBerries,
  Seeds,
  SynergyGems,
  SynergyGivenByGem,
  SynergyGivenByItem,
  SynergyItems,
  SynergyStones,
  Tools,
  WeatherRocksByWeather
} from "../types/enum/Item"
import { Passive } from "../types/enum/Passive"
import { Pkm, PkmFamily, Unowns } from "../types/enum/Pokemon"
import { Synergy } from "../types/enum/Synergy"
import { getSynergyTier } from "../models/colyseus-models/synergies"
import {
  Blessing,
  BLOSSOM_FESTIVAL_CASTS_PER_RANGE_GAIN,
  HEX_MANIAC_STATUS_DURATION,
  NOT_THE_BEES_MAX_COMBEES,
  POLLUTED_SEA_POISON_DURATION,
  STAR_CROSSED_SEAS_ABILITY_POWER,
  STAR_CROSSED_SEAS_MAX_HP,
  FAST_DELIVERY_ATTACK_PER_SEED,
  FAST_DELIVERY_LUCK_PER_SEED,
  MONSTER_KING_BEAM_INTERVAL,
  IGNITION_SHIELD,
  IGNITION_SPEED,
  IGNITION_LIFE_HEAL_ON_KO,
  FERTILE_SOIL_HOLE_MAX_HP_RATIO,
  TIDAL_SURGE_ITEMS_REQUIRED,
  DRAGON_FANG_ABILITY_POWER_PER_STAR,
  SECOND_WIND_RESURRECTION_INTERVAL,
  FIRST_WIND_HEAL_DELAY,
  FIRST_WIND_HEAL_RATIO,
  IMPENDING_DOOM_DELAY,
  QUEST_CRIT_POWER_TARGET,
  QUEST_ABSORB_DAMAGE_BLOCKED_TARGET,
  ASCENSION_BREAK_FREE_CHECK_INTERVAL,
  ASCENSION_EXTRA_LIGHT_APPLICATIONS,
  EXHAUSTING_FLAME_LUCK_PER_STAR,
  SACRIFICE_DELAY,
  SACRIFICE_ENRAGE_DURATION,
  SACRIFICE_EXECUTE_DAMAGE,
  BUG_CLONE_TRIPLE,
  SHAPELESS_SYNERGIES_HP_RATIO,
  SHAPELESS_SYNERGIES_MIN_ACTIVE,
  SHAPELESS_SYNERGIES_SPEED_RATIO,
  SHARE_THE_SPOTLIGHT_RATIO,
  MISFITS_ABILITY_POWER,
  MISFITS_ATTACK,
  MISFITS_DEFENSE,
  MISFITS_MAX_HP,
  MISFITS_SPECIAL_DEFENSE,
  MISFITS_SPEED,
  PROTECT_THE_WEAK_MAX_HP,
  PROTECT_THE_WEAK_SPEED,
  VAMPIRIC_HEAL_RATIO,
  HERO_BLESSING_FAMILY,
  AURORA_BOREALIS_REDUCTION_PER_ACTIVE_SYNERGY,
  FLEXIBILITY_HP_PER_SYNERGY_ITEM,
  FLOWER_QUEEN_MAX_PP_REDUCTION,
  FLOWER_QUEEN_MIN_MAX_PP,
  LEAF_TORNADO_BOUNCES,
  LEAF_TORNADO_DAMAGE_RATIO,
  MARIACHI_MAYHEM_CONFUSION_DURATION,
  FROST_GEAR_MAX_PP,
  FROST_GEAR_RANGE_BONUS,
  HIGH_BREACHING_MAX_PP,
  MORTAR_SHELLS_ATTACK_RATIO,
  MORTAR_SHELLS_RANGE_BONUS,
  MORTAR_SHELLS_SPEED_RATIO,
  ORBITAL_STRIKE_RANGE_BONUS,
  SHUTTLE_BUS_MAX_PP,
  POTENTIAL_ENERGY_SHIELD,
  POTENTIAL_ENERGY_SPEED,
  QUEST_PILLAGE_CRIT_PER_GOLD,
  QUIET_STRENGTH_LOW_LIFE_THRESHOLD,
  SHINY_SAFEGUARD_HP_THRESHOLD,
  SHINY_SAFEGUARD_PROTECT_DURATION,
  GUARD_FORMATION_SHARE_RATIO,
  BRAVE_FORMATION_CRIT_CHANCE_PER_EMPTY_TILE,
  TOUGH_FORMATION_DEFENSE_PER_ADJACENT_ALLY,
  LASTING_EFFECTS_LUCK,
  PULSE_SHIELD_SPEED_RATIO,
  PULSE_SHIELD_ALLY_SPEED,
  MINIMALIST_PP_PER_EMPTY_SLOT,
  MINIMALIST_II_NO_ITEM_AP,
  CRITICAL_RUSH_SPEED,
  CRITICAL_RUSH_DURATION,
  CRITICAL_RUSH_II_STACK_SPEED,
  CRITICAL_PATH_CRIT_POWER_FALLBACK,
  CRITICAL_PATH_II_CRIT_CHANCE,
  LONE_WOLF_SHIELD_RATIO,
  LONE_WOLF_SPEED,
  LONE_WOLF_SPEED_DURATION,
  PARTING_GIFT_ITEMS_REQUIRED,
  PARTING_GIFT_SHIELD,
  REQUIEM_SHIELD_RATIO,
  REVEILLE_DELAY,
  REVEILLE_WALK_DELAY,
  REVEILLE_BENCH_SLOTS,
  VITAMINS_ABILITY_POWER,
  VITAMINS_ATTACK,
  VITAMINS_SPEED,
  HAIL_TO_THE_KING_MAX_HP,
  HAIL_TO_THE_KING_ATTACK,
  HAIL_TO_THE_KING_DEFENSE,
  HAIL_TO_THE_KING_SPECIAL_DEFENSE,
  HAIL_TO_THE_KING_SPEED,
  YOU_FORGOT_SOMETHING_DELAY,
  JESTER_CRIT_POWER_PER_STAR,
  JESTER_SUBSTITUTE_MAX_PP,
  JESTER_SUBSTITUTE_MAX_STARS,
  GRAND_IGNITION_TRUE_DAMAGE_RATIO,
  GRAND_IGNITION_MAX_HP_BURNED_RATIO,
  GRAND_IGNITION_EMBER_DAMAGE_RATIO,
  GRAND_IGNITION_TICK_INTERVAL,
  GRAND_IGNITION_MAX_PP_REDUCTION,
  GRAND_IGNITION_MIN_MAX_PP,
  GRAND_IGNITION_TORCH_TRAVEL_DELAY,
  VALOR_ATTACK_PER_STAR,
  VALOR_SHIELD_PER_STAR,
  COLONY_SPEWPA_HATCH_TIME,
  TOXIC_RESONANCE_POISON_DURATION,
  TOXIC_RESONANCE_ALLY_PP,
  TOXIC_RESONANCE_BEAT_INTERVAL,
  TOXIC_RESONANCE_HARMONIC_BEAT,
  TOXIC_RESONANCE_HARMONIC_ALLY_PP,
  isGrudgeSubstitute,
  TIDAL_GUARDIAN_WHIRLPOOL_TARGETS,
  FOGBOUND_LAKE_FIREFLIES,
  OVERLOAD_CAST_INTERVAL,
  OVERLOAD_FIRST_CAST_DELAY,
  BULL_LEAPING_FOLLOW_UP_DELAY,
  BULL_LEAPING_ARRIVAL_CHECK_INTERVAL,
  BULL_LEAPING_ARRIVAL_MAX_CHECKS,
  ICY_REFLECTION_TRIGGER_MAX_HP_RATIO,
  ICY_REFLECTION_CAST_DELAY,
  UNISON_METER_DAMAGE,
  UNISON_TRIGGERED_PROGRESS_OFFSET,
  UNISON_FINISHED_PROGRESS,
  UNISON_CHECK_INTERVAL,
  UNISON_STRIKE_ATTACK_RATIO,
  UNISON_NOVA_DELAY,
  UNISON_STRIKE_DELAY,
  UNISON_STARFALL_WARNING,
  GEM_HARVEST_ABILITY_POWER_PER_GEM,
  MAGNETOSPHERE_PULSE_INTERVAL,
  MAGNETOSPHERE_ATTRACT_MOVE_DELAY,
  MAGNETOSPHERE_ATTRACT_PARALYSIS_DURATION,
  MAGNETOSPHERE_REPEL_LOCK_DURATION,
  BURNING_FORCE_ATTACK_RATIO,
  COMBAT_BLESSING_TRIGGER_HP_RATIO,
  COMBAT_BLESSING_DURATION,
  DRILL_ATTACK_RATIO,
  SHATTER_DEFENSE_RATIO,
  SURGE_SPEED_RATIO,
  GEAR_SHIELD_PER_ITEM,
  MAGIC_SHIELD_ALLY_AP,
  BRUTE_SHIELD_ATTACK_RATIO,
  BRUTE_SHIELD_ALLY_ATTACK,
  STAR_GUARD_DEFENSE_PER_STAR,
  STEAM_ENGINE_SPEED_ON_ATTACK,
  FROZEN_OCEAN_WAVE_RATIO,
  BLIGHTED_GARDEN_POKERUS_MULCH,
  HUMAN_HORROR_POSSESSION_DURATION,
  HUMAN_HORROR_POSSESSION_PER_HUMAN_TIER,
  HUMAN_HORROR_ABILITIES_BY_TIER,
  CRYSTAL_EXOSKELETON_SHIELD,
  CRYSTAL_EXOSKELETON_SHELL_MAX_HP_RATIO,
  MACHINE_RESIDUE_SHIELD,
  WONDER_BOX_BLESSED_ITEMS,
  CHOICE_SPECS_ALLY_MIN_MAX_PP,
  hasGluttonGrowth
} from "../types/enum/Blessing"
import { GracideaBlossomEffect } from "./effects/items"
import { isSynergyActiveForPlayer } from "../config/game/blessings"
import { getFlowerPotStarCount } from "./flower-pots"
import { Weather, WeatherEffects } from "../types/enum/Weather"
import type { IPokemonData } from "../types/interfaces/PokemonData"
import { count, isIn, removeInArray } from "../utils/array"
import { getAvatarString } from "../utils/avatar"
import {
  getFirstAvailablePositionInBench,
  getLastAvailablePositionInBench,
  isOnBench
} from "../utils/board"
import { DEFAULT_CRIT_POWER } from "../config/game/battle"
import { logger } from "../utils/logger"
import { clamp, max, min } from "../utils/number"
import { chance, pickRandomIn, randomBetween, shuffleArray } from "../utils/random"
import { getOrientation, OrientationVector } from "../utils/orientation"
import { healPlayerLife } from "../utils/player-life"
import { schemaValues } from "../utils/schemas"
import {
  onFossilUnlockFightWon,
  onFossilUnlockTidalWave
} from "../services/fossil-unlocks"
import { AbilityStrategies } from "./abilities/abilities"
import { applyWhirlpoolDamage } from "./abilities/whirlpool"
import type { SurfStrategy } from "./abilities/surf"
import { Board } from "./board"
import Dps from "./dps"
import { DishEffects } from "./effects/dishes"
import {
  OnAttackEffect,
  OnAttackReceivedEffect,
  OnDamageReceivedEffect,
  OnDishConsumedEffect,
  OnHitEffect,
  PeriodicEffect,
  OnMoveEffect,
  OnSimulationStartEffect,
  OnSpawnEffect,
  OnShieldDepletedEffect,
  OnAbilityCastEffect,
  OnKillEffect,
  OnDeathEffect
} from "./effects/effect"
import { WaterSpringEffect } from "./effects/passives"
import {
  cloneBugs,
  electricTripleAttackEffect,
  FightingKnockbackEffect,
  FireHitEffect,
  FlyingProtectionEffect,
  fightingTrainingEffect,
  GroundHoleEffect,
  humanHealEffect,
  MonsterKillEffect,
  normalShieldEffect,
  OnFieldDeathEffect,
  onFlowerMonDeath,
  PoisonPPExplosionEffect,
  pounceWandEffect,
  SoundCryEffect,
  wildBerserkEffect,
  rockDeathExplosionT1,
  rockDeathExplosionT2,
  rockDeathExplosionT3,
  DarkSubstituteEffect,
  makeFrostBarrierEffect,
  isIgnitionActive
} from "./effects/synergies"
import { PokemonEntity } from "./pokemon-entity"
import { DelayedCommand } from "./simulation-command"
import { SpecialGameRule } from "../types/enum/SpecialGameRule"
import {
  getStrongestUnit,
  getStrongestUnitOfFamily,
  getStrongestUnits,
  getUnitScore
} from "./unit-score"
import { SeedEffects } from "./seeds"
import { getAltFormForPlayer } from "../config/game/pokemons"

const FIELD_STATUS_BY_SYNERGY: [Synergy, (entity: PokemonEntity) => void][] = [
  [Synergy.GRASS, (entity) => entity.status.addGrassField(entity)],
  [Synergy.PSYCHIC, (entity) => entity.status.addPsychicField(entity)],
  [Synergy.FAIRY, (entity) => entity.status.addFairyField(entity)],
  [Synergy.ELECTRIC, (entity) => entity.status.addElectricField(entity)]
]

const GRAND_IGNITION_CORNER_CELLS = [
  { x: 0, y: 0 },
  { x: BOARD_WIDTH - 1, y: 0 },
  { x: 0, y: BOARD_HEIGHT - 1 },
  { x: BOARD_WIDTH - 1, y: BOARD_HEIGHT - 1 }
]

function spreadNegativeStatuses(dying: PokemonEntity, board: Board) {
  board
    .getAdjacentCells(dying.positionX, dying.positionY)
    .map((cell) => cell.value)
    .filter(
      (neighbour): neighbour is PokemonEntity =>
        neighbour !== undefined && neighbour.team === dying.team
    )
    .forEach((neighbour) =>
      dying.status.transferNegativeStatus(dying, neighbour, false)
    )
}

export default class Simulation extends Schema implements ISimulation {
  @type("string") weather: Weather = Weather.NEUTRAL
  @type("string") winnerId = ""
  @type({ map: PokemonEntity }) blueTeam = new MapSchema<PokemonEntity>()
  @type({ map: PokemonEntity }) redTeam = new MapSchema<PokemonEntity>()
  @type({ map: Dps }) blueDpsMeter = new MapSchema<Dps>()
  @type({ map: Dps }) redDpsMeter = new MapSchema<Dps>()
  @type("string") id: string
  @type("string") bluePlayerId: string
  @type("string") redPlayerId: string
  @type("string") bluePartnerPlayerId: string = ""
  @type("boolean") isGhostBattle: boolean
  @type("boolean") started: boolean
  room: GameRoom
  blueEffects = new Set<EffectEnum>()
  redEffects = new Set<EffectEnum>()
  board: Board = new Board(BOARD_HEIGHT, BOARD_WIDTH)
  finished = false
  blueFlowerSpawn: number = 0
  redFlowerSpawn: number = 0
  stageLevel = 0
  bluePlayer: Player | undefined
  redPlayer: Player | undefined
  // Double Up shared PVE fights: the partner fights alongside the blue player
  bluePartnerPlayer: Player | undefined
  bluePartnerEffects = new Set<EffectEnum>()
  blueAbilitiesCast: Ability[] = []
  redAbilitiesCast: Ability[] = []
  stormLightningTimer = 0
  tidalWaveTimer = 0
  secondWindTimer = 0
  firstWindTimer = 0
  /* IMPENDING_DOOM is per owning team: a holder's shadow only strikes the units
     opposing them, so two holders in one fight run independent countdowns.
     0 means that side has no doom armed. */
  blueDoomTimer = 0
  redDoomTimer = 0
  floodWaveTimer = 0
  elderStormTimer = 0
  distortionTimer = 0
  meteorShowerTimer = 0
  // meteor impacts are queued so the damage lands ~1s after the visual starts,
  // in sync with the on-screen meteor striking down
  meteorStrikeQueue: { x: number; y: number; delay: number }[] = []
  tidalWaveCounter = 0
  entities: IPokemonEntity[] = []
  finishedAt: number = 0
  reinforcementsSent: boolean = false
  robinGemsRewardProcessed = false
  snifferDogPulledPokemonIds = new Set<string>()
  toxicResonanceByTeam = new Map<
    Team,
    { champion: PokemonEntity; beat: number }
  >()
  toxicResonanceBeatTimer = 0
  grandIgnitionByTeam = new Map<
    Team,
    { litCorners: Set<number>; ignited: boolean; champion: PokemonEntity }
  >()
  grandIgnitionTickTimer = 0
  forgottenReinforcements: {
    player: Player
    team: Team
    timer: number
  }[] = []
  reveilleReinforcements: {
    player: Player
    team: Team
    timer: number
    marching?: Pokemon[]
  }[] = []
  // flags each marched-in unit had before, so stop() restores them exactly
  reveilleLockedPokemon = new Map<
    string,
    { canBeBenched: boolean; canHoldItems: boolean }
  >()

  constructor(
    id: string,
    room: GameRoom,
    bluePlayer: Player,
    redPlayer:
      | Player
      | { id: "pve"; board: MapSchema<Pokemon>; effects?: Set<EffectEnum> },
    stageLevel: number,
    weather: Weather,
    isGhostBattle = false,
    bluePartnerPlayer?: Player
  ) {
    super()
    this.id = id
    this.room = room
    this.bluePlayer = bluePlayer
    this.redPlayer = redPlayer.id === "pve" ? undefined : (redPlayer as Player)
    this.bluePartnerPlayer = bluePartnerPlayer
    this.bluePlayerId = bluePlayer.id
    this.redPlayerId = redPlayer.id
    this.bluePartnerPlayerId = bluePartnerPlayer?.id ?? ""
    this.stageLevel = stageLevel
    this.weather = weather
    this.isGhostBattle = isGhostBattle
    this.board = new Board(BOARD_HEIGHT, BOARD_WIDTH)
    this.started = false

    this.bluePlayer.effects.forEach((e) => this.blueEffects.add(e))
    this.redPlayer?.effects.forEach((e) => this.redEffects.add(e))
    /* A PVE side has no Player behind it, so its synergies have to be handed in
       ready-made by whoever built the board. */
    if (redPlayer.id === "pve") {
      redPlayer.effects?.forEach((e) => this.redEffects.add(e))
    }
    this.bluePartnerPlayer?.effects.forEach((e) =>
      this.bluePartnerEffects.add(e)
    )

    // beforeSimulationStart hooks
    const playerEffects: [
      Player | undefined,
      Set<EffectEnum>,
      Set<EffectEnum>
    ][] = [
      [this.bluePlayer, this.blueEffects, this.redEffects],
      [this.bluePartnerPlayer, this.bluePartnerEffects, this.redEffects],
      [this.redPlayer, this.redEffects, this.blueEffects]
    ]
    for (const [player, teamEffects, opponentEffects] of playerEffects) {
      if (player) {
        player.board.forEach((pokemon, id) => {
          pokemon.beforeSimulationStart({
            simulationId: this.id,
            isGhostBattle: this.isGhostBattle,
            weather: this.weather,
            player,
            teamEffects,
            opponentEffects
          })
          if (isOnBench(pokemon)) {
            // OnBenchedDuringFightEffect should be applied here
            // the blessing unlocks the bag on its own, so a MUSCLE_BAND holder
            // can train without the team ever reaching FIGHTING 8
            const isCoached =
              teamEffects.has(EffectEnum.COACHING) &&
              (pokemon.types.has(Synergy.FIGHTING) ||
                pokemon.name === Pkm.PIKACHU)
            const trainsWithMuscleBand =
              pokemon.items.has(Item.MUSCLE_BAND) &&
              player.blessings?.includes(Blessing.MUSCLE_BAND_BLESSING)
            if (isCoached || trainsWithMuscleBand) {
              fightingTrainingEffect.apply({
                pokemon,
                player,
                simulation: this
              })
            }
          }
        })
      }
    }

    const weatherEffect = WeatherEffects.get(this.weather)
    if (weatherEffect) {
      this.blueEffects.add(weatherEffect)
      this.redEffects.add(weatherEffect)
    }

    this.finished = false
    this.winnerId = ""
    this.grandIgnitionByTeam.clear()
    this.toxicResonanceByTeam.clear()
    this.toxicResonanceBeatTimer = TOXIC_RESONANCE_BEAT_INTERVAL
    this.grandIgnitionTickTimer = GRAND_IGNITION_TICK_INTERVAL
    this.stormLightningTimer = randomBetween(4000, 8000)
    if (
      SynergyTiers[Synergy.AQUATIC].some(
        (e) =>
          this.blueEffects.has(e) ||
          this.redEffects.has(e) ||
          this.bluePartnerEffects.has(e)
      )
    ) {
      this.tidalWaveTimer = 7000
    }
    if (this.weather === Weather.FLOOD) {
      this.floodWaveTimer = 3000
    }
    if (this.weather === Weather.ELDER_STORM) {
      this.elderStormTimer = 2000
    }
    if (this.weather === Weather.DISTORTION) {
      this.distortionTimer = 5000
    }
    if (this.weather === Weather.METEOR_SHOWER) {
      this.meteorShowerTimer = 7000
    }

    this.bluePlayer.board.forEach((pokemon) => {
      if (!isOnBench(pokemon)) {
        this.addPokemon(pokemon, pokemon.positionX, pokemon.positionY - 1, Team.BLUE_TEAM)
      }
    })

    const redBoard = this.redPlayer ? this.redPlayer.board : redPlayer.board
    redBoard.forEach((pokemon) => {
      if (!isOnBench(pokemon)) {
        this.addPokemon(pokemon, pokemon.positionX, 5 - (pokemon.positionY - 1), Team.RED_TEAM)
      }
    })

    // Double Up shared PVE fight: the partner board joins the blue side,
    // shifted to the closest free cell if their usual spot is already taken
    this.bluePartnerPlayer?.board.forEach((pokemon) => {
      if (!isOnBench(pokemon)) {
        const coord = this.getClosestFreeCellTo(
          pokemon.positionX,
          pokemon.positionY - 1,
          Team.BLUE_TEAM
        )
        if (coord) {
          this.addPokemon(
            pokemon,
            coord.x,
            coord.y,
            Team.BLUE_TEAM,
            false,
            false,
            this.bluePartnerPlayer
          )
        }
      }
    })

    this.summonWeatherInstituteCastforms()
    this.applyPostEffects(bluePlayer.board, redBoard)
  }

  /* WEATHER_INSTITUTE blessing: a Castform matching the current weather joins the
     board at combat start, on the side of whoever owns the blessing */
  summonWeatherInstituteCastforms() {
    const castformByWeather: { [weather in Weather]?: Pkm } = {
      [Weather.RAIN]: Pkm.CASTFORM_RAIN,
      [Weather.ZENITH]: Pkm.CASTFORM_SUN,
      [Weather.DROUGHT]: Pkm.CASTFORM_SUN,
      [Weather.SNOW]: Pkm.CASTFORM_HAIL
    }
    const castform = castformByWeather[this.weather]
    if (!castform) return

    for (const [player, team] of [
      [this.bluePlayer, Team.BLUE_TEAM],
      [this.redPlayer, Team.RED_TEAM]
    ] as const) {
      if (!player?.blessings?.includes(Blessing.WEATHER_INSTITUTE)) continue
      const backRow = team === Team.BLUE_TEAM ? 0 : BOARD_HEIGHT - 1
      const coord =
        this.getClosestFreeCellTo(3, backRow, team) ?? this.getFirstFreeCell(team)
      if (!coord) continue
      const summoned = PokemonFactory.createPokemonFromName(castform, player)
      summoned.items.add(Item.AQUA_EGG)
      this.addPokemon(summoned, coord.x, coord.y, team, false)
    }
  }

  broadcastToSpectators(transfer: Transfer, data: any) {
    if (!this.room) return
    const players = this.room.state.players
    for (const client of this.room.clients) {
      const spectatedPlayer = players.get(client.userData?.spectatedPlayerId)
      if (spectatedPlayer?.simulationId === this.id) {
        client.send(transfer, data)
      }
    }
  }

  start() {
    this.started = true
    this.queueForgottenReinforcements()
    this.queueReveilleReinforcements()

    // Seeds targeting the strongest ally / random ally - decided once,
    // BEFORE OnSimulationStartEffect fires below, so those effects can
    // read the flags correctly
    for (const [player, team] of [
      [this.bluePlayer, this.blueTeam] as const,
      [this.bluePartnerPlayer, this.blueTeam] as const,
      [this.redPlayer, this.redTeam] as const
    ]) {
      if (!player) continue
      const strongestAllySeeds = [
        Item.DECOY_SEED,
          Item.REVIVER_SEED,
          Item.TINY_REVIVER_SEED
        ]
        if (
          strongestAllySeeds.some((seed) => player.activeSeed === seed) ||
          player.blessings?.includes(Blessing.DROP_RATES)
        ) {
          const entities = [...team.values()].filter(
            (e): e is PokemonEntity =>
              e.hp > 0 && !e.isSpawn && e.player === player
          )
          if (entities.length > 0) {
            const strongest = getStrongestUnit(entities)
            strongest.isStrongestAllyThisFight = true
          }
        }
        if (player.blessings?.includes(Blessing.LANCES_ACE)) {
          const dratiniFamily = [...team.values()].filter(
            (entity): entity is PokemonEntity =>
              entity.hp > 0 &&
              !entity.isSpawn &&
              entity.player === player &&
              PkmFamily[entity.name] === Pkm.DRATINI
          )
          if (dratiniFamily.length > 0) {
            const lancesAce = getStrongestUnit(dratiniFamily)
            lancesAce.isLancesAceThisFight = true
            lancesAce.range += 2
            lancesAce.skill = Ability.HYPER_BEAM
          }
        }
        // DOOM_SEED - random Flying ally, decided once
        if (player.activeSeed === Item.DOOM_SEED) {
          const flyingAllies = [...team.values()].filter(
            (e): e is PokemonEntity =>
              e.hp > 0 && !e.isSpawn && e.types.has(Synergy.FLYING)
          )
          if (flyingAllies.length > 0) {
            const chosen = pickRandomIn(flyingAllies)
            chosen.isDoomSeedTarget = true
          }
        }
      }

      // post simulation start hooks
      for (const team of [this.blueTeam, this.redTeam]) {
        team.forEach((entity: PokemonEntity) => {
          const boardPokemon = entity.refToBoardPokemon as Pokemon
          if (boardPokemon && boardPokemon.dishes.size > 0) {
            boardPokemon.dishes.forEach((dish) => {
              this.applyDishEffects(dish, boardPokemon, entity, entity.player)
            })
            boardPokemon.action = PokemonActionState.IDLE
            boardPokemon.dishes.clear() // consume all dishes
            boardPokemon.dishChefMaxHP.clear()
          }
          entity.getEffects(OnSimulationStartEffect).forEach((effect) => {
            effect.apply({
              simulation: this,
              player: entity.player,
              team,
              entity
            })
          })
        })
      }
    }

  getEffects(playerId: string) {
    return playerId === this.bluePlayer?.id
      ? this.blueEffects
      : playerId === this.bluePartnerPlayer?.id
        ? this.bluePartnerEffects
        : playerId === this.redPlayer?.id
          ? this.redEffects
          : undefined
  }

  // Returns (creating on first use) the synthetic Battle-Stats row that a board
  // effect accumulates its damage/heal into, on the given team's meter. `id` is
  // one of the SYNTHETIC_DPS_IDS (e.g. tidal-wave, curse); the client renders it
  // by that id, so the row's name is not used for display.
  getOrCreateSyntheticDps(team: Team, id: string): Dps {
    const meter =
      team === Team.BLUE_TEAM ? this.blueDpsMeter : this.redDpsMeter
    let dps = meter.get(id)
    if (!dps) {
      dps = new Dps(id, id)
      meter.set(id, dps)
    }
    return dps
  }

  /* Battle-Stats rows are refreshed once per tick from blueTeam/redTeam, so a
     unit deleted from those maps as it dies would never publish what it did
     while dying: death explosions, on-KO effects. Flush its final tally first */
  flushDpsMeter(pokemon: PokemonEntity) {
    const dps =
      this.blueDpsMeter.get(pokemon.id) ?? this.redDpsMeter.get(pokemon.id)
    dps?.update(
      pokemon.physicalDamage,
      pokemon.specialDamage,
      pokemon.trueDamage,
      pokemon.physicalDamageReduced,
      pokemon.specialDamageReduced,
      pokemon.shieldDamageTaken,
      pokemon.healDone,
      pokemon.shieldDone
    )
  }

  // Credit damage that has no attacker (board effects, weather, curse…) to the
  // synthetic Battle-Stats row `id`, on the team opposing the victim — so it
  // reads as damage inflicted on the enemy team, like a real attacker would.
  creditSyntheticDamage(
    victim: PokemonEntity,
    id: string,
    attackType: AttackType,
    amount: number
  ) {
    if (amount <= 0) return
    const team =
      victim.team === Team.BLUE_TEAM ? Team.RED_TEAM : Team.BLUE_TEAM
    const dps = this.getOrCreateSyntheticDps(team, id)
    // clamp at the uint16 ceiling: these rows accumulate across the whole team
    // and whole fight, so without this a large aggregate would wrap to a small
    // garbage value when Colyseus serializes the field.
    if (attackType === AttackType.PHYSICAL)
      dps.physicalDamage = Math.min(65535, dps.physicalDamage + amount)
    else if (attackType === AttackType.SPECIAL)
      dps.specialDamage = Math.min(65535, dps.specialDamage + amount)
    else dps.trueDamage = Math.min(65535, dps.trueDamage + amount)

    // This damage has no attacker, so handleDamage never emitted a floating
    // number. Emit one here, tagged with the effect id (sourceId) so the client
    // draws the effect's icon instead of an attacker portrait.
    this.broadcastToSpectators(Transfer.POKEMON_DAMAGE, {
      index: "",
      sourceId: id,
      type: attackType,
      amount: Math.round(amount),
      x: victim.positionX,
      y: victim.positionY,
      id: this.id
    })
  }

  getDpsMeter(playerId: string) {
    return playerId === this.bluePlayer?.id ||
      playerId === this.bluePartnerPlayer?.id
      ? this.blueDpsMeter
      : playerId === this.redPlayer?.id
        ? this.redDpsMeter
        : undefined
  }

  getTeam(playerId: string) {
    return playerId === this.bluePlayer?.id ||
      playerId === this.bluePartnerPlayer?.id
      ? this.blueTeam
      : playerId === this.redPlayer?.id
        ? this.redTeam
        : undefined
  }

  getOpponentTeam(playerId: string) {
    return playerId === this.bluePlayer?.id ||
      playerId === this.bluePartnerPlayer?.id
      ? this.redTeam
      : playerId === this.redPlayer?.id
        ? this.blueTeam
        : undefined
  }

  recordFirstPveKnockout(
    pokemon: PokemonEntity,
    attacker: PokemonEntity | null
  ) {
    if (
      this.redPlayerId !== "pve" ||
      pokemon.team !== Team.RED_TEAM ||
      attacker?.team !== Team.BLUE_TEAM
    ) {
      return
    }
    const player = attacker.player
    if (
      player &&
      (player === this.bluePlayer || player === this.bluePartnerPlayer) &&
      player.forgottenPvePokemon === null
    ) {
      player.forgottenPvePokemon = pokemon.name
    }
  }

  queueReveilleReinforcements() {
    const sides: [Player | undefined, Team][] = [
      [this.bluePlayer, Team.BLUE_TEAM],
      [this.isGhostBattle ? undefined : this.redPlayer, Team.RED_TEAM]
    ]
    sides.forEach(([player, team]) => {
      if (!player?.blessings?.includes(Blessing.REVEILLE)) return
      this.reveilleReinforcements.push({ player, team, timer: REVEILLE_DELAY })
    })
  }

  getReveilleBenchUnits(player: Player): Pokemon[] {
    return schemaValues(player.board).filter(
      (pokemon) =>
        isOnBench(pokemon) &&
        pokemon.positionX >= BOARD_WIDTH - REVEILLE_BENCH_SLOTS &&
        !pokemon.supportiveSoul &&
        !isGrudgeSubstitute(pokemon)
    )
  }

  // EXPLORING is the lock: no moving, selling, itemising, sending or merging
  lockReveilleUnit(pokemon: Pokemon) {
    this.reveilleLockedPokemon.set(pokemon.id, {
      canBeBenched: pokemon.canBeBenched,
      canHoldItems: pokemon.canHoldItems
    })
    pokemon.action = PokemonActionState.EXPLORING
    pokemon.canBeBenched = false
    pokemon.canHoldItems = false
  }

  placeReveilleUnit(pokemon: Pokemon, team: Team, player: Player) {
    const backRow = team === Team.BLUE_TEAM ? 0 : BOARD_HEIGHT - 1
    // the search around its own column gives up on a crowded board
    const coord =
      this.getClosestFreeCellTo(pokemon.positionX, backRow, team) ??
      this.getFirstFreeCell(team)
    if (coord) {
      this.addPokemon(pokemon, coord.x, coord.y, team, true, false, player)
    }
  }

  updateReveilleReinforcements(dt: number) {
    this.reveilleReinforcements.forEach((reinforcement) => {
      const { player, team } = reinforcement
      reinforcement.timer -= dt
      player.blessingsRef?.questProgress.set(
        Blessing.REVEILLE,
        Math.max(0, Math.ceil(reinforcement.timer / 1000))
      )

      // they leave the bench early so the walk lands them as the timer ends
      if (!reinforcement.marching && reinforcement.timer <= REVEILLE_WALK_DELAY) {
        reinforcement.marching = this.getReveilleBenchUnits(player)
        reinforcement.marching.forEach((pokemon) =>
          this.lockReveilleUnit(pokemon)
        )
      }

      if (reinforcement.timer > 0) return
      reinforcement.timer = Number.POSITIVE_INFINITY
      reinforcement.marching?.forEach((pokemon) =>
        this.placeReveilleUnit(pokemon, team, player)
      )
      const entities = team === Team.BLUE_TEAM ? this.blueTeam : this.redTeam
      entities.forEach((ally) => {
        if (ally.player === player) ally.addPP(ally.maxPP, ally, 0, false)
      })
    })
    this.reveilleReinforcements = this.reveilleReinforcements.filter(
      ({ timer }) => Number.isFinite(timer)
    )
  }

  queueForgottenReinforcements() {
    if (this.redPlayerId === "pve") return
    const players: [Player | undefined, Team][] = [
      [this.bluePlayer, Team.BLUE_TEAM],
      [this.isGhostBattle ? undefined : this.redPlayer, Team.RED_TEAM]
    ]
    players.forEach(([player, team]) => {
      if (
        player?.blessings?.includes(Blessing.YOU_FORGOT_SOMETHING) &&
        player.forgottenPvePokemon
      ) {
        this.forgottenReinforcements.push({
          player,
          team,
          timer: YOU_FORGOT_SOMETHING_DELAY
        })
      }
    })
  }

  updateForgottenReinforcements(dt: number) {
    this.forgottenReinforcements.forEach((reinforcement) => {
      reinforcement.timer -= dt
      if (reinforcement.timer > 0) return
      const coord = this.getClosestFreeCellTo(
        3,
        reinforcement.team === Team.BLUE_TEAM ? 0 : BOARD_HEIGHT - 1,
        reinforcement.team
      )
      if (!coord || !reinforcement.player.forgottenPvePokemon) return
      const pokemon = PokemonFactory.createPokemonFromName(
        reinforcement.player.forgottenPvePokemon,
        reinforcement.player
      )
      reinforcement.player.forgottenPveItems.forEach((item) =>
        pokemon.items.add(item)
      )
      this.addPokemon(
        pokemon,
        coord.x,
        coord.y,
        reinforcement.team,
        true,
        false,
        reinforcement.player
      )
      reinforcement.timer = Number.POSITIVE_INFINITY
    })
    this.forgottenReinforcements = this.forgottenReinforcements.filter(
      ({ timer }) => Number.isFinite(timer)
    )
  }

  addPokemon(
    pokemon: Pokemon,
    x: number,
    y: number,
    team: Team,
    isSpawn = false,
    skipSynergyEffects = false,
    sourcePlayer?: Player
  ) {
    const player =
      sourcePlayer ??
      (team === Team.BLUE_TEAM ? this.bluePlayer : this.redPlayer)
    if (this.room?.state.specialGameRule === SpecialGameRule.KAIJU_BATTLE) {
      pokemon.types.add(Synergy.MONSTER)
    }
    if (
      this.room?.state.specialGameRule === SpecialGameRule.AVATAR &&
      this.room.state.avatarSynergy
    ) {
      pokemon.types.add(this.room.state.avatarSynergy)
    }
    const pokemonEntity = new PokemonEntity(pokemon, x, y, team, this)
    pokemonEntity.isSpawn = isSpawn
    if (sourcePlayer) pokemonEntity.sourcePlayer = sourcePlayer
    pokemonEntity.orientation =
      team === Team.BLUE_TEAM ? Orientation.UPRIGHT : Orientation.DOWNLEFT
    if (!skipSynergyEffects) this.applySynergyEffects(pokemonEntity)
    this.applyItemsEffects(pokemonEntity)
    /* after the items, so the multiplier sees the crit power they grant and not
       only the part the synergies had applied by the time LIGHT was reached */
    this.applyMidnightSunBonuses(pokemonEntity)

    this.board.setEntityOnCell(
      pokemonEntity.positionX,
      pokemonEntity.positionY,
      pokemonEntity
    )

    const dps = new Dps(
      pokemonEntity.id,
      getAvatarString(
        pokemonEntity.index,
        pokemonEntity.shiny,
        pokemonEntity.emotion
      )
    )
    if (team == Team.BLUE_TEAM) {
      this.blueTeam.set(pokemonEntity.id, pokemonEntity)
      this.blueDpsMeter.set(pokemonEntity.id, dps)
    }
    if (team == Team.RED_TEAM) {
      this.redTeam.set(pokemonEntity.id, pokemonEntity)
      this.redDpsMeter.set(pokemonEntity.id, dps)
    }
    this.entities.push(pokemonEntity)

    /*
    Effects appliance order:
    1) Synergy effects
    2) Item effects
    3) OnSpawn effects (can include effects coming from synergies/items)
    */

    pokemon.onSpawn({ entity: pokemonEntity, simulation: this, isSpawn })
    pokemonEntity.getEffects(OnSpawnEffect).forEach((effect) => {
      effect.apply(pokemonEntity, player, isSpawn)
    })

    if (isSpawn && this.weather === Weather.BLOSSOM) {
      const apGain = pokemonEntity.types.has(Synergy.FLORA) ? 50 : 25
      pokemonEntity.addAbilityPower(apGain, pokemonEntity, 0, false)

      // Deferred one tick so abilities that finalize the spawn's maxHP after addPokemon (e.g. Shadow
      // Clone) are accounted for before the shield is computed.
      pokemonEntity.commands.push(
        new DelayedCommand(() => {
          this.board
            .getCellsInRadius(
              pokemonEntity.positionX,
              pokemonEntity.positionY,
              2,
              false
            )
            .forEach((cell) => {
              if (!cell.value || cell.value.team === pokemonEntity.team) return
              const nbBlossomShards = cell.value.player
                ? count(cell.value.player.items, Item.BLOSSOM_SHARD)
                : 0
              if (nbBlossomShards > 0) {
                cell.value.addShield(
                  Math.round(0.05 * nbBlossomShards * pokemonEntity.maxHP),
                  cell.value,
                  0,
                  false
                )
              }
            })
        }, 0)
      )
    }

    if (!isSpawn && player) {
      const cell = packBoardCell(pokemon.positionX, pokemon.positionY)
      if (this.room?.state.specialGameRule === SpecialGameRule.LIGHT_SHOW) {
        player.scribbleShapes.forEach((shape) => {
          if (shape.cells.includes(cell)) {
            this.applyScribbleShapeEffect(shape.shapeType, pokemonEntity)
          }
        })
      }
      player.blessingsRef?.waterPonds.forEach((pond) => {
        if (pond.cells.includes(cell)) {
          this.applyWaterPondEffect(pond.pondType, pokemonEntity, player)
        }
      })

      const holeIndex =
        (pokemon.positionY - 1) * BOARD_WIDTH + pokemon.positionX
      if (
        player.blessings?.includes(Blessing.FERTILE_SOIL) &&
        player.groundHoles[holeIndex] === 5
      ) {
        pokemonEntity.addMaxHP(
          Math.round(pokemonEntity.maxHP * FERTILE_SOIL_HOLE_MAX_HP_RATIO),
          pokemonEntity,
          0,
          false
        )
      }
    }

    return pokemonEntity
  }

  applyScribbleShapeEffect(
    shapeType: ScribbleShapeType,
    entity: PokemonEntity
  ) {
    // pokemon lit by a scribble shape keep their light spot during the fight
    entity.status.light = true
    entity.status.lightTint = ScribbleShapeTint[shapeType]
    switch (shapeType) {
      case ScribbleShapeType.DOT:
        entity.addAttack(Math.ceil(entity.atk * 0.5), entity, 0, false)
        entity.addAbilityPower(50, entity, 0, false)
        break
      case ScribbleShapeType.LINE:
        entity.addAttack(Math.ceil(entity.atk * 0.5), entity, 0, false)
        break
      case ScribbleShapeType.COLUMN:
        entity.addSpecialDefense(entity.speDef, entity, 0, false)
        break
      case ScribbleShapeType.L:
        entity.addLuck(30, entity, 0, false)
        break
      case ScribbleShapeType.SQUARE:
        entity.addDefense(entity.def, entity, 0, false)
        break
      case ScribbleShapeType.T:
        entity.addAbilityPower(50, entity, 0, false)
        break
      case ScribbleShapeType.TRIANGLE:
        entity.addPP(Math.ceil(entity.maxPP * 0.3), entity, 0, false)
        break
      case ScribbleShapeType.ZIGZAG:
        entity.effectsSet.add(
          new OnAttackEffect(({ pokemon }) => {
            pokemon.addSpeed(5, pokemon, 0, false)
          })
        )
        break
      case ScribbleShapeType.DIAGONAL:
        entity.addSpeed(30, entity, 0, false)
        break
      case ScribbleShapeType.X:
        entity.addCritChance(30, entity, 0, false)
        entity.addCritPower(30, entity, 0, false)
        break
      case ScribbleShapeType.PLUS:
        entity.addMaxHP(Math.ceil(entity.maxHP * 0.3), entity, 0, false)
        break
      case ScribbleShapeType.RING:
        entity.addShield(Math.ceil(entity.maxHP * 0.4), entity, 0, false)
        break
    }
  }

  // no light spot here, unlike a scribble shape: it reads wrong on water
  applyWaterPondEffect(
    pondType: WaterPondType,
    entity: PokemonEntity,
    player: Player
  ) {
    const value = getWaterPondValue(
      pondType,
      getSynergyTier(player.synergies, Synergy.WATER)
    )
    switch (pondType) {
      case WaterPondType.DEEP_POND:
        entity.addDefense(value, entity, 0, false)
        break
      case WaterPondType.MINERAL_SPRING:
        entity.addSpecialDefense(value, entity, 0, false)
        break
      case WaterPondType.TIDE_POOL:
        entity.addShield(
          Math.ceil((entity.maxHP * value) / 100),
          entity,
          0,
          false
        )
        break
      case WaterPondType.TORRENT:
        entity.addAttack(Math.ceil((entity.atk * value) / 100), entity, 0, false)
        break
      case WaterPondType.CRYSTAL_POND:
        entity.addAbilityPower(value, entity, 0, false)
        break
      case WaterPondType.RAPIDS:
        entity.addSpeed(value, entity, 0, false)
        break
      case WaterPondType.GEYSER:
        entity.addCritChance(value, entity, 0, false)
        entity.addCritPower(value, entity, 0, false)
        break
    }
  }

  getFirstFreeCell(team: Team): { x: number; y: number } | null {
    if (team === Team.BLUE_TEAM) {
      for (let y = 0; y <= BOARD_SIDE_HEIGHT - 1; y++) {
        for (let x = 0; x < this.board.columns; x++) {
          if (
            this.board.isOnBoard(x, y) &&
            this.board.getEntityOnCell(x, y) === undefined
          ) {
            return { x, y }
          }
        }
      }
    } else {
      for (let y = this.board.rows - 1; y >= this.board.rows - BOARD_SIDE_HEIGHT; y--) {
        for (let x = this.board.columns - 1; x >= 0; x--) {
          if (
            this.board.isOnBoard(x, y) &&
            this.board.getEntityOnCell(x, y) === undefined
          ) {
            return { x, y }
          }
        }
      }
    }
    return null
  }

  getClosestFreeCellTo(
    positionX: number,
    positionY: number,
    team: Team
  ): { x: number; y: number } | null {
    const placesToConsiderByOrderOfPriority = [
      [0, 0],
      [-1, 0],
      [+1, 0],
      [0, -1],
      [-1, -1],
      [+1, -1],
      [-1, +1],
      [+1, +1],
      [0, +1],
      [-2, 0],
      [+2, 0],
      [-2, -1],
      [+2, -1],
      [0, -2],
      [-1, -2],
      [+1, -2],
      [-2, -2],
      [+2, -2],
      [-2, +1],
      [+2, +1],
      [-3, 0],
      [+3, 0],
      [-3, -1],
      [+3, -1],
      [-3, -2],
      [+3, -2],
      [0, -3],
      [-1, -3],
      [+1, -3],
      [-2, -3],
      [+2, -3],
      [-3, -3],
      [+3, -3],
      [-3, +1],
      [+3, +1]
    ]
    for (const [dx, dy] of placesToConsiderByOrderOfPriority) {
      const x = positionX + dx
      const y = positionY + dy * (team === Team.BLUE_TEAM ? 1 : -1)

      if (
        this.board.isOnBoard(x, y) &&
        this.board.getEntityOnCell(x, y) === undefined
      ) {
        return { x, y }
      }
    }
    return this.getFirstFreeCell(team)
  }

  getClosestFreeCellToPokemon(
    pokemon: IPokemon,
    team: Team
  ): { x: number; y: number } | null {
    const positionX = pokemon.positionX
    const positionY =
      team === Team.BLUE_TEAM
        ? pokemon.positionY - 1
        : 5 - (pokemon.positionY - 1)
    return this.getClosestFreeCellTo(positionX, positionY, team)
  }

  getClosestFreeCellToPokemonEntity(
    pokemon: IPokemonEntity,
    team: Team = pokemon.team
  ): { x: number; y: number } | null {
    return this.getClosestFreeCellTo(pokemon.positionX, pokemon.positionY, team)
  }

  applyItemsEffects(pokemon: PokemonEntity) {
    if (pokemon.passive === Passive.PICKUP && pokemon.items.size === 0) {
      pokemon.items.add(
        pickRandomIn(CraftableItemsNoScarves.concat(NonSpecialBerries))
      )
    }
    // wonderbox should be applied first so that wonderbox items effects can be applied after
    if (pokemon.items.has(Item.WONDER_BOX)) {
      pokemon.items.delete(Item.WONDER_BOX)

      const wonderboxItems: Item[] = []
      const nbWonderboxItems = pokemon.player?.blessings?.includes(
        Blessing.WONDER_BOX_BLESSING
      )
        ? WONDER_BOX_BLESSED_ITEMS
        : 2
      for (let n = 0; n < nbWonderboxItems; n++) {
        const eligibleItems = CraftableItemsNoScarves.filter(
          (i) =>
            !isIn(SynergyStones, i) &&
            !wonderboxItems.includes(i) &&
            !pokemon.items.has(i) &&
            i !== Item.WONDER_BOX
        )
        wonderboxItems.push(pickRandomIn(eligibleItems))
      }

      const itemCapacity = getItemCapacity(this.room?.state.specialGameRule)
      wonderboxItems.forEach((item) => {
        if (pokemon.items.size < itemCapacity) {
          pokemon.items.add(item)
        }
      })
    }

    pokemon.items.forEach((item) => {
      pokemon.applyItemEffect(item)
    })
  }

  /* MIDNIGHT_SUN multiplies the LIGHT spot bonuses by the recipient's crit
     power. The spot has already granted them once, so this tops up the rest */
  applyMidnightSunBonuses(pokemon: PokemonEntity) {
    if (
      pokemon.player?.blessings?.includes(Blessing.MIDNIGHT_SUN) !== true ||
      !pokemon.status.light
    ) {
      return
    }
    const extra = pokemon.critPower - 1
    if (extra <= 0) return
    pokemon.addAttack(
      Math.ceil(pokemon.baseAtk * 0.2 * extra),
      pokemon,
      0,
      false
    )
    pokemon.addAbilityPower(Math.round(20 * extra), pokemon, 0, false)
    if (
      pokemon.effects.has(EffectEnum.ETERNAL_LIGHT) ||
      pokemon.effects.has(EffectEnum.MAX_ILLUMINATION)
    ) {
      pokemon.addDefense(0.5 * pokemon.baseDef * extra, pokemon, 0, false)
      pokemon.addSpecialDefense(
        0.5 * pokemon.baseSpeDef * extra,
        pokemon,
        0,
        false
      )
    }
    if (pokemon.effects.has(EffectEnum.MAX_ILLUMINATION)) {
      pokemon.addShield(Math.round(100 * extra), pokemon, 0, false)
    }
  }

  applySynergyEffects(pokemon: PokemonEntity, singleType?: Synergy) {
    // in Double Up shared PVE fights, the partner's units use their own synergies
    const allyEffects =
      this.bluePartnerPlayer && pokemon.player === this.bluePartnerPlayer
        ? this.bluePartnerEffects
        : pokemon.team === Team.BLUE_TEAM
          ? this.blueEffects
          : this.redEffects
    const apply = (effect) => {
      this.applyEffect(pokemon, effect)
    }

    if (singleType) {
      const effect = SynergyTiers[singleType].find((e) => allyEffects.has(e))
      if (effect && !pokemon.effects.has(effect)) {
        apply(effect)
      }
    } else {
      allyEffects.forEach((effect) => {
        apply(effect)
      })
    }

    if (
      (singleType === Synergy.SOUND ||
        (!singleType && pokemon.types.has(Synergy.SOUND))) &&
      !SynergyTiers[Synergy.SOUND].some((e) => allyEffects.has(e))
    ) {
      // allow sound pokemon to always wake up allies without searching through the board twice
      pokemon.effectsSet.add(new SoundCryEffect())
    }

    if (pokemon.types.has(Synergy.ELECTRIC) && pokemon.player) {
      const nbCellBatteries = schemaValues(pokemon.player.items).filter(
        (item) => item === Item.CELL_BATTERY
      ).length
      if (nbCellBatteries > 0) {
        pokemon.addSpeed(2 * nbCellBatteries, pokemon, 0, false)
      }
    }
    if (pokemon.refToBoardPokemon.supercharged) {
      pokemon.refToBoardPokemon.supercharged = false
      pokemon.status.addElectricField(pokemon)
      pokemon.addSpeed(20, pokemon, 0, false)
      pokemon.addShield(30, pokemon, 0, false)
    }
    // apply effects of the Seven Treasures
    if (pokemon.player) {
      const instruments = [
        { item: Item.AQUA_MONICA, effect: (p: PokemonEntity) => p.addPP(2, p, 0, false) },
        { item: Item.FIERY_DRUM, effect: (p: PokemonEntity) => p.addAttack(2, p, 0, false) },
        { item: Item.SKY_MELODICA, effect: (p: PokemonEntity) => p.addSpeed(4, p, 0, false) },
        { item: Item.ICY_FLUTE, effect: (p: PokemonEntity) => p.addSpecialDefense(4, p, 0, false) },
        { item: Item.ROCK_HORN, effect: (p: PokemonEntity) => p.addDefense(4, p, 0, false) },
        { item: Item.GRASS_CORNET, effect: (p: PokemonEntity) => p.addMaxHP(5, p, 0, false) },
        { item: Item.TERRA_CYMBAL, effect: (p: PokemonEntity) => p.addLuck(3, p, 0, false) },
      ]

      for (const { item, effect } of instruments) {
        const nb = count(pokemon.player.items, item)
        if (nb > 0) {
          pokemon.effectsSet.add(new OnAbilityCastEffect((caster) => {
            caster.simulation.board.cells
              .filter((c): c is PokemonEntity => c != null && c.team === caster.team)
              .forEach((ally) => effect(ally))
          }))
        }
      }
    }
    // apply seed effects for Flying 8
    if (pokemon.player) {
      const activeSeed = pokemon.player.activeSeed
      if (activeSeed && isIn(Seeds, activeSeed)) {
        SeedEffects[activeSeed]?.forEach((effect) => {
          pokemon.effectsSet.add(effect)
        })
      }
    }
  }

  applyDishEffects(
    dish: Item,
    pokemon: Pokemon,
    entity: PokemonEntity | undefined,
    player: Player | undefined
  ) {
    const dishEffects = DishEffects[dish]
    if (!dishEffects) return
    dishEffects.forEach((effect) => {
      entity?.effectsSet.add(effect)
      if (effect instanceof OnDishConsumedEffect)
        effect.apply({ pokemon, dish, entity, player })
      if (effect instanceof OnSpawnEffect && entity)
        effect.apply(entity, player, true)
    })

    if (hasGluttonGrowth(pokemon, player?.blessings)) {
      pokemon.addMaxHP(20)
      entity?.addMaxHP(20, entity, 0, false)
      if (player && pokemon.maxHP > 750) {
        player.titles.add(Title.GLUTTON)
      }
    }

    if (
      entity &&
      player?.blessings?.includes(Blessing.MONSTROUS_GLUTTONY) &&
      entity.types.has(Synergy.MONSTER)
    ) {
      this.applyMonsterStack(entity, pokemon.dishChefMaxHP.get(dish) ?? 0)
    }
  }

  /* the MONSTER synergy normally pays this out on a KO, scaled by the victim's
     size. MONSTROUS_GLUTTONY pays the same for eating what a chef cooked */
  // the shell inherits the wearer's defence, but the factory builds it itemless
  spawnCrystalExoskeletonShell(pokemon: PokemonEntity, team: Team) {
    const coord = this.getClosestFreeCellToPokemonEntity(pokemon)
    if (!coord) return
    const shell = PokemonFactory.createPokemonFromName(
      pokemon.name,
      pokemon.player
    )
    shell.hp = Math.ceil(
      pokemon.refToBoardPokemon.hp * CRYSTAL_EXOSKELETON_SHELL_MAX_HP_RATIO
    )
    const shellEntity = this.addPokemon(shell, coord.x, coord.y, team, true)
    shellEntity.def = pokemon.def
    shellEntity.speDef = pokemon.speDef
    return shellEntity
  }

  applyMonsterStack(pokemon: PokemonEntity, victimMaxHP: number) {
    const tier = getSynergyTier(
      pokemon.player?.synergies ?? new Map(),
      Synergy.MONSTER
    )
    if (tier === 0) return
    pokemon.addAttack(
      MONSTER_ATTACK_BUFF_PER_SYNERGY_TIER[tier] ?? 0,
      pokemon,
      0,
      false
    )
    pokemon.addAbilityPower(
      MONSTER_AP_BUFF_PER_SYNERGY_TIER[tier] ?? 0,
      pokemon,
      0,
      false
    )
    pokemon.addMaxHP(
      (MONSTER_MAX_HP_BUFF_FACTOR_PER_SYNERGY_TIER[tier] ?? 0) * victimMaxHP,
      pokemon,
      0,
      false
    )
  }

  applyPostEffects(
    blueBoard: MapSchema<Pokemon>,
    redBoard: MapSchema<Pokemon>
  ) {
    /*
    in order:
    - spawns (bug, rotom, white flute, etc)
    - support items effects (exp share, gracidea etc)
    - target selection effects (ghost curse, comet shard etc)
    */

    const sides: {
      board: MapSchema<Pokemon>
      teamIndex: Team
      player: Player | undefined
      effects: Set<EffectEnum>
    }[] = [
      {
        board: blueBoard,
        teamIndex: Team.BLUE_TEAM,
        player: this.bluePlayer,
        effects: this.blueEffects
      },
      {
        board: redBoard,
        teamIndex: Team.RED_TEAM,
        player: this.redPlayer,
        effects: this.redEffects
      }
    ]
    if (this.bluePartnerPlayer) {
      sides.splice(1, 0, {
        board: this.bluePartnerPlayer.board,
        teamIndex: Team.BLUE_TEAM,
        player: this.bluePartnerPlayer,
        effects: this.bluePartnerEffects
      })
    }

    // SPAWNS (bug, rotom, white flute, etc)
    for (const { board, teamIndex, player, effects } of sides) {
      if (
        [
          EffectEnum.COCOON,
          EffectEnum.INFESTATION,
          EffectEnum.HORDE,
          EffectEnum.HEART_OF_THE_SWARM
        ].some((e) => effects.has(e))
      ) {
        cloneBugs({ board, effects, teamIndex, player, simulation: this })
      }

      board.forEach((pokemon) => {
        if (pokemon.items.has(Item.GOLD_MASK) && !isOnBench(pokemon)) {
          const sharedTypes = [...pokemon.types]
          const candidates = sharedTypes
            .flatMap((type) => PRECOMPUTED_POKEMONS_PER_TYPE[type] ?? [])
            .map((p) => getPokemonData(p))
            .filter((p, i, arr) => arr.findIndex((x) => x.name === p.name) === i)
          const spawns: IPokemonData[] = []
          const pickWild = (rarity: Rarity, tier: number) => {
            const randomWild =
              pickRandomIn(candidates.filter((p) => p.rarity === rarity && p.stars === tier)) ??
              (candidates.length === 0 ? pickRandomIn([
                getPokemonData(Pkm.MAREEP),
                getPokemonData(Pkm.REGIROCK),
                getPokemonData(Pkm.TOTODILE)
              ]) : undefined)
            if (randomWild) {
              spawns.push(randomWild)
            } else {
              logger.info("no pokemon found for white flute call", rarity, tier)
            }
          }

          if (this.stageLevel <= 5) {
            pickWild(Rarity.COMMON, 1)
            pickWild(Rarity.COMMON, 1)
            pickWild(Rarity.COMMON, 1)
          } else if (this.stageLevel <= 10) {
            pickWild(Rarity.COMMON, 1)
            pickWild(Rarity.COMMON, 1)
            pickWild(Rarity.UNCOMMON, 1)
          } else if (this.stageLevel <= 15) {
            pickWild(Rarity.UNCOMMON, 1)
            pickWild(Rarity.UNCOMMON, 1)
            pickWild(Rarity.RARE, 1)
          } else if (this.stageLevel <= 20) {
            pickWild(Rarity.UNCOMMON, 1)
            pickWild(Rarity.RARE, 1)
            pickWild(Rarity.EPIC, 1)
          } else if (this.stageLevel <= 25) {
            pickWild(Rarity.UNCOMMON, 2)
            pickWild(Rarity.RARE, 1)
            pickWild(Rarity.EPIC, 1)
          } else if (this.stageLevel <= 30) {
            pickWild(Rarity.UNCOMMON, 3)
            pickWild(Rarity.RARE, 1)
            pickWild(Rarity.EPIC, 1)
          } else if (this.stageLevel <= 35) {
            pickWild(Rarity.RARE, 2)
            pickWild(Rarity.EPIC, 2)
            pickWild(Rarity.ULTRA, 1)
          } else {
            pickWild(Rarity.RARE, 3)
            pickWild(Rarity.EPIC, 2)
            pickWild(Rarity.ULTRA, 1)
          }

          spawns.forEach((spawn) => {
            const coord = this.getClosestFreeCellToPokemon(pokemon, teamIndex)
            if (!coord) return
            const mon = PokemonFactory.createPokemonFromName(spawn.name)
            this.addPokemon(mon, coord.x, coord.y, teamIndex, true)
          })
        }
      })

      if (
        this.room.state.specialGameRule === SpecialGameRule.HALLOWEEN &&
        player &&
        (player?.synergies.get(Synergy.GHOST) ?? 0) >= 16
      ) {
        const ghost = PokemonFactory.createPokemonFromName(Pkm.GHOST)
        const coord = this.getFirstFreeCell(teamIndex)
        if (coord) {
          this.addPokemon(ghost, coord.x, coord.y, teamIndex, true)
        }
      }
    }

    // DARK SUBSTITUTE - decide which units are eligible to trigger at fight start
    for (const { teamIndex, player, effects } of sides) {
      const darkTier = effects.has(EffectEnum.FALSE_SURRENDER) ? 4
        : effects.has(EffectEnum.BEAT_UP) ? 3
        : effects.has(EffectEnum.ASSURANCE) ? 2
        : effects.has(EffectEnum.HONE_CLAWS) ? 1 : 0

      if (darkTier > 0) {
        const darkMeleeEntities = (teamIndex === Team.BLUE_TEAM
          ? [...this.blueTeam.values()]
          : [...this.redTeam.values()]
        ).filter(
          (e: IPokemonEntity) => e.types.has(Synergy.DARK) && e.range === 1 && e.hp > 0 && !e.isSpawn &&
            e.player === player // only consider own units in Double Up shared fights
        )
        getStrongestUnits(darkMeleeEntities, darkTier).forEach((e: IPokemonEntity) => {
          ;(e as PokemonEntity).darkSubstituteEligible = true
        })
      }
    }

    // SUPPORT ITEMS EFFECTS (exp share, gracidea etc)
    for (const team of [this.blueTeam, this.redTeam]) {
      team.forEach((pokemon) => {
        if (pokemon.items.has(Item.ABILITY_SHIELD)) {
          const coveredUnits = pokemon.player?.blessings?.includes(
            Blessing.ABILITY_SHIELD_BLESSING
          )
            ? this.board
                .getAdjacentCells(pokemon.positionX, pokemon.positionY, true)
                .map((cell) => cell.value)
            : [-1, 0, 1].map((offset) =>
                this.board.getEntityOnCell(
                  pokemon.positionX + offset,
                  pokemon.positionY
                )
              )
          coveredUnits.forEach((ally) => {
            if (ally && ally.team === pokemon.team) {
              ally.addShield(Math.ceil(0.2 * ally.maxHP), ally, 0, false)
              ally.status.triggerRuneProtect(5000, ally, pokemon as PokemonEntity)
              const shieldEffect = new OnShieldDepletedEffect(({ pokemon: p }) => {
                p.addAbilityPower(30, p, 0, false)
                p.effectsSet.delete(shieldEffect)
              })
              ally.effectsSet.add(shieldEffect)
            }
          })
        }

        if (pokemon.items.has(Item.GRACIDEA_FLOWER)) {
          const blossoms = pokemon.player?.blessings?.includes(
            Blessing.GRACIDEA_FLOWER_BLESSING
          )
          ;[-1, 0, 1].forEach((offset) => {
            const value = this.board.getEntityOnCell(
              pokemon.positionX + offset,
              pokemon.positionY
            )
            if (!value) return
            value.addSpeed(20, pokemon, 0, false)
            if (blossoms && value.team === pokemon.team) {
              value.effectsSet.add(new GracideaBlossomEffect())
            }
          })
        }

        if (
          pokemon.items.has(Item.CHOICE_SPECS) &&
          pokemon.player?.blessings?.includes(Blessing.CHOICE_SPECS_BLESSING)
        ) {
          ;[-1, 1].forEach((offset) => {
            const ally = this.board.getEntityOnCell(
              pokemon.positionX + offset,
              pokemon.positionY
            )
            if (ally && ally.team === pokemon.team) {
              ally.skill = pokemon.skill
              ally.maxPP = Math.max(
                CHOICE_SPECS_ALLY_MIN_MAX_PP,
                pokemon.maxPP
              )
            }
          })
        }

        if (pokemon.items.has(Item.EXP_SHARE)) {
          ;[-1, 1].forEach((offset) => {
            const value = this.board.getEntityOnCell(
              pokemon.positionX + offset,
              pokemon.positionY
            )
            if (value) {
              if (value.atk > pokemon.atk) pokemon.atk = value.atk
              if (value.def > pokemon.def) pokemon.def = value.def
              if (value.speDef > pokemon.speDef) pokemon.speDef = value.speDef
              if (value.ap > pokemon.ap) pokemon.ap = value.ap
            }
          })
        }

        /* SYNCHRO_MASHINE is Exp Share without the positioning: it takes the
           best of every allied unit on the field, not just the two neighbours */
        if (pokemon.items.has(Item.SYNCHRO_MASHINE)) {
          const allies = schemaValues(
            pokemon.team === Team.BLUE_TEAM
              ? this.blueTeam
              : this.redTeam
          ).filter((ally) => ally.id !== pokemon.id)
          allies.forEach((ally) => {
            if (ally.maxHP > pokemon.maxHP) {
              // hp is current health, so it has to follow or it exceeds the cap
              pokemon.maxHP = ally.maxHP
              pokemon.hp = ally.maxHP
            }
            if (ally.atk > pokemon.atk) pokemon.atk = ally.atk
            if (ally.ap > pokemon.ap) pokemon.ap = ally.ap
            if (ally.def > pokemon.def) pokemon.def = ally.def
            if (ally.speDef > pokemon.speDef) pokemon.speDef = ally.speDef
          })
        }

        if (pokemon.passive === Passive.LUVDISC) {
          const lovers = [-1, 1].map((offset) =>
            this.board.getEntityOnCell(
              pokemon.positionX + offset,
              pokemon.positionY
            )
          )
          if (lovers[0] && lovers[1]) {
            const bestAtk = Math.max(lovers[0].atk, lovers[1].atk)
            const bestDef = Math.max(lovers[0].def, lovers[1].def)
            const bestSpeDef = Math.max(lovers[0].speDef, lovers[1].speDef)
            const bestAP = Math.max(lovers[0].ap, lovers[1].ap)
            lovers[0].atk = bestAtk
            lovers[1].atk = bestAtk
            lovers[0].def = bestDef
            lovers[1].def = bestDef
            lovers[0].speDef = bestSpeDef
            lovers[1].speDef = bestSpeDef
            lovers[0].ap = bestAP
            lovers[1].ap = bestAP
          }
        }
      })
    }

    // METAL_ALLOY shield
    for (const team of [this.blueTeam, this.redTeam]) {
      team.forEach((pokemon) => {
        const allyEffects =
          this.bluePartnerPlayer && pokemon.player === this.bluePartnerPlayer
            ? this.bluePartnerEffects
            : pokemon.team === Team.BLUE_TEAM
              ? this.blueEffects
              : this.redEffects
        if (!allyEffects.has(EffectEnum.MAGNET_STORM)) return
        const player = pokemon.player
        const nbMetalAlloys = player ? count(player.items, Item.METAL_ALLOY) : 0
        if (nbMetalAlloys > 0) {
          const adjacentCells = this.board.getAdjacentCells(
            pokemon.positionX,
            pokemon.positionY
          )
          const freeAdjacentCells = adjacentCells.filter(
            (c) => c.value === undefined
          ).length
          pokemon.addShield(freeAdjacentCells * 5 * nbMetalAlloys, pokemon, 0, false)
        }
      })
    }

    this.applyIgnitedUnits(sides)
    this.applyCombatStartBlessings(sides)

    // TARGET SELECTION EFFECTS (ghost curse)
    for (const { teamIndex, effects: teamEffects } of sides) {
      const opponentTeam =
        teamIndex === Team.BLUE_TEAM ? Team.RED_TEAM : Team.BLUE_TEAM

      if (
        teamEffects.has(EffectEnum.CURSE_OF_VULNERABILITY) ||
        teamEffects.has(EffectEnum.CURSE_OF_WEAKNESS) ||
        teamEffects.has(EffectEnum.CURSE_OF_TORMENT) ||
        teamEffects.has(EffectEnum.CURSE_OF_FATE)
      ) {
        this.applyCurse(EffectEnum.CURSE_OF_VULNERABILITY, opponentTeam)
      }

      if (
        teamEffects.has(EffectEnum.CURSE_OF_WEAKNESS) ||
        teamEffects.has(EffectEnum.CURSE_OF_TORMENT) ||
        teamEffects.has(EffectEnum.CURSE_OF_FATE)
      ) {
        this.applyCurse(EffectEnum.CURSE_OF_WEAKNESS, opponentTeam)
      }

      if (
        teamEffects.has(EffectEnum.CURSE_OF_TORMENT) ||
        teamEffects.has(EffectEnum.CURSE_OF_FATE)
      ) {
        this.applyCurse(EffectEnum.CURSE_OF_TORMENT, opponentTeam)
      }

      if (teamEffects.has(EffectEnum.CURSE_OF_FATE)) {
        this.applyCurse(EffectEnum.CURSE_OF_FATE, opponentTeam)
      }
    }
  }

  grantSecondWindResurrection(player: Player, teamIndex: Team) {
    const team = teamIndex === Team.BLUE_TEAM ? this.blueTeam : this.redTeam
    const fieldAllies = [...team.values()].filter(
      (entity): entity is PokemonEntity =>
        entity.player === player &&
        entity.hp > 0 &&
        entity.types.has(Synergy.FIELD) &&
        !entity.status.resurrection &&
        !entity.status.doomed
    )
    if (fieldAllies.length === 0) return
    const weakest = fieldAllies.reduce((lowest, ally) =>
      getUnitScore(ally) < getUnitScore(lowest) ? ally : lowest
    )
    weakest.status.resurrection = true
  }

  /* IMPENDING_DOOM: the shadow strikes the units opposing its owner, stripping
     protect, rune protect and resurrection and barring them for the rest of the
     fight via the doomed flag on each victim's status */
  triggerImpendingDoom(ownerTeam: Team) {
    const victims =
      ownerTeam === Team.BLUE_TEAM ? this.redTeam : this.blueTeam
    victims.forEach((entity) => {
      entity.status.doomed = true
      entity.status.protect = false
      entity.status.protectCooldown = 0
      entity.status.runeProtect = false
      entity.status.runeProtectCooldown = 0
      entity.status.resurrection = false
      entity.broadcastAbility({
        skill: "IMPENDING_DOOM",
        // the shadow is a fixed-size board effect, not the victim's own ability
        ap: 0,
        positionX: entity.positionX,
        positionY: entity.positionY,
        targetX: entity.positionX,
        targetY: entity.positionY
      })
    })
  }

  getMonsterStacksOf(entity: PokemonEntity): number {
    let stacks = 0
    entity.effectsSet.forEach((effect) => {
      if (effect instanceof MonsterKillEffect) stacks += effect.count
    })
    return stacks
  }

  addThresholdAttackBlessing(
    pokemon: PokemonEntity,
    kind: "DRILL" | "SHATTER" | "SURGE",
    tier: "I" | "II",
    controlsTimerBar: boolean
  ) {
    const state = { activated: false, remainingMs: 0 }
    pokemon.effectsSet.add(
      new PeriodicEffect((entity) => {
        if (
          !state.activated &&
          entity.hp <= entity.maxHP * COMBAT_BLESSING_TRIGGER_HP_RATIO
        ) {
          state.activated = true
          state.remainingMs = COMBAT_BLESSING_DURATION[tier]
          if (controlsTimerBar) {
            entity.combatBlessingTimer = 100
            entity.broadcastAbility({
              skill: "COMBAT_BLESSING_ACTIVATION",
              ap: 0
            })
          }
        } else if (state.remainingMs > 0) {
          state.remainingMs = Math.max(0, state.remainingMs - 100)
          if (controlsTimerBar) {
            entity.combatBlessingTimer = Math.round(
              (state.remainingMs / COMBAT_BLESSING_DURATION[tier]) * 100
            )
          }
        }
      }, Passive.NONE, 100)
    )
    pokemon.effectsSet.add(
      new OnAttackEffect(({ pokemon: attacker, target, board, isTripleAttack }) => {
        if (!target || isTripleAttack || state.remainingMs <= 0) return
        const damage = Math.round(
          kind === "DRILL"
            ? attacker.atk * DRILL_ATTACK_RATIO
            : kind === "SHATTER"
              ? (attacker.def + attacker.speDef) * SHATTER_DEFENSE_RATIO
              : attacker.speed * SURGE_SPEED_RATIO
        )
        const attackType =
          kind === "DRILL"
            ? AttackType.TRUE
            : kind === "SHATTER"
              ? AttackType.PHYSICAL
              : AttackType.SPECIAL
        const dealAdditionalDamage = (enemy: PokemonEntity) =>
          enemy.handleDamage({
            damage,
            board,
            attackType,
            attacker,
            shouldTargetGainMana: true
          })

        dealAdditionalDamage(target)
        if (tier === "II") {
          const dx = Math.sign(target.positionX - attacker.positionX)
          const dy = Math.sign(target.positionY - attacker.positionY)
          const behindTarget = board.getEntityOnCell(
            target.positionX + dx,
            target.positionY + dy
          )
          if (behindTarget && behindTarget.team === target.team) {
            dealAdditionalDamage(behindTarget)
          }
        }
      })
    )
  }

  applyIgnitedUnits(sides: { teamIndex: Team; player: Player | undefined }[]) {
    for (const { teamIndex, player } of sides) {
      if (!player) continue
      /* selling a Fire unit after spending the shard loses the ignition, so it
         is put out here instead of applied */
      if (!isIgnitionActive(player)) {
        player.ignitedPokemonIds.forEach((id) =>
          player.board.get(id)?.setIgnited(false)
        )
        player.ignitedPokemonIds = []
        continue
      }
      const team = teamIndex === Team.BLUE_TEAM ? this.blueTeam : this.redTeam
      const ignitedUnits = [...team.values()].filter(
        (entity): entity is PokemonEntity =>
          entity.player === player &&
          entity.hp > 0 &&
          !entity.isSpawn &&
          player.ignitedPokemonIds.includes(entity.refToBoardPokemon.id)
      )
      ignitedUnits.forEach((ignitedUnit) => {
        ignitedUnit.ignited = true
        ignitedUnit.addShield(IGNITION_SHIELD, ignitedUnit, 0, false)
        ignitedUnit.addSpeed(IGNITION_SPEED, ignitedUnit, 0, false)
        ignitedUnit.effectsSet.add(
          new OnKillEffect(({ attacker }) => {
            if (attacker.player) {
              healPlayerLife(
                attacker.player,
                IGNITION_LIFE_HEAL_ON_KO,
                this.room.state
              )
            }
          })
        )
      })
    }
  }

  applyCombatStartBlessings(
    sides: { teamIndex: Team; player: Player | undefined }[]
  ) {
    for (const { teamIndex, player } of sides) {
      const blessings = player?.blessings
      if (!player || !blessings || blessings.length === 0) continue
      const team = teamIndex === Team.BLUE_TEAM ? this.blueTeam : this.redTeam
      const allies = [...team.values()].filter(
        (entity): entity is PokemonEntity =>
          entity.player === player && entity.hp > 0
      )
      const ownUnits = allies.filter((entity) => !entity.isSpawn)
      if (allies.length === 0) continue

      const missingPlayerLife = Math.max(0, player.maxLife - player.life)

      if (blessings.includes(Blessing.BURNING_FORCE)) {
        ownUnits.forEach((ally) => {
          const hasAdjacentAlly = this.board
            .getAdjacentCells(ally.positionX, ally.positionY, false)
            .some((cell) => cell.value?.team === ally.team)
          if (!hasAdjacentAlly) {
            ally.status.triggerBurn(300000, ally, ally)
            ally.addAttack(
              ally.baseAtk * BURNING_FORCE_ATTACK_RATIO,
              ally,
              0,
              false
            )
          }
        })
      }

      if (
        blessings.includes(Blessing.BLIGHTED_GARDEN) &&
        isSynergyActiveForPlayer(player, Synergy.FLORA)
      ) {
        ownUnits.forEach((ally) => {
          ally.effectsSet.add(
            new OnKillEffect(({ target }) => {
              if (target.status.poisonStacks) player.collectMulch(target.stars)
            })
          )
          ally.effectsSet.add(
            new OnDeathEffect(({ pokemon }) => {
              if (pokemon.types.has(Synergy.FLORA) && pokemon.status.pokerus) {
                player.collectMulch(BLIGHTED_GARDEN_POKERUS_MULCH)
              }
            })
          )
        })
      }

      if (blessings.includes(Blessing.STEAM_ENGINE)) {
        const speedPerAttack =
          STEAM_ENGINE_SPEED_ON_ATTACK +
          getSynergyTier(player.synergies, Synergy.FIRE) +
          getSynergyTier(player.synergies, Synergy.ELECTRIC)
        ownUnits
          .filter(
            (ally) =>
              ally.types.has(Synergy.FIRE) && ally.types.has(Synergy.ELECTRIC)
          )
          .forEach((ally) =>
            ally.effectsSet.add(
              new OnAttackEffect(({ pokemon }) =>
                pokemon.addSpeed(speedPerAttack, pokemon, 0, false)
              )
            )
          )
      }

      if (blessings.includes(Blessing.SPIKY_GUARD)) {
        ownUnits.forEach((ally) => {
          const hasAdjacentAlly = this.board
            .getAdjacentCells(ally.positionX, ally.positionY, false)
            .some((cell) => cell.value?.team === ally.team)
          if (hasAdjacentAlly) return
          ally.effectsSet.add(
            new OnAttackReceivedEffect(({ pokemon, attacker, board }) => {
              if (
                distanceC(
                  pokemon.positionX,
                  pokemon.positionY,
                  attacker.positionX,
                  attacker.positionY
                ) !== 1
              ) {
                return
              }
              attacker.handleDamage({
                damage: 0.1 * (pokemon.def + pokemon.speDef),
                board,
                attackType: AttackType.SPECIAL,
                attacker: pokemon,
                shouldTargetGainMana: true,
                isRetaliation: true
              })
            })
          )
        })
      }

      const thresholdAttackBlessings = [
        [Blessing.DRILL_II, "DRILL", "II"],
        [Blessing.DRILL_I, "DRILL", "I"],
        [Blessing.SHATTER_II, "SHATTER", "II"],
        [Blessing.SHATTER_I, "SHATTER", "I"],
        [Blessing.SURGE_II, "SURGE", "II"],
        [Blessing.SURGE_I, "SURGE", "I"]
      ] as const
      const activeThresholdAttackBlessings = thresholdAttackBlessings.filter(
        ([blessing]) => blessings.includes(blessing)
      )
      const timerBarBlessing = activeThresholdAttackBlessings.find(
        ([, , tier]) =>
          COMBAT_BLESSING_DURATION[tier] ===
          Math.max(
            ...activeThresholdAttackBlessings.map(
              ([, , activeTier]) => COMBAT_BLESSING_DURATION[activeTier]
            )
          )
      )?.[0]
      activeThresholdAttackBlessings.forEach(([blessing, kind, tier]) => {
        ownUnits.forEach((ally) =>
          this.addThresholdAttackBlessing(
            ally,
            kind,
            tier,
            blessing === timerBarBlessing
          )
        )
      })

      const gearShieldTier = blessings.includes(Blessing.GEAR_SHIELD_II)
        ? "II"
        : blessings.includes(Blessing.GEAR_SHIELD_I)
          ? "I"
          : undefined
      if (gearShieldTier) {
        ownUnits.filter((ally) => ally.range === 1).forEach((ally) => {
          const shield = GEAR_SHIELD_PER_ITEM[gearShieldTier] * ally.items.size
          if (shield <= 0) return
          if (gearShieldTier === "II") {
            let triggered = false
            ally.effectsSet.add(
              new OnShieldDepletedEffect(({ pokemon, board }) => {
                if (triggered) return
                triggered = true
                board
                  .getAdjacentCells(pokemon.positionX, pokemon.positionY, false)
                  .forEach((cell) => {
                    if (cell.value && cell.value.team !== pokemon.team) {
                      cell.value.status.triggerArmorReduction(3000, cell.value)
                    }
                  })
              })
            )
          }
          ally.addShield(shield, ally, 0, false)
        })
      }

      const magicShieldTier = blessings.includes(Blessing.MAGIC_SHIELD_II)
        ? "II"
        : blessings.includes(Blessing.MAGIC_SHIELD_I)
          ? "I"
          : undefined
      if (magicShieldTier) {
        if (magicShieldTier === "II") {
          ownUnits.forEach((ally) =>
            ally.addAbilityPower(MAGIC_SHIELD_ALLY_AP, ally, 0, false)
          )
        }
        ownUnits.forEach((ally) => ally.addShield(ally.ap, ally, 0, false))
      }

      if (blessings.includes(Blessing.REQUIEM)) {
        ownUnits.forEach((ally) =>
          ally.effectsSet.add(
            new OnDeathEffect(({ pokemon, board }) => {
              board
                .getCellsInRadius(pokemon.positionX, pokemon.positionY, 2, false)
                .forEach((cell) => {
                  if (cell.value?.team !== pokemon.team) return
                  cell.value.addShield(
                    Math.round(cell.value.maxHP * REQUIEM_SHIELD_RATIO),
                    cell.value,
                    0,
                    false
                  )
                })
              pokemon.broadcastAbility({
                skill: "REQUIEM",
                ap: 0,
                positionX: pokemon.positionX,
                positionY: pokemon.positionY
              })
            })
          )
        )
      }

      if (blessings.includes(Blessing.PARTING_GIFT)) {
        ownUnits.forEach((ally) =>
          ally.effectsSet.add(
            new OnDeathEffect(({ pokemon, board }) => {
              if (pokemon.items.size < PARTING_GIFT_ITEMS_REQUIRED) return
              const heirs = board
                .getCellsInRadius(pokemon.positionX, pokemon.positionY, 2, false)
                .map((cell) => cell.value)
                .filter(
                  (heir): heir is PokemonEntity =>
                    heir !== undefined &&
                    heir !== pokemon &&
                    heir.team === pokemon.team &&
                    heir.hp > 0
                )
              if (heirs.length === 0) return
              const heir = pickRandomIn(heirs)
              const gift = pickRandomIn([...pokemon.items])
              pokemon.items.delete(gift)
              heir.items.add(gift)
              heir.addShield(PARTING_GIFT_SHIELD, heir, 0, false)
              pokemon.broadcastAbility({
                skill: "PARTING_GIFT",
                ap: 0,
                positionX: pokemon.positionX,
                positionY: pokemon.positionY,
                targetX: heir.positionX,
                targetY: heir.positionY
              })
            })
          )
        )
      }

      if (blessings.includes(Blessing.LONE_WOLF)) {
        // free while no threshold blessing owns it, same rule as Critical Rush
        const controlsTimerBar = activeThresholdAttackBlessings.length === 0
        const howl = (wolf: PokemonEntity) => {
          wolf.addShield(
            Math.round(wolf.baseHP * LONE_WOLF_SHIELD_RATIO),
            wolf,
            0,
            false
          )
          wolf.addSpeed(LONE_WOLF_SPEED, wolf, 0, false)
          const remaining = { ms: LONE_WOLF_SPEED_DURATION }
          if (controlsTimerBar) wolf.combatBlessingTimer = 100
          wolf.effectsSet.add(
            new PeriodicEffect(
              (entity) => {
                if (remaining.ms <= 0) return
                remaining.ms = Math.max(0, remaining.ms - 100)
                if (controlsTimerBar) {
                  entity.combatBlessingTimer = Math.round(
                    (remaining.ms / LONE_WOLF_SPEED_DURATION) * 100
                  )
                }
                if (remaining.ms === 0) {
                  entity.addSpeed(-LONE_WOLF_SPEED, entity, 0, false)
                }
              },
              Passive.NONE,
              100
            )
          )
        }
        // a board of one never sees an ally die, so it has to howl right away
        if (ownUnits.length === 1) {
          howl(ownUnits[0])
        } else {
          ownUnits.forEach((ally) =>
            ally.effectsSet.add(
              new OnDeathEffect(({ pokemon }) => {
                const survivors = ownUnits.filter(
                  (unit) => unit !== pokemon && unit.hp > 0
                )
                if (survivors.length === 1) howl(survivors[0])
              })
            )
          )
        }
      }

      const criticalRushTier = blessings.includes(Blessing.CRITICAL_RUSH_II)
        ? "II"
        : blessings.includes(Blessing.CRITICAL_RUSH_I)
          ? "I"
          : undefined
      if (criticalRushTier) {
        const rushSpeed = CRITICAL_RUSH_SPEED[criticalRushTier]
        const rushDuration = CRITICAL_RUSH_DURATION[criticalRushTier]
        // Drill, Shatter and Surge drive the same bar, so only take it when free
        const controlsTimerBar = activeThresholdAttackBlessings.length === 0
        ownUnits.forEach((ally) => {
          const rush = { started: false, remainingMs: 0 }
          const onCrit = (crit: boolean) => {
            if (!crit) return
            if (!rush.started) {
              rush.started = true
              rush.remainingMs = rushDuration
              ally.addSpeed(rushSpeed, ally, 0, false)
              if (controlsTimerBar) ally.combatBlessingTimer = 100
              // the burst fades, further crits keep their speed for the fight
            } else if (rush.remainingMs > 0 && criticalRushTier === "II") {
              ally.addSpeed(CRITICAL_RUSH_II_STACK_SPEED, ally, 0, false)
            }
          }
          ally.effectsSet.add(
            new PeriodicEffect(
              (entity) => {
                if (rush.remainingMs <= 0) return
                rush.remainingMs = Math.max(0, rush.remainingMs - 100)
                if (controlsTimerBar) {
                  entity.combatBlessingTimer = Math.round(
                    (rush.remainingMs / rushDuration) * 100
                  )
                }
                if (rush.remainingMs === 0) {
                  entity.addSpeed(-rushSpeed, entity, 0, false)
                }
              },
              Passive.NONE,
              100
            )
          )
          ally.effectsSet.add(new OnAttackEffect(({ crit }) => onCrit(crit)))
          ally.effectsSet.add(
            new OnAbilityCastEffect((_pokemon, _board, _target, crit) =>
              onCrit(crit)
            )
          )
        })
      }

      const criticalPathTier = blessings.includes(Blessing.CRITICAL_PATH_II)
        ? "II"
        : blessings.includes(Blessing.CRITICAL_PATH_I)
          ? "I"
          : undefined
      if (criticalPathTier) {
        /* the order is fixed at combat start so the Path walks a lane the player
           can read, instead of reshuffling every time a unit dies */
        const byStrength = [...ownUnits].sort(
          (a, b) => getUnitScore(b) - getUnitScore(a)
        )
        let joinedCount = 0
        const joinPath = () => {
          const ally = byStrength[joinedCount]
          if (!ally) return
          joinedCount++
          ally.isOnCriticalPath = true
          ally.effects.add(EffectEnum.ABILITY_CRIT)
          if (AbilityStrategies[ally.skill].canCritByDefault) {
            ally.addCritPower(CRITICAL_PATH_CRIT_POWER_FALLBACK, ally, 0, false)
          }
          if (criticalPathTier === "II") {
            ally.addCritChance(CRITICAL_PATH_II_CRIT_CHANCE, ally, 0, false)
          }
          ally.effectsSet.add(new OnAbilityCastEffect(() => joinPath()))
        }
        joinPath()
      }

      const pulseShieldTier = blessings.includes(Blessing.PULSE_SHIELD_II)
        ? "II"
        : blessings.includes(Blessing.PULSE_SHIELD_I)
          ? "I"
          : undefined
      if (pulseShieldTier) {
        if (pulseShieldTier === "II") {
          ownUnits.forEach((ally) =>
            ally.addSpeed(PULSE_SHIELD_ALLY_SPEED, ally, 0, false)
          )
        }
        ownUnits.forEach((ally) =>
          ally.addShield(
            Math.round(ally.speed * PULSE_SHIELD_SPEED_RATIO),
            ally,
            0,
            false
          )
        )
      }

      const minimalistTier = blessings.includes(Blessing.MINIMALIST_II)
        ? "II"
        : blessings.includes(Blessing.MINIMALIST_I)
          ? "I"
          : undefined
      if (minimalistTier) {
        const itemCapacity = getItemCapacity(this.room?.state.specialGameRule)
        ownUnits.forEach((ally) => {
          const emptySlots = min(0)(itemCapacity - ally.items.size)
          const ppRatio =
            (MINIMALIST_PP_PER_EMPTY_SLOT[minimalistTier] * emptySlots) / 100
          ally.addPP(Math.round(ally.maxPP * ppRatio), ally, 0, false)
          if (minimalistTier === "II" && ally.items.size === 0) {
            ally.addAbilityPower(MINIMALIST_II_NO_ITEM_AP, ally, 0, false)
          }
        })
      }

      const bruteShieldTier = blessings.includes(Blessing.BRUTE_SHIELD_II)
        ? "II"
        : blessings.includes(Blessing.BRUTE_SHIELD_I)
          ? "I"
          : undefined
      if (bruteShieldTier) {
        if (bruteShieldTier === "II") {
          ownUnits.forEach((ally) =>
            ally.addAttack(BRUTE_SHIELD_ALLY_ATTACK, ally, 0, false)
          )
        }
        ownUnits.forEach((ally) =>
          ally.addShield(ally.atk * BRUTE_SHIELD_ATTACK_RATIO, ally, 0, false)
        )
      }

      if (blessings.includes(Blessing.STAR_GUARD)) {
        const stars = ownUnits.reduce((total, ally) => total + ally.stars, 0)
        const defense = stars * STAR_GUARD_DEFENSE_PER_STAR
        ownUnits.forEach((ally) => {
          ally.addDefense(defense, ally, 0, false)
          ally.addSpecialDefense(defense, ally, 0, false)
        })
      }

      if (blessings.includes(Blessing.MACHINE_RESIDUE)) {
        ownUnits
          .filter((ally) => ally.types.has(Synergy.ARTIFICIAL))
          .forEach((ally) => {
            ally.effectsSet.add(
              new OnAttackEffect(({ target, board, pokemon }) => {
                if (
                  !target ||
                  ![...pokemon.items].some((item) => isIn(Tools, item))
                ) {
                  return
                }
                board.addBoardEffect(
                  target.positionX,
                  target.positionY,
                  EffectEnum.SPIKES,
                  pokemon.simulation
                )
              })
            )
            ally.effectsSet.add(
              new OnMoveEffect((pokemon, board, _oldX, _oldY, newX, newY) => {
                const effects = board.boardEffects[newY * board.columns + newX]
                if (!effects.has(EffectEnum.SPIKES)) return
                board.clearBoardEffect(
                  newX,
                  newY,
                  pokemon.simulation,
                  EffectEnum.SPIKES
                )
                pokemon.addShield(MACHINE_RESIDUE_SHIELD, pokemon, 0, false)
              })
            )
          })
      }

      if (
        blessings.includes(Blessing.AUTO_CRAFTING) &&
        isSynergyActiveForPlayer(player, Synergy.ARTIFICIAL)
      ) {
        ownUnits
          .filter((ally) => ally.types.has(Synergy.ARTIFICIAL))
          .forEach((ally) => {
            const components = [...ally.items].filter((item) =>
              isIn(ItemComponents, item)
            )
            components.forEach((component) => {
              const craftableItems = (
                Object.entries(ItemRecipe) as [Item, Item[]][]
              )
                .filter(
                  ([item, recipe]) =>
                    recipe.includes(component) &&
                    !isIn(SynergyStones, item) &&
                    item !== Item.WONDER_BOX &&
                    !ally.items.has(item)
                )
                .map(([item]) => item)
              if (craftableItems.length === 0) return
              ally.removeItem(component)
              ally.addItem(pickRandomIn(craftableItems))
            })
          })
      }

      if (
        blessings.includes(Blessing.HIEROGLYPHS) &&
        isSynergyActiveForPlayer(player, Synergy.PSYCHIC)
      ) {
        ownUnits.filter((ally) => isIn(Unowns, ally.name)).forEach((ally) => {
          ally.maxPP = Math.max(1, Math.round(ally.maxPP * 0.5))
        })
      }

      if (
        blessings.includes(Blessing.CENTER_STAGE) &&
        isSynergyActiveForPlayer(player, Synergy.SOUND)
      ) {
        const soundAllies = ownUnits.filter((ally) =>
          ally.types.has(Synergy.SOUND)
        )
        const eagerPerformers = soundAllies.filter(
          (ally) => PkmFamily[ally.name] !== Pkm.GROOKEY
        )
        if (eagerPerformers.length > 0) {
          const centerStageAlly = getStrongestUnit(eagerPerformers)
          centerStageAlly.centerStageSpotlight = true
          centerStageAlly.isBlessedHero = true
        }
      }

      if (blessings.includes(Blessing.FOGBOUND_LAKE)) {
        const teamEffects =
          teamIndex === Team.BLUE_TEAM ? this.blueEffects : this.redEffects
        const activeLightEffects = SynergyTiers[Synergy.LIGHT].filter(
          (lightEffect) => teamEffects.has(lightEffect)
        )
        if (activeLightEffects.length > 0) {
          allies
            .filter((ally) => isIn(FOGBOUND_LAKE_FIREFLIES, ally.name))
            .forEach((firefly) => {
              /* their own spotlight, so they do not compete with the player's
                 single light spot on the board */
              firefly.hasOwnSpotlight = true
              firefly.status.light = true
              activeLightEffects.forEach((lightEffect) =>
                this.applyEffect(firefly, lightEffect)
              )
            })
        }
      }

      if (blessings.includes(Blessing.GRUDGE)) {
        const opponentPlayer =
          teamIndex === Team.BLUE_TEAM ? this.redPlayer : this.bluePlayer
        const substitutesPlanted = opponentPlayer
          ? schemaValues(opponentPlayer.board).filter(isGrudgeSubstitute).length
          : 0
        player.blessingsRef?.questProgress.set(
          Blessing.GRUDGE,
          substitutesPlanted
        )
      }

      if (blessings.includes(Blessing.UNISON)) {
        player.unisonTriggered = false
        player.blessingsRef?.questProgress.set(Blessing.UNISON, 0)
        ownUnits.forEach((unit) => {
          unit.effectsSet.add(
            new PeriodicEffect(
              (pokemon) => {
                const conductor = [...team.values()]
                  .filter((entity) => entity.player === player && entity.hp > 0)
                  .sort((a, b) => a.id.localeCompare(b.id))[0]
                if (!conductor || conductor.id !== pokemon.id) return
                this.updateUnisonMeter(team, player)
              },
              EffectEnum.MERCILESS,
              UNISON_CHECK_INTERVAL
            )
          )
          if (unit.types.has(Synergy.HUMAN)) {
            unit.effectsSet.add(
              new OnDeathEffect(() => {
                if (player.unisonTriggered) return
                const chargedDamage = Math.min(
                  UNISON_METER_DAMAGE,
                  this.getUnisonDamageDealt(team, player)
                )
                player.unisonTriggered = true
                player.blessingsRef?.questProgress.set(
                  Blessing.UNISON,
                  UNISON_TRIGGERED_PROGRESS_OFFSET + Math.floor(chargedDamage)
                )
                this.strikeUnison(team, player, chargedDamage)
              })
            )
          }
        })
      }

      if (blessings.includes(Blessing.LIMIT_BREAKER)) {
        /* raising stars is all an "extra star level" needs: every ability reads
           its scaling as [a,b,c,d][stars - 1], the way STAR_PIECE does it */
        allies.forEach((ally) => {
          if (ally.types.has(Synergy.DRAGON) && ally.refToBoardPokemon.final) {
            ally.stars = max(5)(ally.stars + 1)
          }
        })
      }

      if (blessings.includes(Blessing.GEM_HARVEST)) {
        const gemSynergies = player.items
          .filter((item) => isIn(SynergyGems, item))
          .map((gem) => SynergyGivenByGem[gem])
        if (gemSynergies.length > 0) {
          allies.forEach((ally) => {
            // a gem counts once per matching synergy, and duplicates stack
            const matches = gemSynergies.filter((synergy) =>
              ally.types.has(synergy)
            ).length
            if (matches === 0) return
            ally.addAbilityPower(
              GEM_HARVEST_ABILITY_POWER_PER_GEM * matches,
              ally,
              0,
              false
            )
          })
        }
      }

      if (blessings.includes(Blessing.MAGNETOSPHERE)) {
        player.magnetospherePulseCount = 0
        ownUnits.forEach((unit) => {
          unit.effectsSet.add(
            new PeriodicEffect(
              (pokemon) => {
                const conductor = [...team.values()]
                  .filter((entity) => entity.player === player && entity.hp > 0)
                  .sort((a, b) => a.id.localeCompare(b.id))[0]
                if (!conductor || conductor.id !== pokemon.id) return
                this.pulseMagnetosphere(team, player)
              },
              EffectEnum.STEEL_SURGE,
              MAGNETOSPHERE_PULSE_INTERVAL
            )
          )
        })
      }

      if (blessings.includes(Blessing.ICY_REFLECTION)) {
        allies
          .filter((ally) => ally.types.has(Synergy.ICE))
          .forEach((iceUnit) => {
            iceUnit.effectsSet.add(
              new OnDamageReceivedEffect(
                ({ pokemon, attacker, damageBeforeReduction, attackType, board }) => {
                  if (attackType !== AttackType.SPECIAL) return
                  if (attacker) pokemon.icyReflectionLastAbility = attacker.skill
                  /* what special defence took off this hit, mirroring the
                     reduction formula in pokemon-state handleDamage */
                  pokemon.icyReflectionStored +=
                    damageBeforeReduction -
                    damageBeforeReduction / (1 + ARMOR_FACTOR * pokemon.speDef)

                  const threshold =
                    pokemon.maxHP * ICY_REFLECTION_TRIGGER_MAX_HP_RATIO
                  while (
                    pokemon.icyReflectionStored >= threshold &&
                    pokemon.icyReflectionLastAbility
                  ) {
                    pokemon.icyReflectionStored -= threshold
                    pokemon.commands.push(
                      new DelayedCommand(
                        () => this.castIcyReflectionAbility(pokemon, board),
                        ICY_REFLECTION_CAST_DELAY
                      )
                    )
                  }
                  pokemon.icyReflectionCharge = Math.min(
                    100,
                    Math.round((pokemon.icyReflectionStored / threshold) * 100)
                  )
                }
              )
            )
          })
      }

      if (blessings.includes(Blessing.BULL_LEAPING)) {
        allies
          .filter((ally) => ally.types.has(Synergy.FIELD))
          .forEach((fieldUnit) => {
            fieldUnit.effectsSet.add(
              new OnAbilityCastEffect((pokemon, board, target) => {
                const followUp = this.getBullLeapingFollowUpAbility(pokemon)
                /* casting the same dash twice back to back is unreadable, so
                   those units fall back to the ranged option */
                const ability =
                  followUp === pokemon.skill ? Ability.HAPPY_HOUR : followUp
                if (ability === pokemon.skill) return // own ability is Happy Hour
                /* held back a beat, then until the unit has finished any dash
                   the first ability sent it on */
                let checksLeft = BULL_LEAPING_ARRIVAL_MAX_CHECKS
                const castOnceArrived = () => {
                  if (pokemon.hp <= 0) return
                  if (pokemon.state.name === "moving" && checksLeft-- > 0) {
                    pokemon.commands.push(
                      new DelayedCommand(
                        castOnceArrived,
                        BULL_LEAPING_ARRIVAL_CHECK_INTERVAL
                      )
                    )
                    return
                  }
                  this.castBullLeapingFollowUp(
                    pokemon,
                    board,
                    target && target.hp > 0 ? target : null,
                    ability
                  )
                }
                pokemon.commands.push(
                  new DelayedCommand(
                    castOnceArrived,
                    BULL_LEAPING_FOLLOW_UP_DELAY
                  )
                )
              })
            )
          })
      }

      if (blessings.includes(Blessing.OVERLOAD)) {
        /* deferred to the first ticks of combat: this runs from applyPostEffects,
           before clients have the board, so the Volt Surge visual sent now would
           be dropped */
        getStrongestUnit(
          ownUnits.filter((unit) => unit.types.has(Synergy.ELECTRIC))
        )?.commands.push(
          new DelayedCommand(
            () => this.castOverloadVoltSurge(team, player),
            OVERLOAD_FIRST_CAST_DELAY
          )
        )
        ownUnits.forEach((unit) => {
          unit.effectsSet.add(
            new PeriodicEffect(
              (pokemon) => {
                /* every ally carries the timer so it survives deaths, but only
                   one of them drives the pulse */
                const conductor = [...team.values()]
                  .filter((entity) => entity.player === player && entity.hp > 0)
                  .sort((a, b) => a.id.localeCompare(b.id))[0]
                if (!conductor || conductor.id !== pokemon.id) return
                this.castOverloadVoltSurge(team, player)
              },
              Ability.VOLT_SURGE,
              OVERLOAD_CAST_INTERVAL
            )
          )
        })
      }

      if (blessings.includes(Blessing.MONSTER_KING)) {
        const enemyTeam =
          teamIndex === Team.BLUE_TEAM ? Team.RED_TEAM : Team.BLUE_TEAM
        ownUnits.forEach((unit) => {
          unit.effectsSet.add(
            new PeriodicEffect(
              (pokemon) => {
                /* every ally carries the timer so it survives deaths, but only
                   the one with the most monster stacks actually fires */
                const contenders = [...team.values()].filter(
                  (entity) => entity.player === player && entity.hp > 0
                )
                const beamer = contenders.sort(
                  (a, b) =>
                    this.getMonsterStacksOf(b) - this.getMonsterStacksOf(a) ||
                    a.id.localeCompare(b.id)
                )[0]
                if (!beamer || beamer.id !== pokemon.id) return

                const spot = pokemon.state.getMostSurroundedCoordinateAvailablePlace(
                  enemyTeam,
                  this.board
                )
                const enemies = this.board.cells.filter(
                  (entity): entity is PokemonEntity =>
                    entity != null && entity.team === enemyTeam && entity.hp > 0
                )
                if (enemies.length === 0) return
                const target = spot
                  ? enemies.sort(
                      (a, b) =>
                        distanceC(a.positionX, a.positionY, spot.x, spot.y) -
                        distanceC(b.positionX, b.positionY, spot.x, spot.y)
                    )[0]
                  : enemies[0]
                AbilityStrategies[Ability.HYPER_BEAM].process(
                  pokemon,
                  this.board,
                  target,
                  false
                )
              },
              EffectEnum.MERCILESS,
              MONSTER_KING_BEAM_INTERVAL
            )
          )
        })
      }

      if (blessings.includes(Blessing.FAST_DELIVERY)) {
        const seedsCollected = player.items.filter((item) =>
          isIn(Seeds, item)
        ).length
        if (seedsCollected > 0) {
          ownUnits
            .filter((ally) => ally.types.has(Synergy.FLYING))
            .forEach((ally) => {
              ally.addAttack(
                FAST_DELIVERY_ATTACK_PER_SEED * seedsCollected,
                ally,
                0,
                false
              )
              ally.addLuck(
                FAST_DELIVERY_LUCK_PER_SEED * seedsCollected,
                ally,
                0,
                false
              )
            })
        }
      }

      if (blessings.includes(Blessing.IMPENDING_DOOM)) {
        if (teamIndex === Team.BLUE_TEAM) {
          this.blueDoomTimer = IMPENDING_DOOM_DELAY
        } else {
          this.redDoomTimer = IMPENDING_DOOM_DELAY
        }
      }

      if (blessings.includes(Blessing.VITAMINS)) {
        allies.forEach((ally) => {
          ally.addAttack(VITAMINS_ATTACK, ally, 0, false)
          ally.addAbilityPower(VITAMINS_ABILITY_POWER, ally, 0, false)
          ally.addSpeed(VITAMINS_SPEED, ally, 0, false)
        })
      }

      if (blessings.includes(Blessing.QUEST_PILLAGE)) {
        const critChance = Math.floor(
          player.money * QUEST_PILLAGE_CRIT_PER_GOLD
        )
        ownUnits
          .filter((ally) => ally.items.has(Item.AMULET_COIN))
          .forEach((ally) => ally.addCritChance(critChance, ally, 0, false))
      }

      if (blessings.includes(Blessing.DRAGON_FANG)) {
        const totalStars = ownUnits.reduce((sum, ally) => sum + ally.stars, 0)
        const abilityPower = totalStars * DRAGON_FANG_ABILITY_POWER_PER_STAR
        allies.forEach((ally) =>
          ally.addAbilityPower(abilityPower, ally, 0, false)
        )
      }

      if (blessings.includes(Blessing.MISFITS)) {
        allies
          .filter(
            (ally) =>
              ![...ally.types].some((type) =>
                isSynergyActiveForPlayer(player, type)
              )
          )
          .forEach((ally) => {
            const stars = ally.stars
            ally.addMaxHP(MISFITS_MAX_HP * stars, ally, 0, false)
            ally.addAbilityPower(MISFITS_ABILITY_POWER * stars, ally, 0, false)
            ally.addAttack(MISFITS_ATTACK * stars, ally, 0, false)
            ally.addDefense(MISFITS_DEFENSE * stars, ally, 0, false)
            ally.addSpeed(MISFITS_SPEED * stars, ally, 0, false)
            ally.addSpecialDefense(
              MISFITS_SPECIAL_DEFENSE * stars,
              ally,
              0,
              false
            )
          })
      }

      if (blessings.includes(Blessing.CHARGING_MY_BUG)) {
        ownUnits
          .filter((ally) => PkmFamily[ally.name] === Pkm.GRUBBIN)
          .forEach((ally) => {
            const boardY =
              ally.team === Team.RED_TEAM
                ? BOARD_HEIGHT - 1 - ally.positionY
                : ally.positionY
            const holeIndex = boardY * BOARD_WIDTH + ally.positionX
            if (player.groundHoles[holeIndex] === 5) {
              ally.addAttack(2, ally, 0, false, true)
            }
          })
      }

      if (blessings.includes(Blessing.PROTECT_THE_WEAK)) {
        const weakAllies = ownUnits.filter((ally) =>
          [Rarity.COMMON, Rarity.UNCOMMON].includes(ally.rarity)
        ).length
        ownUnits
          .filter((ally) =>
            [Rarity.EPIC, Rarity.ULTRA, Rarity.LEGENDARY].includes(ally.rarity)
          )
          .forEach((ally) => {
            ally.addMaxHP(
              weakAllies * PROTECT_THE_WEAK_MAX_HP,
              ally,
              0,
              false
            )
            ally.addSpeed(
              weakAllies * PROTECT_THE_WEAK_SPEED,
              ally,
              0,
              false
            )
          })
      }

      for (const [blessing, tier] of [
        [Blessing.POTENTIAL_ENERGY_I, "I"],
        [Blessing.POTENTIAL_ENERGY_II, "II"]
      ] as const) {
        if (!blessings.includes(blessing)) continue
        allies.forEach((ally) => {
          // stages is how many stars the family reaches once fully evolved
          const missingStars = min(0)(getPokemonData(ally.name).stages - ally.stars)
          if (missingStars === 0) return
          ally.addShield(
            POTENTIAL_ENERGY_SHIELD[tier] * missingStars,
            ally,
            0,
            false
          )
          ally.addSpeed(
            POTENTIAL_ENERGY_SPEED[tier] * missingStars,
            ally,
            0,
            false
          )
        })
      }

      if (blessings.includes(Blessing.EXHAUSTING_FLAME)) {
        allies
          .filter((ally) => ally.types.has(Synergy.FIRE))
          .forEach((ally) =>
            ally.addLuck(
              EXHAUSTING_FLAME_LUCK_PER_STAR * ally.stars,
              ally,
              0,
              false
            )
          )
      }

      if (blessings.includes(Blessing.QUIET_STRENGTH) && ownUnits.length > 0) {
        const strongestAlly = getStrongestUnit(ownUnits)
        const bonusHP =
          player.life < QUIET_STRENGTH_LOW_LIFE_THRESHOLD
            ? missingPlayerLife * 2
            : missingPlayerLife
        strongestAlly.addMaxHP(bonusHP, strongestAlly, 0, false)
      }

      if (blessings.includes(Blessing.MISFORTUNE)) {
        const enemyTeam =
          teamIndex === Team.BLUE_TEAM ? this.redTeam : this.blueTeam
        const enemies = [...enemyTeam.values()].filter(
          (entity): entity is PokemonEntity => entity.hp > 0 && !entity.isSpawn
        )
        if (enemies.length > 0) {
          const strongestEnemy = getStrongestUnit(enemies)
          strongestEnemy.handleDamage({
            damage: Math.round(
              (strongestEnemy.maxHP * missingPlayerLife) / 100
            ),
            board: this.board,
            attackType: AttackType.TRUE,
            attacker: null,
            shouldTargetGainMana: false
          })
        }
      }

      if (blessings.includes(Blessing.SHINY_SAFEGUARD)) {
        const frontRow = teamIndex === Team.RED_TEAM ? 3 : 2
        allies
          .filter((ally) => ally.positionY === frontRow)
          .forEach((ally) => {
            const safeguard = new OnDamageReceivedEffect(({ pokemon }) => {
              if (pokemon.hp / pokemon.maxHP >= SHINY_SAFEGUARD_HP_THRESHOLD)
                return
              pokemon.status.triggerProtect(SHINY_SAFEGUARD_PROTECT_DURATION)
              pokemon.effectsSet.delete(safeguard)
            })
            ally.effectsSet.add(safeguard)
          })
      }

      if (blessings.includes(Blessing.LASTING_EFFECTS)) {
        allies.forEach((ally) =>
          ally.addLuck(LASTING_EFFECTS_LUCK, ally, 0, false)
        )
      }

      if (blessings.includes(Blessing.RIPPLING_EFFECTS)) {
        const enemyTeam =
          teamIndex === Team.BLUE_TEAM ? this.redTeam : this.blueTeam
        enemyTeam.forEach((enemy) => {
          enemy.effectsSet.add(
            new OnDeathEffect(({ pokemon, board }) => {
              spreadNegativeStatuses(pokemon, board)
            })
          )
        })
      }

      if (blessings.includes(Blessing.GUARD_FORMATION)) {
        const shareHighestStatInRow = (
          row: number,
          statOf: (ally: PokemonEntity) => number,
          grant: (ally: PokemonEntity, amount: number) => void
        ) => {
          const rowAllies = allies.filter((ally) => ally.positionY === row)
          if (rowAllies.length === 0) return
          const leader = rowAllies.reduce((best, ally) =>
            statOf(ally) > statOf(best) ? ally : best
          )
          const shared = Math.round(
            statOf(leader) * GUARD_FORMATION_SHARE_RATIO
          )
          rowAllies
            .filter(
              (ally) => Math.abs(ally.positionX - leader.positionX) === 1
            )
            .forEach((ally) => grant(ally, shared))
        }
        const isRed = teamIndex === Team.RED_TEAM
        shareHighestStatInRow(
          isRed ? 3 : 2,
          (ally) => ally.def,
          (ally, amount) => ally.addDefense(amount, ally, 0, false)
        )
        shareHighestStatInRow(
          isRed ? 4 : 1,
          (ally) => ally.speDef,
          (ally, amount) => ally.addSpecialDefense(amount, ally, 0, false)
        )
      }

      if (blessings.includes(Blessing.BRAVE_FORMATION)) {
        allies.forEach((ally) => {
          const emptyTiles = this.board
            .getAdjacentCells(ally.positionX, ally.positionY)
            .filter((cell) => cell.value === undefined).length
          ally.addCritChance(
            BRAVE_FORMATION_CRIT_CHANCE_PER_EMPTY_TILE * emptyTiles,
            ally,
            0,
            false
          )
        })
      }

      if (blessings.includes(Blessing.TOUGH_FORMATION)) {
        allies.forEach((ally) => {
          const adjacentAllies = this.board
            .getAdjacentCells(ally.positionX, ally.positionY)
            .filter((cell) => cell.value?.team === ally.team).length
          const bonus =
            TOUGH_FORMATION_DEFENSE_PER_ADJACENT_ALLY * adjacentAllies
          ally.addDefense(bonus, ally, 0, false)
          ally.addSpecialDefense(bonus, ally, 0, false)
        })
      }

      if (blessings.includes(Blessing.RIVALRY) && ownUnits.length > 0) {
        getStrongestUnit(ownUnits).isRivalryChampionThisFight = true
      }

      if (
        blessings.includes(Blessing.HAIL_TO_THE_KING) &&
        ownUnits.length > 0
      ) {
        const king = getStrongestUnit(ownUnits)
        king.isHailToTheKingChampionThisFight = true
        king.isBlessedHero = true
        king.addMaxHP(HAIL_TO_THE_KING_MAX_HP, king, 0, false)
        king.addAttack(HAIL_TO_THE_KING_ATTACK, king, 0, false)
        king.addDefense(HAIL_TO_THE_KING_DEFENSE, king, 0, false)
        king.addSpecialDefense(
          HAIL_TO_THE_KING_SPECIAL_DEFENSE,
          king,
          0,
          false
        )
        king.addSpeed(HAIL_TO_THE_KING_SPEED, king, 0, false)
      }

      const speedLeaderTier = blessings.includes(Blessing.SYNCHRONISED_SPEED_II)
        ? "II"
        : blessings.includes(Blessing.SYNCHRONISED_SPEED_I)
          ? "I"
          : null
      if (speedLeaderTier && ownUnits.length > 0) {
        const speedOf = (entity: PokemonEntity) =>
          speedLeaderTier === "II" ? entity.speed : entity.refToBoardPokemon.speed
        const speedLeader = ownUnits.reduce((fastest, ally) =>
          speedOf(ally) > speedOf(fastest) ? ally : fastest
        )
        speedLeader.isSynchronisedSpeedLeaderThisFight = true
      }

      if (blessings.includes(Blessing.BLOSSOM_FESTIVAL)) {
        const bellossoms = allies.filter(
          (ally) => ally.name === Pkm.BELLOSSOM
        )
        if (bellossoms.length > 0) {
          const champion = getStrongestUnit(bellossoms)
          champion.isBlossomFestivalChampionThisFight = true
          champion.types.add(Synergy.GRASS)
          champion.effectsSet.add(
            new OnAbilityCastEffect((caster) => {
              if (
                caster.count.ult % BLOSSOM_FESTIVAL_CASTS_PER_RANGE_GAIN ===
                0
              ) {
                caster.range += 1
              }
            })
          )
        }
      }

      if (blessings.includes(Blessing.STAR_CROSSED_SEAS)) {
        const seaFamilies = [Pkm.SHELLOS_EAST_SEA, Pkm.SHELLOS_WEST_SEA]
        const fieldedSeaMons = seaFamilies.map((shellos) =>
          allies.filter((ally) => PkmFamily[ally.name] === shellos)
        )
        if (fieldedSeaMons.every((mons) => mons.length > 0)) {
          fieldedSeaMons.flat().forEach((ally) => {
            ally.addMaxHP(STAR_CROSSED_SEAS_MAX_HP, ally, 0, false)
            ally.addAbilityPower(
              STAR_CROSSED_SEAS_ABILITY_POWER,
              ally,
              0,
              false
            )
          })
        }
      }

      if (blessings.includes(Blessing.BERRY_BREAKFAST)) {
        allies.forEach((ally) => {
          schemaValues(ally.refToBoardPokemon.dishes)
            .filter((dish) => isIn(Berries, dish))
            .forEach((berry) => {
              // healToShield, unscaled — flat like the Poffin dish
              ally.eatBerry(berry, undefined, true, 0, false)
            })
        })
      }

      if (blessings.includes(Blessing.NOT_THE_BEES)) {
        const nbCombees = Math.min(
          getFlowerPotStarCount(player),
          NOT_THE_BEES_MAX_COMBEES
        )
        for (let i = 0; i < nbCombees; i++) {
          const coord = this.getClosestFreeCellTo(
            pickRandomIn([0, 1, 2, 3, 4, 5, 6, 7]),
            teamIndex === Team.RED_TEAM ? 5 : 0,
            teamIndex
          )
          if (!coord) break
          player.pokemonsPlayed.add(Pkm.COMBEE)
          this.addPokemon(
            PokemonFactory.createPokemonFromName(Pkm.COMBEE, player),
            coord.x,
            coord.y,
            teamIndex,
            true
          )
        }
      }

      if (blessings.includes(Blessing.FROST_BARRIER)) {
        allies
          .filter((ally) => ally.types.has(Synergy.ICE))
          .forEach((ally) => ally.effectsSet.add(makeFrostBarrierEffect()))
      }

      if (blessings.includes(Blessing.SECOND_WIND)) {
        this.grantSecondWindResurrection(player, teamIndex)
        this.secondWindTimer = SECOND_WIND_RESURRECTION_INTERVAL
      }

      if (blessings.includes(Blessing.FIRST_WIND)) {
        this.firstWindTimer = FIRST_WIND_HEAL_DELAY
      }

      if (blessings.includes(Blessing.ECHO_CHAMBER)) {
        const soundAllies = ownUnits.filter((ally) =>
          ally.types.has(Synergy.SOUND)
        )
        if (soundAllies.length > 0) {
          getStrongestUnit(soundAllies).isEchoChamberLeaderThisFight = true
        }
      }

      if (blessings.includes(Blessing.DRAGON_KING)) {
        const dragonAllies = ownUnits.filter((ally) =>
          ally.types.has(Synergy.DRAGON)
        )
        if (dragonAllies.length > 0) {
          getStrongestUnit(dragonAllies).isDragonKingChampionThisFight = true
        }
      }

      if (blessings.includes(Blessing.HUMAN_HORROR)) {
        const humanTier = getSynergyTier(player.synergies, Synergy.HUMAN)
        const hauntingAbilities = HUMAN_HORROR_ABILITIES_BY_TIER[humanTier]
        ownUnits
          .filter(
            (ally) =>
              ally.types.has(Synergy.GHOST) && ally.tm !== Ability.DEFAULT
          )
          .forEach((ally) => {
            ally.effectsSet.add(
              new OnDeathEffect(({ pokemon, attacker }) => {
                if (!attacker || attacker.hp <= 0 || !hauntingAbilities) return
                attacker.status.triggerPossessed(
                  HUMAN_HORROR_POSSESSION_DURATION +
                    humanTier * HUMAN_HORROR_POSSESSION_PER_HUMAN_TIER,
                  attacker,
                  pokemon
                )
                if (!attacker.status.possessed) return
                const haunting = pickRandomIn(hauntingAbilities)
                // set rather than added, so it is exactly one cast and not two
                attacker.pp = attacker.maxPP
                attacker.skillBeforePossession = attacker.skill
                attacker.skill = haunting
                attacker.broadcastAbility({ skill: haunting })
                this.broadcastToSpectators(Transfer.DISPLAY_TEXT, {
                  id: this.id,
                  text: `ability.${haunting}` as DisplayText,
                  x: attacker.positionX,
                  y: attacker.positionY
                })
              })
            )
          })
      }

      if (blessings.includes(Blessing.CRYSTAL_EXOSKELETON)) {
        ownUnits
          .filter(
            (ally) =>
              ally.types.has(Synergy.BUG) && ally.types.has(Synergy.ROCK)
          )
          .forEach((ally) => {
            let hasMoulted = false
            ally.effectsSet.add(
              new OnDamageReceivedEffect(({ pokemon, board }) => {
                if (hasMoulted || pokemon.hp > 0.5 * pokemon.maxHP) return
                hasMoulted = true
                pokemon.addShield(
                  CRYSTAL_EXOSKELETON_SHIELD,
                  pokemon,
                  0,
                  false
                )
                this.spawnCrystalExoskeletonShell(pokemon, teamIndex)
                pokemon.flyAway(board)
              })
            )
          })
      }

      if (blessings.includes(Blessing.SEEING_TRIPLE)) {
        const bugAllies = ownUnits.filter((ally) => ally.types.has(Synergy.BUG))
        if (bugAllies.length > 0) {
          const strongestBug = getStrongestUnit(bugAllies)
          for (let i = 0; i < BUG_CLONE_TRIPLE; i++) {
            const coord = this.getClosestFreeCellToPokemonEntity(strongestBug)
            if (!coord) break
            const clone = PokemonFactory.createPokemonFromName(
              strongestBug.name,
              player
            )
            clone.hp = strongestBug.refToBoardPokemon.hp
            this.addPokemon(clone, coord.x, coord.y, teamIndex, true)
          }
        }
      }

      if (
        blessings.includes(Blessing.SACRIFICE) &&
        isSynergyActiveForPlayer(player, Synergy.MONSTER)
      ) {
        const monsterAllies = ownUnits.filter((ally) =>
          ally.types.has(Synergy.MONSTER)
        )
        if (monsterAllies.length > 0) {
          const strongestMonster = getStrongestUnit(monsterAllies)
          const adjacentAllies = this.board
            .getAdjacentCells(
              strongestMonster.positionX,
              strongestMonster.positionY
            )
            .map((cell) => cell.value)
            .filter(
              (ally): ally is PokemonEntity =>
                ally != null &&
                ally.team === strongestMonster.team &&
                ally !== strongestMonster &&
                ally.hp > 0
            )
          if (adjacentAllies.length > 0) {
            const weakest = adjacentAllies.reduce((lowest, ally) =>
              getUnitScore(ally) < getUnitScore(lowest) ? ally : lowest
            )
            /* deferred to the first ticks of combat: this runs from
               applyPostEffects, before clients have the board, so an ability
               broadcast sent now is dropped */
            strongestMonster.commands.push(
              new DelayedCommand(() => {
                if (weakest.hp <= 0) return
                strongestMonster.broadcastAbility({
                  skill: Ability.DRAGON_CLAW,
                  positionX: strongestMonster.positionX,
                  positionY: strongestMonster.positionY,
                  targetX: weakest.positionX,
                  targetY: weakest.positionY
                })
                weakest.handleDamage({
                  damage: SACRIFICE_EXECUTE_DAMAGE,
                  board: this.board,
                  attackType: AttackType.TRUE,
                  attacker: strongestMonster,
                  shouldTargetGainMana: false
                })
                strongestMonster.status.triggerRage(
                  SACRIFICE_ENRAGE_DURATION,
                  strongestMonster
                )
              }, SACRIFICE_DELAY)
            )
          }
        }
      }

      const spotlightAllies = allies.filter((ally) => ally.inSpotlight)

      if (blessings.includes(Blessing.ASCENSION)) {
        spotlightAllies.forEach((ally) => {
          // tree holds the unit until its PP bar fills, and wards it meanwhile
          ally.status.tree = true
          ally.toIdleState()
          const breakFreeEffect = new PeriodicEffect(
            (entity) => {
              if (entity.status.tree) return
              SynergyTiers[Synergy.LIGHT].forEach((lightEffect) => {
                if (!entity.effects.has(lightEffect)) return
                for (let i = 0; i < ASCENSION_EXTRA_LIGHT_APPLICATIONS; i++) {
                  this.applyEffect(entity, lightEffect)
                }
              })
              entity.effectsSet.delete(breakFreeEffect)
            },
            EffectEnum.SHINING_RAY,
            ASCENSION_BREAK_FREE_CHECK_INTERVAL
          )
          ally.effectsSet.add(breakFreeEffect)
        })
      }

      if (blessings.includes(Blessing.SHARE_THE_SPOTLIGHT)) {
        spotlightAllies.forEach((spotlit) => {
          this.board
            .getAdjacentCells(spotlit.positionX, spotlit.positionY)
            .forEach((cell) => {
              const ally = cell.value
              if (!ally || ally.team !== spotlit.team) return
              /* multiple spotlights do not stack: only top up to the best
                 share seen so far */
              const raiseTo = (
                current: number,
                shared: number,
                apply: (delta: number) => void
              ) => {
                const target = Math.ceil(shared * SHARE_THE_SPOTLIGHT_RATIO)
                if (target > current) apply(target - current)
              }
              raiseTo(ally.atk - ally.baseAtk, spotlit.atk, (d) =>
                ally.addAttack(d, ally, 0, false)
              )
              raiseTo(ally.ap, spotlit.ap, (d) =>
                ally.addAbilityPower(d, ally, 0, false)
              )
              raiseTo(ally.def - ally.baseDef, spotlit.def, (d) =>
                ally.addDefense(d, ally, 0, false)
              )
              raiseTo(ally.speDef - ally.baseSpeDef, spotlit.speDef, (d) =>
                ally.addSpecialDefense(d, ally, 0, false)
              )
            })
        })
      }

      if (blessings.includes(Blessing.FLEXIBILITY)) {
        const distinctSynergyItems = new Set(
          ownUnits.flatMap((ally) =>
            [...ally.items].filter((item) => isIn(SynergyItems, item))
          )
        )
        const bonusHP =
          distinctSynergyItems.size * FLEXIBILITY_HP_PER_SYNERGY_ITEM
        if (bonusHP > 0) {
          allies.forEach((ally) => ally.addMaxHP(bonusHP, ally, 0, false))
        }
      }

      if (blessings.includes(Blessing.NEUROFORCE) && ownUnits.length > 0) {
        const neuroforceAlly = ownUnits.reduce((highestAP, ally) =>
          ally.ap > highestAP.ap ? ally : highestAP
        )
        neuroforceAlly.effects.add(EffectEnum.SPECIAL_ATTACKS)
        neuroforceAlly.isBlessedHero = true
      }

      player.plunderGoldSpentThisFight = 0
      this.applyHeroBlessings(
        blessings,
        ownUnits,
        teamIndex === Team.BLUE_TEAM ? this.blueEffects : this.redEffects,
        player
      )
    }
  }

  applyGrandIgnitionDamage() {
    this.grandIgnitionByTeam.forEach((ignition, team) => {
      const burningCells = [...ignition.litCorners].map(
        (index) => GRAND_IGNITION_CORNER_CELLS[index]
      )
      const attacker =
        ignition.champion.hp > 0 ? ignition.champion : null
      this.board.forEach((x, y, enemy) => {
        if (!enemy || enemy.team === team || enemy.hp <= 0) return
        const standsInEmbers = burningCells.some(
          (cell) => cell.x === x && cell.y === y
        )
        const ratio =
          (ignition.ignited ? GRAND_IGNITION_TRUE_DAMAGE_RATIO : 0) +
          (standsInEmbers ? GRAND_IGNITION_EMBER_DAMAGE_RATIO : 0)
        if (ratio === 0) return
        const { takenDamage } = enemy.handleDamage({
          damage: Math.round(enemy.maxHP * ratio),
          board: this.board,
          attackType: AttackType.TRUE,
          attacker,
          shouldTargetGainMana: false
        })
        if (!attacker && takenDamage > 0) {
          this.broadcastToSpectators(Transfer.POKEMON_DAMAGE, {
            index: ignition.champion.index,
            type: AttackType.TRUE,
            amount: Math.round(takenDamage),
            x: enemy.positionX,
            y: enemy.positionY,
            id: this.id
          })
        }
      })
    })
  }

  applyToxicResonance(resonance: {
    champion: PokemonEntity
    beat: number
  }) {
    const { champion } = resonance
    if (champion.hp <= 0) return
    resonance.beat = (resonance.beat % TOXIC_RESONANCE_HARMONIC_BEAT) + 1
    const isHarmonic = resonance.beat === TOXIC_RESONANCE_HARMONIC_BEAT
    champion.broadcastAbility({
      skill: isHarmonic
        ? "TOXIC_RESONANCE_HARMONIC"
        : `TOXIC_RESONANCE_BEAT_${resonance.beat}`,
      ap: 0
    })

    const reached = isHarmonic
      ? [...this.blueTeam.values(), ...this.redTeam.values()]
      : this.board
          .getCellsInRadius(
            champion.positionX,
            champion.positionY,
            resonance.beat,
            true
          )
          .map((cell) => cell.value)

    reached.forEach((reachedPokemon) => {
      if (!reachedPokemon || reachedPokemon.hp <= 0) return
      if (
        reachedPokemon.effects.has(EffectEnum.IMMUNITY_POISON) ||
        reachedPokemon.status.runeProtect
      )
        return
      reachedPokemon.status.triggerPoison(
        TOXIC_RESONANCE_POISON_DURATION,
        reachedPokemon,
        champion
      )
      if (reachedPokemon.team === champion.team) {
        reachedPokemon.addPP(
          isHarmonic
            ? TOXIC_RESONANCE_HARMONIC_ALLY_PP
            : TOXIC_RESONANCE_ALLY_PP,
          reachedPokemon,
          0,
          false
        )
      }
    })
  }

  applyHeroBlessings(
    blessings: Blessing[],
    ownUnits: PokemonEntity[],
    teamEffects: Set<EffectEnum>,
    player: Player
  ) {
    const championOf = new Map<Blessing, PokemonEntity>()
    blessings.forEach((blessing) => {
      const family = HERO_BLESSING_FAMILY[blessing]
      if (!family) return
      /* alt forms are their own family: the player's Flabebe colour is decided
         by their first flower pot, so the champion must be resolved per player */
      const champion = getStrongestUnitOfFamily(
        ownUnits,
        getAltFormForPlayer(family, player)
      )
      if (!champion) return
      champion.heroBlessings.add(blessing)
      champion.isBlessedHero = true
      championOf.set(blessing, champion)
    })

    const axeBlastChampion = championOf.get(Blessing.AXE_BLAST)
    if (axeBlastChampion) {
      const alliedTeam =
        axeBlastChampion.team === Team.BLUE_TEAM ? this.blueTeam : this.redTeam
      const opposingTeam =
        axeBlastChampion.team === Team.BLUE_TEAM ? this.redTeam : this.blueTeam
      const totalStars = (team: MapSchema<PokemonEntity>) =>
        [...team.values()]
          .filter((entity) => !entity.isSpawn)
          .reduce((sum, entity) => sum + entity.stars, 0)
      axeBlastChampion.skill = Ability.AXE_BLAST
      axeBlastChampion.range += 1
      const alliedStars = totalStars(alliedTeam)
      const opposingStars = totalStars(opposingTeam)
      player.blessingsRef?.questProgress.set(
        Blessing.AXE_BLAST,
        alliedStars * 100 + opposingStars
      )
      if (alliedStars > opposingStars) {
        axeBlastChampion.axeBlastExecuteChance =
          0.3 + 0.05 * (alliedStars - opposingStars)
      }
    }

    const snifferDogChampion = championOf.get(Blessing.SNIFFER_DOG)
    if (snifferDogChampion) {
      snifferDogChampion.effectsSet.add(
        new OnAbilityCastEffect((caster) => {
          const owner = caster.player
          if (!owner) return
          const hasFullyDugBoardHole = owner.groundHoles
            .slice(0, (BOARD_HEIGHT / 2) * BOARD_WIDTH)
            .some((depth) => depth === 5)
          if (!hasFullyDugBoardHole) return
          const candidates = schemaValues(owner.board).filter(
            (pokemon) =>
              isOnBench(pokemon) &&
              ![
                PokemonActionState.EXPLORING,
                PokemonActionState.DIGGING
              ].includes(pokemon.action) &&
              owner.groundHoles[
                BENCH_GROUND_HOLES_OFFSET + pokemon.positionX
              ] === 5 &&
              !this.snifferDogPulledPokemonIds.has(pokemon.id)
          )
          if (candidates.length === 0) return
          const reinforcement = pickRandomIn(candidates)
          this.snifferDogPulledPokemonIds.add(reinforcement.id)
          reinforcement.action = PokemonActionState.DIGGING
          this.room.broadcast(Transfer.DIG, {
            pokemonId: reinforcement.id,
            buriedItem: null
          })

          const boardHoles: { x: number; y: number }[] = []
          for (let row = 0; row < BOARD_HEIGHT / 2; row++) {
            for (let column = 0; column < BOARD_WIDTH; column++) {
              if (owner.groundHoles[row * BOARD_WIDTH + column] === 5) {
                boardHoles.push({
                  x: column,
                  y:
                    caster.team === Team.BLUE_TEAM
                      ? row
                      : BOARD_HEIGHT - 1 - row
                })
              }
            }
          }
          const openHoles = boardHoles.filter(
            ({ x, y }) => this.board.getEntityOnCell(x, y) === undefined
          )
          const arrivalHole =
            boardHoles.length > 0
              ? pickRandomIn(openHoles.length > 0 ? openHoles : boardHoles)
              : { x: caster.positionX, y: caster.positionY }

          caster.commands.push(
            new DelayedCommand(() => {
              caster.broadcastAbility({
                skill: "DIG",
                positionX: arrivalHole.x,
                positionY: arrivalHole.y
              })
            }, 750),
            new DelayedCommand(() => {
              const coord =
                this.board.getEntityOnCell(arrivalHole.x, arrivalHole.y) ===
                undefined
                  ? arrivalHole
                  : this.getClosestFreeCellTo(
                      arrivalHole.x,
                      arrivalHole.y,
                      caster.team
                    )
              if (!coord) return
              this.addPokemon(
                reinforcement,
                coord.x,
                coord.y,
                caster.team,
                true,
                false,
                owner
              )
            }, 1250)
          )
        })
      )
    }

    const jesterChampion = championOf.get(Blessing.JESTER)
    if (jesterChampion) {
      jesterChampion.effectsSet.add(
        new OnAbilityCastEffect((caster) => {
          const coord = this.getClosestFreeCellToPokemonEntity(caster)
          if (!coord) return
          const jester = this.addPokemon(
            PokemonFactory.createPokemonFromName(Pkm.SUBSTITUTE, caster.player),
            coord.x,
            coord.y,
            caster.team,
            true
          )
          jester.skill = Ability.METRONOME
          jester.metronomeForcedRarity = Rarity.LEGENDARY
          jester.stars = Math.max(
            1,
            Math.min(
              JESTER_SUBSTITUTE_MAX_STARS,
              1 +
                Math.floor(
                  (caster.critPower - DEFAULT_CRIT_POWER) /
                    JESTER_CRIT_POWER_PER_STAR
                )
            )
          )
          jester.maxPP = JESTER_SUBSTITUTE_MAX_PP
          jester.pp = JESTER_SUBSTITUTE_MAX_PP
        })
      )
    }

    const toxicResonanceChampion = championOf.get(Blessing.TOXIC_RESONANCE)
    if (toxicResonanceChampion) {
      this.toxicResonanceByTeam.set(toxicResonanceChampion.team, {
        champion: toxicResonanceChampion,
        beat: 0
      })
    }

    const grandIgnitionChampion = championOf.get(Blessing.GRAND_IGNITION)
    if (grandIgnitionChampion) {
      const ignition = {
        litCorners: new Set<number>(),
        ignited: false,
        champion: grandIgnitionChampion
      }
      this.grandIgnitionByTeam.set(grandIgnitionChampion.team, ignition)
      grandIgnitionChampion.effectsSet.add(
        new OnAbilityCastEffect((caster) => {
          const unlitCorners = GRAND_IGNITION_CORNER_CELLS.map(
            (_, index) => index
          ).filter((index) => !ignition.litCorners.has(index))
          if (unlitCorners.length === 0) return
          const cornerIndex = pickRandomIn(unlitCorners)
          ignition.litCorners.add(cornerIndex)
          caster.broadcastAbility({
            skill: `GRAND_IGNITION_TORCH_${ignition.litCorners.size}`,
            targetX: GRAND_IGNITION_CORNER_CELLS[cornerIndex].x,
            targetY: GRAND_IGNITION_CORNER_CELLS[cornerIndex].y,
            ap: 0
          })
          caster.maxPP = Math.max(
            GRAND_IGNITION_MIN_MAX_PP,
            Math.round(caster.maxPP * (1 - GRAND_IGNITION_MAX_PP_REDUCTION))
          )
          if (ignition.litCorners.size < GRAND_IGNITION_CORNER_CELLS.length)
            return
          caster.commands.push(
            new DelayedCommand(() => {
              ignition.ignited = true
              caster.broadcastAbility({ skill: "GRAND_IGNITION_BLAZE", ap: 0 })
              this.board.forEach((x, y, enemy) => {
                if (!enemy || enemy.team === caster.team || enemy.hp <= 0)
                  return
                enemy.addMaxHP(
                  -Math.round(enemy.maxHP * GRAND_IGNITION_MAX_HP_BURNED_RATIO),
                  caster,
                  0,
                  false,
                  true
                )
              })
            }, GRAND_IGNITION_TORCH_TRAVEL_DELAY)
          )
        })
      )
    }

    const valorChampion = championOf.get(Blessing.VALOR)
    if (valorChampion) {
      const wildStarsOnBench = schemaValues(player.board)
        .filter(
          (pokemon) => isOnBench(pokemon) && pokemon.types.has(Synergy.WILD)
        )
        .reduce((total, pokemon) => total + pokemon.stars, 0)
      if (wildStarsOnBench > 0) {
        valorChampion.addAttack(
          VALOR_ATTACK_PER_STAR * wildStarsOnBench,
          valorChampion,
          0,
          false
        )
        valorChampion.addShield(
          VALOR_SHIELD_PER_STAR * wildStarsOnBench,
          valorChampion,
          0,
          false
        )
      }
    }

    const colonyChampion = championOf.get(Blessing.COLONY)
    if (colonyChampion) {
      colonyChampion.effectsSet.add(
        new OnKillEffect(({ attacker }) => {
          const owner = attacker.player
          if (!owner || attacker.isGhostOpponent) return
          if (
            PkmFamily[attacker.name] !== Pkm.SCATTERBUG ||
            attacker.stars < 3
          )
            return
          // anywhere on the board, or fielding the last one would earn another
          const isSpewpaWaiting = schemaValues(owner.board).some(
            (pokemon) => pokemon.name === Pkm.SPEWPA
          )
          if (isSpewpaWaiting) return
          const freeCellX = getFirstAvailablePositionInBench(owner.board)
          if (freeCellX === null) return
          const spewpa = PokemonFactory.createPokemonFromName(
            Pkm.SPEWPA,
            owner
          )
          spewpa.hatchTimeOverride = COLONY_SPEWPA_HATCH_TIME
          spewpa.positionX = freeCellX
          spewpa.positionY = 0
          owner.board.set(spewpa.id, spewpa)
          spewpa.onAcquired(owner)
          owner.updateSynergies()
        })
      )
    }

    const sandBuddiesChampion = championOf.get(Blessing.SAND_BUDDIES)
    if (sandBuddiesChampion) {
      const trapinchLine = [Pkm.TRAPINCH, Pkm.VIBRAVA, Pkm.FLYGON]
      sandBuddiesChampion.effectsSet.add(
        new OnAbilityCastEffect((caster, board, target) => {
          if (!target || target.hp <= 0) return
          const coord = this.getClosestFreeCellToPokemonEntity(caster)
          if (!coord) return
          const buddy = this.addPokemon(
            PokemonFactory.createPokemonFromName(
              trapinchLine[caster.stars - 1] ?? Pkm.FLYGON,
              caster.player
            ),
            coord.x,
            coord.y,
            caster.team,
            true
          )
          buddy.pp = buddy.maxPP
        })
      )
    }

    const oliveGardenChampion = championOf.get(Blessing.OLIVE_GARDEN)
    if (oliveGardenChampion) {
      /* one field only: holding several lets terrain-pulse's fixed priority pick
         which one spreads, so a synergy stone would never take effect */
      const stoneFields = FIELD_STATUS_BY_SYNERGY.filter(
        ([synergy]) =>
          synergy !== Synergy.GRASS && oliveGardenChampion.types.has(synergy)
      )
      const grantedField =
        stoneFields.length > 0
          ? pickRandomIn(stoneFields)
          : FIELD_STATUS_BY_SYNERGY.find(([synergy]) =>
              oliveGardenChampion.types.has(synergy)
            )
      grantedField?.[1](oliveGardenChampion)
    }

    const orbitalStrikeChampion = championOf.get(Blessing.ORBITAL_STRIKE)
    if (orbitalStrikeChampion) {
      /* the melee unit is picked before the range buff, and never the Blipbug
         itself: it is the one meant to be standing among enemies */
      const meleeAllies = ownUnits.filter(
        (ally) => ally.range === 1 && ally !== orbitalStrikeChampion
      )
      if (meleeAllies.length > 0) {
        const fieldSpreader = getStrongestUnit(meleeAllies)
        fieldSpreader.status.addPsychicField(fieldSpreader)
      }
      orbitalStrikeChampion.range += ORBITAL_STRIKE_RANGE_BONUS
    }

    const mortarShellsChampion = championOf.get(Blessing.MORTAR_SHELLS)
    if (mortarShellsChampion) {
      mortarShellsChampion.range += MORTAR_SHELLS_RANGE_BONUS
      mortarShellsChampion.addAttack(
        Math.round(mortarShellsChampion.baseAtk * MORTAR_SHELLS_ATTACK_RATIO),
        mortarShellsChampion,
        0,
        false
      )
      mortarShellsChampion.addSpeed(
        -Math.round(
          mortarShellsChampion.baseSpeed * MORTAR_SHELLS_SPEED_RATIO
        ),
        mortarShellsChampion,
        0,
        false
      )
    }

    const highBreachingChampion = championOf.get(Blessing.HIGH_BREACHING)
    if (highBreachingChampion) {
      highBreachingChampion.skill = Ability.HIGH_BREACHING
      highBreachingChampion.maxPP = HIGH_BREACHING_MAX_PP
    }

    const frostGearChampion = championOf.get(Blessing.FROST_GEAR)
    if (frostGearChampion) {
      frostGearChampion.range += FROST_GEAR_RANGE_BONUS
      frostGearChampion.maxPP = FROST_GEAR_MAX_PP
      frostGearChampion.effects.add(EffectEnum.ABILITY_CRIT)
    }

    const shuttleBusChampion = championOf.get(Blessing.SHUTTLE_BUS)
    if (shuttleBusChampion) {
      shuttleBusChampion.maxPP = SHUTTLE_BUS_MAX_PP
      shuttleBusChampion.pp = SHUTTLE_BUS_MAX_PP
    }

    const radianceChampion = championOf.get(Blessing.RADIANCE)
    if (radianceChampion) {
      radianceChampion.types.add(Synergy.LIGHT)
      /* the team's Light effects were handed out earlier in applyPostEffects,
         when this unit was not yet spotlighted, so replay the active ones */
      const activeLightEffects = SynergyTiers[Synergy.LIGHT].filter(
        (lightEffect) => teamEffects.has(lightEffect)
      )
      if (activeLightEffects.length > 0) {
        /* its own spotlight, so it does not compete with the player's single
           light spot on the board */
        radianceChampion.hasOwnSpotlight = true
        radianceChampion.status.light = true
        activeLightEffects.forEach((lightEffect) =>
          this.applyEffect(radianceChampion, lightEffect)
        )
      }
    }

    const mariachiChampion = championOf.get(Blessing.MARIACHI_MAYHEM)
    if (mariachiChampion) {
      mariachiChampion.effectsSet.add(
        new OnAbilityCastEffect((caster, board) => {
          board
            .getCellsInRange(
              caster.positionX,
              caster.positionY,
              caster.range,
              false
            )
            .forEach((cell) => {
              if (cell.value && cell.value.team !== caster.team) {
                cell.value.status.triggerConfusion(
                  MARIACHI_MAYHEM_CONFUSION_DURATION,
                  cell.value,
                  caster
                )
              }
            })
        })
      )
    }

    const flowerQueenChampion = championOf.get(Blessing.FLOWER_QUEEN)
    if (flowerQueenChampion) {
      flowerQueenChampion.effectsSet.add(
        new OnAbilityCastEffect((caster) => {
          caster.maxPP = Math.max(
            FLOWER_QUEEN_MIN_MAX_PP,
            caster.maxPP - FLOWER_QUEEN_MAX_PP_REDUCTION
          )
        })
      )
    }

    const leafTornadoChampion = championOf.get(Blessing.LEAF_TORNADO)
    if (leafTornadoChampion) {
      leafTornadoChampion.effectsSet.add(
        new OnAttackEffect(
          ({
            pokemon,
            target,
            board,
            physicalDamage,
            specialDamage,
            trueDamage
          }) => {
            if (!target) return
            const enemyTeam =
              pokemon.team === Team.BLUE_TEAM ? Team.RED_TEAM : Team.BLUE_TEAM
            const ricochetTargets = board
              .getClosestEnemies(pokemon.positionX, pokemon.positionY, enemyTeam)
              .filter((enemy) => enemy.id !== target.id && enemy.hp > 0)
              .slice(0, LEAF_TORNADO_BOUNCES)

            let ratio = LEAF_TORNADO_DAMAGE_RATIO
            let bounceOrigin: PokemonEntity = target
            ricochetTargets.forEach((enemy) => {
              pokemon.broadcastAbility({
                skill: "GRASS_RANGE",
                positionX: bounceOrigin.positionX,
                positionY: bounceOrigin.positionY,
                targetX: enemy.positionX,
                targetY: enemy.positionY
              })
              bounceOrigin = enemy
              const damages: [number, AttackType][] = [
                [physicalDamage, AttackType.PHYSICAL],
                [specialDamage, AttackType.SPECIAL],
                [trueDamage, AttackType.TRUE]
              ]
              let bounceTakenDamage = 0
              damages.forEach(([damage, attackType]) => {
                if (damage <= 0) return
                const bounceDamage = Math.round(damage * ratio)
                bounceTakenDamage += bounceDamage
                enemy.handleDamage({
                  damage: bounceDamage,
                  board,
                  attackType,
                  attacker: pokemon,
                  shouldTargetGainMana: true
                })
              })
              /* handleDamage alone skips the attacker's on-hit hooks, so they
                 are replayed per bounce, the same way ZAP chains do it */
              pokemon.getEffects(OnHitEffect).forEach((effect) =>
                effect.apply({
                  attacker: pokemon,
                  target: enemy,
                  board,
                  totalTakenDamage: bounceTakenDamage,
                  physicalDamage: Math.round(physicalDamage * ratio),
                  specialDamage: Math.round(specialDamage * ratio),
                  trueDamage: Math.round(trueDamage * ratio)
                })
              )
              ratio *= LEAF_TORNADO_DAMAGE_RATIO
            })
          }
        )
      )
    }

    const auroraBorealisChampion = championOf.get(Blessing.AURORA_BOREALIS)
    if (auroraBorealisChampion) {
      const synergyBonus =
        (auroraBorealisChampion.player?.synergies.countActiveSynergies() ?? 0) *
        AURORA_BOREALIS_REDUCTION_PER_ACTIVE_SYNERGY
      ownUnits.forEach((ally) => {
        ally.isAuroraBorealisProtected = true
        ally.auroraBorealisSynergyBonus = synergyBonus
      })
    }
  }

  applyEffect(pokemon: IPokemonEntity, effect: EffectEnum) {
    const player = pokemon.player
    const types = pokemon.types
    switch (effect) {
    case EffectEnum.HONE_CLAWS:
      if (types.has(Synergy.DARK)) {
        pokemon.addCritChance(30, pokemon, 0, false)
        pokemon.addCritPower(30, pokemon, 0, false)
        pokemon.effects.add(EffectEnum.HONE_CLAWS)
        pokemon.effectsSet.add(new DarkSubstituteEffect(EffectEnum.HONE_CLAWS))
      }
      break
    case EffectEnum.ASSURANCE:
      if (types.has(Synergy.DARK)) {
        pokemon.addCritChance(40, pokemon, 0, false)
        pokemon.addCritPower(50, pokemon, 0, false)
        pokemon.effects.add(EffectEnum.ASSURANCE)
        pokemon.effectsSet.add(new DarkSubstituteEffect(EffectEnum.ASSURANCE))
      }
      break
    case EffectEnum.BEAT_UP:
      if (types.has(Synergy.DARK)) {
        pokemon.addCritChance(50, pokemon, 0, false)
        pokemon.addCritPower(80, pokemon, 0, false)
        pokemon.effects.add(EffectEnum.BEAT_UP)
        pokemon.effectsSet.add(new DarkSubstituteEffect(EffectEnum.BEAT_UP))
      }
      break
    case EffectEnum.FALSE_SURRENDER:
      if (types.has(Synergy.DARK)) {
        pokemon.addCritChance(50, pokemon, 0, false)
        pokemon.addCritPower(80, pokemon, 0, false)
        pokemon.effects.add(EffectEnum.FALSE_SURRENDER)
        pokemon.effectsSet.add(new DarkSubstituteEffect(EffectEnum.FALSE_SURRENDER))
      }
      break
      case EffectEnum.ANCIENT_POWER:
      case EffectEnum.ELDER_POWER:
      case EffectEnum.FORGOTTEN_POWER:
      case EffectEnum.PRIMORDIAL_POWER:
        if (types.has(Synergy.FOSSIL)) {
          pokemon.effects.add(effect)
        }
        break

      case EffectEnum.FLAME_BODY:
      case EffectEnum.WILDFIRE:
      case EffectEnum.BLAZE:
      case EffectEnum.DESOLATE_LAND:
        if (types.has(Synergy.FIRE)) {
          pokemon.effects.add(effect)
          pokemon.effectsSet.add(new FireHitEffect(effect))
        }
        break

      case EffectEnum.INGRAIN:
      case EffectEnum.GROWTH:
      case EffectEnum.SPORE:
      case EffectEnum.OVERGROW:
        if (types.has(Synergy.GRASS)) {
          pokemon.effects.add(effect)
        }
        break

      case EffectEnum.RAIN_DANCE:
      case EffectEnum.DRIZZLE:
      case EffectEnum.PRIMORDIAL_SEA:
        if (types.has(Synergy.WATER)) {
          pokemon.effects.add(effect)
        }
        break

      case EffectEnum.STAMINA:
      case EffectEnum.STRENGTH:
      case EffectEnum.ENDURE:
      case EffectEnum.PURE_POWER:
        if (types.has(Synergy.NORMAL)) {
          pokemon.effects.add(effect)
          pokemon.effectsSet.add(normalShieldEffect)
        }
        break

      case EffectEnum.RISING_VOLTAGE:
      case EffectEnum.POWER_SURGE:
      case EffectEnum.SUPERCHARGED:
        if (types.has(Synergy.ELECTRIC)) {
          pokemon.effects.add(effect)
          pokemon.effectsSet.add(electricTripleAttackEffect)
        }
        break

      case EffectEnum.GUTS:
      case EffectEnum.STURDY:
      case EffectEnum.DEFIANT:
      case EffectEnum.COACHING:
        if (types.has(Synergy.FIGHTING)) {
          pokemon.effects.add(effect)
          pokemon.effectsSet.add(new FightingKnockbackEffect(effect))
        }
        break

      case EffectEnum.STEEL_SURGE:
      case EffectEnum.STEEL_SPIKE:
      case EffectEnum.CORKSCREW_CRASH:
      case EffectEnum.MAX_MELTDOWN:
        pokemon.addDefense(3, pokemon, 0, false)
        if (types.has(Synergy.STEEL)) {
          pokemon.effects.add(effect)
        }
        break

      case EffectEnum.BULK_UP:
      case EffectEnum.RAGE:
      case EffectEnum.ANGER_POINT:
        if (types.has(Synergy.FIELD)) {
          pokemon.effects.add(effect)
          pokemon.effectsSet.add(new OnFieldDeathEffect(effect))
        }
        break

      case EffectEnum.PURSUIT:
      case EffectEnum.BRUTAL_SWING:
      case EffectEnum.POWER_TRIP:
      case EffectEnum.MERCILESS:
        if (types.has(Synergy.MONSTER)) {
          pokemon.effects.add(effect)
          pokemon.effectsSet.add(new MonsterKillEffect(effect))
        }
        break

      case EffectEnum.PRECOGNITION:
        if (types.has(Synergy.PSYCHIC)) {
          pokemon.effects.add(EffectEnum.PRECOGNITION)
          pokemon.addAbilityPower(40, pokemon, 0, false)
        }
        break

      case EffectEnum.AURA:
        if (types.has(Synergy.PSYCHIC)) {
          pokemon.effects.add(EffectEnum.AURA)
          pokemon.addAbilityPower(80, pokemon, 0, false)
        }
        break

      case EffectEnum.TRANSCENDENCE:
        if (types.has(Synergy.PSYCHIC)) {
          pokemon.effects.add(EffectEnum.TRANSCENDENCE)
          pokemon.addAbilityPower(120, pokemon, 0, false)
        }
        break

      case EffectEnum.MEDITATE:
      case EffectEnum.FOCUS_ENERGY:
      case EffectEnum.CALM_MIND:
        if (types.has(Synergy.HUMAN)) {
          pokemon.effects.add(effect)
          pokemon.effectsSet.add(humanHealEffect)
        }
        break

      case EffectEnum.TAILWIND:
      case EffectEnum.FEATHER_DANCE:
      case EffectEnum.MAX_AIRSTREAM:
      case EffectEnum.SKYDIVE:
        if (effect === EffectEnum.MAX_AIRSTREAM || effect === EffectEnum.SKYDIVE) {
          pokemon.addSpeed(10, pokemon, 0, false)
        } else {
          pokemon.addSpeed(5, pokemon, 0, false)
        }
        if (types.has(Synergy.FLYING)) {
          pokemon.effects.add(effect)
          pokemon.effectsSet.add(new FlyingProtectionEffect(effect))
        }
        break

      case EffectEnum.SWIFT_SWIM:
      case EffectEnum.HYDRATION:
      case EffectEnum.WATER_VEIL:
      case EffectEnum.SURGE_SURFER:
        pokemon.effects.add(effect)
        break

      case EffectEnum.COTTONWEED:
      case EffectEnum.FLYCATCHER:
      case EffectEnum.FRAGRANT:
      case EffectEnum.FLOWER_POWER:
        if (types.has(Synergy.FLORA)) {
          pokemon.effects.add(effect)
          pokemon.effectsSet.add(onFlowerMonDeath)
        }
        break

      case EffectEnum.BATTLE_ARMOR:
        if (types.has(Synergy.ROCK)) {
          pokemon.addDefense(10, pokemon, 0, false)
          pokemon.effects.add(EffectEnum.BATTLE_ARMOR)
          pokemon.effectsSet.add(rockDeathExplosionT1)
        }
        break
      
      case EffectEnum.MOUTAIN_RESISTANCE: 
        if (types.has(Synergy.ROCK)) {
          pokemon.addDefense(20, pokemon, 0, false) // pre-emptive nerf
          pokemon.effects.add(EffectEnum.MOUTAIN_RESISTANCE)
          pokemon.effectsSet.add(rockDeathExplosionT2)
        }
        break

      case EffectEnum.DIAMOND_STORM:
        if (types.has(Synergy.ROCK)) {
          pokemon.addDefense(40, pokemon, 0, false) 
          pokemon.effects.add(EffectEnum.DIAMOND_STORM)
          pokemon.effectsSet.add(rockDeathExplosionT3)
        }
        break

      case EffectEnum.CRYSTALLISATION:
        if (types.has(Synergy.ROCK)) {
          pokemon.addDefense(40, pokemon, 0, false)
          pokemon.effects.add(EffectEnum.DIAMOND_STORM)
          pokemon.effectsSet.add(rockDeathExplosionT3)
        }
        break

      case EffectEnum.AROMATIC_MIST:
      case EffectEnum.FAIRY_WIND:
      case EffectEnum.STRANGE_STEAM:
      case EffectEnum.MOON_FORCE:
        if (types.has(Synergy.FAIRY)) {
          pokemon.effects.add(effect)
          if (pokemon.player?.items.includes(Item.LONG_WAND)) {
            pokemon.range += 1
          }
          if (pokemon.player?.items.includes(Item.POUNCE_WAND)) {
            pokemon.effectsSet.add(pounceWandEffect)
          }
          if (effect === EffectEnum.MOON_FORCE) {
            pokemon.addLuck(5, pokemon, 0, false)
          }
        }
        break

      case EffectEnum.DRAGON_ENERGY:
      case EffectEnum.DRAGON_SCALES:
      case EffectEnum.DRAGON_DANCE:
        if (types.has(Synergy.DRAGON)) {
          pokemon.effects.add(effect)
          if (player) {
            const dragonLevel = schemaValues(player.board).reduce(
              (acc, p) =>
                acc +
                (p.types.has(Synergy.DRAGON) && !isOnBench(p) ? p.stars : 0),
              0
            )
            if (
              effect === EffectEnum.DRAGON_SCALES ||
              effect === EffectEnum.DRAGON_DANCE
            ) {
              pokemon.addShield(dragonLevel * 5, pokemon, 0, false)
            }
            if (effect === EffectEnum.DRAGON_DANCE) {
              pokemon.addAbilityPower(dragonLevel, pokemon, 0, false)
              pokemon.addSpeed(dragonLevel, pokemon, 0, false)
            }
          }
        }
        break

      case EffectEnum.CHILLY:
        pokemon.effects.add(EffectEnum.CHILLY)
        pokemon.addSpecialDefense(4, pokemon, 0, false)
        break

      case EffectEnum.FROSTY:
        pokemon.effects.add(EffectEnum.FROSTY)
        pokemon.addSpecialDefense(12, pokemon, 0, false)
        break

      case EffectEnum.FREEZING:
        pokemon.effects.add(EffectEnum.FREEZING)
        pokemon.addSpecialDefense(25, pokemon, 0, false)
        break

      case EffectEnum.SHEER_COLD:
        pokemon.effects.add(EffectEnum.SHEER_COLD)
        pokemon.addSpecialDefense(50, pokemon, 0, false)
        break

      case EffectEnum.POISONOUS:
      case EffectEnum.VENOMOUS:
      case EffectEnum.TOXIC:
        if (types.has(Synergy.POISON)) {
          pokemon.effects.add(effect)
          pokemon.effectsSet.add(new PoisonPPExplosionEffect(effect))
        }
        break

      case EffectEnum.LARGO:
      case EffectEnum.ALLEGRO:
      case EffectEnum.PRESTO:
        if (types.has(Synergy.SOUND)) {
          pokemon.effects.add(effect)
          pokemon.effectsSet.add(new SoundCryEffect(effect))
        }
        break

      case EffectEnum.COCOON:
      case EffectEnum.INFESTATION:
      case EffectEnum.HORDE:
      case EffectEnum.HEART_OF_THE_SWARM:
        if (types.has(Synergy.BUG)) {
          pokemon.effects.add(effect)
        }
        break

      case EffectEnum.TILLER:
      case EffectEnum.DIGGER:
      case EffectEnum.DRILLER:
      case EffectEnum.DEEP_MINER:
        if (types.has(Synergy.GROUND)) {
          pokemon.effects.add(effect)
          pokemon.effectsSet.add(new GroundHoleEffect(effect))
        }
        break

      case EffectEnum.DUBIOUS_DISC:
      case EffectEnum.LINK_CABLE:
      case EffectEnum.GOOGLE_SPECS:
        if (types.has(Synergy.ARTIFICIAL) && pokemon.items.size > 0) {
          const nbItems = max(3)(
            pokemon.items.size + (pokemon.items.has(Item.WONDER_BOX) ? 1 : 0)
          )
          const attackBoost = {
            [EffectEnum.DUBIOUS_DISC]: 0,
            [EffectEnum.LINK_CABLE]: (5 / 100) * pokemon.baseAtk,
            [EffectEnum.GOOGLE_SPECS]: (10 / 100) * pokemon.baseAtk
          }[effect]
          const apBoost = {
            [EffectEnum.DUBIOUS_DISC]: 0,
            [EffectEnum.LINK_CABLE]: 5,
            [EffectEnum.GOOGLE_SPECS]: 10
          }[effect]
          const shieldBoost = {
            [EffectEnum.DUBIOUS_DISC]: 0,
            [EffectEnum.LINK_CABLE]: (5 / 100) * pokemon.maxHP,
            [EffectEnum.GOOGLE_SPECS]: (10 / 100) * pokemon.maxHP
          }[effect]
          pokemon.addAttack(attackBoost * nbItems, pokemon, 0, false)
          pokemon.addAbilityPower(apBoost * nbItems, pokemon, 0, false)
          pokemon.addShield(shieldBoost * nbItems, pokemon, 0, false)
          pokemon.effects.add(effect)
        }
        break

      case EffectEnum.GRASSY_TERRAIN:
        if (types.has(Synergy.GRASS)) {
          pokemon.status.grassField = true
          pokemon.effects.add(EffectEnum.GRASSY_TERRAIN)
        }
        break

      case EffectEnum.PSYCHIC_TERRAIN:
        if (types.has(Synergy.PSYCHIC)) {
          pokemon.status.addPsychicField(pokemon)
          pokemon.effects.add(EffectEnum.PSYCHIC_TERRAIN)
        }
        break

      case EffectEnum.ELECTRIC_TERRAIN:
        if (types.has(Synergy.ELECTRIC)) {
          pokemon.status.addElectricField(pokemon)
          pokemon.effects.add(EffectEnum.ELECTRIC_TERRAIN)
        }
        break

      case EffectEnum.MISTY_TERRAIN:
        if (types.has(Synergy.FAIRY)) {
          pokemon.status.fairyField = true
          pokemon.effects.add(EffectEnum.MISTY_TERRAIN)
        }
        break

      case EffectEnum.SHINING_RAY:
        if (pokemon.inSpotlight) {
          pokemon.status.light = true
          pokemon.effects.add(EffectEnum.SHINING_RAY)
          pokemon.addAttack(Math.ceil(pokemon.atk * 0.2), pokemon, 0, false)
          pokemon.addAbilityPower(20, pokemon, 0, false)
        }
        break

      case EffectEnum.LIGHT_PULSE:
        if (pokemon.inSpotlight) {
          pokemon.status.light = true
          pokemon.effects.add(EffectEnum.LIGHT_PULSE)
          pokemon.addAttack(Math.ceil(pokemon.atk * 0.2), pokemon, 0, false)
          pokemon.addAbilityPower(20, pokemon, 0, false)
        }
        break

      case EffectEnum.ETERNAL_LIGHT:
        if (pokemon.inSpotlight) {
          pokemon.status.light = true
          pokemon.effects.add(EffectEnum.ETERNAL_LIGHT)
          pokemon.addAttack(Math.ceil(pokemon.atk * 0.2), pokemon, 0, false)
          pokemon.addAbilityPower(20, pokemon, 0, false)
          pokemon.status.triggerRuneProtect(8000, pokemon, pokemon)
          pokemon.addDefense(0.5 * pokemon.baseDef, pokemon, 0, false)
          pokemon.addSpecialDefense(0.5 * pokemon.baseSpeDef, pokemon, 0, false)
        }
        break

      case EffectEnum.MAX_ILLUMINATION:
        if (pokemon.inSpotlight) {
          pokemon.status.light = true
          pokemon.effects.add(EffectEnum.MAX_ILLUMINATION)
          pokemon.addAttack(Math.ceil(pokemon.atk * 0.2), pokemon, 0, false)
          pokemon.addAbilityPower(20, pokemon, 0, false)
          pokemon.status.triggerRuneProtect(8000, pokemon, pokemon)
          pokemon.addDefense(0.5 * pokemon.baseDef, pokemon, 0, false)
          pokemon.addSpecialDefense(0.5 * pokemon.baseSpeDef, pokemon, 0, false)
          pokemon.addShield(100, pokemon, 0, false)
          pokemon.status.addResurrection(pokemon)
        }
        break

      case EffectEnum.QUICK_FEET:
        if (types.has(Synergy.WILD)) {
          pokemon.effects.add(EffectEnum.QUICK_FEET)
          pokemon.addSpeed(20, pokemon, 0, false)
        }
        break

      case EffectEnum.RUN_AWAY:
        if (types.has(Synergy.WILD)) {
          pokemon.effects.add(EffectEnum.RUN_AWAY)
          pokemon.addSpeed(40, pokemon, 0, false)
        }
        break

      case EffectEnum.HUSTLE:
        if (types.has(Synergy.WILD)) {
          pokemon.effects.add(EffectEnum.HUSTLE)
          pokemon.addAttack(Math.ceil(0.4 * pokemon.baseAtk), pokemon, 0, false)
          pokemon.addSpeed(40, pokemon, 0, false)
        }
        break

      case EffectEnum.BERSERK:
        if (types.has(Synergy.WILD)) {
          pokemon.effects.add(EffectEnum.BERSERK)
          pokemon.effectsSet.add(wildBerserkEffect)
          pokemon.addAttack(Math.ceil(0.4 * pokemon.baseAtk), pokemon, 0, false)
          pokemon.addSpeed(40, pokemon, 0, false)
        }
        break

      case EffectEnum.FLUID:
      case EffectEnum.SHAPELESS:
      case EffectEnum.ETHEREAL: {
        const activeSynergies = player?.synergies.countActiveSynergies() || 0
        const tier = SynergyTiers[Synergy.AMORPHOUS].indexOf(effect) + 1
        let speedFactor = AMORPHOUS_SPEED_BUFF_PER_SYNERGY_TIER[tier] ?? 0
        let hpFactor = AMORPHOUS_HP_BUFF_PER_SYNERGY_TIER[tier] ?? 0

        if (player?.blessings?.includes(Blessing.SHAPELESS_SYNERGIES)) {
          const ownSynergies = new Set<Synergy>(types)
          pokemon.items.forEach((item) => {
            const synergyGivenByItem = SynergyGivenByItem[item]
            if (synergyGivenByItem) ownSynergies.add(synergyGivenByItem)
          })
          const ownActiveSynergies = [...ownSynergies].filter((type) =>
            isSynergyActiveForPlayer(player, type)
          ).length
          if (ownActiveSynergies >= SHAPELESS_SYNERGIES_MIN_ACTIVE) {
            speedFactor *= 1 + SHAPELESS_SYNERGIES_SPEED_RATIO
            hpFactor *= 1 + SHAPELESS_SYNERGIES_HP_RATIO
          }
        }

        pokemon.effects.add(effect)
        const amorphousMaxHp = Math.ceil(hpFactor * activeSynergies)
        pokemon.addSpeed(
          Math.ceil(speedFactor * activeSynergies),
          pokemon,
          0,
          false
        )
        pokemon.addMaxHP(amorphousMaxHp, pokemon, 0, false)
        if (
          types.has(Synergy.WATER) &&
          player?.blessings?.includes(Blessing.HYDRATED_CELLS)
        ) {
          pokemon.addAbilityPower(amorphousMaxHp, pokemon, 0, false)
        }
        break
      }

      case EffectEnum.CURSE_OF_VULNERABILITY:
      case EffectEnum.CURSE_OF_WEAKNESS:
      case EffectEnum.CURSE_OF_TORMENT:
      case EffectEnum.CURSE_OF_FATE:
        if (pokemon.types.has(Synergy.GHOST)) {
          pokemon.effects.add(effect)
          pokemon.addDodgeChance(0.15, pokemon, 0, false)
        }
        break

      case EffectEnum.VICTINI_PASSIVE: {
        pokemon.effects.add(effect)
        pokemon.addDodgeChance(-1, pokemon, 0, false)
        break
      }

      case EffectEnum.WATER_SPRING: {
        pokemon.effectsSet.add(WaterSpringEffect)
        break
      }

      case EffectEnum.WINDY: {
        const nbFloatStones = player ? count(player.items, Item.FLOAT_STONE) : 0
        pokemon.addSpeed(
          (pokemon.types.has(Synergy.FLYING) ? 20 : 10) + nbFloatStones * 10,
          "environment",
          0,
          false
        )
        break
      }

      case EffectEnum.SNOW:
        if (pokemon.types.has(Synergy.ICE) === false) {
          pokemon.addSpeed(-10, "environment", 0, false)
        }
        break

      case EffectEnum.SMOG: {
        const opponentPlayer =
          pokemon.team === Team.BLUE_TEAM ? this.redPlayer : this.bluePlayer
        const nbSmellyClays = opponentPlayer
          ? count(opponentPlayer.items, Item.SMELLY_CLAY)
          : 0
        pokemon.addDodgeChance(
          0.15 - 0.05 * nbSmellyClays,
          "environment",
          0,
          false
        )
        break
      }

      case EffectEnum.NIGHT: {
        const nbBlackAugurite = player
          ? count(player.items, Item.BLACK_AUGURITE)
          : 0

        pokemon.addCritChance(10 + 5 * nbBlackAugurite, "environment", 0, false)
        break
      }

      case EffectEnum.DROUGHT: {
        const nbHeatStones = player ? count(player.items, Item.HEAT_ROCK) : 0

        pokemon.addAttack(3 * nbHeatStones, "environment", 0, false)
        break
      }

      case EffectEnum.MURKY: {
        const player = pokemon.player
        const nbOddStones = player ? count(player.items, Item.ODD_KEYSTONE) : 0
        const luckDebuff =
          10 * nbOddStones - (pokemon.types.has(Synergy.GHOST) ? 0 : 30)
        pokemon.addLuck(luckDebuff, "environment", 0, false)
        break
      }

      case EffectEnum.MISTY: {
        const player = pokemon.player
        const nbMistStones = player ? count(player.items, Item.MIST_STONE) : 0
        if (nbMistStones > 0) {
          pokemon.addSpecialDefense(3 * nbMistStones, "environment", 0, false)
        }
        break
      }

      case EffectEnum.MAGNET_STORM: {
        // compute shield in applyPostEffects
        const isFastSteel =
          pokemon.types.has(Synergy.STEEL) && pokemon.baseSpeed > 50
        if (!isFastSteel) {
          pokemon.addSpeed(50 - pokemon.baseSpeed, "environment", 0, false)
        }
        break
      }

      case EffectEnum.PLAGUE: {
        pokemon.effectsSet.add(
          new OnAttackEffect(({ pokemon, target, board }) => {
            if (!target) return
            const nbAllies =
              board.cells.filter(
                (entity) => entity && entity.team === pokemon.team
              ).length - 1
            if (nbAllies > 0) {
              target.handleDamage({
                damage: nbAllies,
                board,
                attackType: pokemon.types.has(Synergy.BUG)
                  ? AttackType.TRUE
                  : AttackType.SPECIAL,
                attacker: pokemon,
                shouldTargetGainMana: true
              })
            }
          }, Passive.PLAGUE)
        )

        const nbStickyGlobs = pokemon.player
          ? count(pokemon.player.items, Item.STICKY_GLOB)
          : 0
        if (nbStickyGlobs > 0) {
          pokemon.effectsSet.add(
            new OnAttackEffect(({ pokemon, target, board }) => {
              if (target && chance(0.1*nbStickyGlobs, pokemon)) {
                board.addBoardEffect(
                  target.positionX,
                  target.positionY,
                  EffectEnum.STICKY_WEB,
                  pokemon.simulation
                )
                pokemon.broadcastAbility({
                  positionX: target.positionX,
                  positionY: target.positionY
                })
              }
            }, Passive.PLAGUE)
          )
        }
        break
      }

      case EffectEnum.CLOUDY: {
        pokemon.maxPP = Math.round(pokemon.maxPP * 1.1)

        const nbCloudOrbs = pokemon.player
          ? count(pokemon.player.items, Item.CLOUD_ORB)
          : 0
        if (nbCloudOrbs > 0) {
          pokemon.effectsSet.add(
            new OnAttackEffect(({ pokemon, target, board }) => {
              if (!target) return
              target.handleDamage({
                damage: Math.round(0.01 * nbCloudOrbs * target.maxHP),
                board,
                attackType: AttackType.SPECIAL,
                attacker: pokemon,
                shouldTargetGainMana: true
              })
            }, EffectEnum.CLOUDY)
          )
        }
        break
      }

      case EffectEnum.TERRAIN: {
        pokemon.effectsSet.add(
          new OnMoveEffect((pkm) => {
            pkm.addSpeed(1, pkm, 0, false)
          })
        )

        const nbPeatBlocks = pokemon.player
          ? count(pokemon.player.items, Item.PEAT_BLOCK)
          : 0
        if (nbPeatBlocks > 0) {
          pokemon.effectsSet.add(
            new OnAttackReceivedEffect(({ pokemon, board }) => {
              board
                .getAdjacentCells(pokemon.positionX, pokemon.positionY)
                .forEach((cell) => {
                  if (
                    cell.value &&
                    cell.value.team !== pokemon.team &&
                    chance(0.05 * nbPeatBlocks, pokemon)
                  ) {
                    cell.value.addSpeed(-3, pokemon, 0, false)
                  }
                })
            }, EffectEnum.TERRAIN)
          )
        }
        break
      }

      case EffectEnum.ECLIPSE: {
        pokemon.maxPP = Math.round(pokemon.maxPP * 0.9)

        const nbEclipseStones = pokemon.player
          ? count(pokemon.player.items, Item.ECLIPSE_STONE)
          : 0
        if (nbEclipseStones > 0) {
          pokemon.effectsSet.add(
            new OnAttackEffect(({ pokemon, target }) => {
              if (target && chance(0.05*nbEclipseStones, pokemon)) {
                target.addAbilityPower(-5*nbEclipseStones, pokemon, 0, false)
                pokemon.addAbilityPower(5*nbEclipseStones, pokemon, 0, false)
              }
            }, EffectEnum.ECLIPSE)
          )
        }
        break
      }

      default:
        break
    }
  }

  /* QUEST_CRIT and QUEST_ABSORB track the best value any ally has reached in a
     single fight, so the Effects tab can show the record and the quest completes
     once it passes the target */
  checkCombatQuestThresholds() {
    const sides: [Player | undefined, MapSchema<PokemonEntity>][] = [
      [this.bluePlayer, this.blueTeam],
      [this.bluePartnerPlayer, this.blueTeam]
    ]
    // the red side of a ghost battle is a copy of a player fighting elsewhere
    if (!this.isGhostBattle) sides.push([this.redPlayer, this.redTeam])
    for (const [player, team] of sides) {
      if (!player?.blessings?.length) continue
      const wantsCrit = player.blessings.includes(Blessing.QUEST_CRIT)
      const wantsAbsorb = player.blessings.includes(Blessing.QUEST_ABSORB)
      if (!wantsCrit && !wantsAbsorb) continue

      team.forEach((pkm) => {
        if (pkm.player !== player) return
        if (wantsCrit) {
          player.recordBlessingQuestBest(Blessing.QUEST_CRIT, pkm.critPower)
        }
        if (wantsAbsorb) {
          player.recordBlessingQuestBest(
            Blessing.QUEST_ABSORB,
            pkm.physicalDamageReduced +
              pkm.specialDamageReduced +
              pkm.shieldDamageTaken
          )
        }
      })
    }
  }

  update(dt: number) {
    if (this.blueTeam.size === 0 || this.redTeam.size === 0) {
      this.onFinish()
    }

    this.checkCombatQuestThresholds()
    if (!this.finished) this.updateForgottenReinforcements(dt)
    if (!this.finished) this.updateReveilleReinforcements(dt)

    this.blueTeam.forEach((pkm, key) => {
      this.blueDpsMeter
        .get(key)
        ?.update(
          pkm.physicalDamage,
          pkm.specialDamage,
          pkm.trueDamage,
          pkm.physicalDamageReduced,
          pkm.specialDamageReduced,
          pkm.shieldDamageTaken,
          pkm.healDone,
          pkm.shieldDone
        )

      pkm.update(dt, this.board, pkm.player ?? this.bluePlayer)
    })

    this.redTeam.forEach((pkm, key) => {
      this.redDpsMeter
        .get(key)
        ?.update(
          pkm.physicalDamage,
          pkm.specialDamage,
          pkm.trueDamage,
          pkm.physicalDamageReduced,
          pkm.specialDamageReduced,
          pkm.shieldDamageTaken,
          pkm.healDone,
          pkm.shieldDone
        )

      pkm.update(dt, this.board, this.redPlayer)
    })

    if (this.weather === Weather.STORM) {
      this.stormLightningTimer -= dt
      if (this.stormLightningTimer <= 0 && !this.finished) {
        this.stormLightningTimer = randomBetween(2000, 6000)
        // trigger lightning
        const x = randomBetween(0, this.board.columns - 1)
        const y = randomBetween(0, this.board.rows - 1)
        //logger.debug('lightning at ' + x + ' ' + y)
        const pokemonOnCell = this.board.getEntityOnCell(x, y)
        if (pokemonOnCell) {
          const nbElectricQuartz = pokemonOnCell.player
            ? count(pokemonOnCell.player.items, Item.ELECTRIC_QUARTZ)
            : 0
          if (nbElectricQuartz > 0) {
            pokemonOnCell.addShield(
              50 * nbElectricQuartz,
              pokemonOnCell,
              0,
              false
            )
          }
          // ELECTRIC_QUARTZ awakening: charge up when THUNDER_STRUCK
          if (pokemonOnCell.awakening === Awakening.ELECTRIC_QUARTZ) {
            pokemonOnCell.addSpeed(5, pokemonOnCell, 0, false)
            pokemonOnCell.addShield(10, pokemonOnCell, 0, false)
          }
          if (pokemonOnCell.types.has(Synergy.ELECTRIC)) {
            pokemonOnCell.status.addElectricField(pokemonOnCell)
            pokemonOnCell.addSpeed(20, pokemonOnCell, 0, false)
            pokemonOnCell.addShield(30, pokemonOnCell, 0, false)
          } else {
            const { takenDamage } = pokemonOnCell.handleDamage({
              damage: 100,
              board: this.board,
              attackType: AttackType.SPECIAL,
              attacker: null,
              shouldTargetGainMana: false
            })
            // Storm lightning is board-wide weather with no caster; credit its
            // strike to the enemy team's Storm row (see creditSyntheticDamage).
            this.creditSyntheticDamage(
              pokemonOnCell,
              DPS_STORM_ID,
              AttackType.SPECIAL,
              takenDamage
            )
          }
        }
        this.room.broadcast(Transfer.BOARD_EVENT, {
          simulationId: this.id,
          effect: EffectEnum.LIGHTNING_STRIKE,
          x,
          y
        })
      }
    }

    if (this.weather === Weather.FLOOD) {
      this.floodWaveTimer -= dt
      if (this.floodWaveTimer <= 0 && !this.finished) {
        this.floodWaveTimer = 3000
        this.handleFloodWave()
      }
    }

    if (this.weather === Weather.ELDER_STORM) {
      this.elderStormTimer -= dt
      if (this.elderStormTimer <= 0 && !this.finished) {
        this.elderStormTimer = 2000
        const empower = (pkm: IPokemonEntity) => {
          pkm.addSpeed(1, pkm, 0, false)
          pkm.addAbilityPower(2, pkm, 0, false)
          if (pkm.types.has(Synergy.DRAGON)) {
            pkm.addShield(5, pkm, 0, false)
          }
        }
        this.blueTeam.forEach(empower)
        this.redTeam.forEach(empower)
      }
    }

    if (this.weather === Weather.DISTORTION) {
      this.distortionTimer -= dt
      if (this.distortionTimer <= 0 && !this.finished) {
        this.distortionTimer = 5000
        const distort = (pkm: PokemonEntity) => {
          // ARTIFICIAL Pokémon are immune to the reality-warping distortion
          if (pkm.types.has(Synergy.ARTIFICIAL)) return
          pkm.status.triggerArmorReduction(2000, pkm)
        }
        this.blueTeam.forEach(distort)
        this.redTeam.forEach(distort)
      }
    }

    if (this.weather === Weather.METEOR_SHOWER) {
      this.meteorShowerTimer -= dt
      if (this.meteorShowerTimer <= 0 && !this.finished) {
        this.meteorShowerTimer = 7000
        const x = randomBetween(0, this.board.columns - 1)
        const y = randomBetween(0, this.board.rows - 1)
        // start the falling-meteor visual now; queue the damage to land ~1s
        // later so it hits when the meteor visually strikes down
        this.room.broadcast(Transfer.BOARD_EVENT, {
          simulationId: this.id,
          effect: EffectEnum.METEOR_SHOWER,
          x,
          y
        })
        this.meteorStrikeQueue.push({ x, y, delay: 1000 })
      }
    }

    // apply queued meteor impacts once their fall delay elapses; occupants are
    // re-evaluated at impact time, so it hits whoever stands there on landing
    if (this.meteorStrikeQueue.length > 0) {
      this.meteorStrikeQueue = this.meteorStrikeQueue.filter((m) => {
        m.delay -= dt
        if (m.delay > 0) return true
        if (!this.finished) {
          const strike = (pkm: PokemonEntity | undefined) => {
            if (!pkm) return
            const { takenDamage } = pkm.handleDamage({
              damage: 100,
              board: this.board,
              attackType: AttackType.PHYSICAL,
              attacker: null,
              shouldTargetGainMana: false
            })
            this.creditSyntheticDamage(
              pkm,
              DPS_METEOR_SHOWER_ID,
              AttackType.PHYSICAL,
              takenDamage
            )
            if (pkm.types.has(Synergy.FOSSIL)) {
              const ratio =
                pkm.awakening === Awakening.FOSSIL_FRAGMENT ? 1 : 0.5
              pkm.addAttack(ratio * pkm.baseAtk, pkm, 0, false)
            }
          }
          this.board
            .getAdjacentCells(m.x, m.y, true)
            .forEach((cell) => strike(cell.value))
        }
        return false
      })
    }

    if (this.blueDoomTimer > 0) {
      this.blueDoomTimer -= dt
      if (this.blueDoomTimer <= 0) this.triggerImpendingDoom(Team.BLUE_TEAM)
    }

    if (this.redDoomTimer > 0) {
      this.redDoomTimer -= dt
      if (this.redDoomTimer <= 0) this.triggerImpendingDoom(Team.RED_TEAM)
    }

    if (this.secondWindTimer > 0) {
      this.secondWindTimer -= dt
      if (this.secondWindTimer <= 0) {
        this.secondWindTimer = SECOND_WIND_RESURRECTION_INTERVAL
        for (const [player, teamIndex] of [
          [this.bluePlayer, Team.BLUE_TEAM],
          [this.bluePartnerPlayer, Team.BLUE_TEAM],
          [this.redPlayer, Team.RED_TEAM]
        ] as const) {
          if (player?.blessings?.includes(Blessing.SECOND_WIND)) {
            this.grantSecondWindResurrection(player, teamIndex)
          }
        }
      }
    }

    if (this.firstWindTimer > 0) {
      this.firstWindTimer -= dt
      if (this.firstWindTimer <= 0) {
        for (const [player, teamIndex] of [
          [this.bluePlayer, Team.BLUE_TEAM],
          [this.bluePartnerPlayer, Team.BLUE_TEAM],
          [this.redPlayer, Team.RED_TEAM]
        ] as const) {
          if (player?.blessings?.includes(Blessing.FIRST_WIND)) {
            const team =
              teamIndex === Team.BLUE_TEAM ? this.blueTeam : this.redTeam
            team.forEach((ally) => {
              if (ally.player === player && ally.hp > 0) {
                ally.handleHeal(
                  ally.maxHP * FIRST_WIND_HEAL_RATIO,
                  ally,
                  0,
                  false
                )
              }
            })
          }
        }
      }
    }

    if (this.toxicResonanceByTeam.size > 0) {
      this.toxicResonanceBeatTimer -= dt
      if (this.toxicResonanceBeatTimer <= 0) {
        this.toxicResonanceBeatTimer = TOXIC_RESONANCE_BEAT_INTERVAL
        this.toxicResonanceByTeam.forEach((resonance) =>
          this.applyToxicResonance(resonance)
        )
      }
    }

    if (this.grandIgnitionByTeam.size > 0) {
      this.grandIgnitionTickTimer -= dt
      if (this.grandIgnitionTickTimer <= 0) {
        this.grandIgnitionTickTimer = GRAND_IGNITION_TICK_INTERVAL
        this.applyGrandIgnitionDamage()
      }
    }

    if (this.tidalWaveTimer > 0) {
      this.tidalWaveTimer -= dt
      if (this.tidalWaveTimer <= 0) {
        this.tidalWaveCounter++
        this.handleTidalWaveForTeam(Team.BLUE_TEAM)
        this.handleTidalWaveForTeam(Team.RED_TEAM)
        if (
          this.redEffects.has(EffectEnum.SURGE_SURFER) ||
          this.blueEffects.has(EffectEnum.SURGE_SURFER) ||
          this.tidalWaveCounter < 2
        ) {
          this.tidalWaveTimer = 7000
        }
      }
    }
  }

  stop() {
    const players = [this.bluePlayer, this.bluePartnerPlayer, this.redPlayer]
    players.forEach((player) => {
      player?.blessingsRef?.questProgress.delete(Blessing.REVEILLE)
      player?.board.forEach((pokemon) => {
        if (
          this.snifferDogPulledPokemonIds.has(pokemon.id) &&
          pokemon.action === PokemonActionState.DIGGING
        ) {
          pokemon.action = PokemonActionState.IDLE
        }
        const lockedBefore = this.reveilleLockedPokemon.get(pokemon.id) // avoid clash with flying letter
        if (lockedBefore) {
          pokemon.canBeBenched = lockedBefore.canBeBenched
          pokemon.canHoldItems = lockedBefore.canHoldItems
          if (pokemon.action === PokemonActionState.EXPLORING) {
            pokemon.action = PokemonActionState.IDLE
          }
        }
      })
    })

    this.blueTeam.forEach((pokemon, key) => {
      // logger.debug('deleting ' + pokemon.name);
      // @ts-ignore: entity shouldnt be used after simulation stop, so we can safely delete it
      delete pokemon.simulation // remove circular reference to help garbage collection
      this.blueTeam.delete(key)
    })

    this.redTeam.forEach((pokemon, key) => {
      // logger.debug('deleting ' + pokemon.name);
      // @ts-ignore: entity shouldnt be used after simulation stop, so we can safely delete it
      delete pokemon.simulation // remove circular reference to help garbage collection
      this.redTeam.delete(key)
    })

    this.weather = Weather.NEUTRAL
    this.winnerId = ""
    this.room.broadcast(Transfer.SIMULATION_STOP)
    // @ts-ignore: room shouldnt be used after simulation stop, so we can safely delete it
    delete this.room // remove circular reference to help garbage collection
  }

  plantGrudgeSubstitute(loser: Player) {
    // parked on the far right, out of the way of the bench they actually use
    const freeCellX = getLastAvailablePositionInBench(loser.board)
    if (freeCellX === null) return
    const substitute = PokemonFactory.createPokemonFromName(
      Pkm.SUBSTITUTE,
      loser
    )
    substitute.positionX = freeCellX
    substitute.positionY = 0
    substitute.manifestationLocked = true
    loser.board.set(substitute.id, substitute)
  }

  /* Dracovish takes an enemy out of the fight: it leaves the board and its team
     map, so the fight can still resolve, and comes back if Dracovish falls. */
  seizePokemon(seizer: PokemonEntity, victim: PokemonEntity, board: Board) {
    if (seizer.seizedEnemy || victim.hp <= 0) return
    board.setEntityOnCell(victim.positionX, victim.positionY, undefined)
    const team = victim.team === Team.BLUE_TEAM ? this.blueTeam : this.redTeam
    team.delete(victim.id)
    seizer.seizedEnemy = victim
  }

  releaseSeizedPokemon(seizer: PokemonEntity, board: Board) {
    const victim = seizer.seizedEnemy
    if (!victim) return
    seizer.seizedEnemy = null
    if (victim.hp <= 0) return
    const place = board.getClosestAvailablePlace(
      seizer.positionX,
      seizer.positionY
    )
    if (!place) return

    /* spawned fresh rather than re-inserting the seized entity: colyseus releases
       a Schema's ref when it leaves a collection, so putting the same instance
       back never encodes an ADD and the client never redraws it */
    const released = this.addPokemon(
      victim.refToBoardPokemon as Pokemon,
      place.x,
      place.y,
      victim.team,
      true
    )
    // carry over what it was worth when it was taken out of the fight
    released.hp = victim.hp
    released.shield = victim.shield
    released.pp = victim.pp
  }

  onFinish() {
    this.finishedAt = Date.now()
    this.finished = true

    if (this.blueTeam.size === 0 && this.redTeam.size > 0) {
      this.winnerId = this.redPlayerId
    } else if (this.redTeam.size === 0 && this.blueTeam.size > 0) {
      this.winnerId = this.bluePlayerId
    }

    const winningTeam =
      this.winnerId === this.redPlayerId
        ? this.redTeam
        : this.winnerId === this.bluePlayerId
          ? this.blueTeam
          : null
    if (winningTeam) {
      winningTeam.forEach((p) => {
        const entity = p as PokemonEntity
        entity.status.clearNegativeStatus(entity)
        if (entity.status.resurrecting) {
          entity.status.resurrecting = false
          entity.resurrect()
        }
        if (!entity.status.tree) {
          entity.action = PokemonActionState.HOP
        }
      })
    }

    // Handle battle results and rewards for both players
    // sideId is the id compared against winnerId (the partner in Double Up
    // shared PVE fights wins/loses with the blue side)
    const playersToProcess = [
      {
        player: this.redPlayer,
        playerId: this.redPlayerId,
        sideId: this.redPlayerId,
        opponentTeam: this.blueTeam,
        opponentPlayer: this.bluePlayer,
        opponentPlayerId: this.bluePlayerId
      },
      {
        player: this.bluePlayer,
        playerId: this.bluePlayerId,
        sideId: this.bluePlayerId,
        opponentTeam: this.redTeam,
        opponentPlayer: this.redPlayer,
        opponentPlayerId: this.redPlayerId
      }
    ]
    if (this.bluePartnerPlayer) {
      playersToProcess.push({
        player: this.bluePartnerPlayer,
        playerId: this.bluePartnerPlayer.id,
        sideId: this.bluePlayerId,
        opponentTeam: this.redTeam,
        opponentPlayer: this.redPlayer,
        opponentPlayerId: this.redPlayerId
      })
    }

    for (const {
      player,
      playerId,
      sideId,
      opponentTeam,
      opponentPlayer,
      opponentPlayerId
    } of playersToProcess) {
      /*logger.debug(
        `Processing results for player ${playerId} in simulation ${this.id} (stage: ${this.stageLevel}, ${player?.name} vs ${opponentPlayer?.name})`,
        {
          playerId,
          opponentPlayerId,
          noPlayer: !player,
          isGhostOpponent: playerId === this.bluePlayerId && this.isGhostBattle,
          isGhostPlayer: this.id !== player?.simulationId
        }
      )*/
      const isPVEPlayer = playerId === "pve" || !player
      if (isPVEPlayer) continue
      const isGhostPlayer = this.id !== player.simulationId
      const isGhostOpponent =
        sideId === this.bluePlayerId && this.isGhostBattle
      const isPvE = opponentPlayerId === "pve"
      const battleResult =
        this.winnerId === sideId
          ? BattleResult.WIN
          : this.winnerId === opponentPlayerId
            ? BattleResult.DEFEAT
            : BattleResult.DRAW

      // Add battle result
      if (!isGhostPlayer) {
        player.addBattleResult(
          player.opponentId,
          player.opponentName,
          battleResult,
          player.opponentAvatar,
          this.weather
        )

        // Compute streak
        if (!isPvE) {
          const previousBattleResult = player.calledShotPending
            ? BattleResult.WIN
            : player.history
                .filter(
                  (stage) =>
                    stage.id !== "pve" && stage.result !== BattleResult.DRAW
                )
                .map((stage) => stage.result)
                .at(-2)
          player.calledShotPending = false
          if (battleResult === BattleResult.DRAW) {
            // preserve existing streak but lose HP
          } else if (battleResult !== previousBattleResult) {
            // reset streak
            player.streak = 0
          } else {
            player.streak += 1
          }
        }
      }

      const client = this.room.clients.find((cli) => cli.auth.uid === playerId)

      // Handle win/loss outcomes
      if (this.winnerId === sideId) {
        // WIN
        if (!isGhostPlayer) {
          onFossilUnlockFightWon(
            player,
            winningTeam
              ? schemaValues(winningTeam).filter(
                  (entity) => entity.player === player
                )
              : []
          )
        }
        if (!isPvE && !isGhostPlayer) {
          // no extra gold from PvE wins
          const hasLeadersCrest =
            opponentPlayer?.items.includes(Item.LEADERS_CREST) ?? false
          const moneyGain = hasLeadersCrest ? 5 : 1
          player.addMoney(moneyGain, true, null)
          client?.send(Transfer.PLAYER_INCOME, moneyGain)
          if (hasLeadersCrest && opponentPlayer) {
            removeInArray(opponentPlayer.items, Item.LEADERS_CREST)
            player.items.push(Item.LEADERS_CREST)
          }
          if (
            opponentPlayer &&
            !isGhostOpponent &&
            player.blessings?.includes(Blessing.GRUDGE)
          ) {
            this.plantGrudgeSubstitute(opponentPlayer)
          }
        }
      } else {
        // LOSE
        const playerDamage = this.room.computeRoundDamage(
          opponentTeam,
          this.stageLevel
        )
        const isPVE = this.redPlayerId === "pve"
        if (!isGhostPlayer && (isPVE || this.room.state.gameMode !== GameMode.DOUBLE_UP)) {
          player.life -= playerDamage
          if (playerDamage > 0) {
            client?.send(Transfer.PLAYER_DAMAGE, playerDamage)
          }
        }
        if (opponentPlayer && !isGhostOpponent) {
          const previousPlayerDamageDealt =
            opponentPlayer.gameStats.totalPlayerDamageDealt
          opponentPlayer.gameStats.totalPlayerDamageDealt += playerDamage
          if (
            playerDamage > 0 &&
            opponentPlayer.blessings?.includes(Blessing.VAMPIRIC)
          ) {
            healPlayerLife(
              opponentPlayer,
              Math.ceil(playerDamage * VAMPIRIC_HEAL_RATIO),
              this.room.state
            )
          }
          opponentPlayer.checkLunchMoneyReward(previousPlayerDamageDealt)
          if (
            opponentPlayer.items.includes(Item.MISSION_ORDER_RED) &&
            opponentPlayer.gameStats.totalPlayerDamageDealt >= 100
          ) {
            opponentPlayer.completeMissionOrder(Item.MISSION_ORDER_RED)
          }
        }
      }

      // Handle weather rock collection
      if (
        this.weather !== Weather.NEUTRAL &&
        player.synergies.hasSynergyActive(Synergy.ROCK) &&
        !isGhostPlayer &&
        !isPvE // No weather rocks collected for PvE rounds
      ) {
        const rockCollected = WeatherRocksByWeather.get(this.weather)
        if (rockCollected) {
          player.weatherRocks.push(rockCollected)
          if (player.weatherRocks.length > 3) {
            player.weatherRocks.shift()
          }
          player.updateWeatherRocks()
        }
      }
    }

    this.room.rankPlayers()
  }

  /* called from inside each curse branch, so CURSE_OF_TWO's second pass gets
     these statuses on its extra target too */
  applyHexManiacStatus(
    effect: EffectEnum,
    target: PokemonEntity,
    curser: PokemonEntity
  ) {
    if (!curser.player?.blessings?.includes(Blessing.HEX_MANIAC)) return
    const duration = HEX_MANIAC_STATUS_DURATION
    if (effect === EffectEnum.CURSE_OF_VULNERABILITY) {
      target.status.triggerArmorReduction(duration, target)
    } else if (effect === EffectEnum.CURSE_OF_WEAKNESS) {
      target.status.triggerFatigue(duration, target, curser)
    } else if (effect === EffectEnum.CURSE_OF_TORMENT) {
      target.status.triggerParalysis(duration, target, curser)
    } else if (effect === EffectEnum.CURSE_OF_FATE) {
      target.status.triggerSilence(duration, target, curser)
    }
  }

  applyCurse(effect: EffectEnum, opponentTeamNumber: number, pass = 1) {
    const team =
      opponentTeamNumber === Team.RED_TEAM ? this.blueTeam : this.redTeam
    const opponentTeam =
      opponentTeamNumber === Team.BLUE_TEAM ? this.blueTeam : this.redTeam
    const isCursed: { [key in EffectEnum]?: (p: PokemonEntity) => boolean } = {
      [EffectEnum.CURSE_OF_VULNERABILITY]: (p) => p.status.curseVulnerability,
      [EffectEnum.CURSE_OF_WEAKNESS]: (p) => p.status.curseWeakness,
      [EffectEnum.CURSE_OF_TORMENT]: (p) => p.status.curseTorment,
      [EffectEnum.CURSE_OF_FATE]: (p) => p.status.curseFate
    }
    const cursingPlayer =
      opponentTeamNumber === Team.RED_TEAM ? this.bluePlayer : this.redPlayer
    const maxTargets = cursingPlayer?.blessings?.includes(Blessing.CURSE_OF_TWO)
      ? 2
      : 1
    const activeTargets = [...opponentTeam.values()].filter(
      (pokemon) => pokemon.hp > 0 && isCursed[effect]?.(pokemon) === true
    ).length
    if (activeTargets >= maxTargets) return
    const opponentsCursable = (
      shuffleArray([...opponentTeam.values()]).filter(
        (p) => p.hp > 0
      ) as PokemonEntity[]
    ).filter((p) => isCursed[effect]?.(p) !== true)
    const curser = schemaValues(team).find((e) => e.types.has(Synergy.GHOST)) ?? schemaValues(team)[0]
    // the curser is not important, we just need a reference to an opponent for stat debuffs
    if (!curser) return

    if (effect === EffectEnum.CURSE_OF_VULNERABILITY) {
      const highestDef = Math.max(
        ...opponentsCursable.map((p) => p.def + p.speDef)
      )
      const enemyWithHighestDef = pickRandomIn(
        opponentsCursable.filter((p) => p.def + p.speDef === highestDef)
      )
      if (enemyWithHighestDef) {
        enemyWithHighestDef.addDefense(-5, curser, 0, false)
        enemyWithHighestDef.addSpecialDefense(-5, curser, 0, false)
        enemyWithHighestDef.status.curseVulnerability = true
        enemyWithHighestDef.status.triggerFlinch(30000, enemyWithHighestDef)
        this.applyHexManiacStatus(effect, enemyWithHighestDef, curser)
      }
    }

    if (effect === EffectEnum.CURSE_OF_WEAKNESS) {
      const highestAtk = Math.max(...opponentsCursable.map((p) => p.atk))
      const enemyWithHighestAtk = pickRandomIn(
        opponentsCursable.filter((p) => p.atk === highestAtk)
      )
      if (enemyWithHighestAtk) {
        enemyWithHighestAtk.addAttack(
          Math.round(-0.2 * enemyWithHighestAtk.atk),
          curser,
          0,
          false
        )
        enemyWithHighestAtk.status.curseWeakness = true
        enemyWithHighestAtk.status.triggerParalysis(
          30000,
          enemyWithHighestAtk,
          null
        )
        this.applyHexManiacStatus(effect, enemyWithHighestAtk, curser)
      }
    }

    if (effect === EffectEnum.CURSE_OF_TORMENT) {
      const highestAP = Math.max(...opponentsCursable.map((p) => p.ap))
      const enemyWithHighestAP = pickRandomIn(
        opponentsCursable.filter((p) => p.ap === highestAP)
      )
      if (enemyWithHighestAP) {
        enemyWithHighestAP.addAbilityPower(-30, curser, 0, false)
        enemyWithHighestAP.status.curseTorment = true
        enemyWithHighestAP.status.triggerFatigue(
          30000,
          enemyWithHighestAP,
          null
        )
        this.applyHexManiacStatus(effect, enemyWithHighestAP, curser)
      }
    }

    if (effect === EffectEnum.CURSE_OF_FATE) {
      const strongestEnemy = getStrongestUnit(opponentsCursable)
      if (strongestEnemy) {
        strongestEnemy.status.curseFate = true
        strongestEnemy.status.triggerCurse(8000, strongestEnemy)
        this.applyHexManiacStatus(effect, strongestEnemy, curser)
      }
    }

    /* CURSE_OF_TWO blessing: curse a second enemy. The pass counter bounds the
       recursion, and the already cursed filter above picks a different target */
    if (
      pass === 1 &&
      cursingPlayer?.blessings?.includes(Blessing.CURSE_OF_TWO)
    ) {
      this.applyCurse(effect, opponentTeamNumber, 2)
    }
  }

  addPikachuSurferToBoard(team: Team) {
    const player = team === Team.RED_TEAM ? this.redPlayer : this.bluePlayer
    const summoned = player?.blessings?.includes(Blessing.TIDAL_GUARDIAN)
      ? Pkm.LUGIA
      : Pkm.PIKACHU_SURFER
    const surfer = PokemonFactory.createPokemonFromName(summoned, player)
    if (player) player.pokemonsPlayed.add(summoned)
    const coord = this.getFirstFreeCell(team)
    if (coord) {
      const entity = this.addPokemon(surfer, coord.x, coord.y, team, true)
      entity.isTidalGuardian = summoned === Pkm.LUGIA
    }
  }

  getUnisonDamageDealt(team: MapSchema<PokemonEntity>, player: Player): number {
    return [...team.values()]
      .filter(
        (entity) =>
          entity.player === player && entity.types.has(Synergy.HUMAN)
      )
      .reduce(
        (total, entity) =>
          total +
          entity.physicalDamage +
          entity.specialDamage +
          entity.trueDamage,
        0
      )
  }

  updateUnisonMeter(team: MapSchema<PokemonEntity>, player: Player) {
    if (player.unisonTriggered) return
    const pooled = this.getUnisonDamageDealt(team, player)
    player.blessingsRef?.questProgress.set(
      Blessing.UNISON,
      Math.min(UNISON_METER_DAMAGE, Math.floor(pooled))
    )
    if (pooled < UNISON_METER_DAMAGE) return

    player.unisonTriggered = true
    player.blessingsRef?.questProgress.set(
      Blessing.UNISON,
      UNISON_TRIGGERED_PROGRESS_OFFSET + UNISON_METER_DAMAGE
    )
    this.strikeUnison(team, player, UNISON_METER_DAMAGE)
  }

  strikeUnison(
    team: MapSchema<PokemonEntity>,
    player: Player,
    chargedDamage: number
  ) {
    const allies = [...team.values()].filter(
      (entity) => entity.player === player && entity.hp > 0
    )
    if (allies.length === 0) {
      player.blessingsRef?.questProgress.set(
        Blessing.UNISON,
        UNISON_FINISHED_PROGRESS
      )
      return
    }
    const enemyTeam =
      allies[0].team === Team.BLUE_TEAM ? this.redTeam : this.blueTeam
    const livingEnemies = [...enemyTeam.values()].filter((enemy) => enemy.hp > 0)

    const focusX =
      allies.reduce((sum, ally) => sum + ally.positionX, 0) / allies.length
    const focusY =
      allies.reduce((sum, ally) => sum + ally.positionY, 0) / allies.length

    const striker = allies.reduce((nearest, ally) =>
      distanceC(ally.positionX, ally.positionY, focusX, focusY) <
      distanceC(nearest.positionX, nearest.positionY, focusX, focusY)
        ? ally
        : nearest
    )

    const constellation = [...allies].sort(
      (a, b) =>
        Math.atan2(a.positionY - focusY, a.positionX - focusX) -
        Math.atan2(b.positionY - focusY, b.positionX - focusX)
    )
    const links =
      constellation.length === 2
        ? [[constellation[0], constellation[1]]]
        : constellation.map((ally, index) => [
            ally,
            constellation[(index + 1) % constellation.length]
          ])
    links.forEach(([ally, next]) =>
      ally.broadcastAbility({
        skill: "UNISON_BEAM",
        positionX: ally.positionX,
        positionY: ally.positionY,
        targetX: next.positionX,
        targetY: next.positionY
      })
    )
    striker.commands.push(
      new DelayedCommand(() => {
        striker.broadcastAbility({
          skill: "UNISON_NOVA",
          positionX: focusX,
          positionY: focusY,
          ap: allies.length // a fuller team goes off bigger
        })
      }, UNISON_NOVA_DELAY)
    )

    const combinedAttack = allies.reduce((total, ally) => total + ally.atk, 0)
    striker.commands.push(
      new DelayedCommand(() => {
        livingEnemies
          .filter((enemy) => enemy.hp > 0)
          .forEach((enemy) =>
            striker.broadcastAbility({
              skill: "UNISON_STARFALL",
              positionX: enemy.positionX,
              positionY: enemy.positionY
            })
          )
      }, UNISON_STRIKE_DELAY - UNISON_STARFALL_WARNING)
    )
    striker.commands.push(
      new DelayedCommand(() => {
        const enemiesAtImpact = livingEnemies.filter((enemy) => enemy.hp > 0)
        const damagePerEnemy =
          enemiesAtImpact.length > 0
            ? (chargedDamage * UNISON_STRIKE_ATTACK_RATIO) /
              enemiesAtImpact.length
            : 0
        let dealtByStrike = 0
        enemiesAtImpact.forEach((enemy) => {
          const { takenDamage } = enemy.handleSpecialDamage(
            damagePerEnemy,
            this.board,
            AttackType.SPECIAL,
            null,
            false,
            false
          )
          this.creditSyntheticDamage(
            enemy,
            DPS_UNISON_ID,
            AttackType.SPECIAL,
            takenDamage
          )
          dealtByStrike += takenDamage
        })
        const humanAllies = allies.filter(
          (ally) => ally.hp > 0 && ally.types.has(Synergy.HUMAN)
        )
        const humanHealTarget = enemiesAtImpact[0]
        if (humanHealTarget && combinedAttack > 0 && dealtByStrike > 0) {
          humanAllies.forEach((human) =>
            humanHealEffect.apply({
              pokemon: human,
              target: humanHealTarget,
              damage: (dealtByStrike * human.atk) / combinedAttack,
              isRetaliation: false
            })
          )
        }
        player.blessingsRef?.questProgress.set(
          Blessing.UNISON,
          UNISON_FINISHED_PROGRESS
        )
      }, UNISON_STRIKE_DELAY)
    )
  }

  pulseMagnetosphere(team: MapSchema<PokemonEntity>, player: Player) {
    const magnets = [...team.values()].filter(
      (entity) =>
        entity.player === player &&
        entity.hp > 0 &&
        entity.types.has(Synergy.STEEL)
    )
    if (magnets.length === 0) return
    const isAttracting = player.magnetospherePulseCount % 2 === 1
    player.magnetospherePulseCount++

    const enemyTeam =
      magnets[0].team === Team.BLUE_TEAM ? this.redTeam : this.blueTeam
    const enemies = [...enemyTeam.values()].filter((entity) => entity.hp > 0)
    /* leaning into STEEL widens the field: one tile of reach per synergy tier */
    const reach = Math.max(1, getSynergyTier(player.synergies, Synergy.STEEL))
    /* the reach granted by the last repel expires as the field flips back */
    magnets.forEach((magnet) => {
      if (magnet.magnetosphereRangeBonus > 0) {
        magnet.range -= magnet.magnetosphereRangeBonus
        magnet.magnetosphereRangeBonus = 0
      }
      if (!isAttracting) {
        magnet.range += reach
        magnet.magnetosphereRangeBonus = reach
      }
    })

    magnets.forEach((magnet) => {
      // every magnet raises its own field, none of them is the source
      magnet.broadcastAbility({
        skill: isAttracting ? "MAGNETOSPHERE_ATTRACT" : "MAGNETOSPHERE_REPEL",
        positionX: magnet.positionX,
        positionY: magnet.positionY,
        ap: reach // the animation sizes the field from it
      })
    })

    /* walked per enemy rather than per magnet: whichever magnet is nearest wins
       it, otherwise the map's insertion order would drag an enemy past the unit
       it is standing next to towards one across the board */
    enemies
      .filter((enemy) => enemy.hp > 0)
      .forEach((enemy) => {
        const distanceTo = (candidate: PokemonEntity) =>
          distanceC(
            candidate.positionX,
            candidate.positionY,
            enemy.positionX,
            enemy.positionY
          )
        const inReach = magnets.filter((candidate) => distanceTo(candidate) <= reach)
        if (inReach.length === 0) return
        const magnet = inReach.reduce((nearest, candidate) =>
          distanceTo(candidate) < distanceTo(nearest) ? candidate : nearest
        )
        {
          const drag = () => {
          if (enemy.hp <= 0 || magnet.hp <= 0) return
          // as far as the field reaches, so attraction always closes to contact
          for (let step = 0; step < reach; step++) {
            const distance = distanceC(
              magnet.positionX,
              magnet.positionY,
              enemy.positionX,
              enemy.positionY
            )
            if (isAttracting && distance <= 1) break // already in contact
            /* getKnockBackPlace steps along the orientation it is given, so
               pointing it from the enemy at the magnet pulls instead of pushes */
            const orientation = isAttracting
              ? this.board.orientation(
                  enemy.positionX,
                  enemy.positionY,
                  magnet.positionX,
                  magnet.positionY,
                  enemy,
                  magnet
                )
              : this.board.orientation(
                  magnet.positionX,
                  magnet.positionY,
                  enemy.positionX,
                  enemy.positionY,
                  magnet,
                  enemy
                )
            const destination = this.board.getKnockBackPlace(
              enemy.positionX,
              enemy.positionY,
              orientation
            )
            if (!destination) break
            enemy.moveTo(destination.x, destination.y, this.board, true)
          }
          if (isAttracting) {
            enemy.status.triggerParalysis(
              MAGNETOSPHERE_ATTRACT_PARALYSIS_DURATION,
              enemy,
              magnet
            )
          } else {
            enemy.status.triggerLocked(
              MAGNETOSPHERE_REPEL_LOCK_DURATION,
              enemy
            )
          }
          }
          /* held until the rings have closed, so the enemies land on the peak
             of the animation instead of arriving before it starts */
          if (isAttracting) {
            magnet.commands.push(
              new DelayedCommand(drag, MAGNETOSPHERE_ATTRACT_MOVE_DELAY)
            )
          } else {
            drag()
          }
        }
      })
  }

  castIcyReflectionAbility(pokemon: PokemonEntity, board: Board) {
    const ability = pokemon.icyReflectionLastAbility
    if (!ability || pokemon.hp <= 0) return
    const strategy = AbilityStrategies[ability]
    const target =
      pokemon.state.getNearestTargetAtSight(pokemon, board)?.target ?? null
    if (strategy.requiresTarget && !target) return

    // rolled as if the unit were casting its own ability, per castAbility
    const crit =
      (pokemon.effects.has(EffectEnum.ABILITY_CRIT) ||
        strategy.canCritByDefault) &&
      chance(pokemon.critChance / 100, pokemon)

    /* the borrowed cast would otherwise animate this unit's own ability */
    const skillBefore = pokemon.skill
    pokemon.skill = ability
    strategy.process(pokemon, board, target, crit)
    pokemon.skill = skillBefore

    // names the borrowed ability above the caster, the way Metronome does
    this.broadcastToSpectators(Transfer.DISPLAY_TEXT, {
      id: this.id,
      text: `ability.${ability}` as DisplayText,
      x: pokemon.positionX,
      y: pokemon.positionY
    })
  }

  getBullLeapingFollowUpAbility(pokemon: PokemonEntity): Ability {
    if (pokemon.range > 1) return Ability.HAPPY_HOUR
    const chargesBySynergy: [Synergy, Ability][] = [
      [Synergy.WATER, Ability.AQUA_JET],
      [Synergy.FIRE, Ability.FLAME_CHARGE],
      [Synergy.ELECTRIC, Ability.VOLT_SWITCH]
    ]
    const charges = chargesBySynergy
      .filter(([synergy]) => pokemon.types.has(synergy))
      .map(([, ability]) => ability)
    return charges.length > 0 ? pickRandomIn(charges) : Ability.PSYSHIELD_BASH
  }

  /* processed directly rather than through castAbility, so the follow-up cannot
     trigger a follow-up of its own */
  castBullLeapingFollowUp(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity | null,
    ability: Ability
  ) {
    const strategy = AbilityStrategies[ability]
    const followUpTarget =
      target ??
      pokemon.state.getNearestTargetAtSight(pokemon, board)?.target ??
      null
    if (strategy.requiresTarget && !followUpTarget) return

    /* swapping skill as well as stars keeps the broadcasts inside the strategy
       showing the follow-up instead of the ability that was actually cast */
    const starsBefore = pokemon.stars
    const skillBefore = pokemon.skill
    pokemon.stars = 1
    pokemon.skill = ability
    strategy.process(pokemon, board, followUpTarget, false)
    pokemon.stars = starsBefore
    pokemon.skill = skillBefore
  }

  castOverloadVoltSurge(team: MapSchema<PokemonEntity>, player: Player) {
    const nextCaster = getStrongestUnit(
      [...team.values()].filter(
        (entity) =>
          entity.player === player &&
          entity.hp > 0 &&
          entity.types.has(Synergy.ELECTRIC) &&
          !entity.overloadVoltSurged
      )
    )
    if (!nextCaster) return
    nextCaster.overloadVoltSurged = true
    /* an empowerment, not a substituted cast: the unit keeps the charge it had
       built towards its own ability */
    const ppBeforeEmpowerment = nextCaster.pp
    /* the borrowed cast would otherwise animate the unit's own ability, so it is
       suppressed in favour of Iron Thorns' Volt Surge visual */
    AbilityStrategies[Ability.VOLT_SURGE].process(
      nextCaster,
      this.board,
      null,
      false,
      true
    )
    nextCaster.broadcastAbility({ skill: Ability.VOLT_SURGE })
    nextCaster.pp = ppBeforeEmpowerment
  }

  /* Lugia rides each wave after the one that brought it in, striking 3 different
     enemies rather than Whirlpool's usual single unit at the head of a line */
  castTidalGuardianWhirlpools(team: Team) {
    const teamEntities = team === Team.RED_TEAM ? this.redTeam : this.blueTeam
    const lugia = schemaValues(teamEntities).find(
      (entity) => entity.isTidalGuardian && entity.hp > 0
    )
    if (!lugia) return
    const enemies = schemaValues(
      team === Team.RED_TEAM ? this.blueTeam : this.redTeam
    ).filter((entity) => entity.hp > 0)
    if (enemies.length === 0) return
    const targets = shuffleArray([...enemies]).slice(
      0,
      TIDAL_GUARDIAN_WHIRLPOOL_TARGETS
    )
    targets.forEach((enemy) => {
      lugia.broadcastAbility({
        skill: Ability.WHIRLPOOL,
        targetX: enemy.positionX,
        targetY: enemy.positionY
      })
      applyWhirlpoolDamage(lugia, this.board, enemy, false)
    })
  }

  handleFloodWave() {
    const WAVE_KNOCKBACK = 3
    const WAVE_WIDTH = 2 // tiles, matching the FLOOD_WAVE sprite
    const orientation = pickRandomIn([
      Orientation.UP,
      Orientation.DOWN,
      Orientation.LEFT,
      Orientation.RIGHT
    ])
    // physics uses the raw orientation; the client renders vertical waves with
    // an inverted Y vs the board, so only the sprite travels the flipped one
    const spriteOrientation =
      orientation === Orientation.UP
        ? Orientation.DOWN
        : orientation === Orientation.DOWN
          ? Orientation.UP
          : orientation
    const [dx, dy] = OrientationVector[orientation]
    const horizontal = dx !== 0

    // a 2-tile-wide wave sweeps along a random strip perpendicular to its travel
    const line = horizontal
      ? randomBetween(0, this.board.rows - WAVE_WIDTH)
      : randomBetween(0, this.board.columns - WAVE_WIDTH)

    this.room.broadcast(Transfer.ABILITY, {
      id: this.id,
      skill: "FLOOD_WAVE",
      positionX: horizontal ? 0 : line,
      positionY: horizontal ? line : 0,
      targetX: WAVE_WIDTH,
      targetY: 0,
      orientation: spriteOrientation
    })

    const entities = this.board.cells.filter(
      (e): e is PokemonEntity =>
        e != null &&
        e.hp > 0 &&
        (horizontal
          ? e.positionY >= line && e.positionY < line + WAVE_WIDTH
          : e.positionX >= line && e.positionX < line + WAVE_WIDTH)
    )
    // push the Pokémon nearest the wave's leading edge first so they don't
    // block the ones behind them
    entities.sort(
      (a, b) =>
        b.positionX * dx + b.positionY * dy -
        (a.positionX * dx + a.positionY * dy)
    )

    for (const pkm of entities) {
      if (pkm.types.has(Synergy.AQUATIC)) {
        const { healReceived } = pkm.handleHeal(0.03 * pkm.maxHP, pkm, 0, false)
        if (healReceived > 0) {
          // fold flood heal into the Tidal Wave row of the Battle Stats
          pkm.healDone = Math.max(0, pkm.healDone - healReceived)
          const waveDps = this.getOrCreateSyntheticDps(
            pkm.team,
            DPS_TIDAL_WAVE_ID
          )
          waveDps.heal = Math.min(65535, waveDps.heal + healReceived)
        }
      } else {
        const { takenDamage } = pkm.handleDamage({
          damage: 0.03 * pkm.maxHP,
          board: this.board,
          attackType: AttackType.TRUE,
          attacker: null,
          shouldTargetGainMana: false
        })
        // fold flood damage into the Tidal Wave row of the Battle Stats
        this.creditSyntheticDamage(
          pkm,
          DPS_TIDAL_WAVE_ID,
          AttackType.TRUE,
          takenDamage
        )
        this.applyPollutedSeaPoison(pkm)
      }

      const nbPearlStones = pkm.player
        ? count(pkm.player.items, Item.PEARL_STONE)
        : 0
      if (nbPearlStones > 0) {
        pkm.addShield(10 * nbPearlStones, pkm, 0, false)
      }

      // knockback in the wave's direction, resisted by 1 tile per pearl stone
      const tiles = Math.max(0, WAVE_KNOCKBACK - nbPearlStones)
      for (let i = 0; i < tiles; i++) {
        const dest = this.board.getKnockBackPlace(
          pkm.positionX,
          pkm.positionY,
          orientation
        )
        if (!dest) break
        pkm.moveTo(dest.x, dest.y, this.board, true)
      }
    }
  }

  /* both wave types damage a unit without an attacker, so the blessing owner is
     whichever player is opposing the unit that just got hit */
  applyPollutedSeaPoison(pokemonHit: PokemonEntity) {
    const foePlayer =
      pokemonHit.team === Team.BLUE_TEAM ? this.redPlayer : this.bluePlayer
    if (!foePlayer?.blessings?.includes(Blessing.POLLUTED_SEA)) return
    pokemonHit.status.triggerPoison(
      POLLUTED_SEA_POISON_DURATION,
      pokemonHit,
      undefined
    )
  }

  castTidalSurgeAbility(pokemon: PokemonEntity) {
    if (
      !pokemon.player?.blessings?.includes(Blessing.TIDAL_SURGE) ||
      !pokemon.types.has(Synergy.AQUATIC) ||
      pokemon.items.size < TIDAL_SURGE_ITEMS_REQUIRED
    ) {
      return
    }
    const ability = pokemon.range > 1 ? Ability.HYDRO_PUMP : Ability.DIVE
    const target =
      pokemon.state.getNearestTargetAtSight(pokemon, this.board)?.target ?? null
    AbilityStrategies[ability].process(pokemon, this.board, target, false)
  }

  handleTidalWaveForTeam(team: Team) {
    const effects =
      team === Team.RED_TEAM
        ? this.redEffects
        : this.bluePartnerPlayer
          ? new Set([...this.blueEffects, ...this.bluePartnerEffects])
          : this.blueEffects

    const tidalWaveLevel =
      effects.has(EffectEnum.WATER_VEIL) || effects.has(EffectEnum.SURGE_SURFER)
        ? 3
        : effects.has(EffectEnum.HYDRATION)
          ? 2
          : effects.has(EffectEnum.SWIFT_SWIM)
            ? 1
            : 0

    const shouldTrigger =
      (tidalWaveLevel > 0 && this.tidalWaveCounter === 1) ||
      (tidalWaveLevel === 3 && this.tidalWaveCounter === 2) ||
      effects.has(EffectEnum.SURGE_SURFER)

    if (shouldTrigger) {
      this.triggerTidalWave(team, tidalWaveLevel)
      if (effects.has(EffectEnum.SURGE_SURFER) && this.tidalWaveCounter === 1) {
        this.addPikachuSurferToBoard(team)
      } else if (
        effects.has(EffectEnum.SURGE_SURFER) &&
        (team === Team.RED_TEAM
          ? this.redPlayer
          : this.bluePlayer
        )?.blessings?.includes(Blessing.TIDAL_GUARDIAN)
      ) {
        this.castTidalGuardianWhirlpools(team)
      }
    }
  }

  applyFrozenOceanToWaveRider(pokemon: PokemonEntity) {
    if (
      pokemon.player?.blessings?.includes(Blessing.FROZEN_OCEAN) !== true ||
      !pokemon.types.has(Synergy.AQUATIC) ||
      !pokemon.types.has(Synergy.ICE)
    ) {
      return
    }
    pokemon.addPP(
      Math.round(FROZEN_OCEAN_WAVE_RATIO * pokemon.maxPP),
      pokemon,
      0,
      false
    )
    pokemon.addSpecialDefense(pokemon.speDef, pokemon, 0, false)
  }

  triggerTidalWave(
    team: Team,
    tidalWaveLevel: number,
    healAll: boolean = false
  ) {
    const isRed = team === Team.RED_TEAM
    if (isRed) {
      onFossilUnlockTidalWave(this.redPlayer)
    } else {
      onFossilUnlockTidalWave(this.bluePlayer)
      onFossilUnlockTidalWave(this.bluePartnerPlayer)
    }
    const orientation = isRed ? Orientation.DOWN : Orientation.UP
    this.room.broadcast(Transfer.ABILITY, {
      id: this.id,
      skill: "TIDAL_WAVE",
      positionX: 0,
      positionY: 0,
      targetX: 0,
      targetY: tidalWaveLevel - 1,
      orientation
    })
    this.room.broadcast(Transfer.CLEAR_BOARD, {
      simulationId: this.id
    })

    const rowRange = isRed
      ? [...Array(this.board.rows).keys()]
      : [...Array(this.board.rows).keys()].reverse()

    for (const y of rowRange) {
      for (let x = 0; x < this.board.columns; x++) {
        const pokemonHit = this.board.getEntityOnCell(x, y)
        this.board.clearBoardEffect(x, y, this) // clear all effects
        if (pokemonHit) {
          if (pokemonHit.team === team) {
            pokemonHit.status.clearNegativeStatus(pokemonHit)
            this.castTidalSurgeAbility(pokemonHit)
            this.applyFrozenOceanToWaveRider(pokemonHit)
            if (pokemonHit.types.has(Synergy.AQUATIC) || healAll) {
              const { healReceived } = pokemonHit.handleHeal(
                tidalWaveLevel * 0.1 * pokemonHit.maxHP,
                pokemonHit,
                0,
                false
              )
              if (healReceived > 0) {
                // The game just recorded this heal as the Pokémon healing
                // itself. Take that amount back off the Pokémon and add it to
                // the Tidal Wave row instead, so the wave's healing shows on
                // its own line in the Battle Stats. Math.max(0, ...) stops
                // healDone from going negative (this number type can't store
                // negatives and would jump to a huge value instead).
                pokemonHit.healDone = Math.max(
                  0,
                  pokemonHit.healDone - healReceived
                )
                const waveDps = this.getOrCreateSyntheticDps(
                  team,
                  DPS_TIDAL_WAVE_ID
                )
                // clamp at the uint16 ceiling (see creditSyntheticDamage)
                waveDps.heal = Math.min(65535, waveDps.heal + healReceived)
              }
            }
          } else {
            const { takenDamage } = pokemonHit.handleDamage({
              damage: tidalWaveLevel * 0.05 * pokemonHit.maxHP,
              board: this.board,
              attackType: AttackType.TRUE,
              attacker: null,
              shouldTargetGainMana: false
            })
            this.creditSyntheticDamage(
              pokemonHit,
              DPS_TIDAL_WAVE_ID,
              AttackType.TRUE,
              takenDamage
            )
            this.applyPollutedSeaPoison(pokemonHit)
            let newY = y
            if (isRed) {
              while (
                newY > 0 &&
                this.board.getEntityOnCell(x, newY - 1) === undefined
              ) {
                newY--
              }
            } else {
              while (
                newY < this.board.rows - 1 &&
                this.board.getEntityOnCell(x, newY + 1) === undefined
              ) {
                newY++
              }
            }
            // pearl stones resist the wave's knockback by 1 tile each and grant
            // 10 shield per stone when hit
            const nbPearlStones = pokemonHit.player
              ? count(pokemonHit.player.items, Item.PEARL_STONE)
              : 0
            if (nbPearlStones > 0) {
              const dist = Math.max(0, Math.abs(newY - y) - nbPearlStones)
              newY = isRed ? y - dist : y + dist
              pokemonHit.addShield(10 * nbPearlStones, pokemonHit, 0, false)
            }
            if (newY !== y) {
              pokemonHit.moveTo(x, newY, this.board, true) // push enemies away
              pokemonHit.cooldown = 500
            }
          }

          if (
            pokemonHit.items.has(Item.SURFBOARD) ||
            pokemonHit.awakening === Awakening.PEARL_STONE
          ) {
            const surf = AbilityStrategies[Ability.SURF] as SurfStrategy
            surf.process(
              pokemonHit,
              this.board,
              null,
              false,
              false,
              tidalWaveLevel
            )
          }

          if (pokemonHit.passive === Passive.PIKACHU_SURFER) {
            pokemonHit.addPP(pokemonHit.maxPP, pokemonHit, 0, false)
          }
        }
      }
    }
  }
}
