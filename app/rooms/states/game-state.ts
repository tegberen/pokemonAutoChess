import {
  ArraySchema,
  MapSchema,
  Schema,
  SetSchema,
  type
} from "@colyseus/schema"
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  getTreasureBoxReward,
  StageDuration,
  type TreasureBoxReward
} from "../../config"
import BotManager from "../../core/bot-manager"
import Simulation from "../../core/simulation"
import { FloatingItem } from "../../models/colyseus-models/floating-item"
import Player from "../../models/colyseus-models/player"
import { PlayerBlessings } from "../../models/colyseus-models/player-blessings"
import { PlayerFossilUnlocks } from "../../models/colyseus-models/player-fossil-unlocks"
import { PokemonAvatarModel } from "../../models/colyseus-models/pokemon-avatar"
import { Portal, SynergySymbol } from "../../models/colyseus-models/portal"
import Shop from "../../models/shop"
import type { Blessing } from "../../types/enum/Blessing"
import type { EloRank } from "../../types/enum/EloRank"
import { GameMode, GamePhaseState } from "../../types/enum/Game"
import type { Item } from "../../types/enum/Item"
import type { Pkm } from "../../types/enum/Pokemon"
import { SpecialGameRule } from "../../types/enum/SpecialGameRule"
import { Synergy } from "../../types/enum/Synergy"
import type { TownEncounter } from "../../types/enum/TownEncounter"
import { Weather } from "../../types/enum/Weather"

const unavailableScribbleRules = [
  SpecialGameRule.DO_IT_ALL_YOURSELF,
  SpecialGameRule.HALLOWEEN,
  SpecialGameRule.PLAY_TEST
]
import { pickRandomIn, randomBetween } from "../../utils/random"

export default class GameState extends Schema {
  @type("string") afterGameId = ""
  @type("uint8") roundTime = StageDuration[0]
  @type("uint8") phase = GamePhaseState.TOWN
  @type({ map: Player }) players = new MapSchema<Player>()
  @type({ map: PokemonAvatarModel }) avatars =
    new MapSchema<PokemonAvatarModel>()
  /* one per living player, alive for the whole game rather than per phase, so
     walking around never restarts or hands over between systems. Separate from
     `avatars` above, which the carousel owns while everyone shares one map. */
  @type({ map: PokemonAvatarModel }) playerAvatars =
    new MapSchema<PokemonAvatarModel>()
  @type({ map: FloatingItem }) floatingItems = new MapSchema<FloatingItem>()
  @type({ map: Portal }) portals = new MapSchema<Portal>()
  @type({ map: SynergySymbol }) symbols = new MapSchema<SynergySymbol>()
  @type(["string"]) additionalPokemons = new ArraySchema<Pkm>()
  @type("uint8") stageLevel = 0
  @type("string") weather: Weather
  @type("boolean") shinyEncounter = false
  @type("boolean") noElo = false
  @type("boolean") finale = false
  @type("string") gameMode: GameMode = GameMode.CUSTOM_LOBBY
  @type({ set: "string" }) spectators = new SetSchema<string>()
  @type({ map: Simulation }) simulations = new MapSchema<Simulation>()
  @type("uint8") lightX = randomBetween(0, BOARD_WIDTH - 1)
  @type("uint8") lightY = randomBetween(1, BOARD_HEIGHT / 2)
  @type("string") specialGameRule: SpecialGameRule | null = null
  scribbleExtended = false
  @type("boolean") whimsy = false
  @type("string") avatarSynergy: Synergy | null = null
  @type("string") townEncounter: TownEncounter | null = null
  @type("number") weatherThreshold: number = 8
  @type("number") currentPveVariantIndex: number = 0
  @type({ map: PlayerBlessings }) blessingsByPlayerId =
    new MapSchema<PlayerBlessings>()
  @type("boolean") blessingsEnabled = false
  /* Fossil unlocks per player. Declared after blessingsByPlayerId, and any new
     field must keep going last, so existing fields keep their wire index. */
  @type({ map: PlayerFossilUnlocks }) fossilUnlocksByPlayerId =
    new MapSchema<PlayerFossilUnlocks>()
  /** GUIDE mode: which synergy this run teaches, and how far the player has
      read. Both must stay after fossilUnlocksByPlayerId for the same reason. */
  @type("string") guideSynergy: Synergy | null = null
  @type("uint8") guideStep = 0
  // whether the player has pressed "Got it" on the current step
  @type("boolean") guideStepAcked = false
  // server-only cursor recording which step already handed out its grants
  guideStepEntered = -1
  // server-only: true while a guide stage is being replayed with a different
  // carousel, which is what makes the rewind deal the alternative items
  guideRewinding = false
  /* server-only: reroll count when the current step became active, so a pity
     floor counts that step's own rolls rather than the whole stage's */
  guideStepRerollBase = 0
  // server-only: which step the two values above were last synced to
  guideTrackedStep = -1
  // dev only, undecorated: restricts the pool without costing a schema field
  blessingsUnderTest: Blessing[] = []
  time = StageDuration[0] * 1000
  updatePhaseNeeded = false
  botManager: BotManager = new BotManager()
  shop: Shop = new Shop()
  simulationPaused = false
  gameFinished = false
  gameLoaded = false
  name: string
  startTime: number
  endTime: number | undefined = undefined
  preparationId: string
  townEncounters: Set<TownEncounter> = new Set<TownEncounter>()
  pveRewards: Item[] = []
  pveRewardsPropositions: Item[] = []
  minRank: EloRank | null = null
  maxRank: EloRank | null = null
  outlawStage: number | null = null
  treasureBoxRewardGiven: TreasureBoxReward = getTreasureBoxReward()

  hasBlessing(playerId: string, blessing: Blessing): boolean {
    return (
      this.blessingsByPlayerId.get(playerId)?.blessings.includes(blessing) ===
      true
    )
  }

  constructor(
    preparationId: string,
    name: string,
    noElo: boolean,
    gameMode: GameMode,
    minRank: EloRank | null,
    maxRank: EloRank | null,
    specialGameRule: SpecialGameRule | null,
    scribbleExtended = false,
    whimsy = false,
    blessingsEnabled = false,
    blessingsUnderTest: Blessing[] = [],
    guideSynergy: Synergy | null = null
  ) {
    super()
    this.scribbleExtended = scribbleExtended
    this.blessingsEnabled = blessingsEnabled
    this.blessingsUnderTest = blessingsUnderTest
    this.whimsy = whimsy
    this.preparationId = preparationId
    this.startTime = Date.now()
    this.name = name
    this.noElo = noElo
    this.gameMode = gameMode
    this.guideSynergy = guideSynergy
    this.minRank = minRank
    this.maxRank = maxRank
    this.weather = Weather.NEUTRAL

    if (gameMode === GameMode.SCRIBBLE) {
      this.specialGameRule = pickRandomIn(
        Object.values(SpecialGameRule).filter(
          (rule) => unavailableScribbleRules.includes(rule) === false
        )
      )
    } else if (whimsy) {
      // the window was checked at room creation, so a lobby that started just
      // before the deadline still gets its rule
      this.specialGameRule = pickRandomIn(
        Object.values(SpecialGameRule).filter(
          (rule) => unavailableScribbleRules.includes(rule) === false
        )
      )
    } else {
      this.specialGameRule = specialGameRule
    }

    if (this.specialGameRule === SpecialGameRule.AVATAR) {
      this.avatarSynergy = pickRandomIn(
        Object.values(Synergy).filter((s) => s !== Synergy.BABY)
      )
    }
  }
}
