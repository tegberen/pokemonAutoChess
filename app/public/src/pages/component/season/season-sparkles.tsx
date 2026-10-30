import type { CSSProperties } from "react"

const SPARKLES = [
  { left: -8, top: 10, size: 32, color: "#ffffff" },
  { left: 104, top: 4, size: 24, color: "#ffe27a" },
  { left: 112, top: 48, size: 18, color: "#8fdcff" },
  { left: 98, top: 94, size: 30, color: "#ff9fd4" },
  { left: 2, top: 98, size: 22, color: "#c3a6ff" },
  { left: -12, top: 56, size: 16, color: "#9ff2c4" },
  { left: 52, top: -6, size: 20, color: "#ffffff" }
]
const SPARKLE_STAGGER_MS = 90
// a scrolling grid clips anything past the card edge
const CONTAINED_MIN_PERCENT = 8
const CONTAINED_MAX_PERCENT = 92

function containWithinCard(percent: number) {
  return Math.min(
    CONTAINED_MAX_PERCENT,
    Math.max(CONTAINED_MIN_PERCENT, percent)
  )
}

export default function SeasonSparkles(props: {
  delayMs: number
  colors?: string[]
  isContained?: boolean
}) {
  return SPARKLES.map((sparkle, i) => {
    const left = props.isContained
      ? containWithinCard(sparkle.left)
      : sparkle.left
    const top = props.isContained
      ? containWithinCard(sparkle.top)
      : sparkle.top
    return (
      <span
        key={i}
        className="season-wonder-sparkle"
        style={{
          left: `${left}%`,
          top: `${top}%`,
          width: sparkle.size,
          height: sparkle.size,
          backgroundColor: props.colors
            ? props.colors[i % props.colors.length]
            : sparkle.color,
          animationDelay: `${props.delayMs + i * SPARKLE_STAGGER_MS}ms`
        }}
      />
    )
  })
}

const BURST_SPARKLE_COUNT = 14
const BURST_COLORS = [
  "#ffffff",
  "#ffe27a",
  "#8fdcff",
  "#ff9fd4",
  "#c3a6ff",
  "#9ff2c4"
]
const BURST_REACHES = [1, 0.8, 1.15]
const BURST_SIZES = [22, 14, 18]
const BURST_STAGGER_MS = 45
// in container widths of the card, and taller than wide like the card itself
const BURST_RADIUS_X_CQW = 75
const BURST_RADIUS_Y_CQW = 95

function getBurstSparkles(angleOffset: number) {
  return Array.from({ length: BURST_SPARKLE_COUNT }, (_, i) => {
    const angle = ((i + angleOffset) / BURST_SPARKLE_COUNT) * 2 * Math.PI
    const reach = BURST_REACHES[i % BURST_REACHES.length]
    return {
      x: Math.cos(angle) * BURST_RADIUS_X_CQW * reach,
      y: Math.sin(angle) * BURST_RADIUS_Y_CQW * reach,
      size: BURST_SIZES[i % BURST_SIZES.length],
      delay: (i % 4) * BURST_STAGGER_MS
    }
  })
}

const BURST_SPARKLES = getBurstSparkles(0)
// a shiny's second, golden burst flies between the stars of the first
const GOLDEN_BURST_SPARKLES = getBurstSparkles(0.5)
const GOLDEN_SPARKLE_COLORS = ["#ffe27a", "#ffd23f", "#fff3b0"]

// stars flying out from the card's edges as a shiny or holo lands
export function SeasonSparkleBurst(props: {
  delayMs: number
  colors?: string[]
  isGolden?: boolean
}) {
  const sparkles = props.isGolden ? GOLDEN_BURST_SPARKLES : BURST_SPARKLES
  const colors = props.isGolden
    ? GOLDEN_SPARKLE_COLORS
    : (props.colors ?? BURST_COLORS)
  return sparkles.map((sparkle, i) => (
    <span
      key={i}
      className="season-sparkle-burst"
      style={
        {
          width: sparkle.size,
          height: sparkle.size,
          backgroundColor: colors[i % colors.length],
          animationDelay: `${props.delayMs + sparkle.delay}ms`,
          "--burst-x": `${sparkle.x}cqw`,
          "--burst-y": `${sparkle.y}cqw`
        } as CSSProperties
      }
    />
  ))
}
