import Phaser from "phaser"

export const AUTUMN_LEAF_COLORS = [
  0xf26b1d, 0xe83a25, 0xffb627, 0xd9531e, 0xffd23f
]
// maple outline as [angle from the stem axis in degrees, radius]: five pointed
// lobes with notches between them, pinched in at the stem
const MAPLE_LEAF_OUTLINE: Array<[number, number]> = [
  [0, 1],
  [28, 0.45],
  [55, 0.9],
  [82, 0.42],
  [110, 0.62],
  [150, 0.3],
  [180, 0.12],
  [210, 0.3],
  [250, 0.62],
  [278, 0.42],
  [305, 0.9],
  [332, 0.45]
]
const MAPLE_LEAF_LOBE_TIPS = [0, 55, 110, 250, 305]

export function drawMapleLeaf(
  effect: Phaser.GameObjects.Graphics,
  radius: number,
  color: number
) {
  const atAngle = (degrees: number, distanceFromCenter: number) => {
    const angle = Phaser.Math.DegToRad(degrees)
    return new Phaser.Math.Vector2(
      Math.cos(angle) * distanceFromCenter,
      Math.sin(angle) * distanceFromCenter
    )
  }
  const outline = MAPLE_LEAF_OUTLINE.map(([degrees, scale]) =>
    atAngle(degrees, scale * radius)
  )
  // 1px at the trail's small sizes, thicker when drawn large to be scaled down
  const lineWidth = Math.max(1, radius / 10)
  effect.fillStyle(color, 1)
  effect.fillPoints(outline, true)
  effect.lineStyle(lineWidth, 0x5a220c, 0.75)
  effect.strokePoints(outline, true)
  effect.lineStyle(lineWidth, 0x7a3410, 0.5)
  MAPLE_LEAF_LOBE_TIPS.forEach((degrees) => {
    const tip = atAngle(degrees, radius * 0.7)
    effect.lineBetween(0, 0, tip.x, tip.y)
  })
  const stemEnd = atAngle(180, radius * 0.65)
  effect.lineStyle(lineWidth * 1.5, 0x5a220c, 0.9)
  effect.lineBetween(0, 0, stemEnd.x, stemEnd.y)
}
