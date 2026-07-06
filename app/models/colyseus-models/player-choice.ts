import { Schema, type } from "@colyseus/schema"
import type { ScribbleShapeType } from "../../config/game/scribble-shapes"
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
  @type(["string"]) pokemons: PkmProposition[] = []
  @type(["string"]) armoryOptions: ArmoryOptions[] = []
  @type(["string"]) scribbleShapes: ScribbleShapeType[] = []

  constructor(args: {
    type: PlayerChoiceType
    items?: Item[]
    pokemons?: PkmProposition[]
    armoryOptions?: ArmoryOptions[]
    scribbleShapes?: ScribbleShapeType[]
  }) {
    super()
    this.id = crypto.randomUUID()
    this.type = args.type
    if (args.items) this.items = args.items
    if (args.pokemons) this.pokemons = args.pokemons
    if (args.armoryOptions) this.armoryOptions = args.armoryOptions
    if (args.scribbleShapes) this.scribbleShapes = args.scribbleShapes
  }
}
