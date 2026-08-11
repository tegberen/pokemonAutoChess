import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema"
import type { Blessing } from "../../types/enum/Blessing"
import type { Item } from "../../types/enum/Item"
import { WaterPond } from "./water-pond"

export class PlayerBlessings extends Schema {
  @type(["string"]) blessings = new ArraySchema<Blessing>()
  /* TREASURE_TRAIL: board index of the revealed buried item, -1 when none is
     left. Lives here because Player is at the colyseus 64-field cap. */
  @type("int8") treasureTrailHighlight: number = -1
  /* quest counters that the Effects tab renders as progress, keyed by blessing.
     Synced because player.blessingQuestThresholdsReached is server-only. */
  @type({ map: "number" }) questProgress = new MapSchema<number>()
  @type("boolean") thinkFastActive = false
  @type("uint32") goldEarned = 0
  /* WATER_FOUNTAIN ponds, here rather than on Player because Player is at the
     colyseus 64-field cap. Declared LAST so it does not shift the wire index of
     the fields above, which would desync clients on an older bundle. */
  @type([WaterPond]) waterPonds = new ArraySchema<WaterPond>()
  /* MYSTOGAN: the wands left out of each FAIRY offer, so the Effects tab can
     name them. Declared LAST for the same wire-index reason as above. */
  @type(["string"]) mystoganWands = new ArraySchema<Item>()
}
