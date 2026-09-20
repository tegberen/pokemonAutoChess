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

export function getThemeColor(property: string, fallback: number): number {
  if (typeof window === "undefined") return fallback
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(property)
    .trim()
  if (value.startsWith("#")) {
    const hex = value.slice(1)
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex
    const parsed = Number.parseInt(full.slice(0, 6), 16)
    return Number.isNaN(parsed) ? fallback : parsed
  }
  const rgb = value.match(/\d+/g)
  if (rgb && rgb.length >= 3) {
    return (Number(rgb[0]) << 16) + (Number(rgb[1]) << 8) + Number(rgb[2])
  }
  return fallback
}
