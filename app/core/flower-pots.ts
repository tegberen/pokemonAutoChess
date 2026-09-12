import { type IPlayer, Title } from "../types"
import { getItemCapacity } from "../config/game/items"
import { Blessing } from "../types/enum/Blessing"
import type { Pokemon } from "../models/colyseus-models/pokemon"
import type Player from "../models/colyseus-models/player"
import { schemaValues } from "../utils/schemas"
import { EffectEnum } from "../types/enum/Effect"
import { FlowerPot, FlowerPots } from "../types/enum/FlowerPot"
import {
  DojoTickets,
  Item,
  Mulches,
  UnholdableItems
} from "../types/enum/Item"
import { Pkm } from "../types/enum/Pokemon"
import { isIn } from "../utils/array"

// two rows 96px apart, staggered by 48px. A flower's item column reaches about
// 57px to its right and the next pot's sprite about 24px to its left, so anything
// under ~81px of same row spacing draws items on top of the neighbouring pot
export const FLOWER_POTS_POSITIONS_BLUE = [
  [432, 566],
  [384, 470],
  [336, 566],
  [288, 470],
  [240, 566]
]

// Pots sit 96px apart within a row and 96px apart between rows, so a 64px zone
// never reaches a neighbour. The vertical offset lifts it over the flower
// sprite, which is drawn above the pot
export const FLOWER_POT_ZONE_WIDTH = 64
export const FLOWER_POT_ZONE_HEIGHT = 64
export const FLOWER_POT_ZONE_Y_OFFSET = 16

// the same garden mirrored about y = 800 and shifted right, far enough that the
// widened row clears board cell 7, which reaches x 1392
export const FLOWER_POTS_POSITIONS_RED = [
  [1624, 234],
  [1576, 330],
  [1528, 234],
  [1480, 330],
  [1432, 234]
]

export const FlowerMonByPot: Record<FlowerPot, Pkm[]> = {
  [FlowerPot.PINK]: [Pkm.HOPPIP, Pkm.SKIPLOOM, Pkm.JUMPLUFF],
  [FlowerPot.YELLOW]: [Pkm.BELLSPROUT, Pkm.WEEPINBELL, Pkm.VICTREEBEL],
  [FlowerPot.WHITE]: [Pkm.CHIKORITA, Pkm.BAYLEEF, Pkm.MEGANIUM],
  [FlowerPot.BLUE]: [Pkm.ODDISH, Pkm.GLOOM, Pkm.VILEPLUME],
  [FlowerPot.ORANGE]: [Pkm.BELLOSSOM]
}

// rare candy evolves its holder through player.board, which a pot is not part of,
// and gold bow only frees up team size, which a pot never took in the first place
const FlowerPotForbiddenItems = [Item.RARE_CANDY, Item.GOLD_BOW] satisfies Item[]

// mulches feed the pot itself, everything else is carried into the fight by the
// flower it spawns, so only what a pokemon could never hold is refused.
// dojo tickets are holdable but send their pokemon off to train, which a pot cannot do
export function canItemGoOnFlowerPot(item: Item): boolean {
  if (isIn(FlowerPotForbiddenItems, item)) return false
  if (isIn(Mulches, item)) return true
  return !isIn(UnholdableItems, item) && !isIn(DojoTickets, item)
}

// these wishes bolt an item onto their flower pot for the rest of the game, and
// the player cannot take it back off
const WishItemByPot: Partial<
  Record<FlowerPot, { blessing: Blessing; item: Item }>
> = {
  [FlowerPot.YELLOW]: { blessing: Blessing.FLYTRAP, item: Item.COVERT_CLOAK },
  [FlowerPot.WHITE]: { blessing: Blessing.MEGA_SOL, item: Item.SOOTHE_BELL },
  [FlowerPot.BLUE]: { blessing: Blessing.SPORE_CLOUDS, item: Item.KINGS_ROCK }
}

function getFlowerPotOf(pkm: Pkm): FlowerPot | undefined {
  return FlowerPots.find((pot) => FlowerMonByPot[pot].includes(pkm))
}

// the item a wish has locked onto this pot, if the player took that wish
export function getWishItemOnPot(
  player: IPlayer,
  pot: Pokemon
): Item | undefined {
  const potColor = getFlowerPotOf(pot.name)
  const wish = potColor ? WishItemByPot[potColor] : undefined
  return wish && player.blessings?.includes(wish.blessing) ? wish.item : undefined
}

// Taking one of these wishes attaches its item to the matching pot right away.
// A pot with no room left hands everything it was holding back to the bag, so
// the wish item is the only thing it wears
export function grantWishItemToFlowerPot(player: Player, blessing: Blessing) {
  const potColor = FlowerPots.find(
    (pot) => WishItemByPot[pot]?.blessing === blessing
  )
  const item = potColor && WishItemByPot[potColor]?.item
  if (!potColor || !item) return
  const pot = player.flowerPots.find((p) =>
    FlowerMonByPot[potColor].includes(p.name)
  )
  if (!pot) return
  let itemsToReturn: Item[] = []
  if (pot.items.size >= getItemCapacity(player.specialGameRule)) {
    itemsToReturn = schemaValues(pot.items)
  } else if (pot.items.has(item)) {
    itemsToReturn = [item]
  }
  if (itemsToReturn.length > 0) {
    pot.removeItems(itemsToReturn, player)
    itemsToReturn.forEach((heldItem) => player.items.push(heldItem))
  }
  pot.items.add(item)
}

export function getFlowerPotsUnlocked(player: IPlayer): FlowerPot[] {
  const hasAllEvolutions = player.flowerPots.every(
    (pot) => pot.evolution === Pkm.DEFAULT
  )
  if (hasAllEvolutions) player.titles.add(Title.BLOSSOMED)
  return player.flowerPotsSpawnOrder.filter((pot) => {
    if (player.effects.has(EffectEnum.COTTONWEED)) return pot === FlowerPot.PINK
    if (player.effects.has(EffectEnum.FLYCATCHER))
      return [FlowerPot.PINK, FlowerPot.YELLOW].includes(pot)
    if (player.effects.has(EffectEnum.FRAGRANT))
      return [FlowerPot.PINK, FlowerPot.YELLOW, FlowerPot.WHITE].includes(pot)
    if (player.effects.has(EffectEnum.FLOWER_POWER)) {
      return (
        [
          FlowerPot.PINK,
          FlowerPot.YELLOW,
          FlowerPot.WHITE,
          FlowerPot.BLUE
        ].includes(pot) ||
        (hasAllEvolutions && pot === FlowerPot.ORANGE)
      )
    }
  })
}

/* flowerPots is a fixed array in unlock order, so the unlocked ones are always
   its first N entries. Locked pots still hold a Pokemon and would otherwise be
   counted by anything summing stars or evolutions */
export function getUnlockedFlowerPots(player: IPlayer) {
  return player.flowerPots.slice(0, getFlowerPotsUnlocked(player).length)
}

// IKEBANA: max Flora, with every pot it unlocked carrying a full set of items
export function hasFullyItemizedFlowerPots(player: Player): boolean {
  if (!player.effects.has(EffectEnum.FLOWER_POWER)) return false
  const capacity = getItemCapacity(player.specialGameRule)
  return getUnlockedFlowerPots(player).every(
    (pot) => pot.items.size >= capacity
  )
}

export function getFlowerPotStarCount(player: IPlayer): number {
  return getUnlockedFlowerPots(player).reduce((sum, pot) => sum + pot.stars, 0)
}

export function getFlowerMonByPot(pot: FlowerPot): Pkm[] {
  return FlowerMonByPot[pot] || []
}

export const FlowerPotMons: Pkm[] = Object.values(FlowerMonByPot).flat()

export const MulchStockCaps = [
  5,
  8, // 13
  11, // 24
  15, // 39
  20, // 59
  27, // 86
  36, // 122
  50 // 172
]
