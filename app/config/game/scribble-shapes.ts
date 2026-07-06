import { pickRandomIn, shuffleArray } from "../../utils/random"
import { BOARD_SIDE_HEIGHT, BOARD_WIDTH } from "./board"

export enum ScribbleShapeType {
  DOT = "DOT",
  LINE = "LINE",
  COLUMN = "COLUMN",
  L = "L",
  SQUARE = "SQUARE",
  T = "T",
  TRIANGLE = "TRIANGLE",
  ZIGZAG = "ZIGZAG",
  DIAGONAL = "DIAGONAL",
  X = "X",
  PLUS = "PLUS",
  RING = "RING"
}

// cell offsets [dx, dy] from the top-left corner of the shape bounding box
export const ScribbleShapeOffsets: Record<
  ScribbleShapeType,
  [number, number][]
> = {
  [ScribbleShapeType.DOT]: [[0, 0]],
  [ScribbleShapeType.LINE]: [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0]
  ],
  [ScribbleShapeType.COLUMN]: [
    [0, 0],
    [0, 1],
    [0, 2]
  ],
  [ScribbleShapeType.L]: [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 2]
  ],
  [ScribbleShapeType.SQUARE]: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1]
  ],
  [ScribbleShapeType.T]: [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1]
  ],
  [ScribbleShapeType.TRIANGLE]: [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1]
  ],
  [ScribbleShapeType.ZIGZAG]: [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1]
  ],
  [ScribbleShapeType.DIAGONAL]: [
    [0, 0],
    [1, 1],
    [2, 2]
  ],
  [ScribbleShapeType.X]: [
    [0, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [2, 2]
  ],
  [ScribbleShapeType.PLUS]: [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [1, 2]
  ],
  [ScribbleShapeType.RING]: [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2]
  ]
}

export const ScribbleShapeTint: Record<ScribbleShapeType, number> = {
  [ScribbleShapeType.DOT]: 0xffffff, // white - attack + ability power
  [ScribbleShapeType.LINE]: 0xff8877, // red - attack
  [ScribbleShapeType.COLUMN]: 0x99ffcc, // mint - special defense
  [ScribbleShapeType.L]: 0xffcc66, // orange - luck
  [ScribbleShapeType.SQUARE]: 0x8899ff, // blue - defense
  [ScribbleShapeType.T]: 0xff88ff, // pink - ability power
  [ScribbleShapeType.TRIANGLE]: 0x66aaff, // azure - PP
  [ScribbleShapeType.ZIGZAG]: 0xffff88, // yellow - speed stacks
  [ScribbleShapeType.DIAGONAL]: 0x88ffff, // cyan - speed
  [ScribbleShapeType.X]: 0xff44aa, // magenta - crit
  [ScribbleShapeType.PLUS]: 0x88ff88, // green - max HP
  [ScribbleShapeType.RING]: 0xaaaaee // lavender - shield
}

// placeable rows of the player half of the board (y = 0 is the bench)
const SCRIBBLE_MIN_Y = 1
const SCRIBBLE_MAX_Y = BOARD_SIDE_HEIGHT - 1

export function packScribbleCell(x: number, y: number): number {
  return y * BOARD_WIDTH + x
}

export function unpackScribbleCell(cell: number): { x: number; y: number } {
  return { x: cell % BOARD_WIDTH, y: Math.floor(cell / BOARD_WIDTH) }
}

export interface ScribbleShapeData {
  shapeType: ScribbleShapeType
  cells: number[]
}

export const ScribbleSketchbookMilestones = [2, 4, 6, 8, 10, 12]

export function buildScribbleShapeBag(
  collectedShapes: ScribbleShapeType[] = []
): ScribbleShapeType[] {
  // shapes not yet in the sketchbook come out of the bag first, so that a
  // player who missed a shape gets another try as early as possible.
  // Any pair of shapes fits together on the 8x3 board (two 3-column shapes
  // side by side use only 6 columns), so no other constraint is needed.
  const allShapes = Object.values(ScribbleShapeType)
  return [
    ...shuffleArray(
      allShapes.filter((s) => collectedShapes.includes(s) === false)
    ),
    ...shuffleArray(allShapes.filter((s) => collectedShapes.includes(s)))
  ]
}

export function rollScribbleShapes(
  shapeTypes: ScribbleShapeType[]
): ScribbleShapeData[] {
  // biggest shapes are placed first, and some placements can make the next
  // shape impossible to place without overlap; in that case restart the roll
  const placementOrder = [...shapeTypes].sort(
    (a, b) => ScribbleShapeOffsets[b].length - ScribbleShapeOffsets[a].length
  )
  for (let rolls = 0; rolls < 100; rolls++) {
    const shapes = tryPlaceScribbleShapes(placementOrder)
    if (shapes.length === shapeTypes.length) return shapes
  }
  return tryPlaceScribbleShapes(placementOrder)
}

function tryPlaceScribbleShapes(
  shapeTypes: ScribbleShapeType[]
): ScribbleShapeData[] {
  const shapes: ScribbleShapeData[] = []
  const occupied: number[] = []

  for (const shapeType of shapeTypes) {
    const cells = placeScribbleShape(shapeType, occupied)
    if (cells === null) return shapes
    occupied.push(...cells)
    shapes.push({ shapeType, cells })
  }

  return shapes
}

export function enumerateScribbleShapePlacements(
  shapeType: ScribbleShapeType,
  occupiedCells: number[]
): number[][] {
  const occupied = new Set(occupiedCells)
  const offsets = ScribbleShapeOffsets[shapeType]
  const width = Math.max(...offsets.map(([dx]) => dx)) + 1
  const height = Math.max(...offsets.map(([, dy]) => dy)) + 1
  // enumerate every legal placement. No mirroring or rotation, so that the
  // shapes always appear on board exactly like in the sketchbook
  const placements: number[][] = []
  for (let originX = 0; originX <= BOARD_WIDTH - width; originX++) {
    for (
      let originY = SCRIBBLE_MIN_Y;
      originY <= SCRIBBLE_MAX_Y - height + 1;
      originY++
    ) {
      // shape offsets use visual rows (dy 0 = top) while board y axis
      // points up, so the row is inverted to keep shapes upright on board
      const cells = offsets.map(([dx, dy]) =>
        packScribbleCell(originX + dx, originY + (height - 1 - dy))
      )
      if (cells.every((c) => occupied.has(c) === false)) {
        placements.push(cells)
      }
    }
  }
  return placements
}

export function placeScribbleShape(
  shapeType: ScribbleShapeType,
  occupiedCells: number[]
): number[] | null {
  const placements = enumerateScribbleShapePlacements(shapeType, occupiedCells)
  if (placements.length === 0) return null
  return pickRandomIn(placements)
}

// place a shape so that every shape of nextShapeTypes can still be placed
// afterwards without overlap, whichever one is drawn next
export function placeScribbleShapeCompatibleWith(
  shapeType: ScribbleShapeType,
  nextShapeTypes: ScribbleShapeType[]
): number[] {
  const placements = enumerateScribbleShapePlacements(shapeType, [])
  const compatiblePlacements = placements.filter((cells) =>
    nextShapeTypes.every(
      (next) => enumerateScribbleShapePlacements(next, cells).length > 0
    )
  )
  return pickRandomIn(
    compatiblePlacements.length > 0 ? compatiblePlacements : placements
  )
}
