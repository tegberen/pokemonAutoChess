import { ArraySchema, Schema, type } from "@colyseus/schema"

// lives on GameState because Player is at the colyseus field cap
export class PlayerIncantations extends Schema {
  @type(["string"]) written = new ArraySchema<string>()
}
