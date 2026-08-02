import { ArraySchema, Schema, type } from "@colyseus/schema"
import type { Blessing } from "../../types/enum/Blessing"

export class PlayerBlessings extends Schema {
  @type(["string"]) blessings = new ArraySchema<Blessing>()
}
