import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema"
import type { Blessing } from "../../types/enum/Blessing"

export class PlayerBlessings extends Schema {
  @type(["string"]) blessings = new ArraySchema<Blessing>()
  /* TREASURE_TRAIL: board index of the revealed buried item, -1 when none is
     left. Lives here because Player is at the colyseus 64-field cap. */
  @type("int8") treasureTrailHighlight: number = -1
  /* quest counters that the Effects tab renders as progress, keyed by blessing.
     Synced because player.blessingQuestThresholdsReached is server-only. */
  @type({ map: "number" }) questProgress = new MapSchema<number>()
}
