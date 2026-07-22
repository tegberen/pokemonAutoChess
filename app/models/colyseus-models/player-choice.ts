import { Schema, type } from "@colyseus/schema"
import type { ScribbleShapeType } from "../../config/game/scribble-shapes"
import type { Emotion } from "../../types/enum/Emotion"
import type { Item } from "../../types/enum/Item"
import type { PkmProposition } from "../../types/enum/Pokemon"
import { ArmoryOptions } from "../../types/enum/ArmoryOptions"

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

export class PlayerChoice extends Schema {
  @type("string") id: string
  @type("string") type: PlayerChoiceType
  @type(["string"]) items: Item[] = []
  // SIX_PACK: optional second component paired with each pokemon proposition
  @type(["string"]) items2: Item[] = []
  @type(["string"]) pokemons: PkmProposition[] = []
  @type(["string"]) armoryOptions: ArmoryOptions[] = []
  @type(["string"]) scribbleShapes: ScribbleShapeType[] = []
  @type(["boolean"]) shinies: boolean[] = []
  @type(["string"]) emotions: Emotion[] = []
  @type("boolean") canReroll: boolean = false

  constructor(args: {
    type: PlayerChoiceType
    items?: Item[]
    items2?: Item[]
    pokemons?: PkmProposition[]
    armoryOptions?: ArmoryOptions[]
    scribbleShapes?: ScribbleShapeType[]
    shinies?: boolean[]
    emotions?: Emotion[]
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
    if (args.shinies) this.shinies = args.shinies
    if (args.emotions) this.emotions = args.emotions
    if (args.canReroll) this.canReroll = args.canReroll
  }
}
