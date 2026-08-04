import type { IPokemon } from "../types"
import { Blessing, CHEFS_GREED_DISHES, CHEFS_GREED_DISHES_WITH_BELT } from "../types/enum/Blessing"
import { Item } from "../types/enum/Item"

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
  return pokemon.canEat || pokemon.dishes.size < getDishCapacity(pokemon, blessings)
}
