export function distanceC(x0: number, y0: number, x1: number, y1: number) {
  // chebyshev distance
  return Math.max(Math.abs(y0 - y1), Math.abs(x0 - x1))
}

export function distanceM(x0: number, y0: number, x1: number, y1: number) {
  // Manhattan distance
  return Math.abs(x1 - x0) + Math.abs(y1 - y0)
}

export function distanceE(x0: number, y0: number, x1: number, y1: number) {
  // Euclidian distance
  return Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2)
}

// number of free cells separating two units, so adjacent units have 0 spaces between them
export function spacesBetween(
  x0: number,
  y0: number,
  x1: number,
  y1: number
) {
  return Math.max(0, distanceC(x0, y0, x1, y1) - 1)
}
