import { DishByPkm } from "../config/game/dishes"
import type { IPokemon } from "../types"
import { Blessing, CHEFS_GREED_DISHES, CHEFS_GREED_DISHES_WITH_BELT } from "../types/enum/Blessing"
import { Item, NonSpecialBerries, Sweets } from "../types/enum/Item"
import { Pkm } from "../types/enum/Pokemon"
import { pickNRandomIn, randomWeighted } from "./random"

export function getChefDish(chef: IPokemon): Item | null | undefined {
  if (chef.items.has(Item.COOKING_POT)) return Item.HEARTY_STEW
  if (
    chef.name.startsWith("ARCEUS") ||
    chef.name === Pkm.KECLEON ||
    chef.items.has(Item.GOURMET_MEMORY)
  ) {
    return Item.SANDWICH
  }
  return DishByPkm[chef.name]
}

// BERRIES, MUSHROOMS and SWEETS stand for a random pick from their family
export function rollCookedDishes(
  dish: Item,
  count: number,
  chef: IPokemon
): Item[] {
  if (dish === Item.BERRIES) {
    return pickNRandomIn(
      NonSpecialBerries.filter((berry) => chef.items.has(berry) === false),
      count
    )
  }
  if (dish === Item.MUSHROOMS) {
    return Array.from(
      { length: count },
      () =>
        randomWeighted({
          [Item.TINY_MUSHROOM]: 77,
          [Item.BIG_MUSHROOM]: 20,
          [Item.BALM_MUSHROOM]: 3
        }) ?? Item.TINY_MUSHROOM
    )
  }
  if (dish === Item.SWEETS) return pickNRandomIn(Sweets, count)
  return Array.from({ length: count }, () => dish)
}

/* CHEFS_GREED raises how many dishes a chef can eat, so the limit can no longer
   live in Pokemon.canEat, which has no access to the owner's blessings */
export function getDishCapacity(
  pokemon: IPokemon,
  blessings?: Blessing[]
): number {
  const hasBelt = pokemon.items.has(Item.BIG_EATER_BELT)
  if (
    blessings?.includes(Blessing.CHEFS_GREED) &&
    pokemon.items.has(Item.CHEF_HAT)
  ) {
    return hasBelt ? CHEFS_GREED_DISHES_WITH_BELT : CHEFS_GREED_DISHES
  }
  return hasBelt ? 2 : 1
}

export function canEatMoreDishes(
  pokemon: IPokemon,
  blessings?: Blessing[]
): boolean {
  /* FESTIVE_PICNIC fills every mouth at the start of the phase, so a cook would
     never find a free one: its handout can always be replaced instead */
  if (
    blessings?.includes(Blessing.FESTIVE_PICNIC) &&
    pokemon.festivePicnicDish != null
  ) {
    return true
  }
  return pokemon.canEat || pokemon.dishes.size < getDishCapacity(pokemon, blessings)
}
