import { Pkm } from "./Pokemon"

/* `as const` so each conditionKey stays a string literal: t() only accepts keys
   it can resolve, and a widened `string` makes the template key unresolvable */
const fossilUnlocks = [
  { pokemon: Pkm.OMANYTE, conditionKey: "omanyte", target: 1, minLevel: 0 },
  { pokemon: Pkm.WIMPOD, conditionKey: "wimpod", target: 1, minLevel: 0 },
  { pokemon: Pkm.KABUTO, conditionKey: "kabuto", target: 1, minLevel: 0 },
  { pokemon: Pkm.LILEEP, conditionKey: "lileep", target: 2, minLevel: 0 },
  { pokemon: Pkm.ANORITH, conditionKey: "anorith", target: 2, minLevel: 0 },
  { pokemon: Pkm.TANGELA, conditionKey: "tangela", target: 2, minLevel: 0 },
  { pokemon: Pkm.YANMA, conditionKey: "yanma", target: 60, minLevel: 5 },
  { pokemon: Pkm.ARCHEN, conditionKey: "archen", target: 6, minLevel: 5 },
  { pokemon: Pkm.CLAMPERL, conditionKey: "clamperl", target: 6, minLevel: 5 },
  { pokemon: Pkm.CRANIDOS, conditionKey: "cranidos", target: 12, minLevel: 7 },
  { pokemon: Pkm.SHIELDON, conditionKey: "shieldon", target: 120, minLevel: 7 },
  { pokemon: Pkm.AMAURA, conditionKey: "amaura", target: 1, minLevel: 7 },
  { pokemon: Pkm.TYRUNT, conditionKey: "tyrunt", target: 12, minLevel: 7 },
  {
    pokemon: Pkm.REGIGIGAS,
    conditionKey: "regigigas",
    target: 1,
    minLevel: 9
  }
] as const

export interface FossilUnlockDefinition {
  pokemon: Pkm
  /* key under `fossil_unlocks.conditions` in the locales, which is the source of
     truth for the wording of the condition */
  conditionKey: (typeof fossilUnlocks)[number]["conditionKey"]
  target: number
  /* the "Level N +" prefix of a condition: progress only accrues from that level */
  minLevel: number
}

export const FossilUnlocks: readonly FossilUnlockDefinition[] = fossilUnlocks

export const FossilUnlockDefinitionByPokemon = new Map<
  Pkm,
  FossilUnlockDefinition
>(FossilUnlocks.map((unlock) => [unlock.pokemon, unlock]))

/* Draw entries an unlocked Pokemon gets = its remaining Unlock Pool copies plus
   its shop weight. Weight starts at 0 (normal rarity odds, the guaranteed slot
   being the whole reward) and only ever falls, one step per offer passed over,
   so an unwanted fossil fades out instead of clogging the shop. */
export const FOSSIL_UNLOCK_WEIGHT_LOST_WHEN_IGNORED = 2
// below any pool size, so the weight bottoms out instead of drifting
export const FOSSIL_UNLOCK_MIN_SHOP_WEIGHT = -30
// one entry always survives, so a change of heart stays possible
export const FOSSIL_UNLOCK_MIN_ENTRIES = 1
// guaranteed slots one shop may spend; the rest stays queued
export const FOSSIL_UNLOCK_MAX_GUARANTEES_PER_SHOP = 2

/* Discovery tokens rather than items: never held, only paired inside the unlock
   menu. The values double as the artwork filename under assets/item. */
export enum GalarFossil {
  BIRD = "FOSSILIZED_BIRD",
  DINO = "FOSSILIZED_DINO",
  DRAKE = "FOSSILIZED_DRAKE",
  FISH = "FOSSILIZED_FISH"
}

const GalarFossilRestorations: {
  fossils: [GalarFossil, GalarFossil]
  pokemon: Pkm
}[] = [
  { fossils: [GalarFossil.BIRD, GalarFossil.DRAKE], pokemon: Pkm.DRACOZOLT },
  { fossils: [GalarFossil.BIRD, GalarFossil.DINO], pokemon: Pkm.ARCTOZOLT },
  { fossils: [GalarFossil.FISH, GalarFossil.DRAKE], pokemon: Pkm.DRACOVISH },
  { fossils: [GalarFossil.FISH, GalarFossil.DINO], pokemon: Pkm.ARCTOVISH }
]

export function getRestoredPokemon(
  a: GalarFossil | null,
  b: GalarFossil | null
): Pkm | null {
  if (!a || !b || a === b) return null
  return (
    GalarFossilRestorations.find(
      ({ fossils }) => fossils.includes(a) && fossils.includes(b)
    )?.pokemon ?? null
  )
}

// FOSSIL synergy needed for a fight to count towards a discovery
export const FOSSIL_RESTORATION_SYNERGY_LEVEL = 8
// fights at that level between one discovery and the next
export const FOSSIL_RESTORATION_FIGHTS_PER_DISCOVERY = 2
// undiscovered fossils offered to choose from each time
export const FOSSIL_RESTORATION_CHOICES = 2
// FOSSIL synergy REGIGIGAS asks for alongside a surviving Mamoswine
export const REGIGIGAS_FOSSIL_SYNERGY_REQUIRED = 8

export const isFossilUnlockPokemon = (pkm: Pkm): boolean =>
  FossilUnlockDefinitionByPokemon.has(pkm)
