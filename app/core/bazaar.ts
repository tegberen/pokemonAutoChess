import type Player from "../models/colyseus-models/player"
import PokemonFactory from "../models/pokemon-factory"
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
import {
  pickNRandomIn,
  pickRandomIn,
  randomWeighted,
  shuffleArray
} from "../utils/random"
import { createRandomEgg } from "./eggs"

export { BAZAAR_SHOP_INTERVAL } from "../types/enum/SpecialGameRule"

export type BazaarOfferKind =
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

export const BAZAAR_POTION_KEY = "POTION"
export const BAZAAR_POTION_HEAL = 10

const BazaarTier1Kinds: BazaarOfferKind[] = [
  "berry",
  "bronze_dojo",
  "magikarp",
  "sweet"
]

const BazaarTier2Weights: Partial<Record<BazaarOfferKind, number>> = {
  component: 3,
  silver_dojo: 1,
  egg: 1,
  recycle: 1,
  exchange_ticket: 1,
  lapras_ticket: 1,
  picnic_set: 1
}

const BazaarTier3Kinds: BazaarOfferKind[] = [
  "completed_item",
  "artificial_item",
  "gold_dojo",
  "potion",
  "gem",
  "amulet_coin"
]

export type BazaarOfferData = {
  item: string
  price: number
  kind: BazaarOfferKind
}

const BazaarSweets: Item[] = [
  ...Sweets,
  Item.TART_APPLE,
  Item.TINY_MUSHROOM,
  Item.BIG_MUSHROOM,
  Item.BALM_MUSHROOM
]

function resolveBazaarItem(kind: BazaarOfferKind): string {
  switch (kind) {
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
      return BAZAAR_POTION_KEY
  }
}

const makeOffer = (kind: BazaarOfferKind, price: number): BazaarOfferData => ({
  item: resolveBazaarItem(kind),
  price,
  kind
})

// sampling without replacement
function pickNWeightedDistinct(
  weights: Partial<Record<BazaarOfferKind, number>>,
  n: number
): BazaarOfferKind[] {
  const pool = { ...weights }
  const result: BazaarOfferKind[] = []
  while (result.length < n) {
    const pick = randomWeighted<BazaarOfferKind>(pool)
    if (!pick) break
    result.push(pick)
    delete pool[pick]
  }
  return result
}

// 3x 1-gold, 2x 5-gold, 1x 10-gold, all distinct kinds
export function createBazaarShopOffers(): BazaarOfferData[] {
  const offers: BazaarOfferData[] = [
    ...pickNRandomIn(BazaarTier1Kinds, 3).map((k) => makeOffer(k, 1)),
    ...pickNWeightedDistinct(BazaarTier2Weights, 2).map((k) => makeOffer(k, 5)),
    makeOffer(pickRandomIn(BazaarTier3Kinds), 10)
  ]
  shuffleArray(offers)
  return offers
}

export function bazaarOfferNeedsBench(kind: string): boolean {
  return kind === "magikarp" || kind === "egg"
}

export function grantBazaarOffer(
  offer: { item: string; kind: string },
  player: Player
): void {
  const kind = offer.kind as BazaarOfferKind
  switch (kind) {
    case "magikarp":
    case "egg": {
      const pokemon =
        kind === "egg"
          ? createRandomEgg(player, false)
          : PokemonFactory.createPokemonFromName(Pkm.MAGIKARP, player)
      pokemon.positionX = getFirstAvailablePositionInBench(player.board) ?? 0
      pokemon.positionY = 0
      player.board.set(pokemon.id, pokemon)
      pokemon.onAcquired(player)
      break
    }
    case "potion":
      player.life = Math.min(100, player.life + BAZAAR_POTION_HEAL)
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
