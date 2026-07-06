import { ArraySchema, Schema, type } from "@colyseus/schema"
import type { ScribbleShapeType } from "../../config/game/scribble-shapes"

export class ScribbleShape extends Schema {
  @type("string") shapeType: ScribbleShapeType
  @type(["uint8"]) cells = new ArraySchema<number>()

  constructor(shapeType: ScribbleShapeType, cells: number[]) {
    super()
    this.shapeType = shapeType
    this.cells.push(...cells)
  }
}
