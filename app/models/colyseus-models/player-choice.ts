import { Schema, type } from "@colyseus/schema"
import type { ScribbleShapeType } from "../../config/game/scribble-shapes"
import type { Emotion } from "../../types/enum/Emotion"
import type { Item } from "../../types/enum/Item"
import type { PkmProposition } from "../../types/enum/Pokemon"
import { ArmoryOptions } from "../../types/enum/ArmoryOptions"
import type { Blessing } from "../../types/enum/Blessing"

export type PlayerChoiceType =
  | "item"
  | "addPick"
  | "starter"
  | "unique"
  | "legendary"
  | "mission_order"
  | "wand"
  | "armory_assist"
  | "scribble_shape"
  // reward kinds in `rewards`; any rolled gem in `items[0]`, components in `items2`
  | "evolution_lab_reward"
  | "blessing"
  /* SINGULARITY_I/II and STARTER_CHOICE need their own types: the generic item
     and starter branches grant the pick and forget it, but these have to record
     what was chosen so later stages can re-grant the same thing */
  | "singularity"
  | "starter_choice"

export class PlayerChoice extends Schema {
  @type("string") id: string
  @type("string") type: PlayerChoiceType
  @type(["string"]) items: Item[] = []
  // SIX_PACK: optional second component paired with each pokemon proposition
  @type(["string"]) items2: Item[] = []
  @type(["string"]) pokemons: PkmProposition[] = []
  @type(["string"]) armoryOptions: ArmoryOptions[] = []
  @type(["string"]) scribbleShapes: ScribbleShapeType[] = []
  @type(["string"]) rewards: string[] = []
  @type(["boolean"]) shinies: boolean[] = []
  @type(["string"]) emotions: Emotion[] = []
  @type(["string"]) blessings: Blessing[] = []
  @type(["string"]) rerollCandidates: Blessing[] = []
  @type(["boolean"]) rerollableSlots: boolean[] = []
  // ADDITIONAL_RETHINK_II: item slots reroll independently of pokemon slots
  @type(["boolean"]) rerollableItemSlots: boolean[] = []
  @type("boolean") canReroll: boolean = false
  // server-only: every blessing ever shown in this selection, so family caps and
  // duplicate exclusion survive the choice being replaced on each reroll
  blessingsProposedHistory: Blessing[] = []

  constructor(args: {
    type: PlayerChoiceType
    items?: Item[]
    items2?: Item[]
    pokemons?: PkmProposition[]
    armoryOptions?: ArmoryOptions[]
    scribbleShapes?: ScribbleShapeType[]
    rewards?: string[]
    shinies?: boolean[]
    emotions?: Emotion[]
    blessings?: Blessing[]
    rerollCandidates?: Blessing[]
    rerollableSlots?: boolean[]
    rerollableItemSlots?: boolean[]
    canReroll?: boolean
  }) {
    super()
    this.id = crypto.randomUUID()
    this.type = args.type
    if (args.items) this.items = args.items
    if (args.items2) this.items2 = args.items2
    if (args.pokemons) this.pokemons = args.pokemons
    if (args.armoryOptions) this.armoryOptions = args.armoryOptions
    if (args.scribbleShapes) this.scribbleShapes = args.scribbleShapes
    if (args.rewards) this.rewards = args.rewards
    if (args.shinies) this.shinies = args.shinies
    if (args.emotions) this.emotions = args.emotions
    if (args.blessings) this.blessings = args.blessings
    if (args.rerollCandidates) this.rerollCandidates = args.rerollCandidates
    if (args.rerollableSlots) this.rerollableSlots = args.rerollableSlots
    if (args.rerollableItemSlots)
      this.rerollableItemSlots = args.rerollableItemSlots
    if (args.canReroll) this.canReroll = args.canReroll
  }
}
