import { ArraySchema, Schema, type } from "@colyseus/schema"
import type { WaterPondType } from "../../config/game/water-ponds"

export class WaterPond extends Schema {
  @type("string") pondType: WaterPondType
  @type(["uint8"]) cells = new ArraySchema<number>()

  constructor(pondType: WaterPondType, cells: number[]) {
    super()
    this.pondType = pondType
    this.cells.push(...cells)
  }
}
