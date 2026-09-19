import { BOARD_SIDE_HEIGHT, BOARD_WIDTH, packBoardCell } from "./board"

export enum ScribbleShapeType {
  WALL = "WALL",
  BASTION = "BASTION",
  BLOCK = "BLOCK",
  HOOK = "HOOK",
  SPIKE = "SPIKE",
  RUSH = "RUSH",
  ZIGZAG = "ZIGZAG",
  SPARK = "SPARK",
  DOT = "DOT"
}

// [dx, dy] from the top-left corner, the top row being the front row
export const ScribbleShapeOffsets: Record<
  ScribbleShapeType,
  [number, number][]
> = {
  [ScribbleShapeType.WALL]: [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0]
  ],
  [ScribbleShapeType.BASTION]: [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1]
  ],
  [ScribbleShapeType.BLOCK]: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1]
  ],
  [ScribbleShapeType.HOOK]: [
    [0, 0],
    [1, 0],
    [0, 1]
  ],
  [ScribbleShapeType.SPIKE]: [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1]
  ],
  [ScribbleShapeType.RUSH]: [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1]
  ],
  [ScribbleShapeType.ZIGZAG]: [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1]
  ],
  [ScribbleShapeType.SPARK]: [
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1]
  ],
  [ScribbleShapeType.DOT]: [[0, 0]]
}

export const ScribbleShapeTint: Record<ScribbleShapeType, number> = {
  [ScribbleShapeType.WALL]: 0xf4d35e,
  [ScribbleShapeType.BASTION]: 0xee964b,
  [ScribbleShapeType.BLOCK]: 0xb57edc,
  [ScribbleShapeType.HOOK]: 0x6cc36c,
  [ScribbleShapeType.SPIKE]: 0xe8505b,
  [ScribbleShapeType.RUSH]: 0x4cc9f0,
  [ScribbleShapeType.ZIGZAG]: 0xff6fb5,
  [ScribbleShapeType.SPARK]: 0x3a6ee8,
  [ScribbleShapeType.DOT]: 0x2ec4b6
}

export const SCRIBBLE_LABEL_FADE_DURATION = 250
// dispatched on #game with the shape in hand, or null
export const SCRIBBLE_PAINTING_EVENT = "scribble-painting"

// placeable rows of the player half of the board (y = 0 is the bench)
const SCRIBBLE_MIN_Y = 1
const SCRIBBLE_MAX_Y = BOARD_SIDE_HEIGHT - 1

export function getScribbleShapeSize(shapeType: ScribbleShapeType) {
  const offsets = ScribbleShapeOffsets[shapeType]
  return {
    width: Math.max(...offsets.map(([dx]) => dx)) + 1,
    height: Math.max(...offsets.map(([, dy]) => dy)) + 1
  }
}

// origin is the bottom-left cell of the bounding box
export function getScribbleShapeCellsAt(
  shapeType: ScribbleShapeType,
  originX: number,
  originY: number
): number[] | null {
  const { width, height } = getScribbleShapeSize(shapeType)
  if (
    originX < 0 ||
    originX + width > BOARD_WIDTH ||
    originY < SCRIBBLE_MIN_Y ||
    originY + height - 1 > SCRIBBLE_MAX_Y
  )
    return null
  // offsets count rows from the top while board y counts up
  return ScribbleShapeOffsets[shapeType].map(([dx, dy]) =>
    packBoardCell(originX + dx, originY + (height - 1 - dy))
  )
}
