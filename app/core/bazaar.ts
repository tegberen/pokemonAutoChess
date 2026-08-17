import type Player from "../models/colyseus-models/player"
import PokemonFactory from "../models/pokemon-factory"
import type GameState from "../rooms/states/game-state"
import { healPlayerLife } from "../utils/player-life"
import {
  ArtificialItems,
  Berries,
  CraftableItemsNoScarves,
  Item,
  ItemComponents,
  Sweets,
  SynergyGems,
  SynergyGivenByGem
} from "../types/enum/Item"
import { Pkm } from "../types/enum/Pokemon"
import { getFirstAvailablePositionInBench } from "../utils/board"
import { pickRandomIn, randomWeighted, shuffleArray } from "../utils/random"
import { createRandomEgg } from "./eggs"

export { BAZAAR_SHOP_INTERVAL } from "../types/enum/SpecialGameRule"

export type BazaarOfferCategory =
  | "berry"
  | "bronze_dojo"
  | "magikarp"
  | "sweet"
  | "silver_dojo"
  | "component"
  | "egg"
  | "recycle"
  | "exchange_ticket"
  | "lapras_ticket"
  | "picnic_set"
  | "completed_item"
  | "artificial_item"
  | "gold_dojo"
  | "potion"
  | "gem"
  | "amulet_coin"

export const BAZAAR_POTION_HEAL = 10

const BazaarLowWeights: Partial<Record<BazaarOfferCategory, number>> = {
  berry: 1,
  bronze_dojo: 1,
  magikarp: 1,
  sweet: 1
}

const BazaarMidWeights: Partial<Record<BazaarOfferCategory, number>> = {
  component: 3,
  silver_dojo: 1,
  egg: 1,
  recycle: 1,
  exchange_ticket: 1,
  lapras_ticket: 1,
  picnic_set: 1
}

const BazaarHighWeights: Partial<Record<BazaarOfferCategory, number>> = {
  completed_item: 8,
  artificial_item: 4,
  gem: 5,
  amulet_coin: 1,
  potion: 1,
  gold_dojo: 1
}

const BazaarOfferPrice: Record<BazaarOfferCategory, number> = {
  berry: 0,
  magikarp: 1,
  sweet: 1,
  bronze_dojo: 4,
  component: 5,
  egg: 5,
  recycle: 4,
  exchange_ticket: 4,
  lapras_ticket: 4,
  picnic_set: 5,
  silver_dojo: 8,
  completed_item: 10,
  artificial_item: 10,
  potion: 10,
  gem: 10,
  amulet_coin: 10,
  gold_dojo: 12
}

export type BazaarOfferData = {
  item: string
  price: number
  category: BazaarOfferCategory
}

const BazaarSweets: Item[] = [
  ...Sweets,
  Item.TART_APPLE,
  Item.TINY_MUSHROOM,
  Item.BIG_MUSHROOM,
  Item.BALM_MUSHROOM
]

function resolveBazaarItem(category: BazaarOfferCategory): string {
  switch (category) {
    case "berry":
      return pickRandomIn(Berries)
    case "sweet":
      return pickRandomIn(BazaarSweets)
    case "component":
      return pickRandomIn(ItemComponents)
    case "completed_item":
      return pickRandomIn(CraftableItemsNoScarves)
    case "artificial_item":
      return pickRandomIn(ArtificialItems)
    case "gem":
      return pickRandomIn(SynergyGems)
    case "bronze_dojo":
      return Item.BRONZE_DOJO_TICKET
    case "silver_dojo":
      return Item.SILVER_DOJO_TICKET
    case "gold_dojo":
      return Item.GOLD_DOJO_TICKET
    case "amulet_coin":
      return Item.AMULET_COIN
    case "recycle":
      return Item.RECYCLE_TICKET
    case "exchange_ticket":
      return Item.EXCHANGE_TICKET
    case "lapras_ticket":
      return Item.LAPRAS_PASSPORT
    case "picnic_set":
      return Item.PICNIC_SET
    case "magikarp":
      return Pkm.MAGIKARP
    case "egg":
      return Pkm.EGG
    case "potion":
      return Item.POTION
  }
}

const makeOffer = (category: BazaarOfferCategory): BazaarOfferData => ({
  item: resolveBazaarItem(category),
  price: BazaarOfferPrice[category],
  category
})

// draw `count` offers from a weighted category pool, sampling WITH replacement but
// keeping every resolved item distinct — so the same category may repeat as long as
// it yields a different item (e.g. two different sweets), while identical items
// and single-item categories (tickets, potion...) never duplicate. usedItems is shared
// across the whole shop.
function drawBazaarOffers(
  weights: Partial<Record<BazaarOfferCategory, number>>,
  count: number,
  usedItems: Set<string>
): BazaarOfferData[] {
  const offers: BazaarOfferData[] = []
  let attempts = 0
  const maxAttempts = count * 50
  while (offers.length < count && attempts < maxAttempts) {
    attempts++
    const category = randomWeighted<BazaarOfferCategory>(weights)
    if (!category) break
    const offer = makeOffer(category)
    if (usedItems.has(offer.item)) continue
    usedItems.add(offer.item)
    offers.push(offer)
  }
  return offers
}

function getBazaarTierCounts(stageLevel: number): {
  low: number
  mid: number
  high: number
} {
  if (stageLevel < 15) return { low: 3, mid: 2, high: 1 }
  if (stageLevel < 25) return { low: 2, mid: 2, high: 2 }
  return { low: 1, mid: 2, high: 3 }
}

export function createBazaarShopOffers(stageLevel: number): BazaarOfferData[] {
  const { low, mid, high } = getBazaarTierCounts(stageLevel)
  const usedItems = new Set<string>()
  const offers: BazaarOfferData[] = [
    ...drawBazaarOffers(BazaarLowWeights, low, usedItems),
    ...drawBazaarOffers(BazaarMidWeights, mid, usedItems),
    ...drawBazaarOffers(BazaarHighWeights, high, usedItems)
  ]
  shuffleArray(offers)
  return offers
}

export function bazaarOfferNeedsBench(category: string): boolean {
  return category === "magikarp" || category === "egg"
}

export function grantBazaarOffer(
  offer: { item: string; category: string },
  player: Player,
  state: GameState
): void {
  const category = offer.category as BazaarOfferCategory
  switch (category) {
    case "magikarp":
    case "egg": {
      const pokemon =
        category === "egg"
          ? PokemonFactory.createPokemonFromName(
              createRandomEgg(player, false).evolution,
              player
            )
          : PokemonFactory.createPokemonFromName(Pkm.MAGIKARP, player)
      pokemon.positionX = getFirstAvailablePositionInBench(player.board) ?? 0
      pokemon.positionY = 0
      player.board.set(pokemon.id, pokemon)
      pokemon.onAcquired(player)
      break
    }
    case "potion":
      healPlayerLife(player, BAZAAR_POTION_HEAL, state)
      break
    case "gem": {
      const gem = offer.item as Item
      player.items.push(gem)
      const type = SynergyGivenByGem[gem]
      if (type) {
        player.bonusSynergies.set(type, (player.bonusSynergies.get(type) ?? 0) + 1)
        player.updateSynergies()
      }
      break
    }
    default:
      player.items.push(offer.item as Item)
      break
  }
}
