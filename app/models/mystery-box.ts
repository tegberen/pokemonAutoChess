import { RarityCost } from "../config"
import { getAltFormForPlayer } from "../config/game/pokemons"
import type GameState from "../rooms/states/game-state"
import { Rarity } from "../types/enum/Game"
import type { Pkm } from "../types/enum/Pokemon"
import { getBenchSize, getFirstAvailablePositionInBench } from "../utils/board"
import { pickRandomIn, randomBetween } from "../utils/random"
import type Player from "./colyseus-models/player"
import PokemonFactory from "./pokemon-factory"
import { getPokemonData } from "./precomputed/precomputed-pokemon-data"
import { PRECOMPUTED_POKEMONS_PER_RARITY } from "./precomputed/precomputed-rarity"

export interface MysteryBox {
  gold: number
  guaranteedRarity: Rarity
}

export const MYSTERY_BOXES: MysteryBox[] = [
  { gold: 12, guaranteedRarity: Rarity.RARE },
  { gold: 18, guaranteedRarity: Rarity.EPIC },
  { gold: 26, guaranteedRarity: Rarity.ULTRA }
]

const RARITY_BY_COST: { [cost: number]: Rarity } = {
  1: Rarity.COMMON,
  2: Rarity.UNCOMMON,
  3: Rarity.RARE,
  4: Rarity.EPIC,
  5: Rarity.ULTRA
}

// filler units cost at least half the guaranteed one, so a box fits the bench
function rollMysteryBoxRarities(box: MysteryBox) {
  const maxCost = RarityCost[box.guaranteedRarity]
  const minCost = Math.ceil(maxCost / 2)
  const rarities = [box.guaranteedRarity]
  let goldLeft = box.gold - maxCost
  while (goldLeft > 0) {
    const cost =
      goldLeft < minCost
        ? goldLeft
        : randomBetween(minCost, Math.min(maxCost, goldLeft))
    rarities.push(RARITY_BY_COST[cost])
    goldLeft -= cost
  }
  return rarities
}

export function openMysteryBox(
  player: Player,
  box: MysteryBox,
  state: GameState
) {
  for (const rarity of rollMysteryBoxRarities(box)) {
    const candidates = PRECOMPUTED_POKEMONS_PER_RARITY[rarity].filter(
      (pkm: Pkm) => getPokemonData(pkm).stars === 1
    )
    const x = getFirstAvailablePositionInBench(
      player.board,
      getBenchSize(player.blessings)
    )
    if (candidates.length === 0 || x === null) continue
    const pkm = pickRandomIn(candidates)
    const { additional, regional, unlockable } = getPokemonData(pkm)
    const isMissingFromPool = additional || regional || unlockable
    if (isMissingFromPool && !state.shop.getPool(rarity)?.includes(pkm)) {
      state.shop.addCopiesToPool(pkm)
    }
    const pokemon = PokemonFactory.createPokemonFromName(
      getAltFormForPlayer(pkm, player),
      player
    )
    pokemon.positionX = x
    pokemon.positionY = 0
    player.board.set(pokemon.id, pokemon)
    pokemon.onAcquired(player)
  }
}
