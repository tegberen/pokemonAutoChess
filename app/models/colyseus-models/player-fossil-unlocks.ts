import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema"
import type { GalarFossil } from "../../types/enum/FossilUnlock"
import type { Pkm } from "../../types/enum/Pokemon"

/* Fossil unlock state for one player. Lives on GameState rather than on Player
   because Player is at the colyseus 64-field cap, the same reason
   PlayerBlessings exists. */
export class PlayerFossilUnlocks extends Schema {
  /* the whole feature stays hidden until the player finishes a combat with an
     evolved Swinub or a UNIQUE FOSSIL fielded, either of which is a way in */
  @type("boolean") revealed = false
  @type(["string"]) unlocked = new ArraySchema<Pkm>()
  /* progress towards each condition, keyed by the unlockable Pokemon. Capped at
     its target, so the client can render it straight into a progress bar. */
  @type({ map: "number" }) progress = new MapSchema<number>()
  /* unlocked Pokemon still owed a guaranteed shop slot, oldest first */
  @type(["string"]) pendingGuarantees = new ArraySchema<Pkm>()
  /* draw weight per Pokemon, 0 at normal rarity odds and dropping below zero
     each time an offer is passed over */
  @type({ map: "number" }) shopWeight = new MapSchema<number>()
  /* Fossil (8) Restoration. Galar fossils discovered so far, the Pokemon already
     restored (one per game), and fights held at Fossil (8) since the last
     discovery. */
  @type(["string"]) galarFossils = new ArraySchema<GalarFossil>()
  @type("string") restoredPokemon: Pkm | "" = ""
  @type("uint8") fightsTowardsNextFossil = 0
}
