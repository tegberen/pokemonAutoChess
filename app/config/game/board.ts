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

/* the corner the avatar occupies outside of a fight */
export const AVATAR_HOME_X = 504
export const AVATAR_HOME_Y = 696

/* How far either player may roam, in board cells. The right side has one extra
   cell of space to match the usable map area there. */
export const AVATAR_ROAM_MIN_X = -2
export const AVATAR_ROAM_MAX_X = BOARD_WIDTH + 2
/* Keep the vertical edge one cell further inside than the horizontal edge.
   At the old limits the upper avatar could disappear beneath the stage HUD;
   these remain symmetric around the board midpoint so camera flips match. */
export const AVATAR_ROAM_MIN_Y = -1
export const AVATAR_ROAM_MAX_Y = BOARD_HEIGHT
/* Avatar speed scaling. Base Speed is curved around 75 so slow and fast
   Pokémon feel distinctly different. */
export const AVATAR_WALK_SPEED_SCALE = 3

/* Double Up puts two players on the blue side of a pve round, so they step
   apart either side of the spawn instead of standing in the same place. */
export const AVATAR_TEAMMATE_OFFSET_CELLS = 0.75

export const CELL_WIDTH = 96
export const CELL_HEIGHT = 96

export const CELL_VISUAL_WIDTH = 75
export const CELL_VISUAL_HEIGHT = 75

/* Where a player's avatar stands when it is not being walked, in board cells.

   Centred on purpose. Only y mirrors in this game, so any x other than the
   middle puts the two players on physically different sides of the board: one
   beside their units, the other stranded across from them. Centred, both stand
   behind the middle of their own half and neither can tell which side the game
   dealt them.

   The y pair are mirror images, so each player sees their own nearest. */
export const AVATAR_SPAWN_X = (BOARD_WIDTH - 1) / 2

/* The generated arena draws a wall across the bottom, which the avatar would
   otherwise spawn standing on top of. Map tiles are 24px drawn at 2x, so this
   is the tile column the avatar occupies, and the gap opened for it. */
export const MAP_TILE_SIZE = 48
export const AVATAR_SPAWN_WORLD_X = BOARD_X_START + CELL_WIDTH * AVATAR_SPAWN_X
/* Measured in world pixels rather than whole tiles: the spawn falls on a tile
   boundary, so a gap counted in tiles either side of it lands half a tile off.

   Three tiles either side. Double Up stands two players here, and a narrower
   gap left both of them flush against the wall ends. Keep it an even number of
   tiles or the two halves of the wall stop matching. */
export const AVATAR_WALL_GAP_HALF_WIDTH = MAP_TILE_SIZE * 3
/* the wall row the arena draws across the bottom, and the middle of it in world
   pixels: the avatar stands in the gap opened there rather than above it */
export const AVATAR_SPAWN_TILE_Y = 15
const AVATAR_SPAWN_WORLD_Y = (AVATAR_SPAWN_TILE_Y + 0.5) * MAP_TILE_SIZE
export const AVATAR_SPAWN_BLUE_Y =
  (BOARD_Y_START - (AVATAR_SPAWN_WORLD_Y - CELL_HEIGHT / 2)) / CELL_HEIGHT - 2
export const AVATAR_SPAWN_RED_Y = BOARD_HEIGHT - 1 - AVATAR_SPAWN_BLUE_Y

export const BERRY_TREE_POSITIONS = [
  [408, 710],
  [360, 710],
  [312, 710]
]
