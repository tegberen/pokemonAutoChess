import { MapSchema, Schema, type } from "@colyseus/schema"
import AfterGamePlayer from "../../models/colyseus-models/after-game-player"
import { GameMode } from "../../types/enum/Game"
import type { Synergy } from "../../types/enum/Synergy"

export default class AfterGameState extends Schema {
  @type({ map: AfterGamePlayer }) players = new MapSchema<AfterGamePlayer>()
  @type("boolean") eligibleToELO = false
  @type("boolean") eligibleToXP = false
  @type("string") gameMode = GameMode.CUSTOM_LOBBY
  // which lesson just finished, so the end card can show its notes
  @type("string") guideSynergy = ""

  constructor({
    eligibleToELO,
    eligibleToXP,
    gameMode,
    guideSynergy
  }: {
    eligibleToELO: boolean
    eligibleToXP: boolean
    gameMode: GameMode
    guideSynergy?: Synergy | null
  }) {
    super()
    this.eligibleToXP = eligibleToXP
    this.eligibleToELO = eligibleToELO
    this.gameMode = gameMode
    this.guideSynergy = guideSynergy ?? ""
  }
}
