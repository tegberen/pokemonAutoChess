import type Player from "../../models/colyseus-models/player"
import type { Pokemon } from "../../models/colyseus-models/pokemon"
import { getSynergyTier } from "../../models/colyseus-models/synergies"
import { getPokemonData } from "../../models/precomputed/precomputed-pokemon-data"
import { PRECOMPUTED_POKEMONS_PER_TYPE } from "../../models/precomputed/precomputed-types"
import { Rarity } from "../../types/enum/Game"
import type { Item } from "../../types/enum/Item"
import { type Pkm, PkmFamily } from "../../types/enum/Pokemon"
import type { Synergy } from "../../types/enum/Synergy"

/* Everything a lesson author needs to write a step's `isCompleted`. Import from
   here and nowhere else; if a check you want is missing, add it here rather
   than reaching into the Player schema from a lesson file.

   Two rules these all follow, learned the hard way:

   - Pokemon are matched by FAMILY, never by name. A lesson spans evolutions, so
     a check written against CHESPIN has to keep seeing it once it is QUILLADIN.
   - Items distinguish "held by a unit" from "loose in the inventory". A step
     that says "put it on X" must check the unit, or crafting into the bag will
     satisfy it without the player ever equipping anything. */

function anyPokemon(
  player: Player,
  predicate: (pokemon: Pokemon) => boolean
): boolean {
  let found = false
  player.board.forEach((pokemon) => {
    if (!found && predicate(pokemon)) found = true
  })
  return found
}

const isSameFamilyAs = (pkm: Pkm) => (pokemon: Pokemon) =>
  PkmFamily[pokemon.name] === PkmFamily[pkm]

const isOnBoard = (pokemon: Pokemon) => pokemon.positionY > 0

// ---------------------------------------------------------------------------
// pokemon
// ---------------------------------------------------------------------------

/** Owned at all, bench included. */
export function hasPokemon(player: Player, pkm: Pkm): boolean {
  return anyPokemon(player, isSameFamilyAs(pkm))
}

/** Owned and fielded, as opposed to sitting on the bench. */
export function hasPokemonOnBoard(player: Player, pkm: Pkm): boolean {
  return anyPokemon(
    player,
    (pokemon) => isSameFamilyAs(pkm)(pokemon) && isOnBoard(pokemon)
  )
}

export function hasPokemonAtStars(
  player: Player,
  pkm: Pkm,
  stars: number
): boolean {
  return anyPokemon(
    player,
    (pokemon) => isSameFamilyAs(pkm)(pokemon) && pokemon.stars >= stars
  )
}

// ---------------------------------------------------------------------------
// items
// ---------------------------------------------------------------------------

/** Anywhere: loose in the inventory or held by any unit. */
export function hasItemAnywhere(player: Player, item: Item): boolean {
  return (
    player.items.includes(item) ||
    anyPokemon(player, (pokemon) => pokemon.items.has(item))
  )
}

export function countItemAnywhere(player: Player, item: Item): number {
  let count = player.items.filter((held) => held === item).length
  player.board.forEach((pokemon) => {
    if (pokemon.items.has(item)) count++
  })
  return count
}

/** Loose in the inventory only - the state a just-sold unit's items land in. */
export function hasItemInInventory(player: Player, item: Item): boolean {
  return player.items.includes(item)
}

/** Equipped on that specific unit, which is what "put it on X" means. */
export function hasItemOnPokemon(
  player: Player,
  pkm: Pkm,
  item: Item
): boolean {
  return anyPokemon(
    player,
    (pokemon) => isSameFamilyAs(pkm)(pokemon) && pokemon.items.has(item)
  )
}

export function countItemsOnPokemon(player: Player, pkm: Pkm): number {
  let count = 0
  player.board.forEach((pokemon) => {
    if (isSameFamilyAs(pkm)(pokemon)) {
      count = Math.max(count, pokemon.items.size)
    }
  })
  return count
}

// ---------------------------------------------------------------------------
// board and economy
// ---------------------------------------------------------------------------

export function hasSynergyTier(
  player: Player,
  synergy: Synergy,
  tier: number
): boolean {
  return getSynergyTier(player.synergies, synergy) >= tier
}

export function hasLevel(player: Player, level: number): boolean {
  return player.experienceManager.level >= level
}

// ---------------------------------------------------------------------------
// pool grids, for the two intro steps every lesson opens with
// ---------------------------------------------------------------------------

const SHOP_RARITIES: Rarity[] = [
  Rarity.COMMON,
  Rarity.UNCOMMON,
  Rarity.RARE,
  Rarity.EPIC,
  Rarity.ULTRA
]

/** Derived, so a balance patch never leaves a lesson's grid lying. */
export function getRegularPoolOfSynergy(synergy: Synergy): Pkm[] {
  return (PRECOMPUTED_POKEMONS_PER_TYPE[synergy] ?? []).filter((pkm) => {
    const data = getPokemonData(pkm)
    return (
      data.stars === 1 &&
      !data.additional &&
      !data.regional &&
      SHOP_RARITIES.includes(data.rarity)
    )
  })
}

export function getRegionalsOfSynergy(synergy: Synergy): Pkm[] {
  return (PRECOMPUTED_POKEMONS_PER_TYPE[synergy] ?? []).filter((pkm) => {
    const data = getPokemonData(pkm)
    return data.stars === 1 && data.regional
  })
}
