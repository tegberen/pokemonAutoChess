import type { MapSchema } from "@colyseus/schema"
import type { Pokemon } from "../models/colyseus-models/pokemon"
import type PokemonSprite from "../public/src/game/components/pokemon"
import type { IPokemon } from "../types"
import {
  BENCH_MAX_WIDTH,
  BENCH_WIDTH,
  BOARD_WIDTH
} from "../config/game/board"
import { Blessing } from "../types/enum/Blessing"
import { SpecialGameRule } from "../types/enum/SpecialGameRule"
import { schemaValues } from "./schemas"

export function getBenchSize(
  blessings: { includes(blessing: Blessing): boolean } | undefined
): number {
  return blessings?.includes(Blessing.PARK_BENCH)
    ? BENCH_MAX_WIDTH
    : BENCH_WIDTH
}

export function isOnBench(pokemon: IPokemon | PokemonSprite) {
  return pokemon.positionY === 0
}

export function isPositionEmpty(
  x: number,
  y: number,
  board: MapSchema<Pokemon, string>
) {
  return (
    schemaValues(board).some((p) => p.positionX === x && p.positionY === y) ===
    false
  )
}

export function getFirstAvailablePositionInBench(
  board: MapSchema<Pokemon, string>,
  benchSize = BENCH_WIDTH
): number | null {
  for (let i = 0; i < benchSize; i++) {
    if (isPositionEmpty(i, 0, board)) {
      return i
    }
  }
  return null
}

export function getLastAvailablePositionInBench(
  board: MapSchema<Pokemon, string>,
  benchSize = BENCH_WIDTH
): number | null {
  for (let i = benchSize - 1; i >= 0; i--) {
    if (isPositionEmpty(i, 0, board)) {
      return i
    }
  }
  return null
}

export function getFirstAvailablePositionOnBoard(
  board: MapSchema<Pokemon, string>,
  range: number
) {
  let rowsOrder: number[]
  switch (Math.min(range, 3)) {
    case 2:
      rowsOrder = [2, 1, 3]
      break

    case 3:
      rowsOrder = [1, 2, 3]
      break

    case 1:
    default:
      rowsOrder = [3, 2, 1]
      break
  }
  for (let y = 0; y < rowsOrder.length; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (isPositionEmpty(x, rowsOrder[y], board)) {
        return [x, rowsOrder[y]]
      }
    }
  }
}

export function getFreeSpaceOnBench(
  board: MapSchema<Pokemon, string>,
  benchSize = BENCH_WIDTH
): number {
  let numberOfFreeSpace = 0
  for (let i = 0; i < benchSize; i++) {
    if (isPositionEmpty(i, 0, board)) {
      numberOfFreeSpace++
    }
  }
  return numberOfFreeSpace
}

export function getMaxTeamSize(
  playerLevel: number,
  specialGameRule?: SpecialGameRule | null
) {
  if (specialGameRule === SpecialGameRule.CROWDED) return playerLevel + 3
  return playerLevel
}
