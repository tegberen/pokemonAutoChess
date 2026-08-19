import {
  BOARD_X_START,
  BOARD_Y_START,
  CELL_HEIGHT,
  CELL_WIDTH
} from "../../../../config"

export function transformBoardCoordinates(
  x: number,
  y: number
): [number, number] {
  if (y === 0) {
    return [BOARD_X_START + CELL_WIDTH * x, BOARD_Y_START]
  } else {
    return [
      BOARD_X_START + CELL_WIDTH * x,
      BOARD_Y_START - CELL_HEIGHT * (y + 1) + CELL_HEIGHT / 2
    ]
  }
}

export function transformEntityCoordinates(
  x: number,
  y: number,
  flip: boolean
): [number, number] {
  return [
    BOARD_X_START + CELL_WIDTH * x,
    CELL_HEIGHT / 2 +
      (flip
        ? BOARD_Y_START + CELL_HEIGHT * (y - 7)
        : BOARD_Y_START - CELL_HEIGHT * (y + 2))
  ]
}

/* the inverse of transformEntityCoordinates, for turning a click back into the
   board cell it landed on. Fractional on purpose: avatars walk between cells */
export function untransformEntityCoordinates(
  worldX: number,
  worldY: number,
  flip: boolean
): [number, number] {
  const y = worldY - CELL_HEIGHT / 2
  return [
    (worldX - BOARD_X_START) / CELL_WIDTH,
    flip
      ? (y - BOARD_Y_START) / CELL_HEIGHT + 7
      : (BOARD_Y_START - y) / CELL_HEIGHT - 2
  ]
}

export function transformMiniGameXCoordinate(x: number) {
  return BOARD_X_START + x
}

export function transformMiniGameYCoordinate(y: number) {
  return BOARD_Y_START - y - CELL_HEIGHT * 1.5
}
