import Phaser from "phaser"

const SPLASH_SIZE = 24
const SPLASH_VARIANTS = 4
export const PAINT_SPLASH_SCALE = 4
export const PAINT_SPLASH_ALPHA = 0.9

function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shade(tint: number, factor: number): string {
  const channel = (shift: number) => {
    const value = (tint >> shift) & 0xff
    return Math.round(
      factor >= 1 ? value + (255 - value) * (factor - 1) : value * factor
    )
  }
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`
}

function drawSplash(
  context: CanvasRenderingContext2D,
  tint: number,
  seed: number
) {
  const random = seededRandom(seed)
  const center = (SPLASH_SIZE - 1) / 2
  const lobes = 3 + Math.floor(random() * 3)
  const phase = random() * Math.PI * 2
  const radiusAt = (angle: number) =>
    9.5 + 1.4 * Math.sin(lobes * angle + phase) + (random() - 0.5) * 0.8

  const inside: boolean[][] = []
  for (let y = 0; y < SPLASH_SIZE; y++) {
    inside.push([])
    for (let x = 0; x < SPLASH_SIZE; x++) {
      const dx = x - center
      const dy = y - center
      inside[y].push(Math.hypot(dx, dy) < radiusAt(Math.atan2(dy, dx)))
    }
  }
  const isInside = (x: number, y: number) => inside[y]?.[x] === true

  for (let y = 0; y < SPLASH_SIZE; y++) {
    for (let x = 0; x < SPLASH_SIZE; x++) {
      if (!isInside(x, y)) continue
      const isRim =
        !isInside(x - 1, y) ||
        !isInside(x + 1, y) ||
        !isInside(x, y - 1) ||
        !isInside(x, y + 1)
      const isHighlight =
        !isRim && x - center < -2 && y - center < -2 && x + y < center + 3
      context.fillStyle = isRim
        ? shade(tint, 0.6)
        : isHighlight
          ? shade(tint, 1.25)
          : shade(tint, 0.92)
      context.fillRect(x, y, 1, 1)
    }
  }

  const droplets = 2 + Math.floor(random() * 2)
  context.fillStyle = shade(tint, 0.75)
  for (let i = 0; i < droplets; i++) {
    const angle = random() * Math.PI * 2
    const distance = 10.5 + random() * 1.2
    const x = Math.round(center + Math.cos(angle) * distance)
    const y = Math.round(center + Math.sin(angle) * distance)
    const size = random() < 0.5 ? 1 : 2
    context.fillRect(x, y, size, size)
  }
}

export function getPaintSplashTexture(
  scene: Phaser.Scene,
  tint: number,
  cellIndex: number
): string {
  const variant = cellIndex % SPLASH_VARIANTS
  const key = `paint-splash-${tint.toString(16)}-${variant}`
  if (scene.textures.exists(key)) return key
  const texture = scene.textures.createCanvas(key, SPLASH_SIZE, SPLASH_SIZE)
  const context = texture?.getContext()
  if (!texture || !context) return key
  drawSplash(context, tint, tint + variant * 7919)
  texture.refresh()
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST)
  return key
}
