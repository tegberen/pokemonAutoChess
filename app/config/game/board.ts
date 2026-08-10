export const BOARD_WIDTH = 8
export const BOARD_HEIGHT = 6
export const BOARD_SIDE_HEIGHT = 4 // 0 = bench

// a board cell as a single number, so sets of cells can be sent as uint8 arrays
export function packBoardCell(x: number, y: number): number {
  return y * BOARD_WIDTH + x
}

export function unpackBoardCell(cell: number): { x: number; y: number } {
  return { x: cell % BOARD_WIDTH, y: Math.floor(cell / BOARD_WIDTH) }
}

/* SNIFFER_DOG lets ground types dig on the bench too. The bench row is parked
   past the whole board in player.groundHoles so that combat abilities digging
   under an enemy (rows 3-5 in simulation coordinates) can never reach it. */
export const BENCH_GROUND_HOLES_OFFSET = BOARD_WIDTH * BOARD_HEIGHT
export const GROUND_HOLES_LENGTH = BENCH_GROUND_HOLES_OFFSET + BOARD_WIDTH
export const BOARD_X_START = 672 // 28 * 24
export const BOARD_Y_START = 808

export const CELL_WIDTH = 96
export const CELL_HEIGHT = 96

export const CELL_VISUAL_WIDTH = 75
export const CELL_VISUAL_HEIGHT = 75

export const BERRY_TREE_POSITIONS = [
  [408, 710],
  [360, 710],
  [312, 710]
]
