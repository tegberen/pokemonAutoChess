import Masker from "../../core/masker"
import { pickRandomIn, shuffleArray } from "../../utils/random"
import {
  DTEF_TILESET_WIDTH,
  MaskCoordinate,
  TerrainType
} from "../maps/tileset"
import {
  BOARD_SIDE_HEIGHT,
  BOARD_WIDTH,
  packBoardCell,
  unpackBoardCell
} from "./board"

/* Ponds of the WATER_FOUNTAIN blessing: patches of water on the player board
   that buff whoever starts a fight standing in them. */

export enum WaterPondType {
  DEEP_POND = "DEEP_POND",
  MINERAL_SPRING = "MINERAL_SPRING",
  TIDE_POOL = "TIDE_POOL",
  TORRENT = "TORRENT",
  CRYSTAL_POND = "CRYSTAL_POND",
  RAPIDS = "RAPIDS",
  GEYSER = "GEYSER"
}

export interface WaterPondData {
  pondType: WaterPondType
  cells: number[]
}

/* Cell offsets [dx, dy] from the top left of the bounding box. Ponds are round
   so the water autotiling reads as a shoreline rather than scattered puddles,
   never wider than 4 so two always fit side by side in the 8 columns, and never
   taller than 2 rows so a front or back row band still leaves them somewhere */
export const WaterPondOffsets: Record<WaterPondType, [number, number][]> = {
  [WaterPondType.DEEP_POND]: [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1]
  ],
  [WaterPondType.MINERAL_SPRING]: [
    [1, 0],
    [2, 0],
    [3, 0],
    [0, 1],
    [1, 1],
    [2, 1]
  ],
  [WaterPondType.TIDE_POOL]: [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [1, 1],
    [2, 1]
  ],
  [WaterPondType.TORRENT]: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1]
  ],
  [WaterPondType.CRYSTAL_POND]: [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1]
  ],
  [WaterPondType.RAPIDS]: [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
    [3, 1]
  ],
  [WaterPondType.GEYSER]: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1]
  ]
}

// ponds keep their region's own water colours, so these only tint the label
export const WaterPondTint: Record<WaterPondType, number> = {
  [WaterPondType.DEEP_POND]: 0x8899ff, // blue - defense
  [WaterPondType.MINERAL_SPRING]: 0x99ffcc, // mint - special defense
  [WaterPondType.TIDE_POOL]: 0xaaaaee, // lavender - shield
  [WaterPondType.TORRENT]: 0xff8877, // red - attack
  [WaterPondType.CRYSTAL_POND]: 0xff88ff, // pink - ability power
  [WaterPondType.RAPIDS]: 0x88ffff, // cyan - speed
  [WaterPondType.GEYSER]: 0xff44aa // magenta - crit
}

/* defensive ponds sit on the front row so that holding them means holding the
   line, offensive and generic ones in the backline where carries stand */
export const WaterPondFrontRowTypes = [
  WaterPondType.DEEP_POND,
  WaterPondType.MINERAL_SPRING,
  WaterPondType.TIDE_POOL
]

export const WaterPondTypes = Object.values(WaterPondType)

/* effect strength per tier of Water, so Water 3/6/9 pays 1x/2x/3x. The blessing
   can be taken before Water is active, which would otherwise be a dead pick */
export const WaterPondValuePerWaterTier: Record<WaterPondType, number> = {
  [WaterPondType.DEEP_POND]: 4,
  [WaterPondType.MINERAL_SPRING]: 4,
  [WaterPondType.TIDE_POOL]: 15,
  [WaterPondType.TORRENT]: 15,
  [WaterPondType.CRYSTAL_POND]: 20,
  [WaterPondType.RAPIDS]: 15,
  [WaterPondType.GEYSER]: 10
}

export function getWaterPondValue(
  pondType: WaterPondType,
  waterTier: number
): number {
  return WaterPondValuePerWaterTier[pondType] * Math.max(1, waterTier)
}

export const WATER_FOUNTAIN_PONDS = 2
export const WATER_FOUNTAIN_REROLL_INTERVAL = 4
export const WATER_POND_LABEL_FADE_DURATION = 250

// placeable rows of the player half of the board (y = 0 is the bench)
const POND_MIN_Y = 1
const POND_MAX_Y = BOARD_SIDE_HEIGHT - 1

function enumerateWaterPondPlacements(
  pondType: WaterPondType,
  occupiedCells: number[]
): number[][] {
  const occupied = new Set(occupiedCells)
  const offsets = WaterPondOffsets[pondType]
  const width = Math.max(...offsets.map(([dx]) => dx)) + 1
  const height = Math.max(...offsets.map(([, dy]) => dy)) + 1
  /* originY is the row nearest the bench, so the highest one puts the pond on
     the front row and the lowest keeps it in the backline */
  const originY = WaterPondFrontRowTypes.includes(pondType)
    ? POND_MAX_Y - height + 1
    : POND_MIN_Y

  const placements: number[][] = []
  for (let originX = 0; originX <= BOARD_WIDTH - width; originX++) {
    /* offsets use visual rows (dy 0 = top) while the board y axis points up,
       so the row is inverted to keep ponds upright on board */
    const cells = offsets.map(([dx, dy]) =>
      packBoardCell(originX + dx, originY + (height - 1 - dy))
    )
    if (cells.every((cell) => occupied.has(cell) === false)) {
      placements.push(cells)
    }
  }
  return placements
}

export function rollWaterPonds(): WaterPondData[] {
  const pondTypes = shuffleArray([...WaterPondTypes]).slice(
    0,
    WATER_FOUNTAIN_PONDS
  )
  const ponds: WaterPondData[] = []
  const occupied: number[] = []
  for (const pondType of pondTypes) {
    const placements = enumerateWaterPondPlacements(pondType, occupied)
    if (placements.length === 0) continue
    const cells = pickRandomIn(placements)
    occupied.push(...cells)
    ponds.push({ pondType, cells })
  }
  return ponds
}

/* Ponds are drawn with their own region's water tiles so the shoreline blends
   with the ground the region is painted for. The tilemap already loads these
   images flat, so the pond copies need their own keys to be spritesheets */
export const WATER_POND_TILE_SIZE = 24
const WATER_POND_STATIC_TILESET = "tileset_0"
/* DTEF draws water as a static tile with animated frames composited above it,
   so ponds stack the same layers rather than replacing one with the other */
const WATER_POND_ANIMATED_TILESET_PREFIX = "tileset_0_frame"

export function isWaterPondTileset(tilesetName: string) {
  return (
    tilesetName === WATER_POND_STATIC_TILESET ||
    tilesetName.startsWith(WATER_POND_ANIMATED_TILESET_PREFIX)
  )
}

export function isWaterPondAnimatedTileset(tilesetName: string) {
  return tilesetName.startsWith(WATER_POND_ANIMATED_TILESET_PREFIX)
}

export function getWaterPondTilesetKey(map: string, tilesetName: string) {
  return `pond_tiles_${map}_${tilesetName}`
}

export const POND_SPLASH_INTERVAL = 1600
// the splash lands at the feet rather than the middle of the sprite
export const POND_SPLASH_Y_OFFSET = 4

// tiles per row in a DTEF tileset image: three terrain blocks side by side
const DTEF_TILESET_COLUMNS = DTEF_TILESET_WIDTH * 3
const masker = new Masker()

/* Each pond cell picks the water tile matching how it is surrounded by the rest
   of the pond, so the pond renders with a shoreline instead of square blocks.
   Rows are flipped because the board y axis points up while the tileset masks
   are defined visually (row 0 = top) */
export function getWaterPondTileFrames(cells: number[]): Map<number, number> {
  const coordinates = cells.map(unpackBoardCell)
  const minX = Math.min(...coordinates.map(({ x }) => x))
  const maxX = Math.max(...coordinates.map(({ x }) => x))
  const minY = Math.min(...coordinates.map(({ y }) => y))
  const maxY = Math.max(...coordinates.map(({ y }) => y))

  // padded by one so that border cells see empty neighbours on every side
  const width = maxX - minX + 3
  const height = maxY - minY + 3
  const grid: number[][] = Array.from({ length: height }, () =>
    new Array<number>(width).fill(TerrainType.GROUND)
  )
  const toGrid = ({ x, y }: { x: number; y: number }) => ({
    col: x - minX + 1,
    row: maxY - y + 1
  })
  coordinates.forEach((coordinate) => {
    const { col, row } = toGrid(coordinate)
    grid[row][col] = TerrainType.WATER
  })

  const frames = new Map<number, number>()
  cells.forEach((cell) => {
    const { col, row } = toGrid(unpackBoardCell(cell))
    const maskCoordinate = MaskCoordinate[masker.mask8bits(grid, row, col)]
    frames.set(
      cell,
      maskCoordinate.y * DTEF_TILESET_COLUMNS +
        maskCoordinate.x +
        TerrainType.WATER * DTEF_TILESET_WIDTH
    )
  })
  return frames
}
