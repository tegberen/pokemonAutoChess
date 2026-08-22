import Phaser, { GameObjects } from "phaser"
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  CELL_HEIGHT,
  CELL_WIDTH
} from "../../../../config"
import PokemonFactory from "../../../../models/pokemon-factory"
import {
  type AbilityAnimation,
  type AbilityAnimationArgs,
  type AbilityAnimationMaker,
  type AbilityAnimationOptions,
  AnimationType,
  AttackSprite,
  AttackSpriteScale,
  HitSprite
} from "../../../../types/Animation"
import { Ability } from "../../../../types/enum/Ability"
import {
  UNISON_STARFALL_WARNING
} from "../../../../types/enum/Blessing"
import {
  Orientation,
  OrientationFlip,
  PokemonActionState,
  PokemonTint,
  SpriteType,
  Stat
} from "../../../../types/enum/Game"
import { Sweets } from "../../../../types/enum/Item"
import { Pillars, Pkm, PkmIndex } from "../../../../types/enum/Pokemon"
import { range } from "../../../../utils/array"
import { distanceE, distanceM } from "../../../../utils/distance"
import { logger } from "../../../../utils/logger"
import { angleBetween, max, min } from "../../../../utils/number"
import {
  getOrientation,
  OrientationAngle,
  OrientationArray,
  OrientationVector
} from "../../../../utils/orientation"
import { pickRandomIn, randomBetween } from "../../../../utils/random"
import { transformEntityCoordinates } from "../../pages/utils/utils"
import { DEPTH } from "../depths"
import type { DebugScene } from "../scenes/debug-scene"
import type GameScene from "../scenes/game-scene"
import PokemonSprite from "./pokemon"

/** Fixed base angle (degrees) per feather type so each stat feather has a distinct tilt */
const FeatherBaseAngles: Record<string, number> = {
  HEALTH_FEATHER: 0,
  MUSCLE_FEATHER: -30,
  RESIST_FEATHER: 30,
  GENIUS_FEATHER: -15,
  CLEVER_FEATHER: 15,
  SWIFT_FEATHER: 45,
  PRETTY_FEATHER: -45
}

export function displayHit(
  scene: GameScene | DebugScene,
  hitSpriteTypes: HitSprite | HitSprite[],
  x: number,
  y: number,
  flip: boolean
) {
  const hitSpriteType = Array.isArray(hitSpriteTypes)
    ? pickRandomIn(hitSpriteTypes)
    : hitSpriteTypes
  const frame = `${hitSpriteType}/000.png`

  if (
    !scene.textures.exists("attacks") ||
    !scene.textures.get("attacks").has(frame)
  ) {
    logger.warn(`Missing frame: ${frame} in attacks texture`)
    return null
  }

  if (!scene.anims.exists(hitSpriteType)) {
    logger.warn(`Missing animation: ${hitSpriteType}`)
    return null
  }

  const hitSprite = scene.add.sprite(
    x + (Math.random() - 0.5) * 30,
    y + (Math.random() - 0.5) * 30,
    "attacks",
    `${hitSpriteType}/000.png`
  )
  hitSprite
    .setOrigin(0.5, 0.5)
    .setDepth(DEPTH.HIT_FX_ABOVE_POKEMON)
    .setScale(...(AttackSpriteScale[hitSpriteType] ?? [1, 1]))
  hitSprite.anims.play(hitSpriteType)
  hitSprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
    hitSprite.destroy()
  })
  scene.abilitiesVfxGroup?.add(hitSprite)
}

function featherAnimation(args: AbilityAnimationArgs) {
  const { scene, positionX, positionY, flip, ability } = args

  const frame = `FEATHER_DANCE/${ability}.png`
  if (
    !scene.textures.exists("abilities") ||
    !scene.textures.get("abilities").has(frame)
  ) {
    return
  }

  const destination = transformEntityCoordinates(positionX, positionY, flip)

  // Random drift direction: feather sways left or right as it falls
  const driftDir = Math.random() < 0.5 ? -1 : 1
  const driftWidth = randomBetween(25, 45)
  const startHeight = randomBetween(100, 160)
  const baseAngle = FeatherBaseAngles[ability] ?? 0

  const startX = destination[0] + driftDir * driftWidth * 1.5
  const startY = destination[1] - startHeight

  // Mid-air waypoint: drifted to opposite side, partway down
  const midX = destination[0] - driftDir * driftWidth * 0.5
  const midY = destination[1] - startHeight * 0.45

  // Final landing position with tiny random offset
  const landX = destination[0] + randomBetween(-6, 6)
  const landY = destination[1] + randomBetween(-4, 4)

  const feather = scene.add
    .image(startX, startY, "abilities", frame)
    .setOrigin(0.5, 0.5)
    .setDepth(DEPTH.ABILITY)
    .setAlpha(0)
    .setAngle(baseAngle)

  scene.abilitiesVfxGroup?.add(feather)

  scene.tweens.chain({
    targets: feather,
    tweens: [
      {
        // Phase 1: fade in, sway one direction while falling to mid-air
        x: midX,
        y: midY,
        alpha: 1,
        angle: baseAngle + driftDir * 35,
        ease: Phaser.Math.Easing.Sine.Out,
        duration: 500
      },
      {
        // Phase 2: sway back as it reaches the ground
        x: landX,
        y: landY,
        angle: baseAngle - driftDir * 20,
        ease: Phaser.Math.Easing.Quadratic.In,
        duration: 500
      },
      {
        // Phase 3: settle - tiny rock to a flat rest, slight scale-up on impact
        angle: baseAngle - driftDir * 5,
        ease: Phaser.Math.Easing.Back.Out,
        duration: 120
      },
      {
        // Phase 4: come to full rest (flatten back from impact squish)
        angle: baseAngle,
        ease: Phaser.Math.Easing.Sine.InOut,
        duration: 180
      },
      {
        // Phase 5: linger, then slowly fade away
        alpha: 0,
        scaleX: 0.6,
        scaleY: 0.6,
        ease: Phaser.Math.Easing.Sine.In,
        duration: 600,
        delay: 400
      }
    ],
    onComplete: () => {
      feather?.destroy()
    }
  })
}

function tidalWaveAnimation(args: AbilityAnimationArgs) {
  const { scene, targetY, orientation, flip } = args
  const down = orientation === Orientation.DOWN
  const startCoords = transformEntityCoordinates(3.6, -4, flip)
  const endCoords = transformEntityCoordinates(3.6, 10, flip)
  const wave = scene.add
    .sprite(
      startCoords[0],
      startCoords[1],
      "abilities",
      `TIDAL_WAVE/00${targetY}.png` // targetY is used to store the tidal wave level
    )
    .setOrigin(0.5, 0.5)
    .setDepth(DEPTH.ABILITY_MINOR)
    .setScale(3)
    .setAlpha(0)
    .setRotation(down ? Math.PI : 0)
  scene.tweens.add({
    targets: wave,
    x: endCoords[0],
    y: endCoords[1],
    ease: "linear",
    duration: 1800,
    onComplete: () => {
      wave.destroy()
    },
    onUpdate: function (tween) {
      if (tween.progress < 0.2) {
        wave.setAlpha(tween.progress * 5)
      } else if (tween.progress > 0.8) {
        wave.setAlpha((1 - tween.progress) * 5)
      }
    }
  })
  scene.abilitiesVfxGroup?.add(wave)
}

function floodWaveAnimation(args: AbilityAnimationArgs) {
  const { scene, positionX, positionY, targetX, orientation, flip } = args
  const width = targetX || 2
  const offset = (width - 1) / 2 // centre the sprite on the strip of columns/rows
  let startCoords: number[]
  let endCoords: number[]
  if (orientation === Orientation.DOWN) {
    startCoords = transformEntityCoordinates(positionX + offset, -2, flip)
    endCoords = transformEntityCoordinates(positionX + offset, 8, flip)
  } else if (orientation === Orientation.UP) {
    startCoords = transformEntityCoordinates(positionX + offset, 8, flip)
    endCoords = transformEntityCoordinates(positionX + offset, -2, flip)
  } else if (orientation === Orientation.RIGHT) {
    startCoords = transformEntityCoordinates(-2, positionY + offset, flip)
    endCoords = transformEntityCoordinates(8, positionY + offset, flip)
  } else {
    startCoords = transformEntityCoordinates(8, positionY + offset, flip)
    endCoords = transformEntityCoordinates(-2, positionY + offset, flip)
  }
  // the sprite's crest is drawn at its top; rotate so the crest leads the
  // actual on-screen travel direction. Deriving it from the start/end pixels
  // handles every orientation correctly, including the inverted board Y axis.
  const rotation =
    Math.atan2(
      endCoords[1] - startCoords[1],
      endCoords[0] - startCoords[0]
    ) +
    Math.PI / 2
  const frame = Phaser.Math.Between(0, 2)
  const wave = scene.add
    .sprite(
      startCoords[0],
      startCoords[1],
      "abilities",
      `FLOOD_WAVE/00${frame}.png`
    )
    .setOrigin(0.5, 0.5)
    .setDepth(DEPTH.ABILITY_MINOR)
    .setScale(3) // FLOOD_WAVE sprite is already trimmed to 2 tiles wide
    .setAlpha(0)
    .setRotation(rotation)
  scene.tweens.add({
    targets: wave,
    x: endCoords[0],
    y: endCoords[1],
    ease: "linear",
    duration: 1200,
    onComplete: () => {
      wave.destroy()
    },
    onUpdate: function (tween) {
      if (tween.progress < 0.2) {
        wave.setAlpha(tween.progress * 5)
      } else if (tween.progress > 0.8) {
        wave.setAlpha((1 - tween.progress) * 5)
      }
    }
  })
  scene.abilitiesVfxGroup?.add(wave)
}

const UNOWNS_PER_ABILITY = new Map([
  [
    Ability.HIDDEN_POWER_A,
    [Pkm.UNOWN_A, Pkm.UNOWN_B, Pkm.UNOWN_R, Pkm.UNOWN_A]
  ],
  [
    Ability.HIDDEN_POWER_B,
    [Pkm.UNOWN_B, Pkm.UNOWN_U, Pkm.UNOWN_R, Pkm.UNOWN_N]
  ],
  [
    Ability.HIDDEN_POWER_C,
    [Pkm.UNOWN_C, Pkm.UNOWN_O, Pkm.UNOWN_I, Pkm.UNOWN_N]
  ],
  [
    Ability.HIDDEN_POWER_D,
    [Pkm.UNOWN_D, Pkm.UNOWN_I, Pkm.UNOWN_T, Pkm.UNOWN_O]
  ],
  [
    Ability.HIDDEN_POWER_E,
    [Pkm.UNOWN_E, Pkm.UNOWN_G, Pkm.UNOWN_G, Pkm.UNOWN_S]
  ],
  [
    Ability.HIDDEN_POWER_F,
    [Pkm.UNOWN_F, Pkm.UNOWN_I, Pkm.UNOWN_S, Pkm.UNOWN_H]
  ],
  [
    Ability.HIDDEN_POWER_G,
    [Pkm.UNOWN_G, Pkm.UNOWN_O, Pkm.UNOWN_L, Pkm.UNOWN_D]
  ],
  [
    Ability.HIDDEN_POWER_H,
    [Pkm.UNOWN_H, Pkm.UNOWN_E, Pkm.UNOWN_A, Pkm.UNOWN_L]
  ],
  [
    Ability.HIDDEN_POWER_I,
    [Pkm.UNOWN_I, Pkm.UNOWN_T, Pkm.UNOWN_E, Pkm.UNOWN_M]
  ],
  [
    Ability.HIDDEN_POWER_J,
    [Pkm.UNOWN_J, Pkm.UNOWN_A, Pkm.UNOWN_W, Pkm.UNOWN_S]
  ],
  [
    Ability.HIDDEN_POWER_K,
    [Pkm.UNOWN_K, Pkm.UNOWN_I, Pkm.UNOWN_C, Pkm.UNOWN_K]
  ],
  [
    Ability.HIDDEN_POWER_L,
    [Pkm.UNOWN_L, Pkm.UNOWN_O, Pkm.UNOWN_C, Pkm.UNOWN_K]
  ],
  [
    Ability.HIDDEN_POWER_M,
    [Pkm.UNOWN_M, Pkm.UNOWN_A, Pkm.UNOWN_N, Pkm.UNOWN_A]
  ],
  [
    Ability.HIDDEN_POWER_N,
    [Pkm.UNOWN_N, Pkm.UNOWN_U, Pkm.UNOWN_K, Pkm.UNOWN_E]
  ],
  [
    Ability.HIDDEN_POWER_O,
    [Pkm.UNOWN_O, Pkm.UNOWN_V, Pkm.UNOWN_E, Pkm.UNOWN_N]
  ],
  [
    Ability.HIDDEN_POWER_P,
    [Pkm.UNOWN_P, Pkm.UNOWN_E, Pkm.UNOWN_S, Pkm.UNOWN_T]
  ],
  [
    Ability.HIDDEN_POWER_Q,
    [Pkm.UNOWN_Q, Pkm.UNOWN_U, Pkm.UNOWN_I, Pkm.UNOWN_T]
  ],
  [
    Ability.HIDDEN_POWER_R,
    [Pkm.UNOWN_R, Pkm.UNOWN_O, Pkm.UNOWN_L, Pkm.UNOWN_L]
  ],
  [
    Ability.HIDDEN_POWER_S,
    [Pkm.UNOWN_S, Pkm.UNOWN_U, Pkm.UNOWN_R, Pkm.UNOWN_F]
  ],
  [
    Ability.HIDDEN_POWER_T,
    [Pkm.UNOWN_T, Pkm.UNOWN_R, Pkm.UNOWN_E, Pkm.UNOWN_E]
  ],
  [
    Ability.HIDDEN_POWER_U,
    [Pkm.UNOWN_U, Pkm.UNOWN_X, Pkm.UNOWN_I, Pkm.UNOWN_E]
  ],
  [
    Ability.HIDDEN_POWER_V,
    [Pkm.UNOWN_V, Pkm.UNOWN_O, Pkm.UNOWN_L, Pkm.UNOWN_T]
  ],
  [
    Ability.HIDDEN_POWER_W,
    [Pkm.UNOWN_W, Pkm.UNOWN_I, Pkm.UNOWN_S, Pkm.UNOWN_H]
  ],
  [
    Ability.HIDDEN_POWER_X,
    [Pkm.UNOWN_X, Pkm.UNOWN_R, Pkm.UNOWN_A, Pkm.UNOWN_Y]
  ],
  [
    Ability.HIDDEN_POWER_Y,
    [Pkm.UNOWN_Y, Pkm.UNOWN_O, Pkm.UNOWN_G, Pkm.UNOWN_A]
  ],
  [
    Ability.HIDDEN_POWER_Z,
    [Pkm.UNOWN_Z, Pkm.UNOWN_E, Pkm.UNOWN_R, Pkm.UNOWN_O]
  ],
  [
    Ability.HIDDEN_POWER_EM,
    [
      Pkm.UNOWN_EXCLAMATION,
      Pkm.UNOWN_EXCLAMATION,
      Pkm.UNOWN_EXCLAMATION,
      Pkm.UNOWN_EXCLAMATION
    ]
  ],
  [
    Ability.HIDDEN_POWER_QM,
    [
      Pkm.UNOWN_QUESTION,
      Pkm.UNOWN_QUESTION,
      Pkm.UNOWN_QUESTION,
      Pkm.UNOWN_QUESTION
    ]
  ]
])

export function hiddenPowerAnimation(args: AbilityAnimationArgs) {
  const { scene, ability, positionX, positionY, flip } = args
  const [x, y] = transformEntityCoordinates(positionX, positionY, flip)
  const unownsGroup = scene.add.group()
  const letters = UNOWNS_PER_ABILITY.get(ability as Ability)
  for (let n = 0; n < 8; n++) {
    letters?.forEach((letter, i) => {
      const unown = new PokemonSprite(
        scene,
        x,
        y,
        PokemonFactory.createPokemonFromName(letter),
        "unown",
        false,
        flip
      )
      unown.draggable = false
      unownsGroup.add(unown)
      scene.animationManager?.animatePokemon(
        unown,
        PokemonActionState.IDLE,
        flip
      )
    })
  }

  const circle = new Phaser.Geom.Circle(x, y, 10)
  Phaser.Actions.PlaceOnCircle(unownsGroup.getChildren(), circle)

  scene.tweens.add({
    targets: circle,
    radius: 500,
    ease: Phaser.Math.Easing.Quartic.Out,
    duration: 2500,
    onUpdate: function (tween) {
      Phaser.Actions.RotateAroundDistance(
        unownsGroup.getChildren(),
        { x, y },
        -0.02 * (1 - tween.progress),
        circle.radius
      )
      if (tween.progress > 0.8) {
        unownsGroup.setAlpha((1 - tween.progress) * 5)
      }
    },
    onComplete() {
      unownsGroup.destroy(true, true)
    }
  })
}

const GRAND_IGNITION_MAGIC_TINT = 0xff8a2b
const GRAND_IGNITION_ARC_BLOOM = 0xd93b0a
const GRAND_IGNITION_ARC_TINT = 0xff9a2b
const GRAND_IGNITION_ARC_CORE = 0xffe9a8
const GRAND_IGNITION_SMOKE_TINT = 0x726154
const VFX_PIXEL = 3

type PixelLayer = { grid: number; size: number; color: number; alpha: number }

function samplePolyline(
  points: { x: number; y: number }[],
  step: number
): { x: number; y: number }[] {
  const sampled: { x: number; y: number }[] = []
  for (let index = 1; index < points.length; index++) {
    const [from, to] = [points[index - 1], points[index]]
    const steps = Math.max(
      1,
      Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / step)
    )
    for (let s = 0; s < steps; s++) {
      const t = s / steps
      sampled.push({
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t
      })
    }
  }
  sampled.push(points[points.length - 1])
  return sampled
}

function drawPixelPath(
  graphics: Phaser.GameObjects.Graphics,
  points: { x: number; y: number }[],
  layers: PixelLayer[]
) {
  layers.forEach(({ grid, size, color, alpha }) => {
    const cells = new Map<string, { x: number; y: number }>()
    samplePolyline(points, grid / 2).forEach(({ x, y }) => {
      const snapped = {
        x: Math.round(x / grid) * grid,
        y: Math.round(y / grid) * grid
      }
      cells.set(`${snapped.x},${snapped.y}`, snapped)
    })
    graphics.fillStyle(color, alpha)
    cells.forEach(({ x, y }) =>
      graphics.fillRect(x - size / 2, y - size / 2, size, size)
    )
  })
}

function ringPoints(radius: number) {
  const STEPS = Math.max(32, Math.round(radius))
  return Array.from({ length: STEPS + 1 }, (_, step) => {
    const angle = (step / STEPS) * Math.PI * 2
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
  })
}
/* MAGNETOSPHERE has no sprite, so the field is drawn: shockwave rings on the
   board plane, iron filings streaming along the field, and dipole arcs bowing
   the way the force pulls. Blue north pole draws in, red south pole throws out */
/* every magnet raises its own field. Kept compact so several can overlap, but
   saturated: this is a capstone blessing and it should land like one */
// the field is drawn to cover the tiles it actually reaches, one STEEL tier each
const MAGNETOSPHERE_RADIUS_PER_RANGE = 52
const MAGNETOSPHERE_FIELD_DURATION = 1100
const MAGNETOSPHERE_RINGS = 3
const MAGNETOSPHERE_FILINGS = 10
const MAGNETOSPHERE_ARCS = 6
const MAGNETOSPHERE_FLASH_DURATION = 420
const MAGNETOSPHERE_ATTRACT_CORE = 0xdafcff
const MAGNETOSPHERE_ATTRACT_TINT = 0x3aa5ff
const MAGNETOSPHERE_REPEL_CORE = 0xffc46b
const MAGNETOSPHERE_REPEL_TINT = 0xf03a10
/* blue reads far darker than orange at the same alpha under ADD blending, so
   the attracting half is pushed harder to land with equal weight */
const MAGNETOSPHERE_ATTRACT_INTENSITY = 1.4

const UNISON_NOVA_WHITE = 0xfffdf0
const UNISON_NOVA_GOLD = 0xffb03c
const UNISON_NOVA_DEEP = 0xff5a1e
const UNISON_CONSTELLATION_RAYS = 20
const UNISON_IMPACT_SHARDS = 10

function unisonBeamAnimation(): AbilityAnimation {
  return ({
    scene,
    positionX,
    positionY,
    targetX,
    targetY,
    flip
  }: AbilityAnimationArgs) => {
    const [fromX, fromY] = transformEntityCoordinates(positionX, positionY, flip)
    const [toX, toY] = transformEntityCoordinates(targetX, targetY, flip)
    const runner = scene.add
      .graphics()
      .setDepth(DEPTH.ABILITY_GROUND_LEVEL)
      .setBlendMode(Phaser.BlendModes.ADD)
    scene.abilitiesVfxGroup?.add(runner)

    const TAIL = 24
    const head = { t: 0 }
    scene.tweens.add({
      targets: head,
      t: 1,
      duration: 1300,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        runner.clear()
        const travel = Math.min(1, head.t * 2)
        const constellationFade =
          head.t < 0.78 ? 1 : Math.max(0, (1 - head.t) / 0.22)
        drawPixelPath(
          runner,
          [
            { x: fromX, y: fromY },
            {
              x: fromX + (toX - fromX) * travel,
              y: fromY + (toY - fromY) * travel
            }
          ],
          [
            {
              grid: 8,
              size: 9,
              color: UNISON_NOVA_DEEP,
              alpha: constellationFade * 0.25
            },
            {
              grid: 4,
              size: 4,
              color: UNISON_NOVA_GOLD,
              alpha: constellationFade * 0.7
            }
          ]
        )
        for (let step = 0; step < TAIL; step++) {
          const t = travel - step * 0.027
          if (t < 0) continue
          const fade = 1 - step / TAIL
          const pulse = 0.8 + Math.sin(head.t * Math.PI * 8 - step * 0.4) * 0.2
          const size = VFX_PIXEL * (step === 0 ? 6 : (1.5 + fade * 3) * pulse)
          runner.fillStyle(
            step === 0
              ? UNISON_NOVA_WHITE
              : step < 5
                ? UNISON_NOVA_GOLD
                : UNISON_NOVA_DEEP,
            fade * constellationFade
          )
          runner.fillRect(
            fromX + (toX - fromX) * t - size / 2,
            fromY + (toY - fromY) * t - size / 2,
            size,
            size
          )
        }
      },
      onComplete: () => runner.destroy()
    })
  }
}

function unisonNovaAnimation(): AbilityAnimation {
  return ({ scene, positionX, positionY, flip, ap }: AbilityAnimationArgs) => {
    const [centerX, centerY] = transformEntityCoordinates(
      positionX,
      positionY,
      flip
    )
    const allies = Math.max(1, ap)
    const radius = 72 + allies * 11
    const constellation = scene.add
      .graphics({ x: centerX, y: centerY - 86 })
      .setDepth(DEPTH.ABILITY)
      .setBlendMode(Phaser.BlendModes.ADD)
    scene.abilitiesVfxGroup?.add(constellation)
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 700,
      ease: "Cubic.easeInOut",
      onUpdate: (tween) => {
        const progress = (tween.getValue() ?? 0) as number
        const size = radius * Math.min(1, progress * 1.6)
        const fade = progress < 0.72 ? 1 : (1 - progress) / 0.28
        const points = Array.from({ length: 10 }, (_, index) => {
          const angle = -Math.PI / 2 + index * (Math.PI / 5)
          const pointRadius = index % 2 === 0 ? size : size * 0.4
          return {
            x: Math.cos(angle) * pointRadius,
            y: Math.sin(angle) * pointRadius
          }
        })
        points.push(points[0])
        constellation.clear()
        drawPixelPath(constellation, points, [
          { grid: 10, size: 12, color: UNISON_NOVA_DEEP, alpha: fade * 0.3 },
          { grid: 5, size: 6, color: UNISON_NOVA_GOLD, alpha: fade * 0.8 },
          { grid: 3, size: 3, color: UNISON_NOVA_WHITE, alpha: fade }
        ])
        drawPixelPath(constellation, ringPoints(size * 0.62), [
          { grid: 7, size: 7, color: UNISON_NOVA_GOLD, alpha: fade * 0.5 },
          { grid: 3, size: 3, color: UNISON_NOVA_WHITE, alpha: fade * 0.75 }
        ])
        const rayGrowth = Math.max(0, (progress - 0.35) / 0.65)
        for (let ray = 0; ray < UNISON_CONSTELLATION_RAYS; ray++) {
          const angle = (ray / UNISON_CONSTELLATION_RAYS) * Math.PI * 2
          const alternatingLength = ray % 2 === 0 ? 1 : 0.58
          const inner = size * 0.74
          const outer =
            inner + (34 + allies * 4) * rayGrowth * alternatingLength
          drawPixelPath(
            constellation,
            [
              { x: Math.cos(angle) * inner, y: Math.sin(angle) * inner },
              { x: Math.cos(angle) * outer, y: Math.sin(angle) * outer }
            ],
            [
              {
                grid: 7,
                size: 8,
                color: UNISON_NOVA_GOLD,
                alpha: fade * 0.55
              },
              {
                grid: 3,
                size: 4,
                color: UNISON_NOVA_WHITE,
                alpha: fade
              }
            ]
          )
        }
        points.slice(0, -1).forEach((point, index) => {
          if (index % 2 !== 0) return
          constellation.fillStyle(UNISON_NOVA_GOLD, fade * 0.55)
          constellation.fillCircle(point.x, point.y, 10 + allies * 0.5)
          constellation.fillStyle(UNISON_NOVA_WHITE, fade)
          constellation.fillCircle(point.x, point.y, 4 + allies * 0.25)
        })
        constellation.fillStyle(UNISON_NOVA_WHITE, fade)
        constellation.fillCircle(0, 0, 8 + allies)
      },
      onComplete: () => {
        constellation.destroy()
        const flash = scene.add
          .rectangle(
            centerX,
            centerY,
            CELL_WIDTH * (BOARD_WIDTH + 2),
            CELL_HEIGHT * (BOARD_HEIGHT + 2),
            UNISON_NOVA_GOLD,
            0.28
          )
          .setDepth(DEPTH.BOARD_EFFECT_AIR_LEVEL)
          .setBlendMode(Phaser.BlendModes.ADD)
        scene.abilitiesVfxGroup?.add(flash)
        scene.tweens.add({
          targets: flash,
          alpha: 0,
          duration: 420,
          ease: "Cubic.easeOut",
          onComplete: () => flash.destroy()
        })
        scene.shakeCamera({ duration: 360, intensity: 0.006 })
      }
    })
  }
}

function sandTombAnimation(): AbilityAnimation {
  return ({
    scene,
    pokemonsOnBoard,
    positionX,
    positionY,
    flip
  }: AbilityAnimationArgs) => {
    const [cx, cy] = transformEntityCoordinates(positionX, positionY, flip)
    const casterSprite = pokemonsOnBoard.find(
      (pokemon) =>
        pokemon.positionX === positionX && pokemon.positionY === positionY
    )
    // Slightly overscan the gameplay radius so every affected edge cell is
    // visibly inside the quicksand after board/camera projection.
    const maxRadius = CELL_WIDTH * 5
    const pixel = VFX_PIXEL
    const verticalScale = 0.65
    const sandStops = [0x3a302d, 0x665044, 0x9a7042, 0xc99755, 0xe0b96f]
    const mixColor = (from: number, to: number, amount: number) => {
      const channel = (shift: number) =>
        Math.round(
          ((from >> shift) & 0xff) * (1 - amount) +
            ((to >> shift) & 0xff) * amount
        )
      return (channel(16) << 16) | (channel(8) << 8) | channel(0)
    }
    const sandGradient = Array.from({ length: 25 }, (_, index) => {
      const position = index / 24 * (sandStops.length - 1)
      const stop = Math.min(sandStops.length - 2, Math.floor(position))
      return mixColor(sandStops[stop], sandStops[stop + 1], position - stop)
    })
    const dormantGradient = sandGradient.map((color) =>
      mixColor(0x817466, color, 0.22)
    )
    const sandCells = Array.from({ length: 97 * 97 }, (_, index) => {
      const x = index % 97 - 48
      const y = Math.floor(index / 97) - 48
      const nx = x / 48
      const ny = y / 48
      return {
        x: nx,
        y: ny,
        radius: Math.hypot(nx, ny),
        angle: Math.atan2(ny, nx),
        noise: Math.sin(x * 12.9898 + y * 78.233) * 0.5 + 0.5
      }
    }).filter((cell) => cell.radius <= 1)
    const grains = Array.from({ length: 96 }, (_, i) => ({
      angle: (i / 96) * Math.PI * 2 + Math.random() * 0.18,
      radius: 0.16 + Math.random() * 0.84,
      drift: 0.65 + Math.random() * 0.5,
      size: randomBetween(1, 2) * pixel,
      lift: randomBetween(0, 10) * pixel,
      shade: i % 5
    }))
    const ground = scene.add.graphics().setDepth(DEPTH.ABILITY_GROUND_LEVEL)
    const storm = scene.add.graphics().setDepth(DEPTH.ABILITY)
    scene.abilitiesVfxGroup?.add(ground)
    scene.abilitiesVfxGroup?.add(storm)
    let lastFrame = -1
    let cancellationStart: number | undefined

    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 5000,
      ease: "Linear",
      onUpdate: (tween) => {
        const p = (tween.getValue() ?? 0) as number
        if (
          casterSprite &&
          cancellationStart === undefined &&
          (!casterSprite.active || casterSprite.alpha < 0.99)
        ) {
          cancellationStart = p
        }
        const cancellationFade =
          cancellationStart === undefined
            ? 1
            : Math.max(0, 1 - (p - cancellationStart) / 0.08)
        // PMD effects update in visible animation steps instead of gliding.
        const frame = Math.floor(p * 5000 / 90)
        if (frame === lastFrame) return
        lastFrame = frame
        const steppedTime = frame * 0.09
        const summon = 1
        const materializeProgress = Math.min(1, p / 0.18)
        const materialize =
          materializeProgress * materializeProgress *
          (3 - 2 * materializeProgress)
        const collapse = p < 0.86 ? 1 : Math.max(0, (1 - p) / 0.14)
        const radius = maxRadius * summon * collapse
        const rotation = steppedTime * 1.55
        const alpha =
          Math.min(0.08 + materialize * 0.92, Math.max(0, collapse * 1.8)) *
          cancellationFade
        ground.clear()
        storm.clear()
        if (cancellationFade <= 0) return

        // A continuous quicksand funnel: pale and raised at the perimeter,
        // progressively darker and lower toward one recessed opening.
        const cellSize = Math.max(pixel, pixel * 2.7 * summon * collapse)
        sandCells.forEach((cell) => {
          const spiral = Math.sin(
            cell.angle * 1.8 + cell.radius * 10 - rotation * 0.5
          )
          const pitDepth = Math.max(0, (0.72 - cell.radius) / 0.62)
          const shadePosition = Math.max(
            0,
            Math.min(
              1,
              cell.radius * 0.86 +
                spiral * 0.055 +
                (cell.noise - 0.5) * 0.035 -
                pitDepth * 0.12
            )
          )
          const edgeFade = Math.max(
            0,
            Math.min(1, (1.04 - cell.radius + (cell.noise - 0.5) * 0.12) / 0.22)
          )
          const shadeIndex = Math.round(
            shadePosition * (sandGradient.length - 1)
          )
          ground.fillStyle(
            mixColor(
              dormantGradient[shadeIndex],
              sandGradient[shadeIndex],
              materialize
            ),
            alpha * edgeFade * (0.3 + pitDepth * 0.18 + Math.abs(spiral) * 0.08 + cell.noise * 0.04)
          )
          ground.fillRect(
            Math.round((cx + cell.x * radius) / pixel) * pixel - cellSize / 2,
            Math.round((cy + 12 + cell.y * radius * verticalScale + pitDepth * pitDepth * 38) / pixel) * pixel - cellSize / 4,
            cellSize,
            cellSize * 0.55
          )
        })

        // Closely packed spiral contours make the full pool visibly whirl.
        // Each contour advances outward during its turn, so none reads as a
        // separate closed ring or a large isolated noodle.
        for (let band = 0; band < 7; band++) {
          const points = Array.from({ length: 73 }, (_, step) => {
            const turn = step / 72
            const angle = turn * Math.PI * 2 * 1.25 + rotation * 0.5
            const normalizedRadius = 0.06 + (band + turn * 2.2) / 9.2 * 0.9
            const ripple = Math.sin(angle * 3 + band * 0.9) * pixel * 0.7
            const bandRadius = radius * normalizedRadius + ripple
            const depth = Math.max(0, (0.68 - normalizedRadius) / 0.58)
            return {
              x: cx + Math.cos(angle) * bandRadius,
              y: cy + 12 + Math.sin(angle) * bandRadius * verticalScale + depth * depth * 32
            }
          })
          const bandFade = Math.min(1, (7 - band) / 2.5)
          drawPixelPath(ground, points, [
            { grid: pixel * 2, size: pixel * 2, color: 0x65482f, alpha: 0.24 * alpha * bandFade },
            { grid: pixel, size: pixel, color: band % 3 === 0 ? 0xe4bd76 : 0xb5834d, alpha: 0.4 * alpha * bandFade }
          ])
        }

        sandCells
          .filter((cell) => cell.radius < 0.135)
          .forEach((cell) => {
            ground.fillStyle(
              cell.radius < 0.07 ? 0x242326 : 0x403735,
              0.86 * alpha
            )
            ground.fillRect(
              cx + cell.x * radius - cellSize * 0.7,
              cy + 39 + cell.y * radius * verticalScale - cellSize * 0.4,
              cellSize * 1.4,
              cellSize * 0.8
            )
          })

        grains.forEach((grain, i) => {
          const flow = (grain.radius - steppedTime * 0.085 * grain.drift + 1) % 1
          const r = radius * (0.07 + flow * 0.93)
          const angle = grain.angle + rotation * grain.drift + (1 - flow) * 2.4
          const x = Math.round((cx + Math.cos(angle) * r) / pixel) * pixel
          const y = Math.round((cy + 12 + Math.sin(angle) * r * verticalScale + (1 - flow) * pixel * 5 - grain.lift * flow * 0.25) / pixel) * pixel
          const colors = [0x5d493d, 0x826142, 0xa87a45, 0xc99855, 0xe3ba70]
          storm.fillStyle(colors[grain.shade], alpha * (0.52 + grain.shade * 0.08))
          const sinkingSize = Math.max(pixel, grain.size * (0.35 + flow * 0.65))
          storm.fillRect(x - sinkingSize / 2, y - sinkingSize / 2, sinkingSize, sinkingSize)
          if (i % 7 === frame % 7) {
            storm.fillStyle(0xe6bd73, alpha * 0.45)
            storm.fillRect(x + pixel, y - pixel * 2, pixel, pixel)
          }
        })

      },
      onComplete: () => {
        ground.destroy()
        storm.destroy()
      }
    })
  }
}

function unisonStarfallAnimation(): AbilityAnimation {
  return ({ scene, positionX, positionY, flip }: AbilityAnimationArgs) => {
    const [x, y] = transformEntityCoordinates(positionX, positionY, flip)
    const warning = scene.add
      .graphics({ x, y })
      .setDepth(DEPTH.ABILITY)
      .setBlendMode(Phaser.BlendModes.ADD)
    scene.abilitiesVfxGroup?.add(warning)
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: UNISON_STARFALL_WARNING,
      ease: "Quint.easeIn",
      onUpdate: (tween) => {
        const progress = (tween.getValue() ?? 0) as number
        const starY = -300 + progress * 300
        warning.clear()
        warning.fillStyle(UNISON_NOVA_GOLD, 0.3 + progress * 0.5)
        warning.fillRect(-3, -300, 6, 300)
        warning.fillStyle(UNISON_NOVA_WHITE, 1)
        warning.fillTriangle(0, starY - 15, 8, starY, 0, starY + 15)
        warning.fillTriangle(0, starY - 15, -8, starY, 0, starY + 15)
        drawPixelPath(warning, ringPoints(58 - progress * 38), [
          { grid: 5, size: 5, color: UNISON_NOVA_WHITE, alpha: progress }
        ])
      },
      onComplete: () => warning.destroy()
    })

    const light = scene.add
      .graphics({ x, y })
      .setDepth(DEPTH.ABILITY)
      .setBlendMode(Phaser.BlendModes.ADD)
    scene.abilitiesVfxGroup?.add(light)
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 720,
      delay: UNISON_STARFALL_WARNING,
      ease: "Quint.easeOut",
      onUpdate: (tween) => {
        const progress = (tween.getValue() ?? 0) as number
        const fade = 1 - progress
        const width = 18 + progress * 58
        light.clear()
        light.fillStyle(UNISON_NOVA_DEEP, fade * 0.22)
        light.fillTriangle(-width * 1.8, 22, width * 1.8, 22, 0, -420)
        light.fillStyle(UNISON_NOVA_GOLD, fade * 0.55)
        light.fillTriangle(-width, 16, width, 16, 0, -420)
        light.fillStyle(UNISON_NOVA_WHITE, fade)
        light.fillRect(-width * 0.24, -420, width * 0.48, 430)
        drawPixelPath(light, ringPoints(progress * 105), [
          { grid: 8, size: 10, color: UNISON_NOVA_GOLD, alpha: fade * 0.8 },
          { grid: 4, size: 5, color: UNISON_NOVA_WHITE, alpha: fade }
        ])
        for (let shard = 0; shard < UNISON_IMPACT_SHARDS; shard++) {
          const angle =
            (shard / UNISON_IMPACT_SHARDS) * Math.PI * 2 + Math.PI / 10
          const inner = progress * 52
          const outer = inner + 48 * fade
          drawPixelPath(
            light,
            [
              { x: Math.cos(angle) * inner, y: Math.sin(angle) * inner },
              { x: Math.cos(angle) * outer, y: Math.sin(angle) * outer }
            ],
            [
              {
                grid: 6,
                size: 7,
                color: UNISON_NOVA_GOLD,
                alpha: fade * 0.75
              },
              {
                grid: 3,
                size: 4,
                color: UNISON_NOVA_WHITE,
                alpha: fade
              }
            ]
          )
        }
      },
      onComplete: () => light.destroy()
    })
  }
}

function boardPlaneGraphics(
  scene: GameScene | DebugScene,
  centerX: number,
  centerY: number
) {
  const graphics = scene.add
    .graphics({ x: centerX, y: centerY })
    .setDepth(DEPTH.ABILITY_GROUND_LEVEL)
    .setBlendMode(Phaser.BlendModes.ADD)
  graphics.setScale(1, BOARD_PLANE_FLATTEN)
  scene.abilitiesVfxGroup?.add(graphics)
  return graphics
}

/* the shockwave: rings collapsing inwards or blasting outwards, staggered so
   the field reads as several pulses rather than one line */
function magnetosphereRings(
  scene: GameScene | DebugScene,
  centerX: number,
  centerY: number,
  attracting: boolean,
  core: number,
  tint: number,
  fieldRadius: number
) {
  for (let ring = 0; ring < MAGNETOSPHERE_RINGS; ring++) {
    const graphics = boardPlaneGraphics(scene, centerX, centerY)
    scene.tweens.addCounter({
      from: attracting ? 1 : 0,
      to: attracting ? 0 : 1,
      duration: MAGNETOSPHERE_FIELD_DURATION,
      delay: ring * 140,
      ease: attracting ? "Cubic.easeIn" : "Cubic.easeOut",
      onUpdate: (tween) => {
        const progress = (tween.getValue() ?? 0) as number
        /* attracting tightens as it closes, so it is dim while wide and at its
           brightest the instant it snaps shut */
        const fade = attracting
          ? (0.4 + (1 - progress) * 0.6) * MAGNETOSPHERE_ATTRACT_INTENSITY
          : 1 - progress
        const radius = progress * fieldRadius
        graphics.clear()
        drawPixelPath(graphics, ringPoints(radius), [
          { grid: 8, size: 8, color: tint, alpha: fade * 0.3 },
          { grid: 4, size: 4, color: core, alpha: fade * 0.8 }
        ])
      },
      onComplete: () => graphics.destroy()
    })
  }
}

/* iron filings: pixel comets riding the field in or out, each with a tail */
function magnetosphereFilings(
  scene: GameScene | DebugScene,
  centerX: number,
  centerY: number,
  attracting: boolean,
  core: number,
  tint: number,
  count: number,
  fieldRadius: number
) {
  const TAIL = 7
  for (let filing = 0; filing < count; filing++) {
    const angle =
      (filing / count) * Math.PI * 2 + randomBetween(-20, 20) / 100
    const runner = scene.add
      .graphics()
      .setDepth(DEPTH.ABILITY_GROUND_LEVEL)
      .setBlendMode(Phaser.BlendModes.ADD)
    scene.abilitiesVfxGroup?.add(runner)
    const head = { t: 0 }
    scene.tweens.add({
      targets: head,
      t: 1,
      duration: MAGNETOSPHERE_FIELD_DURATION,
      delay: randomBetween(0, 220),
      ease: attracting ? "Cubic.easeIn" : "Cubic.easeOut",
      onUpdate: () => {
        runner.clear()
        for (let step = 0; step < TAIL; step++) {
          const t = head.t - step * 0.045
          if (t < 0) continue
          const radius = (attracting ? 1 - t : t) * fieldRadius
          const size = VFX_PIXEL * (step === 0 ? 2 : 1.1)
          runner.fillStyle(
            step === 0 ? core : tint,
            (1 - step / TAIL) *
              0.75 *
              (attracting ? MAGNETOSPHERE_ATTRACT_INTENSITY : 1)
          )
          runner.fillRect(
            centerX + Math.cos(angle) * radius - size / 2,
            centerY +
              Math.sin(angle) * radius * BOARD_PLANE_FLATTEN -
              size / 2,
            size,
            size
          )
        }
      },
      onComplete: () => runner.destroy()
    })
  }
}

/* dipole arcs, bowed towards the magnet when attracting and away when
   repelling, so the direction of the force is legible without the motion */
function magnetosphereArcs(
  scene: GameScene | DebugScene,
  centerX: number,
  centerY: number,
  attracting: boolean,
  core: number,
  fieldRadius: number
) {
  const graphics = boardPlaneGraphics(scene, centerX, centerY)
  scene.tweens.addCounter({
    from: 0,
    to: 1,
    duration: MAGNETOSPHERE_FIELD_DURATION,
    ease: "Sine.easeInOut",
    onUpdate: (tween) => {
      const progress = (tween.getValue() ?? 0) as number
      const spread = attracting ? 1 - progress : progress
      const arcAlpha =
        Math.sin(progress * Math.PI) *
        0.45 *
        (attracting ? MAGNETOSPHERE_ATTRACT_INTENSITY : 1)
      graphics.clear()
      for (let arc = 0; arc < MAGNETOSPHERE_ARCS; arc++) {
        const angle = (arc / MAGNETOSPHERE_ARCS) * Math.PI * 2
        const points = Array.from({ length: 13 }, (_, step) => {
          const along = step / 12
          const radius = along * fieldRadius * spread
          // bow sideways in the middle, the classic field line shape
          const bow = Math.sin(along * Math.PI) * 40 * (attracting ? -1 : 1)
          return {
            x: Math.cos(angle) * radius - Math.sin(angle) * bow,
            y: Math.sin(angle) * radius + Math.cos(angle) * bow
          }
        })
        drawPixelPath(graphics, points, [
          { grid: 4, size: 4, color: core, alpha: arcAlpha }
        ])
      }
    },
    onComplete: () => graphics.destroy()
  })
}

/* the payoff beat: repelling detonates at the magnet as the blast leaves,
   attracting slams shut once the field has finished dragging everything in */
function magnetosphereCoreFlash(
  scene: GameScene | DebugScene,
  centerX: number,
  centerY: number,
  attracting: boolean,
  core: number,
  tint: number
) {
  const graphics = boardPlaneGraphics(scene, centerX, centerY)
  scene.tweens.addCounter({
    from: 0,
    to: 1,
    duration: MAGNETOSPHERE_FLASH_DURATION,
    delay: attracting
      ? MAGNETOSPHERE_FIELD_DURATION - MAGNETOSPHERE_FLASH_DURATION
      : 0,
    ease: "Cubic.easeOut",
    onUpdate: (tween) => {
      const progress = (tween.getValue() ?? 0) as number
      graphics.clear()
      const punch = attracting ? MAGNETOSPHERE_ATTRACT_INTENSITY : 1
      drawPixelPath(graphics, ringPoints(12 + progress * 52), [
        { grid: 6, size: 9, color: tint, alpha: (1 - progress) * 0.6 * punch },
        { grid: 3, size: 5, color: core, alpha: (1 - progress) * punch }
      ])
    },
    onComplete: () => graphics.destroy()
  })
}

function magnetosphereFieldAnimation(attracting: boolean): AbilityAnimation {
  // ap carries the reach in tiles, so the field is as wide as it actually pulls
  return ({ scene, positionX, positionY, flip, ap }: AbilityAnimationArgs) => {
    const [centerX, centerY] = transformEntityCoordinates(
      positionX,
      positionY,
      flip
    )
    const fieldRadius = Math.max(1, ap) * MAGNETOSPHERE_RADIUS_PER_RANGE
    const core = attracting
      ? MAGNETOSPHERE_ATTRACT_CORE
      : MAGNETOSPHERE_REPEL_CORE
    const tint = attracting
      ? MAGNETOSPHERE_ATTRACT_TINT
      : MAGNETOSPHERE_REPEL_TINT
    magnetosphereArcs(scene, centerX, centerY, attracting, core, fieldRadius)
    magnetosphereRings(
      scene,
      centerX,
      centerY,
      attracting,
      core,
      tint,
      fieldRadius
    )
    magnetosphereFilings(
      scene,
      centerX,
      centerY,
      attracting,
      core,
      tint,
      MAGNETOSPHERE_FILINGS,
      fieldRadius
    )
    magnetosphereCoreFlash(scene, centerX, centerY, attracting, core, tint)
  }
}

const BOARD_PLANE_FLATTEN = 0.55
const GRAND_IGNITION_CORNERS: [number, number][] = [
  [0, 0],
  [BOARD_WIDTH - 1, 0],
  [0, BOARD_HEIGHT - 1],
  [BOARD_WIDTH - 1, BOARD_HEIGHT - 1]
]

const GRAND_IGNITION_FLAME_BASE: [number, number] = [0.5, 1]
const GRAND_IGNITION_NEAR_CORNER_DROP = 26

function grandIgnitionCornerDrop(cornerPixelY: number, flip: boolean) {
  const [, centerPixelY] = transformEntityCoordinates(
    (BOARD_WIDTH - 1) / 2,
    (BOARD_HEIGHT - 1) / 2,
    flip
  )
  return cornerPixelY > centerPixelY ? GRAND_IGNITION_NEAR_CORNER_DROP : 0
}

function grandIgnitionFlame(
  scene: GameScene | DebugScene,
  x: number,
  groundY: number,
  width: number,
  height: number,
  phase: number,
  depth: number = DEPTH.ABILITY_MINOR
) {
  return addAbilitySprite(scene, "EMBER", 0, [x, groundY], {
    scale: [width, height],
    origin: GRAND_IGNITION_FLAME_BASE,
    depth,
    destroyOnComplete: false,
    animOptions: {
      repeat: -1,
      delay: phase,
      frameRate: randomBetween(11, 18)
    }
  })
}

function grandIgnitionWanderingFlame(
  scene: GameScene | DebugScene,
  x: number,
  groundY: number,
  width: number,
  height: number,
  depth: number
) {
  const flame = grandIgnitionFlame(
    scene,
    x,
    groundY,
    width,
    height,
    randomBetween(0, 500),
    depth
  )
  if (!flame) return
  scene.tweens.add({
    targets: flame,
    x: x + randomBetween(-7, 7),
    y: groundY + randomBetween(-4, 4),
    duration: randomBetween(1500, 2900),
    yoyo: true,
    repeat: -1,
    ease: Phaser.Math.Easing.Sine.InOut
  })
}

function grandIgnitionSparks(
  scene: GameScene | DebugScene,
  x: number,
  groundY: number,
  count: number,
  spread: number
) {
  for (let i = 0; i < count; i++) {
    const spark = addAbilitySprite(
      scene,
      "EMBER",
      0,
      [x + randomBetween(-spread, spread), groundY],
      {
        scale: randomBetween(3, 6) / 10,
        depth: DEPTH.ABILITY,
        destroyOnComplete: false,
        animOptions: { repeat: -1 }
      }
    )
    if (!spark) continue
    scene.tweens.add({
      targets: spark,
      y: groundY - randomBetween(140, 300),
      x: spark.x + randomBetween(-50, 50),
      alpha: 0,
      duration: randomBetween(1100, 2000),
      delay: randomBetween(0, 500),
      ease: Phaser.Math.Easing.Sine.Out,
      onComplete: () => spark.destroy()
    })
  }
}

function grandIgnitionSmoke(
  scene: GameScene | DebugScene,
  x: number,
  groundY: number,
  scale: number
) {
  const smoke = addAbilitySprite(scene, "SMOKE", 0, [x, groundY - 20], {
    scale: scale * 0.6,
    depth: DEPTH.ABILITY_MINOR,
    tint: GRAND_IGNITION_SMOKE_TINT,
    alpha: 0,
    destroyOnComplete: false,
    animOptions: { repeat: -1, frameRate: randomBetween(4, 7) }
  })
  if (!smoke) return
  scene.tweens.add({
    targets: smoke,
    alpha: { from: 0, to: 0.22 },
    duration: 900,
    delay: randomBetween(0, 1200),
    yoyo: true,
    hold: 900,
    repeat: -1,
    ease: Phaser.Math.Easing.Sine.InOut
  })
  scene.tweens.add({
    targets: smoke,
    y: groundY - randomBetween(150, 230),
    x: x + randomBetween(-90, 90),
    scaleX: scale * 1.8,
    scaleY: scale * 1.8,
    angle: randomBetween(-25, 25),
    duration: 2700,
    delay: randomBetween(0, 1200),
    repeat: -1,
    ease: Phaser.Math.Easing.Sine.Out
  })
}

function grandIgnitionBoardCenter(flip: boolean) {
  return transformEntityCoordinates(
    (BOARD_WIDTH - 1) / 2,
    (BOARD_HEIGHT - 1) / 2,
    flip
  )
}

const grandIgnitionSigilRadius = () => (CELL_WIDTH * BOARD_WIDTH) / 2

function boardGroundPlane(
  scene: GameScene | DebugScene,
  centerX: number,
  centerY: number
) {
  const plane = scene.add
    .container(centerX, centerY)
    .setDepth(DEPTH.ABILITY_GROUND_LEVEL)
    .setScale(1, BOARD_PLANE_FLATTEN)
  scene.abilitiesVfxGroup?.add(plane)
  const graphics = scene.add
    .graphics()
    .setBlendMode(Phaser.BlendModes.ADD)
    .setAlpha(0)
  plane.add(graphics)
  return graphics
}

function grandIgnitionLineRunner(
  scene: GameScene | DebugScene,
  centerX: number,
  centerY: number,
  pointAt: (t: number) => { x: number; y: number },
  duration: number
) {
  const pixel = VFX_PIXEL
  const TAIL = 7
  const runner = scene.add
    .graphics()
    .setDepth(DEPTH.ABILITY_GROUND_LEVEL)
    .setBlendMode(Phaser.BlendModes.ADD)
  scene.abilitiesVfxGroup?.add(runner)

  const head = { t: 0 }
  scene.tweens.add({
    targets: head,
    t: 1,
    duration,
    repeat: -1,
    repeatDelay: randomBetween(200, 900),
    ease: Phaser.Math.Easing.Sine.InOut,
    onUpdate: () => {
      runner.clear()
      for (let step = 0; step < TAIL; step++) {
        const t = head.t - step * 0.022
        if (t < 0) continue
        const point = pointAt(t)
        const size = pixel * (step === 0 ? 2.4 : 1.6)
        runner.fillStyle(
          step === 0 ? GRAND_IGNITION_ARC_CORE : GRAND_IGNITION_ARC_TINT,
          (1 - step / TAIL) * 0.85
        )
        runner.fillRect(
          centerX + point.x - size / 2,
          centerY + point.y * BOARD_PLANE_FLATTEN - size / 2,
          size,
          size
        )
      }
    }
  })
}

function grandIgnitionQuarterArc(
  scene: GameScene | DebugScene,
  cornerX: number,
  cornerY: number,
  flip: boolean
) {
  const [centerX, centerY] = grandIgnitionBoardCenter(flip)
  const quarter = boardGroundPlane(scene, centerX, centerY)
  const radius = grandIgnitionSigilRadius()
  const toCorner = Math.atan2(
    (cornerY - centerY) / BOARD_PLANE_FLATTEN,
    cornerX - centerX
  )
  const pixel = VFX_PIXEL
  const points = Array.from({ length: 33 }, (_, step) => {
    const angle = toCorner - Math.PI / 4 + (step / 32) * (Math.PI / 2)
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
  })
  drawPixelPath(quarter, points, [
    { grid: pixel * 4, size: pixel * 5, color: GRAND_IGNITION_ARC_BLOOM, alpha: 0.11 },
    { grid: pixel, size: pixel * 1.5, color: GRAND_IGNITION_ARC_CORE, alpha: 0.6 }
  ])

  const cornerLocal = {
    x: cornerX - centerX,
    y: (cornerY - centerY) / BOARD_PLANE_FLATTEN
  }
  const arcEdge = {
    x: Math.cos(toCorner) * radius,
    y: Math.sin(toCorner) * radius
  }
  drawPixelPath(quarter, [arcEdge, cornerLocal], [
    { grid: pixel * 4, size: pixel * 5, color: GRAND_IGNITION_ARC_BLOOM, alpha: 0.09 },
    { grid: pixel, size: pixel * 1.5, color: GRAND_IGNITION_ARC_TINT, alpha: 0.45 }
  ])

  quarter.setScale(1.18)
  scene.tweens.add({
    targets: quarter,
    alpha: 1,
    scale: 1,
    duration: 520,
    ease: Phaser.Math.Easing.Cubic.Out
  })

  grandIgnitionLineRunner(scene, centerX, centerY, (t) => {
    const angle = toCorner - Math.PI / 4 + t * (Math.PI / 2)
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
  }, 2600)
  grandIgnitionLineRunner(scene, centerX, centerY, (t) => ({
    x: cornerLocal.x + (arcEdge.x - cornerLocal.x) * t,
    y: cornerLocal.y + (arcEdge.y - cornerLocal.y) * t
  }), 1500)
}

function grandIgnitionSigil(
  scene: GameScene | DebugScene,
  centerX: number,
  centerY: number,
  radius: number
) {
  const sigil = boardGroundPlane(scene, centerX, centerY)

  const RUNNERS = 2
  for (let runner = 0; runner < RUNNERS; runner++) {
    const offset = runner / RUNNERS
    grandIgnitionLineRunner(
      scene,
      centerX,
      centerY,
      (t) => {
        const angle = (offset + t) * Math.PI * 2
        return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
      },
      5200
    )
  }

  const pixel = VFX_PIXEL
  drawPixelPath(sigil, ringPoints(radius), [
    { grid: pixel * 4, size: pixel * 5, color: GRAND_IGNITION_ARC_BLOOM, alpha: 0.11 },
    { grid: pixel, size: pixel * 1.5, color: GRAND_IGNITION_ARC_CORE, alpha: 0.65 }
  ])
  drawPixelPath(sigil, ringPoints(radius * 0.82), [
    { grid: pixel, size: pixel * 1.2, color: GRAND_IGNITION_ARC_TINT, alpha: 0.5 }
  ])
  drawPixelPath(sigil, ringPoints(radius * 0.44), [
    { grid: pixel * 3, size: pixel * 4, color: GRAND_IGNITION_ARC_BLOOM, alpha: 0.1 },
    { grid: pixel, size: pixel * 1.2, color: GRAND_IGNITION_ARC_CORE, alpha: 0.55 }
  ])

  const TICKS = 24
  for (let tick = 0; tick < TICKS; tick++) {
    const angle = (tick / TICKS) * Math.PI * 2
    const [dx, dy] = [Math.cos(angle), Math.sin(angle)]
    drawPixelPath(
      sigil,
      [
        { x: dx * radius * 0.82, y: dy * radius * 0.82 },
        { x: dx * radius, y: dy * radius }
      ],
      [{ grid: pixel, size: pixel * 1.5, color: GRAND_IGNITION_ARC_TINT, alpha: 0.55 }]
    )
  }

  const ARCS = 5
  const ARC_SWEEP = (Math.PI * 2) / ARCS / 1.7
  for (let segment = 0; segment < ARCS; segment++) {
    const start = (segment / ARCS) * Math.PI * 2
    const dash = Array.from({ length: 13 }, (_, step) => {
      const angle = start + (step / 12) * ARC_SWEEP
      return {
        x: Math.cos(angle) * radius * 0.63,
        y: Math.sin(angle) * radius * 0.63
      }
    })
    drawPixelPath(sigil, dash, [
      { grid: pixel * 3, size: pixel * 4, color: GRAND_IGNITION_ARC_BLOOM, alpha: 0.11 },
      { grid: pixel, size: pixel * 1.5, color: GRAND_IGNITION_ARC_CORE, alpha: 0.6 }
    ])
  }

  const MARKERS = 8
  for (let marker = 0; marker < MARKERS; marker++) {
    const angle = (marker / MARKERS) * Math.PI * 2 + Math.PI / MARKERS
    const [cx, cy] = [
      Math.cos(angle) * radius * 0.63,
      Math.sin(angle) * radius * 0.63
    ]
    const size = pixel * 2.5
    drawPixelPath(
      sigil,
      [
        { x: cx, y: cy - size },
        { x: cx + size, y: cy },
        { x: cx, y: cy + size },
        { x: cx - size, y: cy },
        { x: cx, y: cy - size }
      ],
      [{ grid: pixel, size: pixel * 1.5, color: GRAND_IGNITION_ARC_TINT, alpha: 0.65 }]
    )
  }

  sigil.setScale(0.4)
  scene.tweens.add({
    targets: sigil,
    alpha: { from: 0, to: 1 },
    scale: 1,
    duration: 700,
    ease: Phaser.Math.Easing.Cubic.Out
  })
  scene.tweens.add({
    targets: sigil,
    angle: 360,
    duration: 34000,
    repeat: -1,
    ease: "Linear"
  })
  scene.tweens.add({
    targets: sigil,
    alpha: 0.35,
    delay: 1400,
    duration: 1800,
    yoyo: true,
    repeat: -1,
    ease: Phaser.Math.Easing.Sine.InOut
  })
}

const TOXIC_RESONANCE_BLOOM = 0x6b2fa0
const TOXIC_RESONANCE_BODY = 0x7ae582
const TOXIC_RESONANCE_CORE = 0xe8fff0
const TOXIC_RESONANCE_HARMONIC_BEAT = 4
// below 0.894 the diagonal neighbours fall outside a ring that does poison them
const TOXIC_RESONANCE_RING_TILT = 0.9

function toxicResonanceRing(
  scene: GameScene | DebugScene,
  centerX: number,
  centerY: number,
  radius: number,
  delay: number,
  duration: number,
  weight: number
) {
  const ring = scene.add
    .graphics({ x: centerX, y: centerY })
    .setDepth(DEPTH.ABILITY_GROUND_LEVEL)
    .setBlendMode(Phaser.BlendModes.ADD)
  scene.abilitiesVfxGroup?.add(ring)
  drawPixelPath(ring, ringPoints(radius), [
    {
      grid: VFX_PIXEL * 6,
      size: VFX_PIXEL * 7 * weight,
      color: TOXIC_RESONANCE_BLOOM,
      alpha: 0.3
    },
    {
      grid: VFX_PIXEL * 4,
      size: VFX_PIXEL * 4.5 * weight,
      color: TOXIC_RESONANCE_BODY,
      alpha: 0.55
    },
    {
      grid: VFX_PIXEL * 2,
      size: VFX_PIXEL * 2.4 * weight,
      color: TOXIC_RESONANCE_CORE,
      alpha: 0.9
    }
  ])
  ring.setScale(0.25, 0.25 * TOXIC_RESONANCE_RING_TILT).setAlpha(0)
  scene.tweens.add({
    targets: ring,
    scaleX: 1,
    scaleY: TOXIC_RESONANCE_RING_TILT,
    alpha: { from: 0.95, to: 0 },
    delay,
    duration,
    ease: Phaser.Math.Easing.Cubic.Out,
    onComplete: () => ring.destroy()
  })
}

function toxicResonanceBeatMarks(
  scene: GameScene | DebugScene,
  x: number,
  y: number,
  beat: number
) {
  const marks = boardGroundPlane(scene, x, y - 6)
  const radius = 46
  for (let pip = 0; pip < TOXIC_RESONANCE_HARMONIC_BEAT; pip++) {
    const angle =
      (pip / TOXIC_RESONANCE_HARMONIC_BEAT) * Math.PI * 2 - Math.PI / 2
    const isLit = pip < beat
    marks.fillStyle(
      isLit ? TOXIC_RESONANCE_CORE : TOXIC_RESONANCE_BLOOM,
      isLit ? 0.95 : 0.3
    )
    const size = VFX_PIXEL * (isLit ? 4 : 2)
    marks.fillRect(
      Math.round((Math.cos(angle) * radius) / VFX_PIXEL) * VFX_PIXEL - size / 2,
      Math.round((Math.sin(angle) * radius) / VFX_PIXEL) * VFX_PIXEL - size / 2,
      size,
      size
    )
  }
  marks.setAlpha(0)
  scene.tweens.add({
    targets: marks,
    alpha: { from: 0.9, to: 0 },
    scale: { from: 0.85, to: 1.2 },
    duration: 1100,
    ease: Phaser.Math.Easing.Sine.Out,
    onComplete: () => marks.parentContainer?.destroy()
  })
}

function toxicResonanceReaction(
  args: AbilityAnimationArgs,
  radiusInCells: number,
  isHarmonic = false
) {
  const { scene, positionX, positionY, flip, pokemonsOnBoard } = args
  /* mirrors Board.getCellsInRadius: euclidean against radius + 0.5, not a
     chebyshev square, or the wave animates on units it never poisons */
  const reach = radiusInCells + 0.5
  pokemonsOnBoard.forEach((unit) => {
    const [dx, dy] = [unit.positionX - positionX, unit.positionY - positionY]
    if (dx * dx + dy * dy >= reach * reach) return
    const distance = Math.round(Math.hypot(dx, dy))
    const [unitX, unitY] = transformEntityCoordinates(
      unit.positionX,
      unit.positionY,
      flip
    )
    const isChampion = distance === 0
    scene.time.delayedCall(distance * 90, () => {
      addAbilitySprite(
        scene,
        isChampion ? Ability.ECHO : "SMOG",
        0,
        [unitX, unitY - 10],
        {
          scale: isChampion ? 2.4 : 1.6,
          depth: DEPTH.ABILITY_MINOR,
          tint: TOXIC_RESONANCE_BLOOM,
          alpha: 0.8
        }
      )
      const bubbles = isHarmonic ? 7 : 3
      for (let bubble = 0; bubble < bubbles; bubble++) {
        const drop = addAbilitySprite(
          scene,
          Ability.MUD_BUBBLE,
          0,
          [unitX + randomBetween(-22, 22), unitY + randomBetween(-6, 10)],
          {
            scale: randomBetween(6, 11) / 10,
            depth: DEPTH.ABILITY,
            tint: TOXIC_RESONANCE_BODY,
            destroyOnComplete: false
          }
        )
        if (!drop) continue
        scene.tweens.add({
          targets: drop,
          y: drop.y - randomBetween(34, 74),
          alpha: 0,
          duration: randomBetween(520, 900),
          delay: randomBetween(0, 180),
          ease: Phaser.Math.Easing.Sine.Out,
          onComplete: () => drop.destroy()
        })
      }
      if (!isHarmonic) return
      addAbilitySprite(scene, Ability.ECHO, 0, [unitX, unitY - 12], {
        scale: 2.2,
        depth: DEPTH.ABILITY_MAJOR,
        tint: TOXIC_RESONANCE_CORE,
        alpha: 0.9
      })
      for (let mote = 0; mote < 6; mote++) {
        toxicResonanceUplift(scene, unitX + randomBetween(-20, 20), unitY)
      }
    })
  })
}

function toxicResonanceUplift(
  scene: GameScene | DebugScene,
  x: number,
  y: number
) {
  const mote = scene.add
    .graphics({ x, y })
    .setDepth(DEPTH.ABILITY_MAJOR)
    .setBlendMode(Phaser.BlendModes.ADD)
  const size = VFX_PIXEL * randomBetween(2, 3)
  mote.fillStyle(TOXIC_RESONANCE_CORE, 0.9)
  mote.fillRect(-size / 2, -size / 2, size, size)
  scene.abilitiesVfxGroup?.add(mote)
  scene.tweens.add({
    targets: mote,
    x: x + randomBetween(-14, 14),
    y: y - randomBetween(60, 110),
    alpha: 0,
    duration: randomBetween(480, 780),
    delay: randomBetween(0, 200),
    ease: Phaser.Math.Easing.Sine.Out,
    onComplete: () => mote.destroy()
  })
}

function grandIgnitionMagicBlister(
  scene: GameScene | DebugScene,
  x: number,
  y: number
) {
  const blister = addAbilitySprite(scene, Ability.MYSTICAL_FIRE, 0, [x, y], {
    scale: randomBetween(15, 32) / 10,
    depth: DEPTH.ABILITY,
    animOptions: { frameRate: randomBetween(18, 26) }
  })
  if (!blister) return
  scene.tweens.add({
    targets: blister,
    y: y - randomBetween(30, 70),
    alpha: { from: 1, to: 0 },
    duration: randomBetween(500, 900),
    ease: Phaser.Math.Easing.Sine.Out
  })
}

function grandIgnitionArc(
  scene: GameScene | DebugScene,
  x0: number,
  y0: number,
  x1: number,
  y1: number
) {
  const length = Math.hypot(x1 - x0, y1 - y0)
  const [midX, midY] = [(x0 + x1) / 2, (y0 + y1) / 2]
  const local = [
    { x: x0 - midX, y: y0 - midY },
    { x: x1 - midX, y: y1 - midY }
  ]
  const arc = scene.add
    .graphics({ x: midX, y: midY })
    .setDepth(DEPTH.ABILITY)
    .setBlendMode(Phaser.BlendModes.ADD)
  const weight = 1 + length / 220
  const pixel = VFX_PIXEL
  drawPixelPath(arc, local, [
    { grid: pixel * 4, size: pixel * 5 * weight, color: GRAND_IGNITION_ARC_BLOOM, alpha: 0.09 },
    { grid: pixel * 2, size: pixel * 3 * weight, color: GRAND_IGNITION_ARC_TINT, alpha: 0.24 },
    { grid: pixel, size: pixel * 1.5 * weight, color: GRAND_IGNITION_ARC_CORE, alpha: 0.7 }
  ])
  scene.abilitiesVfxGroup?.add(arc)

  arc.setScale(0.9)
  scene.tweens.add({
    targets: arc,
    alpha: 0,
    scale: 1.1,
    duration: randomBetween(260, 460),
    ease: Phaser.Math.Easing.Sine.Out,
    onComplete: () => arc.destroy()
  })
}

function grandIgnitionSpark(
  scene: GameScene | DebugScene,
  x: number,
  y: number,
  heading: number,
  distance: number,
  duration: number
) {
  const pixel = VFX_PIXEL
  const tail = randomBetween(4, 9) * pixel
  const [dx, dy] = [Math.cos(heading), Math.sin(heading)]
  const spark = scene.add
    .graphics({ x, y })
    .setDepth(DEPTH.ABILITY)
    .setBlendMode(Phaser.BlendModes.ADD)

  drawPixelPath(
    spark,
    [
      { x: -dx * tail, y: -dy * tail },
      { x: 0, y: 0 }
    ],
    [
      { grid: pixel * 2, size: pixel * 2.5, color: GRAND_IGNITION_ARC_BLOOM, alpha: 0.12 },
      { grid: pixel, size: pixel, color: GRAND_IGNITION_ARC_TINT, alpha: 0.5 }
    ]
  )
  spark.fillStyle(GRAND_IGNITION_ARC_CORE, 0.95)
  spark.fillRect(-pixel, -pixel, pixel * 2, pixel * 2)
  scene.abilitiesVfxGroup?.add(spark)

  scene.tweens.add({
    targets: spark,
    x: x + dx * distance,
    y: y + dy * distance,
    duration,
    ease: Phaser.Math.Easing.Cubic.Out
  })
  scene.tweens.add({
    targets: spark,
    alpha: 0,
    duration: duration * 0.5,
    delay: duration * 0.5,
    onComplete: () => spark.destroy()
  })
}

function grandIgnitionSparksInward(
  scene: GameScene | DebugScene,
  x: number,
  y: number,
  count: number,
  reach: number
) {
  for (let index = 0; index < count; index++) {
    const heading = Math.random() * Math.PI * 2
    scene.time.delayedCall(randomBetween(0, 260), () =>
      grandIgnitionSpark(
        scene,
        x + Math.cos(heading) * reach,
        y + Math.sin(heading) * reach * BOARD_PLANE_FLATTEN,
        heading + Math.PI,
        reach,
        randomBetween(280, 460)
      )
    )
  }
}

function grandIgnitionTorchFlame(
  scene: GameScene | DebugScene,
  x: number,
  y: number,
  size: number,
  flip: boolean
) {
  const groundY = y + 24 + grandIgnitionCornerDrop(y, flip)
  grandIgnitionFlame(scene, x, groundY, size * 0.9, size * 2.2, 0)
  grandIgnitionFlame(scene, x - 16 * size * 0.4, groundY, size * 0.6, size * 1.4, 210)
  grandIgnitionFlame(scene, x + 15 * size * 0.4, groundY, size * 0.55, size * 1.6, 390)
  grandIgnitionSparks(scene, x, groundY, 6, 22 * size * 0.4)
  grandIgnitionSmoke(scene, x, groundY - size * 22, size * 0.5)
}

const grandIgnitionTorchAnimation =
  (litCorners: number) => (args: AbilityAnimationArgs) => {
  const { scene, positionX, positionY, targetX, targetY, flip } = args
  const [startX, startY] = transformEntityCoordinates(
    positionX,
    positionY,
    flip
  )
  const [endX, endY] = transformEntityCoordinates(targetX, targetY, flip)

  const torch = addAbilitySprite(scene, "FIRE/range", 0, [startX, startY], {
    textureKey: "attacks",
    scale: 2.5,
    depth: DEPTH.PROJECTILE,
    destroyOnComplete: false,
    animOptions: { repeat: -1 }
  })
  if (!torch) return

  scene.tweens.add({ targets: torch, x: endX, duration: 720, ease: "Linear" })
  scene.tweens.chain({
    targets: torch,
    tweens: [
      { angle: -25, duration: 360, ease: Phaser.Math.Easing.Sine.Out },
      { angle: 20, duration: 360, ease: Phaser.Math.Easing.Sine.In }
    ]
  })
  scene.tweens.chain({
    targets: torch,
    tweens: [
      {
        y: Math.min(startY, endY) - 150,
        duration: 360,
        ease: Phaser.Math.Easing.Quadratic.Out
      },
      { y: endY, duration: 360, ease: Phaser.Math.Easing.Quadratic.In }
    ],
    onComplete: () => {
      torch.destroy()
      const landingY = endY + 24 + grandIgnitionCornerDrop(endY, flip)
      addAbilitySprite(scene, Ability.TORCH_SONG, 0, [endX, landingY], {
        scale: [2.5, 4],
        origin: GRAND_IGNITION_FLAME_BASE,
        depth: DEPTH.ABILITY
      })
      grandIgnitionTorchFlame(scene, endX, endY, 2.5, flip)
      scene.shakeCamera({ duration: 120, intensity: 0.003 })

      grandIgnitionSparksInward(scene, endX, landingY, 8 + litCorners * 2, 90)
      // the fourth arc is what closes the square, so every torch draws one
      scene.time.delayedCall(220, () =>
        grandIgnitionQuarterArc(scene, endX, endY, flip)
      )
    }
  })
}

const toxicResonanceBeatAnimation =
  (beat: number) => (args: AbilityAnimationArgs) => {
    const { scene, positionX, positionY, flip } = args
    const [championX, championY] = transformEntityCoordinates(
      positionX,
      positionY,
      flip
    )
    addAbilitySprite(scene, Ability.ECHO, 0, [championX, championY - 10], {
      scale: 1.6 + beat * 0.7,
      depth: DEPTH.ABILITY,
      tint: TOXIC_RESONANCE_BODY
    })
    toxicResonanceBeatMarks(scene, championX, championY, beat)
    for (let ring = 0; ring < 3; ring++) {
      toxicResonanceRing(
        scene,
        championX,
        championY,
        CELL_WIDTH * (beat + 0.5),
        ring * 120,
        420 + beat * 90,
        1 - ring * 0.22
      )
    }
    toxicResonanceReaction(args, beat)
    scene.shakeCamera({ duration: 140, intensity: 0.002 * beat })
  }

function toxicResonanceHarmonicAnimation(args: AbilityAnimationArgs) {
  const { scene, positionX, positionY, flip } = args
  const [championX, championY] = transformEntityCoordinates(
    positionX,
    positionY,
    flip
  )

  {
    addAbilitySprite(scene, Ability.ECHO, 0, [championX, championY - 10], {
      scale: 5,
      depth: DEPTH.ABILITY_MAJOR,
      tint: TOXIC_RESONANCE_CORE
    })
    toxicResonanceBeatMarks(
      scene,
      championX,
      championY,
      TOXIC_RESONANCE_HARMONIC_BEAT
    )

    const [boardCenterX, boardCenterY] = transformEntityCoordinates(
      (BOARD_WIDTH - 1) / 2,
      (BOARD_HEIGHT - 1) / 2,
      flip
    )
    const wash = scene.add
      .rectangle(
        boardCenterX,
        boardCenterY,
        CELL_WIDTH * (BOARD_WIDTH + 1),
        CELL_HEIGHT * (BOARD_HEIGHT + 1),
        TOXIC_RESONANCE_BLOOM,
        0
      )
      .setDepth(DEPTH.BOARD_EFFECT_AIR_LEVEL)
      .setBlendMode(Phaser.BlendModes.ADD)
    scene.abilitiesVfxGroup?.add(wash)
    scene.tweens.add({
      targets: wash,
      alpha: { from: 0, to: 0.3 },
      duration: 500,
      yoyo: true,
      hold: 500,
      ease: Phaser.Math.Easing.Sine.InOut,
      onComplete: () => wash.destroy()
    })

    const RINGS = 5
    const reach = CELL_WIDTH * (BOARD_WIDTH + 1)
    for (let ring = 0; ring < RINGS; ring++) {
      toxicResonanceRing(
        scene,
        championX,
        championY,
        reach,
        ring * 190,
        1500,
        1.5 - ring * 0.18
      )
    }
    toxicResonanceReaction(args, BOARD_WIDTH + BOARD_HEIGHT, true)
    scene.shakeCamera({ duration: 900, intensity: 0.009 })
  }
}

function grandIgnitionBlazeAnimation(args: AbilityAnimationArgs) {
  const { scene, flip } = args
  const corners = GRAND_IGNITION_CORNERS.map(([x, y]) =>
    transformEntityCoordinates(x, y, flip)
  )
  const [centerX, centerY] = transformEntityCoordinates(
    (BOARD_WIDTH - 1) / 2,
    (BOARD_HEIGHT - 1) / 2,
    flip
  )

  corners.forEach(([x, y]) => grandIgnitionTorchFlame(scene, x, y, 5, flip))
  grandIgnitionSigil(scene, centerX, centerY, grandIgnitionSigilRadius())

  corners.forEach(([x, y], index) => {
    const [nextX, nextY] = corners[(index + 1) % corners.length]
    scene.time.delayedCall(index * 120, () =>
      grandIgnitionArc(scene, x, y, nextX, nextY)
    )
    scene.time.delayedCall(index * 120 + 200, () =>
      grandIgnitionArc(scene, x, y, centerX, centerY)
    )
  })

  const BURST_SPARKS = 34
  scene.time.delayedCall(560, () => {
    for (let spark = 0; spark < BURST_SPARKS; spark++) {
      const heading = (spark / BURST_SPARKS) * Math.PI * 2 + Math.random() * 0.2
      grandIgnitionSpark(
        scene,
        centerX,
        centerY,
        heading,
        randomBetween(220, 460),
        randomBetween(420, 760)
      )
    }
  })

  const flash = scene.add
    .rectangle(
      centerX,
      centerY,
      CELL_WIDTH * (BOARD_WIDTH + 1),
      CELL_HEIGHT * (BOARD_HEIGHT + 1),
      GRAND_IGNITION_MAGIC_TINT,
      0
    )
    .setDepth(DEPTH.BOARD_EFFECT_AIR_LEVEL)
    .setBlendMode(Phaser.BlendModes.ADD)
  scene.abilitiesVfxGroup?.add(flash)
  scene.tweens.add({
    targets: flash,
    alpha: { from: 0, to: 0.2 },
    duration: 900,
    delay: 400,
    yoyo: true,
    hold: 700,
    ease: Phaser.Math.Easing.Sine.InOut,
    onComplete: () => flash.destroy()
  })

  const radius = grandIgnitionSigilRadius()
  const RING_COLLAPSE_STEP = 260
  const SWEEP_STEP = 900
  const cornerBearings = corners.map(([cornerX, cornerY]) =>
    Math.atan2(
      (cornerY - centerY) / BOARD_PLANE_FLATTEN,
      cornerX - centerX
    )
  )
  const sweepFromCorners = (angle: number) =>
    Math.min(
      ...cornerBearings.map((bearing) => {
        const delta = Math.abs(
          ((angle - bearing + Math.PI * 3) % (Math.PI * 2)) - Math.PI
        )
        return delta / Math.PI
      })
    )

  const burningRings = [
    { r: radius, flames: 34, size: 1.6 },
    { r: radius * 0.82, flames: 28, size: 1.3 },
    { r: radius * 0.63, flames: 22, size: 1.2 },
    { r: radius * 0.44, flames: 15, size: 1.1 }
  ]
  burningRings.forEach(({ r, flames, size }, ringIndex) => {
    for (let index = 0; index < flames; index++) {
      const spacing = (Math.PI * 2) / flames
      const angle =
        index * spacing + ((randomBetween(-40, 40) / 100) * spacing)
      const scatter = r + randomBetween(-14, 14)
      const worldX = centerX + Math.cos(angle) * scatter
      const worldY =
        centerY +
        Math.sin(angle) * scatter * BOARD_PLANE_FLATTEN +
        randomBetween(4, 20)
      const delay =
        ringIndex * RING_COLLAPSE_STEP +
        sweepFromCorners(angle) * SWEEP_STEP +
        randomBetween(0, 120)
      scene.time.delayedCall(delay, () => {
        grandIgnitionWanderingFlame(
          scene,
          worldX,
          worldY,
          (size * randomBetween(80, 125)) / 100,
          (size * randomBetween(190, 260)) / 100,
          DEPTH.ABILITY_BELOW_POKEMON
        )
        if (index % 4 === 0) grandIgnitionSparks(scene, worldX, worldY, 2, 26)
        if (ringIndex === 0 && index % 5 === 0) {
          grandIgnitionSmoke(scene, worldX, worldY - 60, 0.9)
        }
      })
    }
  })

  const BURNING_SPOKES = 12
  for (let spoke = 0; spoke < BURNING_SPOKES; spoke++) {
    const angle = (spoke / BURNING_SPOKES) * Math.PI * 2
    const spokeRadius = radius * (randomBetween(88, 96) / 100)
    const worldX = centerX + Math.cos(angle) * spokeRadius
    const worldY =
      centerY + Math.sin(angle) * spokeRadius * BOARD_PLANE_FLATTEN
    scene.time.delayedCall(
      sweepFromCorners(angle) * SWEEP_STEP + randomBetween(0, 200),
      () =>
        grandIgnitionWanderingFlame(
          scene,
          worldX,
          worldY + randomBetween(4, 16),
          randomBetween(70, 100) / 100,
          randomBetween(150, 200) / 100,
          DEPTH.ABILITY_BELOW_POKEMON
        )
    )
  }

  const AIRBURST_COUNT = 40
  const [boardLeft, boardTop] = transformEntityCoordinates(0, 0, flip)
  const [boardRight, boardBottom] = transformEntityCoordinates(
    BOARD_WIDTH - 1,
    BOARD_HEIGHT - 1,
    flip
  )
  const randomPointInTheAir = (): [number, number] => [
    randomBetween(
      Math.min(boardLeft, boardRight) - 30,
      Math.max(boardLeft, boardRight) + 30
    ),
    randomBetween(
      Math.min(boardTop, boardBottom) - 140,
      Math.max(boardTop, boardBottom) - 40
    )
  ]
  scene.time.addEvent({
    delay: 110,
    repeat: AIRBURST_COUNT,
    callback: () => {
      const [x, y] = randomPointInTheAir()
      if (randomBetween(0, 3) === 0) {
        grandIgnitionMagicBlister(scene, x, y)
      } else {
        grandIgnitionSpark(
          scene,
          x,
          y,
          -Math.PI / 2 + (randomBetween(-45, 45) / 180) * Math.PI,
          randomBetween(80, 190),
          randomBetween(360, 620)
        )
      }
    }
  })

  scene.shakeCamera({ duration: 2200, intensity: 0.004 })
}

export function addAbilitySprite(
  scene: GameScene | DebugScene,
  ability: Ability | string,
  ap: number,
  position: number[],
  options: AbilityAnimationOptions = {}
) {
  const frame = options.frame ?? `${ability}/000.png`
  const textureKey = options.textureKey ?? "abilities"

  if (
    !scene.textures.exists(textureKey) ||
    !scene.textures.get(textureKey).has(frame)
  ) {
    logger.warn(`Missing frame "${frame}" in texture "${textureKey}"`)
    return null
  }

  if (ability && !scene.anims.exists(ability)) {
    logger.warn(`Missing animation: ${ability}`)
    return null
  }

  const sprite = scene.add.sprite(position[0], position[1], textureKey, frame)
  scene.abilitiesVfxGroup?.add(sprite)

  const {
    origin,
    scale,
    depth,
    tint,
    tintFill,
    rotation,
    angle,
    alpha,
    flipX,
    flipY,
    destroyOnComplete = true,
    animOptions = {}
  } = options
  sprite.setOrigin(
    ...(Array.isArray(origin)
      ? origin
      : origin !== undefined
        ? [origin]
        : [0.5, 0.5])
  )
  const scaleX = max(10)(
    (Array.isArray(scale) ? scale[0] : (scale ?? 2)) * (1 + ap / 200)
  )
  const scaleY = max(10)(
    (Array.isArray(scale) ? scale[1] : (scale ?? 2)) * (1 + ap / 200)
  )
  sprite.setScale(scaleX, scaleY)
  sprite.setDepth(depth ?? DEPTH.ABILITY)
  if (tint) sprite.setTint(tint)
  if (tintFill) {
    sprite.setTint(tintFill).setTintMode(Phaser.TintModes.FILL)
  }
  if (rotation !== undefined) sprite.setRotation(rotation)
  if (angle !== undefined) sprite.setAngle(angle)
  if (alpha !== undefined) sprite.setAlpha(alpha)
  if (flipX) sprite.flipX = true
  if (flipY) sprite.flipY = true
  if (destroyOnComplete) {
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      sprite.destroy()
    })
  }

  if (ability) sprite.play({ key: ability, ...animOptions })
  return sprite
}

const staticAnimation: AbilityAnimationMaker<{ x: number; y: number }> =
  (options) => (args) => {
    let rotation = options.rotation
    if (options?.oriented) {
      const coordinates = transformEntityCoordinates(
        args.positionX,
        args.positionY,
        args.flip
      )
      const coordinatesTarget = transformEntityCoordinates(
        args.targetX,
        args.targetY,
        args.flip
      )
      rotation = angleBetween(coordinates, coordinatesTarget) + (rotation ?? 0)
    }

    const delay = options.delay ?? args.delay ?? 0
    setTimeout(() => {
      addAbilitySprite(
        args.scene,
        options.ability ?? args.ability,
        args.ap,
        [
          options.x + (options?.positionOffset?.[0] ?? 0),
          options.y + (options?.positionOffset?.[1] ?? 0)
        ],
        { ...options, rotation }
      )
    }, delay)
  }

const onCaster: AbilityAnimationMaker = (options) => (args) => {
  const [x, y] = transformEntityCoordinates(
    args.positionX,
    args.positionY,
    args.flip
  )
  return staticAnimation({ x, y, ...options })(args)
}

const onTarget: AbilityAnimationMaker = (options) => (args) => {
  const [x, y] = transformEntityCoordinates(
    args.targetX,
    args.targetY,
    args.flip
  )
  return staticAnimation({ x, y, ...options })(args)
}

const onCasterScale1 = onCaster({ scale: 1 })
const onCasterScale2 = onCaster({ scale: 2 })
const onCasterScale3 = onCaster({ scale: 3 })
const onCasterScale4 = onCaster({ scale: 4 })
const onTargetScale1 = onTarget({ scale: 1 })
const onTargetScale2 = onTarget({ scale: 2 })
const onTargetScale3 = onTarget({ scale: 3 })
const onTargetScale4 = onTarget({ scale: 4 })

const onSprite =
  (
    handler: (
      args: AbilityAnimationArgs & {
        casterSprite?: PokemonSprite
        targetSprite?: PokemonSprite
      }
    ) => void
  ) =>
  (args) => {
    const casterSprite = args.pokemonsOnBoard.find(
      (pkmUI) =>
        pkmUI.positionX === args.positionX && pkmUI.positionY === args.positionY
    )
    const targetSprite = args.pokemonsOnBoard.find(
      (pkmUI) =>
        pkmUI.positionX === args.targetX && pkmUI.positionY === args.targetY
    )
    handler({ casterSprite, targetSprite, ...args })
  }

type AbilityCoordinates = [number, number, boolean?] | "target" | "caster"

type TweenAnimationMakerOptions = {
  duration?: number
  ease?: string | ((v: number) => number)
  hitAnim?: AbilityAnimation
  tweenProps?: Record<string, any>
  startCoords?: AbilityCoordinates
  endCoords?: AbilityCoordinates
  startPositionOffset?: [number, number]
  endPositionOffset?: [number, number]
  startPosition?: [number, number]
  destroyOnTweenComplete?: boolean
}

const parseCoordinates = (
  coords: AbilityCoordinates,
  args: AbilityAnimationArgs
): [number, number, boolean?] => {
  if (coords === "caster") {
    return [args.positionX, args.positionY, args.flip]
  } else if (coords === "target") {
    return [args.targetX, args.targetY, args.flip]
  }
  return coords
}

const tweenAnimation: AbilityAnimationMaker<TweenAnimationMakerOptions> =
  (options = {}) =>
  (args) => {
    const { scene, flip } = args
    let { rotation } = options
    const [startRow, startCol, startFlip] = parseCoordinates(
      options.startCoords ?? "caster",
      args
    )
    const delay = options.delay ?? args.delay ?? 0
    setTimeout(() => {
      const startPosition =
        options.startPosition ||
        transformEntityCoordinates(startRow, startCol, startFlip ?? flip).map(
          (coord, i) => coord + (options.startPositionOffset?.[i] ?? 0)
        )

      if (options?.oriented) {
        const coordinates = transformEntityCoordinates(
          args.positionX,
          args.positionY,
          args.flip
        )
        const coordinatesTarget = transformEntityCoordinates(
          args.targetX,
          args.targetY,
          args.flip
        )
        rotation =
          angleBetween(coordinates, coordinatesTarget) + (rotation ?? 0)
      }

      const sprite = addAbilitySprite(
        scene,
        options.ability ?? args.ability,
        args.ap,
        startPosition,
        {
          destroyOnComplete: false,
          ...options,
          rotation
        }
      )
      if (!sprite) return null

      const tweenConfig: Phaser.Types.Tweens.TweenBuilderConfig = {
        targets: sprite,
        duration: options.duration || 500,
        ease: options.ease || "linear",
        onComplete: () => {
          if (options.destroyOnTweenComplete !== false) sprite?.destroy()
          if (options.hitAnim) options.hitAnim(args)
        },
        ...(options.tweenProps ?? {})
      }

      scene.tweens.add(tweenConfig)
    }, delay)
  }

const projectile: AbilityAnimationMaker<
  TweenAnimationMakerOptions & {
    orientation?: Orientation | true
    distance?: number
    easeX?: string | ((v: number) => number)
    easeY?: string | ((v: number) => number)
  }
> =
  (options = {}) =>
  (args) => {
    let { startCoords, endCoords, oriented, rotation, distance, orientation } =
      options

    let endPosition: [number, number]
    if (distance !== undefined || orientation !== undefined) {
      // projectile passing through units over a certain distance

      let ox: number, oy: number
      if (endCoords !== undefined) {
        ;[ox, oy] = parseCoordinates(endCoords ?? "caster", args)
      } else {
        ;[ox, oy] = parseCoordinates(startCoords ?? "caster", args)
      }

      let dx: number, dy: number
      if (options.orientation !== undefined) {
        ;[dx, dy] =
          OrientationVector[
            options.orientation === true
              ? args.orientation
              : options.orientation
          ]
      } else {
        const angleToTarget = Math.atan2(
          args.targetY - args.positionY,
          args.targetX - args.positionX
        )
        dx = Math.cos(angleToTarget)
        dy = Math.sin(angleToTarget)
      }
      endPosition = transformEntityCoordinates(
        ox + dx * (options.distance ?? 12),
        oy + dy * (options.distance ?? 12),
        args.flip
      )

      if (oriented) {
        rotation = angleBetween([dx, -dy], [0, 0]) + (rotation ?? 0)
        oriented = false // rotation is already set, prevent computation from tweenAnimation
      }
    } else {
      // projectile stopping on target or certain coordinates
      const [endRow, endCol, endFlip] = parseCoordinates(
        endCoords ?? "target",
        args
      )
      endPosition = transformEntityCoordinates(
        endRow,
        endCol,
        endFlip ?? args.flip
      )
    }

    endPosition[0] += options.endPositionOffset?.[0] ?? 0
    endPosition[1] += options.endPositionOffset?.[1] ?? 0

    return tweenAnimation({
      ...options,
      oriented,
      rotation,
      startCoords,
      endCoords,
      tweenProps: {
        x: {
          value: endPosition[0],
          ease: options.easeX ?? options.ease ?? "linear"
        },
        y: {
          value: endPosition[1],
          ease: options.easeY ?? options.ease ?? "linear"
        },
        ...(options.tweenProps ?? {})
      }
    })(args)
  }

const skyfall: AbilityAnimationMaker<TweenAnimationMakerOptions> =
  (options) => (args) => {
    return projectile({
      ...options,
      startCoords: [args.targetX, 9, false]
    })(args)
  }

const shakeCamera: AbilityAnimationMaker<{
  duration?: number
  intensity?: number
}> =
  (options) =>
  ({ scene }) =>
    scene.shakeCamera(options)

const poppingIcon: AbilityAnimationMaker<
  TweenAnimationMakerOptions & { maxScale: number }
> = (options) => (args) =>
  tweenAnimation({
    ...options,
    startCoords:
      options.startCoords === "target"
        ? [args.targetX, args.targetY]
        : [args.positionX, args.positionY],
    ease: Phaser.Math.Easing.Cubic.Out,
    scale: options.scale ?? 0.25,
    tweenProps: { scale: options?.maxScale ?? 3, ...(options.tweenProps ?? {}) }
  })(args)

function earthQuakeAnim(stars: number) {
  return ({ scene, positionX, positionY, flip, ap }) => {
    const [x, y] = transformEntityCoordinates(positionX, positionY, flip)
    const CELL_SIZE = 96
    const radius = stars

    const center = scene.add
      .sprite(x, y, "abilities", `${Ability.EARTH_QUAKE}/000.png`)
      ?.setScale(2 * (1 + ap / 600))
    center.anims.play({ key: Ability.EARTH_QUAKE, frameRate: 4 })
    scene.abilitiesVfxGroup?.add(center)
    center.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => center.destroy())

    const rings = new Map<number, Array<{dx: number, dy: number}>>()
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < radius + 0.5) {
          const ring = Math.round(dist)
          if (!rings.has(ring)) rings.set(ring, [])
          rings.get(ring)!.push({ dx, dy })
        }
      }
    }

    const cells: {dx: number, dy: number}[] = []
    Array.from(rings.keys()).sort((a, b) => a - b).forEach(ring => {
      const shuffled = Phaser.Utils.Array.Shuffle(rings.get(ring)!)
      cells.push(...shuffled)
    })

    cells.forEach(({ dx, dy }, i) => {
      const offsetX = x + dx * CELL_SIZE
      const offsetY = y + dy * CELL_SIZE
      scene.time.delayedCall(i * 20, () => {
        const sprite = scene.add
          .sprite(offsetX, offsetY, "abilities", `${Ability.EARTH_QUAKE}/000.png`)
          ?.setScale(2 * (1 + ap / 600))
        sprite.anims.play({ key: Ability.EARTH_QUAKE, frameRate: 4 })
        scene.abilitiesVfxGroup?.add(sprite)
        sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => sprite.destroy())
      })
    })
  }
}

const FLAMETHROWER_JET_LENGTH = CELL_WIDTH * 8
/** the jet starts just in front of the caster's muzzle, not on its sprite */
const FLAMETHROWER_MUZZLE_OFFSET = CELL_WIDTH * 0.2
const FLAMETHROWER_JET_DURATION = 820
const FLAMETHROWER_JET_GROWTH = 300
/** the jet holds at full length before fading out */
const FLAMETHROWER_JET_HOLD = 540
const FLAMETHROWER_EMBER_TINT = 0xffc65a
/** slight multiply tint, just enough to stop the flame reading as pale pink */
const FLAMETHROWER_JET_TINT = 0xffd9a0
/** eruptions trail the flame front instead of landing on the cast frame */
const FLAMETHROWER_ERUPT_DELAY = 150
const FLAMETHROWER_ERUPT_DELAY_PER_CELL = 30

function flamethrowerEmber(
  scene: GameScene | DebugScene,
  x: number,
  y: number,
  toX: number,
  toY: number,
  duration: number,
  delay: number
) {
  const ember = addAbilitySprite(scene, "EMBER", 0, [x, y], {
    scale: randomBetween(4, 8) / 10,
    depth: DEPTH.ABILITY,
    destroyOnComplete: false,
    animOptions: { repeat: -1 }
  })
  if (!ember) return
  ember.setBlendMode(Phaser.BlendModes.ADD)
  scene.tweens.add({
    targets: ember,
    x: toX,
    y: toY,
    alpha: { from: 1, to: 0 },
    duration,
    delay,
    ease: Phaser.Math.Easing.Cubic.Out,
    onComplete: () => ember.destroy()
  })
}

/** A jet of fire stretching from the caster to the far edge of the board,
    matching the full line the server burns PP on */
function flamethrowerJetAnimation(args: AbilityAnimationArgs) {
  const { scene, positionX, positionY, targetX, targetY, ap, flip } = args
  const from = transformEntityCoordinates(positionX, positionY, flip)
  const to = transformEntityCoordinates(targetX, targetY, flip)
  const angle = angleBetween(from, to)
  const [dx, dy] = [Math.cos(angle), Math.sin(angle)]

  const muzzle = [
    from[0] + dx * FLAMETHROWER_MUZZLE_OFFSET,
    from[1] + dy * FLAMETHROWER_MUZZLE_OFFSET
  ]

  const jet = addAbilitySprite(scene, Ability.FLAMETHROWER, ap, muzzle, {
    origin: [0.5, 1],
    rotation: angle + Math.PI / 2,
    scale: 2,
    depth: DEPTH.ABILITY,
    tint: FLAMETHROWER_JET_TINT,
    destroyOnComplete: false
  })
  if (jet) {
    const jetScaleY = Math.max(2, FLAMETHROWER_JET_LENGTH / jet.height)
    scene.tweens.add({
      targets: jet,
      scaleX: { from: jet.scaleX * 0.3, to: jet.scaleX },
      scaleY: { from: jetScaleY * 0.08, to: jetScaleY },
      duration: FLAMETHROWER_JET_GROWTH,
      ease: Phaser.Math.Easing.Cubic.Out
    })
    scene.tweens.add({
      targets: jet,
      alpha: 0,
      duration: FLAMETHROWER_JET_DURATION - FLAMETHROWER_JET_HOLD,
      delay: FLAMETHROWER_JET_HOLD,
      ease: Phaser.Math.Easing.Quadratic.In,
      onComplete: () => jet.destroy()
    })
  }

  const EMBERS = 6
  for (let index = 0; index < EMBERS; index++) {
    const spread = randomBetween(-14, 14)
    const reach = FLAMETHROWER_JET_LENGTH * (randomBetween(6, 10) / 10)
    flamethrowerEmber(
      scene,
      muzzle[0] - dy * spread,
      muzzle[1] + dx * spread,
      muzzle[0] + dx * reach - dy * spread,
      muzzle[1] + dy * reach + dx * spread,
      randomBetween(400, 540),
      index * 45
    )
  }

  scene.shakeCamera({ duration: 300, intensity: 0.002 })
}

/** how long the flame front takes to reach the erupting cell */
function flamethrowerEruptDelay(args: AbilityAnimationArgs) {
  return (
    FLAMETHROWER_ERUPT_DELAY +
    distanceM(args.positionX, args.positionY, args.targetX, args.targetY) *
      FLAMETHROWER_ERUPT_DELAY_PER_CELL
  )
}

/** PP burn overflowing into an eruption on one enemy of the line */
function flamethrowerEruptAnimation(args: AbilityAnimationArgs) {
  const { scene, targetX, targetY, ap, flip } = args
  const [x, y] = transformEntityCoordinates(targetX, targetY, flip)

  addAbilitySprite(scene, HitSprite.FIRE_HIT, ap, [x, y], {
    textureKey: "attacks",
    scale: 5.5,
    depth: DEPTH.HIT_FX_ABOVE_POKEMON
  })

  const shockwave = scene.add
    .graphics({ x, y })
    .setDepth(DEPTH.ABILITY)
    .setBlendMode(Phaser.BlendModes.ADD)
  shockwave
    .lineStyle(VFX_PIXEL * 1.5, FLAMETHROWER_EMBER_TINT, 1)
    .strokeCircle(0, 0, CELL_WIDTH * 0.75)
  scene.abilitiesVfxGroup?.add(shockwave)
  scene.tweens.add({
    targets: shockwave,
    scaleX: 3.6,
    scaleY: 2.1,
    alpha: 0,
    duration: 380,
    ease: Phaser.Math.Easing.Cubic.Out,
    onComplete: () => shockwave.destroy()
  })

  const EMBERS = 12
  for (let index = 0; index < EMBERS; index++) {
    const heading = (index / EMBERS) * Math.PI * 2 + Math.random() * 0.5
    const reach = randomBetween(90, 160)
    flamethrowerEmber(
      scene,
      x,
      y,
      x + Math.cos(heading) * reach,
      y + Math.sin(heading) * reach - 35,
      randomBetween(300, 420),
      0
    )
  }
}

/** splash feedback on the ADJACENT enemies caught by an eruption */
function flamethrowerSplashAnimation(args: AbilityAnimationArgs) {
  const { scene, targetX, targetY, ap, flip } = args
  const [x, y] = transformEntityCoordinates(targetX, targetY, flip)

  addAbilitySprite(scene, HitSprite.FIRE_HIT, ap, [x, y], {
    textureKey: "attacks",
    scale: 3.2,
    depth: DEPTH.HIT_FX_ABOVE_POKEMON
  })

  for (let index = 0; index < 3; index++) {
    const heading = -Math.PI / 2 + randomBetween(-6, 6) / 10
    flamethrowerEmber(
      scene,
      x,
      y,
      x + Math.cos(heading) * randomBetween(25, 50),
      y + Math.sin(heading) * randomBetween(25, 50),
      randomBetween(200, 280),
      0
    )
  }
}

/** both eruption animations wait for the flame front to actually get there */
const flamethrowerDelayed =
  (animation: AbilityAnimation): AbilityAnimation =>
  (args) => {
    args.scene.time.delayedCall(flamethrowerEruptDelay(args), () =>
      animation(args)
    )
  }

export const AbilitiesAnimations: {
  [animKey: string]: AbilityAnimation | AbilityAnimation[]
} = {
  /* IMPENDING_DOOM borrows the Dark Void sprite but sits at ground level, so
     the shadow reads as falling under the victim rather than over it. Its own
     key keeps Darkrai's DARK_VOID depth untouched. */
  ["IMPENDING_DOOM"]: onTarget({
    ability: Ability.DARK_VOID,
    scale: 6,
    depth: DEPTH.ABILITY_GROUND_LEVEL
  }),
  ["PRISON_BOTTLE_PORTAL"]: onCasterScale2,
  ["PUFF_RED"]: onTargetScale2,
  ["PUFF_PINK"]: onTargetScale2,
  ["INFLATABLE_PUFF"]: onCaster({ ability: "PUFF_PINK", scale: 4 }),
  ["PUFF_GREEN"]: onTargetScale2,
  ["PUFF_BROWN"]: onTargetScale2,
  ["COCONUT"]: projectile({
    duration: 500,
    scale: 3
  }),
  // projectile for DAMP_ROCK awakening.
  ["WATER_RANGE"]: projectile({
    ability: "WATER/range",
    textureKey: "attacks",
    duration: 400,
    scale: 5
  }),
  // projectile for the LEAF_TORNADO blessing ricochet
  ["GRASS_RANGE"]: projectile({
    ability: "GRASS/range",
    textureKey: "attacks",
    duration: 300,
    scale: 3,
    hitAnim: onTarget({ ability: "PUFF_GREEN", scale: 1 })
  }),
  ["FLAMETHROWER_ERUPT"]: flamethrowerDelayed(flamethrowerEruptAnimation),
  ["FLAMETHROWER_SPLASH"]: flamethrowerDelayed(flamethrowerSplashAnimation),
  ["TOXIC_RESONANCE_BEAT_1"]: toxicResonanceBeatAnimation(1),
  ["TOXIC_RESONANCE_BEAT_2"]: toxicResonanceBeatAnimation(2),
  ["TOXIC_RESONANCE_BEAT_3"]: toxicResonanceBeatAnimation(3),
  ["TOXIC_RESONANCE_HARMONIC"]: toxicResonanceHarmonicAnimation,
  ["GRAND_IGNITION_TORCH_1"]: grandIgnitionTorchAnimation(1),
  ["GRAND_IGNITION_TORCH_2"]: grandIgnitionTorchAnimation(2),
  ["GRAND_IGNITION_TORCH_3"]: grandIgnitionTorchAnimation(3),
  ["GRAND_IGNITION_TORCH_4"]: grandIgnitionTorchAnimation(4),
  ["GRAND_IGNITION_BLAZE"]: grandIgnitionBlazeAnimation,
  ["UNISON_BEAM"]: unisonBeamAnimation(),
  ["UNISON_NOVA"]: unisonNovaAnimation(),
  ["UNISON_STARFALL"]: unisonStarfallAnimation(),
  ["MAGNETOSPHERE_ATTRACT"]: magnetosphereFieldAnimation(true),
  ["MAGNETOSPHERE_REPEL"]: magnetosphereFieldAnimation(false),
  // soul fragment travelling back to the caster, for the SOUL_DRAIN blessing
  ["GHOST_RANGE"]: projectile({
    ability: "GHOST/range",
    textureKey: "attacks",
    duration: 600,
    scale: 1.5
  }),
  [Ability.AQUA_STEP]: onCaster({
    ability: Ability.AQUA_STEP,
    scale: 1.5,
    positionOffset: [+5, -15]
  }),
  [`${Ability.EARTH_QUAKE}_1`]: [earthQuakeAnim(1), shakeCamera({ duration: 800, intensity: 0.004 })],
  [`${Ability.EARTH_QUAKE}_2`]: [earthQuakeAnim(2), shakeCamera({ duration: 800, intensity: 0.004 })],
  [`${Ability.EARTH_QUAKE}_3`]: [earthQuakeAnim(3), shakeCamera({ duration: 800, intensity: 0.004 })],
  [Ability.FORESTS_CURSE]: onTarget({
    scale: 2,
    depth: DEPTH.ABILITY_BELOW_POKEMON
  }),
  [Ability.LUMINA_CRASH]: onTargetScale2,
  [Ability.TREASURE_RUSH]: onCaster({
    ability: Ability.GOLD_RUSH
  }),
  [Ability.SURPRISING_HAND]: onTarget({
    ability: Ability.ASSURANCE,
    scale: 1.4,
    tint: 0x35c1a8
  }),
  [Ability.CURSED_LAND]: onCaster({
    scale: 4,
    tint: 0x6a329f,
    positionOffset: [+2, -40],
    depth: DEPTH.ABILITY_BELOW_POKEMON,
    animOptions: { frameRate: 12 }
  }),
  [Ability.MAGNETIC_FLUX]: onCaster({
    scale: 2.7,
    depth: DEPTH.ABILITY_BELOW_POKEMON,
    positionOffset: [0, -10]
  }),
  [Ability.MAGNETIC_ABSORPTION]: onTarget({scale: 4, tint: 0xf1c232, positionOffset: [0, -20] }),
  [Ability.FRENZY_PLANT]: (args) => {
    const { scene, targetX, targetY, flip, ap } = args
    const [tx, ty] = transformEntityCoordinates(targetX, targetY, flip)

    const offsets = [
      [0, -80], [-50, -40], [-45, -10], [50, -40], [45, -10]
    ]
    const [dx, dy] = pickRandomIn(offsets)
    const flipX = flip ? -dx : dx

    const sprite = scene.add
      .sprite(tx + flipX, ty + dy, "abilities", `${Ability.FRENZY_PLANT}/000.png`)
      ?.setScale(4.5 * (1 + ap / 200))
      ?.setFlipX(flip)
    sprite.anims.play({ key: Ability.FRENZY_PLANT, frameRate: 16 })
    scene.abilitiesVfxGroup?.add(sprite)
    sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => sprite.destroy())

    tweenAnimation({
      ability: Ability.BRICK_BREAK,
      scale: 1.2,
      startCoords: "target",
      tint: 0x97AC97,
      startPositionOffset: [randomBetween(-30, 30), randomBetween(-30, 30)],
      tweenProps: { alpha: 0 }
    })(args)
  },
  [Ability.NIHIL_LIGHT]: [
    (args) => {
      const coordinates = transformEntityCoordinates(
        args.positionX,
        args.positionY,
        args.flip
      )
      const [dx, dy] = OrientationVector[args.orientation]
      return staticAnimation({
        ability: Ability.DYNAMAX_CANNON,
        x: coordinates[0] + dx * 16,
        y: coordinates[1] - dy * 16,
        tint: 0xc010ca,
        depth: DEPTH.ABILITY_BELOW_POKEMON,
        origin: [0.5, 0],
        oriented: true,
        rotation: -Math.PI / 2
      })(args)
    }
  ],
  [Ability.LIGHT_OF_RUIN]: [
    (args) => {
      const coordinates = transformEntityCoordinates(
        args.positionX,
        args.positionY,
        args.flip
      )
      const [dx, dy] = OrientationVector[args.orientation]
      return staticAnimation({
        x: coordinates[0] + dx * 16,
        y: coordinates[1] - dy * 16,
        depth: DEPTH.ABILITY_BELOW_POKEMON,
        origin: [0.5, 0],
        oriented: true,
        scale: 3,
        rotation: -Math.PI / 2,
        flipY: true,
        animOptions: { frameRate: 12 }  // lower = slower, default is usually 16
      })(args)
    }
  ],

  [Ability.DIAMOND_STORM]: onCasterScale2,
  [Ability.THRASH]: onCasterScale2,
  [Ability.HELPING_HAND]: onCasterScale2,
  [Ability.ENCORE]: onCaster({ ability: Ability.HELPING_HAND }),
  [Ability.FLORAL_HEALING]: onCasterScale2,
  [Ability.CAMOUFLAGE]: onCasterScale2,
  [Ability.ROAR_OF_TIME]: onCasterScale2,
  [Ability.HAPPY_HOUR]: onCasterScale2,
  [Ability.TELEPORT]: onCasterScale2,
  [Ability.PSYCHO_BOOST]: onCasterScale2,
  [Ability.SHIELDS_UP]: onCasterScale2,
  [Ability.AQUA_RING]: onCasterScale2,
  [Ability.INGRAIN]: onCasterScale2,
  [Ability.DEFENSE_CURL]: onCasterScale2,
  [Ability.RECOVER]: onCasterScale2,
  [Ability.METRONOME]: onCasterScale2,
  [Ability.LUNAR_BLESSING]: onCasterScale2,
  [Ability.MAGIC_POWDER]: onCasterScale2,
  [Ability.LANDS_WRATH]: onCasterScale2,
  [Ability.NIGHT_DAZE]: onCasterScale2,
  [Ability.BITTER_MALICE]: onTarget({ ability: Ability.NIGHT_DAZE, scale: 2 }),
  [Ability.POWER_WHIP]: [
    onCaster({
      oriented: true,
      scale: 4,
      origin: [0.5, 1],
      rotation: Math.PI / 2
    }),
    onTarget({ ability: "POWER_WHIP/hit", scale: 2, delay: 100 })
  ],
  [Ability.STORED_POWER]: onCaster({
    ability: Ability.POWER_WHIP,
    tint: 0xff80ff
  }),
  [Ability.YAWN]: onCasterScale2,
  [Ability.WISE_YAWN]: projectile({
    scale: 2,
    ability: Ability.YAWN
  }),
  [Ability.MEDITATE]: onCasterScale2,
  [Ability.MUD_BUBBLE]: [
    onCasterScale2,
    onCaster({ ability: Ability.SMASHING_WING, scale: 2.5, depth: DEPTH.ABILITY_BELOW_POKEMON, tint: 0x8B4513 })
  ],
  [Ability.SOFT_BOILED]: onCasterScale2,
  [Ability.FAKE_TEARS]: onCasterScale2,
  ["COVERT_CLOAK"]: onCaster({ ability: Ability.FAKE_TEARS, scale: 1.5, tint: 0xff9900 }),
  [Ability.TEA_TIME]: onCasterScale2,
  ["SOOTHE_BELL"]: onTarget({ ability: "TEA_TIME", scale: 2 }),

  [Ability.FUTURE_SIGHT]: onTarget({
    depth: DEPTH.ABILITY_BELOW_POKEMON,
    animOptions: { repeat: 2 }
  }),
  ["FUTURE_SIGHT_HIT"]: onTarget({
    scale: 2,
    depth: DEPTH.ABILITY_BELOW_POKEMON,
    tint: 0xbb90ff
  }),
  [Ability.DOOM_DESIRE]: onTarget({
    depth: DEPTH.ABILITY_MAJOR,
    scale: 1,
    positionOffset: [0, -20]
  }),
  ["DOOM_DESIRE_HIT"]: onTarget({
    depth: DEPTH.ABILITY_MAJOR,
    scale: 1,
    positionOffset: [0, -20]
  }),
  [Ability.PETAL_DANCE]: [
    onCaster({ scale: 2, positionOffset: [0, -40] }),
    ({ scene, positionX, positionY, flip, ap }) => {
      const [x, y] = transformEntityCoordinates(positionX, positionY, flip)
      const petalCount = 5

      for (const r of [64, 96]) {
        const petalGroup = scene.add.group()
        const circle = new Phaser.Geom.Circle(x, y, 48)
        for (let i = 0; i < petalCount; i++) {
          const petalSprite = scene.add
            .sprite(0, 0, "abilities", `PETAL_DANCE_PROJECTILE/000.png`)
            ?.setScale(2 * (1 + ap / 200))
          petalSprite.anims.play({
            key: "PETAL_DANCE_PROJECTILE",
            frameRate: 8
          })
          petalGroup.add(petalSprite)
          scene.abilitiesVfxGroup?.add(petalSprite)
        }

        Phaser.Actions.PlaceOnCircle(petalGroup.getChildren(), circle)

        scene.tweens.add({
          targets: circle,
          radius: r,
          ease: Phaser.Math.Easing.Quartic.Out,
          duration: 1200,
          onUpdate: function (tween) {
            Phaser.Actions.RotateAroundDistance(
              petalGroup.getChildren(),
              { x, y },
              (r === 96 ? 1 : -1) * 0.04,
              circle.radius
            )
          },
          onComplete: function () {
            petalGroup.destroy(true, true)
          }
        })
      }
    }
  ],
  [Ability.AROMATHERAPY]: onCasterScale2,
  [Ability.BOUNCE]: onCasterScale2,
  [Ability.BRICK_BREAK]: onTargetScale2,
  [Ability.RETURN]: onTarget({ ability: Ability.BRICK_BREAK, scale: 2 }),
  [Ability.BULK_UP]: onCasterScale2,
  [Ability.FLASH]: onCasterScale2,
  ["CLEAR_AMULET"]: onCaster({ ability: "FLASH", tint: 0x87e5fa, scale: 2 }),
  [Ability.METEOR_MASH]: onTarget({ ability: Ability.FLASH }),
  [Ability.STEEL_WING]: onCasterScale2,
  [Ability.HYPNOSIS]: projectile({
    oriented: true,
    textureKey: "attacks",
    ability: AttackSprite.PSYCHIC_RANGE,
    scale: 2,
    distance: 1
  }),
  ["FIELD_DEATH"]: onCasterScale2,
  ["FAIRY_CRIT"]: onCasterScale2,
  ["FAIRY_HIT"]: onTarget({
    ability: "FAIRY/hit",
    textureKey: "attacks"
  }),
  ["FAIRY_TUNNEL"]: projectile({
    ability: Ability.PSYCHO_CUT,
    distance: 8,
    duration: 1000,
    oriented: true,
    rotation: +Math.PI / 2
  }),
  ["POWER_LENS"]: onCasterScale2,
  ["STAR_DUST"]: onCasterScale2,
  ["HEAL_ORDER"]: onCasterScale2,
  ["ATTACK_ORDER"]: onCasterScale2,
  ["DEFEND_ORDER"]: onCasterScale2,
  ["FOSSIL_RESURRECT"]: onCasterScale2,
  ["LANDS_WRATH/hit"]: onCasterScale2,
  [Ability.BUG_BUZZ]: onTargetScale2,
  [Ability.VENOSHOCK]: onTarget({ scale: 2, origin: [0.5, 1] }),
  [Ability.LEECH_LIFE]: onTargetScale2,
  [Ability.THIEF]: onTargetScale2,
  [Ability.STUN_SPORE]: onTargetScale2,
  ["STUN_SPORE_PINK"]: onTarget({ ability: "STUN_SPORE", tint: 0xff69b4, scale: 1.2 }),
  [Ability.CRABHAMMER]: onTargetScale2,
  [Ability.JAW_LOCK]: onTarget({
    ability: Ability.ICE_FANG,
    scale: 2,
    tint: 0x798f8d
  }),
  [Ability.BARED_FANGS]: onTarget({
    ability: Ability.ICE_FANG,
    scale: 2,
    tint: 0x8b0000
  }),
  [Ability.RAZOR_WIND]: onTargetScale2,
  [Ability.SEISMIC_TOSS]: onTargetScale2,
  [Ability.ASSURANCE]: onTargetScale2,
  [Ability.CRUSH_GRIP]: onTargetScale2,
  [Ability.METAL_BURST]: onTargetScale2,
  [Ability.SHADOW_SNEAK]: onTargetScale2,
  [Ability.IVY_CUDGEL]: onTargetScale2,
  [Ability.FACADE]: onTargetScale2,
  [Ability.SHIELDS_DOWN]: onTargetScale2,
  [Ability.BRAVE_BIRD]: onTargetScale2,
  [Ability.DYNAMIC_PUNCH]: onTargetScale2,
  [Ability.ELECTRO_WEB]: onTargetScale2,
  [Ability.PSYSHIELD_BASH]: onTargetScale2,
  [Ability.LIQUIDATION]: onTargetScale2,
  [Ability.ACID_ARMOR]: onCasterScale2,
  [Ability.AIR_SLASH]: onTargetScale2,
  [Ability.DREAM_EATER]: onTargetScale2,
  [Ability.BURN_UP]: onTargetScale3,
  [Ability.ICE_HAMMER]: onTargetScale2,
  [Ability.MANTIS_BLADES]: onTargetScale2,
  [Ability.PSYCHIC_FANGS]: onTargetScale2,
  [Ability.THUNDER_FANG]: onTargetScale2,
  [Ability.ICE_FANG]: onTargetScale2,
  [Ability.FIRE_FANG]: onTargetScale2,
  [Ability.POPULATION_BOMB]: onTargetScale2,
  [Ability.SCREECH]: onTargetScale2,
  [Ability.SAND_TOMB]: sandTombAnimation(),
  ["SAND_TOMB_HIT"]: onTarget({ ability: Ability.SAND_TOMB, scale: 2 }),
  [Ability.FIRST_IMPRESSION]: onTarget({ ability: "PUFF_BROWN", scale: 3 }),
  [Ability.PLAY_ROUGH]: onTargetScale2,
  [Ability.ANCHOR_SHOT]: onTargetScale1,
  [Ability.LEAF_BLADE]: onTargetScale2,
  [Ability.SLASHING_CLAW]: onTargetScale2,
  [Ability.DIRE_CLAW]: onTarget({ ability: Ability.SLASHING_CLAW, scale: 3 }),
  [Ability.HEX]: onTargetScale2,
  [Ability.PLASMA_FIST]: onTargetScale2,
  [Ability.LEECH_SEED]: onTargetScale2,
  [Ability.TRIPLE_DIVE]: onTarget({ ability: Ability.WATERFALL, scale: 2 }),
  [Ability.LOCK_ON]: onTargetScale2,
  [Ability.DISABLE]: onTargetScale2,
  [Ability.ROCK_SMASH]: onTargetScale2,
  [Ability.BLAZE_KICK]: onTarget({ positionOffset: [0, -35] }),
  [Ability.BITE]: onTargetScale2,
  [Ability.DRAGON_TAIL]: onTargetScale2,
  [Ability.SOAK]: onTargetScale2,
  [Ability.IRON_TAIL]: onTargetScale2,
  [Ability.ICICLE_CRASH]: onTargetScale2,
  [Ability.DRAIN_PUNCH]: onTargetScale2,
  [Ability.LICK]: onTargetScale2,
  [Ability.OCTOLOCK]: onTargetScale2,
  [Ability.SPITE]: onTarget({ ability: Ability.ACID_SPRAY, scale: 2 }),
  [Ability.SPIRIT_BREAK]: onTargetScale2,
  [Ability.PSYSHOCK]: onTargetScale2,
  [Ability.SHEER_COLD]: onTargetScale2,
  [Ability.COTTON_SPORE]: onTargetScale2,
  [Ability.RETALIATE]: onTargetScale2,
  [Ability.THUNDER_CAGE]: onTargetScale2,
  ["FIGHTING_KNOCKBACK"]: onTargetScale2,
  [Ability.FIRE_BLAST]: onTargetScale3,
  [Ability.CLOSE_COMBAT]: onTargetScale3,
  [Ability.SUPER_FANG]: onTargetScale3,
  [Ability.VINE_WHIP]: onTargetScale3,
  [Ability.STOMP]: onTargetScale3,
  [Ability.GUILLOTINE]: onTargetScale3,
  [Ability.CROSS_POISON]: onTargetScale3,
  [Ability.FIERY_DANCE]: onTarget({ ability: Ability.FIRE_BLAST, scale: 2 }),
  [Ability.ANACHRONISM_REPULSOR]: onCaster({scale: 1.8, positionOffset: [0, -30]}),
  [Ability.SMASHING_WING]: onCaster({ scale: 5, depth: DEPTH.ABILITY_BELOW_POKEMON }),
  ["DARK_SUBSTITUTE"]: onCaster({ ability: Ability.SMASHING_WING, scale: 3.5 }),
  [Ability.FIRE_SPIN]: onTarget({ ability: Ability.MAGMA_STORM, scale: 2 }),
  [Ability.DRAGON_ENERGY]: onTarget({ depth: DEPTH.ABILITY_BELOW_POKEMON }),
  [Ability.GRUDGE_DIVE]: projectile({
    ability: Ability.DRAGON_ENERGY,
    tint: 0xcbc3e3
  }),
  [Ability.ROCK_WRECKER]: onSprite(({ casterSprite, ...args }) =>
    projectile({
      duration: 200,
      ability: "",
      frame: `ROCK_WRECKER/${(casterSprite?.pokemon?.stars ?? 0) > 1 ? "001" : "000"}.png`,
      hitAnim: onTarget({ ability: "SMOKE_BALL", scale: 2 })
    })(args)
  ),
  [Ability.DYNAMAX_CANNON]: onCaster({
    origin: [0.5, 0],
    oriented: true,
    rotation: -Math.PI / 2
  }),
  [Ability.MOONGEIST_BEAM]: onCaster({
    origin: [0.5, 0],
    oriented: true,
    rotation: -Math.PI / 2
  }),
  [Ability.FREEZING_GLARE]: onCaster({
    origin: [0.5, 0.98],
    positionOffset: [0, -50],
    oriented: true,
    rotation: +Math.PI / 2
  }),
  [Ability.MYSTICAL_FIRE]: onTarget({ scale: 1.5 }),
  [Ability.FLAME_CHARGE]: onCaster({
    oriented: true,
    rotation: +Math.PI / 2,
    origin: [0.5, 1],
    depth: DEPTH.ABILITY_BELOW_POKEMON
  }),
  [Ability.PASTEL_VEIL]: onCaster({
    oriented: true,
    rotation: +Math.PI,
    origin: [1, 1],
    depth: DEPTH.ABILITY_BELOW_POKEMON
  }),
  [Ability.AQUA_JET]: onCaster({ oriented: true, rotation: -Math.PI / 2 }),
  [Ability.STOCKPILE]: onCaster({
    oriented: true,
    rotation: -Math.PI / 2,
    ability: Ability.AQUA_JET
  }),
  [Ability.EXTREME_SPEED]: [onCaster({}), onTarget({})],
  [Ability.SALT_CURE]: onCaster({
    ability: Ability.MAGIC_POWDER,
    tint: 0xb0ff80,
    scale: 2
  }),
  [Ability.SPICY_EXTRACT]: onCaster({
    ability: Ability.MAGIC_POWDER,
    tint: 0xff9000,
    scale: 3
  }),
  [Ability.SWEET_SCENT]: onCaster({
    ability: Ability.MAGIC_POWDER,
    tint: 0xffc0c0,
    scale: 3
  }),
  [Ability.DARK_VOID]: onTarget({
    scale: 6,
    depth: DEPTH.ABILITY_BELOW_POKEMON
  }),
  [Ability.SEED_FLARE]: onCasterScale3,
  [Ability.MULTI_ATTACK]: onCasterScale4,
  [Ability.ROCK_SLIDE]: onTarget({ scale: 2, origin: [0.5, 0.9] }),
  [Ability.FLAMETHROWER]: flamethrowerJetAnimation,
  [Ability.SUPER_HEAT]: [
    onCaster({
      oriented: true,
      origin: [0, 0.5],
      depth: DEPTH.ABILITY_BELOW_POKEMON
    }),
    onCaster({
      oriented: true,
      origin: [0, 0.5],
      rotation: Math.PI / 4,
      depth: DEPTH.ABILITY_BELOW_POKEMON
    }),
    onCaster({
      oriented: true,
      origin: [0, 0.5],
      rotation: -Math.PI / 4,
      depth: DEPTH.ABILITY_BELOW_POKEMON
    })
  ],
  [Ability.BLOODMOON_ABILITY]: [
    onCaster({ ability: "COSMIC_POWER", tint: 0xff5060, origin: [0.5, 1] }),
    (args) => {
      const coordinates = transformEntityCoordinates(
        args.positionX,
        args.positionY,
        args.flip
      )
      const [dx, dy] = OrientationVector[args.orientation]
      return staticAnimation({
        ability: Ability.DYNAMAX_CANNON,
        x: coordinates[0] + dx * 16,
        y: coordinates[1] - dy * 16 - 24,
        tint: 0xff5060,
        origin: [0.5, 0],
        oriented: true,
        rotation: -Math.PI / 2
      })(args)
    }
  ],
  [Ability.PSYBEAM]: onCaster({
    oriented: true,
    rotation: -Math.PI / 2,
    origin: [0.5, 0],
    scale: [1, 2]
  }),
  [Ability.TWIN_BEAM]: onCaster({
    ability: Ability.PSYBEAM,
    oriented: true,
    rotation: -Math.PI / 2,
    origin: [0.5, 0],
    scale: [1, 2]
  }),
  [Ability.HYPER_BEAM]: onCaster({
    ability: Ability.PSYBEAM,
    oriented: true,
    rotation: -Math.PI / 2,
    origin: [0.5, 0],
    scale: [2, 2],
    tint: 0xffffa0
  }),
  ["HYPER_BEAM_CHARGE"]: onCasterScale2,
  [Ability.THUNDER_SHOCK]: onTarget({
    ability: Ability.THUNDER,
    scale: 2,
    origin: [0.5, 1]
  }),
  [Ability.HYDRO_PUMP]: onCaster({
    oriented: true,
    rotation: Math.PI / 2,
    origin: [0.5, 1]
  }),
  [Ability.WITHDRAW]: OrientationArray.map((orientation) =>
    projectile({
      orientation,
      scale: 1.2,
      distance: 8,
      ability: "HYDRO_PUMP",
      oriented: true,
      rotation: -Math.PI / 2,
      duration: 900
    })
  ),
  [Ability.SWALLOW]: onCaster({
    ability: Ability.HYDRO_PUMP,
    oriented: true,
    rotation: +Math.PI / 2,
    origin: [0.5, 1],
    tint: 0x60ff60
  }),
  [Ability.DRACO_METEOR]: onTarget({ origin: [0.5, 0.9] }),
  [Ability.WISH]: onCasterScale3,
  [Ability.GRAVITY]: onCaster({
    ability: Ability.MEDITATE,
    scale: 3,
    tint: 0xccff33,
    depth: DEPTH.ABILITY_BELOW_POKEMON
  }),
  [Ability.COSMIC_POWER_MOON]: onCaster({
    ability: "COSMIC_POWER",
    tint: 0xccb0ff,
    origin: [0.5, 1]
  }),
  [Ability.COSMIC_POWER_SUN]: onCaster({
    ability: "COSMIC_POWER",
    tint: 0xffffd0,
    origin: [0.5, 1]
  }),
  [Ability.FORECAST]: onCaster({ depth: DEPTH.ABILITY_BELOW_POKEMON }),
  [Ability.CHATTER]: onCasterScale2,
  [Ability.BOOMBURST]: onCaster({ ability: Ability.CHATTER, scale: 3 }),
  [Ability.BLAST_BURN]: onCasterScale3,
  [Ability.FLARE_BLITZ]: onCasterScale3,
  [Ability.CHARGE]: onCaster({
    scale: 4,
    depth: DEPTH.ABILITY_BELOW_POKEMON,
    origin: [0.5, 0.8]
  }),
  [Ability.DISCHARGE]: onCasterScale3,
  [Ability.SHOCKWAVE]: onCasterScale3,
  [Ability.OVERDRIVE]: onCaster({ scale: 3, positionOffset: [0, -20] }),
  [Ability.SMOG]: onCaster({ scale: 4, depth: DEPTH.ABILITY_MINOR }),
  [Ability.POISON_GAS]: onCaster({
    ability: Ability.SMOG,
    scale: 3,
    tint: 0xa0f0f0,
    depth: DEPTH.ABILITY_BELOW_POKEMON
  }),
  [Ability.SLUDGE]: onTarget({
    ability: Ability.SMOG,
    scale: 3,
    tint: 0xa0c020
  }),
  [Ability.CRUNCH]: onTarget({ ability: Ability.BITE, scale: 3 }),
  [Ability.PUMMELING_PAYBACK]: onTarget({
    ability: Ability.BITE,
    scale: 3,
    tint: 0xc89d7c
  }),
  [Ability.CAVERNOUS_CHOMP]: onTarget({
    ability: Ability.BITE,
    scale: 2,
    tint: 0x804000
  }),
  [Ability.FROST_BREATH]: onCaster({
    oriented: true,
    positionOffset: [0, -30],
    origin: [-0.1, 0.5],
    scale: 4
  }),
  [Ability.TORMENT]: onCaster({ positionOffset: [0, -50] }),
  [Ability.RAGING_BULL]: onCaster({
    positionOffset: [0, -50],
    ability: Ability.TORMENT
  }),
  [Ability.RAGE]: onCaster({
    ability: Ability.TORMENT,
    positionOffset: [0, -50],
    tint: 0xff0000
  }),
  [Ability.NIGHT_SLASH]: onTargetScale2,
  [Ability.KOWTOW_CLEAVE]: onTarget({ ability: Ability.NIGHT_SLASH, scale: 3 }),
  [Ability.FELL_STINGER]: onTarget({
    ability: Ability.VENOSHOCK,
    tint: 0xc0ffc0,
    origin: [0.5, 1]
  }),
  [Ability.NASTY_PLOT]: onCaster({ positionOffset: [0, -50] }),
  [Ability.ROCK_TOMB]: onTarget({ origin: [0.5, 0.9], scale: 1 }),
  [Ability.SLACK_OFF]: onCaster({ ability: Ability.CAMOUFLAGE, scale: 1 }),
  [Ability.FISHIOUS_REND]: onCaster({ oriented: true, rotation: -Math.PI / 2 }),
  [Ability.HORN_ATTACK]: onTarget({ ability: Ability.CUT, scale: 3 }),
  [Ability.HORN_DRILL]: onTarget({ ability: Ability.CUT, scale: 4 }),
  [Ability.CUT]: [
    onTargetScale3,
    onCaster({
      ability: Ability.FISHIOUS_REND,
      oriented: true,
      rotation: -Math.PI / 2
    })
  ],
  [Ability.PAYDAY]: [
    onTargetScale2,
    onTarget({ ability: Ability.FACADE, scale: 1 })
  ],
  [Ability.VOLT_SWITCH]: onTarget({
    origin: [0.5, 0],
    oriented: true,
    rotation: -Math.PI / 2,
    scale: 2
  }),
  [Ability.BEHEMOTH_BLADE]: onCaster({
    ability: Ability.VOLT_SWITCH,
    origin: [0.5, 0],
    oriented: true,
    rotation: -Math.PI / 2,
    tint: 0xffc0ff
  }),
  [Ability.BEHEMOTH_BASH]: onCaster({
    oriented: true,
    scale: 1.7
  }),
  [Ability.MUDDY_WATER]: onTarget({ origin: [0.5, 1] }),
  [Ability.FAIRY_LOCK]: onTargetScale1,
  [Ability.STEAM_ERUPTION]: onTargetScale2,
  [Ability.SEARING_SHOT]: onCaster({
    depth: DEPTH.ABILITY_BELOW_POKEMON,
    scale: 3
  }),
  [Ability.VOLT_SURGE]: onCaster({
    ability: Ability.PARABOLIC_CHARGE,
    depth: DEPTH.ABILITY_BELOW_POKEMON,
    scale: 3
  }),
  [Ability.POWER_HUG]: onTarget({ ability: Ability.ANCHOR_SHOT }),
  [Ability.HEAVY_SLAM]: [onCasterScale2, shakeCamera({})],
  [Ability.MORTAL_SPIN]: onCaster({
    ability: Ability.HEAVY_SLAM,
    scale: 1.5,
    tint: 0xa0ff90
  }),
  [Ability.BODY_SLAM]: shakeCamera({}),
  [Ability.BULLDOZE]: [
    onCaster({ ability: Ability.HEAVY_SLAM, scale: 1.5 }),
    shakeCamera({})
  ],
  [Ability.EAR_DIG]: [
    onTarget({ ability: Ability.HEAVY_SLAM, scale: 1 }),
    (args) => {
      const [x, y] = transformEntityCoordinates(
        args.targetX,
        args.targetY,
        args.flip
      )
      const hole = args.delay ?? 0
      if (hole > 0) {
        const groundHole = args.scene.add
          .sprite(x, y + 10, "ground_holes", `hole${hole}.png`)
          .setScale(2)
          .setDepth(DEPTH.BOARD_EFFECT_GROUND_LEVEL)
        args.scene.abilitiesVfxGroup?.add(groundHole)
        args.scene.tweens.add({
          alpha: 0,
          delay: 15000,
          duration: 2000,
          targets: groundHole,
          onComplete() {
            groundHole.destroy()
          }
        })
        args.scene.abilitiesVfxGroup?.add(groundHole)
      }
    }
  ],
  [Ability.FAKE_OUT]: onCaster({ ability: Ability.FACADE }),
  [Ability.FILLET_AWAY]: onCaster({ ability: Ability.SHIELDS_UP }),
  [Ability.BITTER_BLADE]: onCasterScale3,
  [Ability.MIND_BEND]: onTarget({
    ability: Ability.ASSURANCE,
    positionOffset: [0, -20]
  }),
  ["REQUIEM"]: tweenAnimation({
    ability: Ability.ATTRACT,
    startCoords: "caster",
    startPositionOffset: [0, -70],
    duration: 1100,
    tweenProps: { alpha: 0, y: "-=50" }
  }),
  [Ability.ATTRACT]: onCaster({ positionOffset: [0, -70] }),
  [Ability.MAGNET_RISE]: onCasterScale2,
  [Ability.FORCE_PALM]: onTarget({ ability: Ability.ANCHOR_SHOT }),
  [Ability.WATERFALL]: onCaster({
    depth: DEPTH.ABILITY_BELOW_POKEMON,
    positionOffset: [0, -50]
  }),
  [Ability.MAGMA_STORM]: onTargetScale1,
  [Ability.ABSORB]: onCaster({ depth: DEPTH.ABILITY_GROUND_LEVEL }),
  [Ability.GIGATON_HAMMER]: [
    onTarget({ depth: DEPTH.ABILITY_BELOW_POKEMON }),
    shakeCamera({})
  ],
  [Ability.COUNTER]: onCasterScale2,
  ["ROCK_EXPLOSION"]: onCasterScale4,
  ["CRYSTALLISE"]:  onCaster({
    scale: 4,
    positionOffset: [+7, -15],
    depth: DEPTH.ABILITY_BELOW_POKEMON
  }),
  ["CRYSTALLISE_SHATTER"]: onCaster({
    scale: 4,
    positionOffset: [+7, -15],
    depth: DEPTH.ABILITY_BELOW_POKEMON
  }),
  // poison rework sprites
  ["CORROSION"]: onCasterScale4,
  ["POISON_PP_EXPLOSION"]: onCaster({ scale: 5 }),
  ["POISON_PP_HIT"]: onCaster({ scale: 4, delay: 250 }), 
  ["TOXIC_BURST"]: onCaster({
    ability: Ability.SMOG,
    scale: 3,
    depth: DEPTH.ABILITY_MINOR
  }),
  ["TOXIC_BURST_SPREAD"]: onCaster({
    ability: Ability.SMOG,
    scale: 2,
    tint: 0xa040c0,
    depth: DEPTH.ABILITY_MINOR
  }),
  [Ability.HIGH_HORSEPOWER]: onCaster({
    ability: Ability.COUNTER,
    scale: 2,
    tint: 0xc4a484
  }),
  [Ability.CITY_SHUTTLE]: onCaster({
    ability: "SMOKE_BROWN",
    scale: 2,
    tint: 0xc19a6b
  }),
  [Ability.SPECTRAL_THIEF]: [onTargetScale2, onCasterScale2],
  ["PARTING_GIFT"]: [
    tweenAnimation({
      ability: "SACRED_SWORD",
      startCoords: "caster",
      startPositionOffset: [0, -40],
      origin: [0.5, 0.2],
      rotation: Math.PI,
      scale: 2,
      duration: 900,
      tweenProps: { alpha: 0 }
    }),
    projectile({
      ability: Ability.PRESENT,
      startCoords: "caster",
      endCoords: "target",
      scale: 2,
      duration: 700
    })
  ],
  [Ability.SACRED_SWORD_IRON]: onTarget({
    ability: "SACRED_SWORD",
    origin: [0.5, 0.2],
    rotation: Math.PI
  }),
  [Ability.SACRED_SWORD_GRASS]: onTarget({
    ability: "SACRED_SWORD",
    origin: [0.5, 0.2],
    rotation: Math.PI,
    tint: 0xb0ffa0
  }),
  [Ability.SACRED_SWORD_CAVERN]: onTarget({
    ability: "SACRED_SWORD",
    origin: [0.5, 0.2],
    rotation: Math.PI,
    tint: 0xe0c0a0
  }),
  [Ability.SECRET_SWORD]: projectile({
    ability: "SACRED_SWORD",
    startCoords: "target",
    startPositionOffset: [0, -30],
    tint: 0xfff0b0,
    tweenProps: {
      angle: 540,
      duration: 400
    }
  }),
  [Ability.JUDGEMENT]: onTarget({ origin: [0.5, 1] }),
  [Ability.DIVE]: onCaster({ scale: 3, depth: DEPTH.ABILITY_BELOW_POKEMON }),
  [Ability.SMOKE_SCREEN]: onTargetScale3,
  [Ability.BARB_BARRAGE]: onTargetScale2,
  [Ability.OUTRAGE]: onTargetScale2,
  [Ability.KNOCK_OFF]: onTargetScale2,
  [Ability.SLASH]: onTargetScale2,
  [Ability.SHADOW_CLONE]: onCasterScale2,
  [Ability.ECHO]: onCaster({ origin: [0.5, 0.7] }),
  [Ability.UPROAR]: onCaster({
    ability: Ability.ECHO,
    origin: [0.5, 0.7],
    scale: 2
  }),
  [Ability.EXPLOSION]: [
    onCasterScale2,
    shakeCamera({ duration: 400, intensity: 0.01 })
  ],
  [Ability.CHLOROBLAST]: [
    onCaster({ ability: Ability.EXPLOSION, tint: 0x90ffd0 }),
    shakeCamera({ duration: 300, intensity: 0.015 })
  ],
  [Ability.CLANGOROUS_SOUL]: onCasterScale2,
  [Ability.GROWL]: onCaster({ oriented: true, rotation: -Math.PI / 2 }),
  [Ability.FAIRY_WIND]: onCasterScale2,
  [Ability.TAKE_HEART]: onCaster({
    ability: Ability.FAIRY_WIND,
    tint: 0xc0c0ff
  }),
  [Ability.HEART_SWAP]: [
    onCaster({
      ability: Ability.FAIRY_WIND,
      tint: 0xc0c0ff
    }),
    onTarget({
      ability: Ability.FAIRY_WIND,
      tint: 0xc0c0ff
    })
  ],
  [Ability.GRASSY_SURGE]: onCaster({
    ability: Ability.FAIRY_WIND,
    tint: 0x80ff80
  }),
  [Ability.ELECTRIC_SURGE]: onCaster({
    ability: Ability.FAIRY_WIND,
    tint: 0xffff80
  }),
  [Ability.PSYCHIC_SURGE]: onCaster({
    ability: Ability.FAIRY_WIND,
    tint: 0xc050ff
  }),
  [Ability.MISTY_SURGE]: onCaster({
    ability: Ability.FAIRY_WIND,
    tint: 0xffa0ff
  }),
  [Ability.RELIC_SONG]: onCasterScale2,
  [Ability.SING]: poppingIcon({ ability: Ability.RELIC_SONG, maxScale: 2 }),
  [Ability.DISARMING_VOICE]: onCaster({ ability: Ability.RELIC_SONG }),
  [Ability.LOVELY_KISS]: poppingIcon({
    textureKey: "attacks",
    ability: AttackSprite.FAIRY_MELEE,
    maxScale: 2,
    startPositionOffset: [0, -50]
  }),
  [Ability.CHARM]: poppingIcon({
    textureKey: "attacks",
    ability: AttackSprite.FAIRY_MELEE,
    maxScale: 3,
    startPositionOffset: [0, -50]
  }),
  [Ability.HIGH_JUMP_KICK]: onTargetScale2,
  [Ability.LUNGE]: onTarget({ ability: Ability.HIGH_JUMP_KICK }),
  [Ability.TROP_KICK]: onTargetScale2,
  [Ability.SHELL_TRAP]: onCaster({ ability: Ability.COUNTER }),
  [Ability.SHELL_SMASH]: onCaster({ ability: Ability.COUNTER }),
  [Ability.SONG_OF_DESIRE]: onTarget({ positionOffset: [0, -60] }),
  [Ability.CONFUSING_MIND]: [onTargetScale2, onCasterScale2],
  [Ability.DOUBLE_SHOCK]: [onTargetScale1, onCasterScale1],
  [Ability.FIRE_LASH]: onCaster({
    ability: Ability.FISHIOUS_REND,
    tint: 0xff6000,
    oriented: true,
    rotation: -Math.PI / 2,
    scale: 3
  }),
  [Ability.WONDER_GUARD]: onCaster({ depth: DEPTH.ABILITY_BELOW_POKEMON }),
  [Ability.THUNDERCLAP_PRESS]: onTarget({
    ability: Ability.WONDER_GUARD,
    scale: 2
  }),

  [Ability.X_SCISSOR]: onTargetScale2,
  [Ability.OBLIVION_WING]: (args) => {
    onCaster({
      ability: Ability.MOONGEIST_BEAM,
      tint: 0xBF1369,
      origin: [0.5, 0],
      oriented: true,
      scale: 3.5,
      rotation: -Math.PI / 2,
    })(args)
  },
  [Ability.GEOMANCY]: onCaster({
    positionOffset: [0, -50],
    depth: DEPTH.ABILITY_GROUND_LEVEL
  }),
  [Ability.BLIZZARD]: onCaster({ depth: DEPTH.ABILITY_BELOW_POKEMON }),
  [Ability.OVERHEAT]: onCaster({
    ability: Ability.FIRE_BLAST,
    scale: 4,
    depth: DEPTH.ABILITY_BELOW_POKEMON
  }),
  [Ability.FIERY_WRATH]: onCaster({
    ability: Ability.FIRE_BLAST,
    scale: 4,
    depth: DEPTH.ABILITY_BELOW_POKEMON,
    tint: 0xb000ff
  }),
  ["LINK_CABLE_link"]: (args) => {
    const distance = distanceE(
      args.positionX,
      args.positionY,
      args.targetX,
      args.targetY
    )
    return onCaster({
      ability: Ability.LINK_CABLE,
      origin: [0.5, 0],
      oriented: true,
      rotation: -Math.PI / 2,
      scale: [2, distance * 0.36]
    })(args)
  },
  ["LINK_CABLE_discharge"]: onCaster({ ability: Ability.DISCHARGE }),
  ["GRASS_HEAL"]: onCaster({ depth: DEPTH.BOOST_BACK }),
  ["FLAME_HIT"]: onCaster({ depth: DEPTH.HIT_FX_BELOW_POKEMON }),
  [Ability.TEETER_DANCE]: (args) => {
    args.pokemonsOnBoard.forEach((pkmUI) => {
      const coordinates = transformEntityCoordinates(
        pkmUI.positionX,
        pkmUI.positionY,
        args.flip
      )
      addAbilitySprite(args.scene, Ability.TEETER_DANCE, args.ap, coordinates, {
        depth: DEPTH.ABILITY_BELOW_POKEMON
      })
    })
  },
  [Ability.STRUGGLE_BUG]: onCaster({ ability: Ability.PSYCHIC }),
  [Ability.SPIN_OUT]: projectile({
    distance: 1,
    duration: 400,
    oriented: true,
    rotation: 0,
    scale: 4,
    destroyOnComplete: true
  }),
  [Ability.SPACIAL_REND]: (args) =>
    addAbilitySprite(
      args.scene,
      args.ability,
      args.ap,
      transformEntityCoordinates(4, args.targetY, args.flip),
      {
        scale: 4
      }
    ),
  [Ability.TEMPORAL_RUPTURE]: onCaster({ depth: DEPTH.ABILITY_BELOW_POKEMON, scale: 3}),
  [Ability.PRIMAL_ROAR]: onCaster({ scale: 2, positionOffset: [0, -40] }),
  [Ability.SUBSPACE_SWELL]: onCaster({ scale: 4, positionOffset: [+3,-50]}),
  [Ability.PETAL_BLIZZARD]: onCasterScale3,
  [Ability.NIGHTMARE]: onCaster({ origin: [0.5, 1] }),
  [Ability.AQUA_TAIL]: projectile({
    ability: Ability.SPIN_OUT,
    tint: 0x80eeff,
    distance: 1,
    duration: 400,
    oriented: true,
    rotation: 0,
    scale: 3,
    destroyOnComplete: true
  }),
  [Ability.CEASELESS_EDGE]: projectile({
    ability: Ability.SOLAR_BLADE,
    distance: 1,
    scale: 2,
    oriented: true,
    rotation: -Math.PI / 2,
    duration: 400,
    tint: 0xe83a3a
  }),
  [Ability.PSYBLADE]: onTarget({ ability: Ability.SLASHING_CLAW }),

  [Ability.WAVE_SPLASH]: projectile({
    distance: 2,
    duration: 600,
    oriented: true,
    rotation: -Math.PI / 2,
    scale: 3,
    destroyOnComplete: true
  }),
  [Ability.RAPID_SPIN]: onTarget({ scale: 1.5 }),
  [Ability.COTTON_GUARD]: onCaster({ ability: Ability.COTTON_SPORE, scale: 3 }),
  ["FLOWER_TRICK_EXPLOSION"]: onCaster({ ability: "PUFF_PINK", scale: 3 }),
  [Ability.FLOWER_TRICK]: onSprite(({ targetSprite }) =>
    targetSprite?.addFlowerTrick()
  ),
  [Ability.ENTRAINMENT]: onSprite(({ targetSprite }) =>
    targetSprite?.emoteAnimation()
  ),
  [Ability.SCHOOLING]: onCaster({
    scale: 4,
    depth: DEPTH.ABILITY_BELOW_POKEMON
  }),
  [Ability.STONE_AXE]: onTargetScale2,
  [Ability.CRUSH_CLAW]: onTargetScale2,
  [Ability.ICE_SPINNER]: onTarget({ scale: 1 }),
  [Ability.METAL_CLAW]: onTarget({ ability: Ability.CRUSH_CLAW, scale: 2 }),
  [Ability.DRAGON_CLAW]: onTargetScale1,
  [Ability.PRECIPICE_BLADES]: [onCasterScale3, shakeCamera({ duration: 350 })],
  [Ability.OCTAZOOKA]: projectile({
    ability: Ability.ARMOR_CANNON,
    scale: 1,
    tint: 0x303030,
    hitAnim: onTarget({
      ability: Ability.SMOKE_SCREEN,
      tint: 0x303030,
      scale: 3
    })
  }),
  [Ability.WOOD_HAMMER]: onTarget({ scale: 1, origin: [0.5, 1] }),
  [Ability.TRICK_OR_TREAT]: onTarget({ origin: [0.5, 1] }),
  [Ability.HEADBUTT]: onTarget({ ability: "FIGHTING_KNOCKBACK" }),
  [Ability.DIZZY_PUNCH]: onTarget({ ability: "FIGHTING_KNOCKBACK" }),
  [Ability.HEAD_SMASH]: onTarget({
    ability: "FIGHTING_KNOCKBACK",
    tint: 0xffffa0
  }),
  [Ability.IRON_HEAD]: onTarget({
    ability: "FIGHTING_KNOCKBACK",
    tint: 0x8090a0
  }),
  [Ability.DOUBLE_EDGE]: onTarget({
    ability: "FIGHTING_KNOCKBACK",
    scale: 2,
    tint: 0x606060
  }),
  ["GROUND_GROW"]: onCaster({ scale: 1.5 }),
  ["FISHING"]: onCaster({
    ability: Ability.DIVE,
    scale: 1,
    origin: [0.5, -1],
    depth: DEPTH.ABILITY_GROUND_LEVEL
  }),
  ["SPAWN"]: onCaster({ origin: [0.5, -0.5], depth: DEPTH.BOOST_BACK }),
  ["EVOLUTION"]: onCaster({ origin: [0.5, 0.4], depth: DEPTH.BOOST_BACK }),
  ["HATCH"]: onCaster({
    ability: "SOFT_BOILED",
    origin: [0.5, 0.4],
    depth: DEPTH.BOOST_BACK
  }),
  ["FLYING_TAKEOFF"]: onCaster({ depth: DEPTH.ABILITY_BELOW_POKEMON }),
  ["DIG"]: [
    onCaster({
      ability: "DIG",
      origin: [0, 1],
      scale: [1, 2],
      depth: DEPTH.ABILITY_BELOW_POKEMON
    }),
    onCaster({
      ability: "DIG",
      origin: [1, 1],
      flipX: true,
      delay: 250,
      scale: [1, 2],
      depth: DEPTH.ABILITY_BELOW_POKEMON
    })
  ],
  [Ability.SAND_SPIT]: [
    onCaster({ ability: "DIG", oriented: true, origin: [0, 1], scale: [3, 3] }),
    onCaster({ ability: "DIG", oriented: true, origin: [0, 1], scale: [3, -3] })
  ],
  [Ability.PLASMA_FISSION]: [
    (args) => {
      const distance = distanceM(
        args.positionX,
        args.positionY,
        args.targetX,
        args.targetY
      )
      const speed = 0.01
      const duration = distance / speed

      return projectile({
        scale: 2,
        duration: duration
      })(args)
    }
  ],
  [Ability.PLASMA_TEMPEST]: projectile({
    ability: Ability.PLASMA_FISSION,
    scale: 3,
    duration: 500
  }),
  [Ability.DEEP_FREEZE]: projectile({
    ability: Ability.PLASMA_FISSION,
    scale: 2,
    duration: 300
  }),
  [Ability.PLASMA_FLASH]: projectile({
    ability: Ability.PLASMA_FISSION,
    scale: 2,
    duration: 300,
    tint: 0xffea00
  }),
  [Ability.HYPER_DRILL]: [
    projectile({
      startCoords: "target",
      startPositionOffset: [0, -40],
      duration: 1000,
      scale: 2,
      rotation: Math.PI / 2,
      depth: DEPTH.ABILITY_BELOW_POKEMON
    }),
    onTarget({
      ability: "DIG",
      origin: [0, 1],
      scale: [1, 2],
      depth: DEPTH.ABILITY_BELOW_POKEMON
    }),
    onTarget({
      ability: "DIG",
      origin: [1, 1],
      flipX: true,
      scale: [1, 2],
      depth: DEPTH.ABILITY_BELOW_POKEMON
    }),
    (args) => {
      const [x, y] = transformEntityCoordinates(
        args.targetX,
        args.targetY,
        args.flip
      )
      const hole = args.delay ?? 0
      if (hole > 0) {
        const groundHole = args.scene.add
          .sprite(x, y + 10, "ground_holes", `hole${hole}.png`)
          .setScale(2)
          .setDepth(DEPTH.BOARD_EFFECT_GROUND_LEVEL)
        args.scene.abilitiesVfxGroup?.add(groundHole)
        args.scene.tweens.add({
          alpha: 0,
          delay: 15000,
          duration: 2000,
          targets: groundHole,
          onComplete() {
            groundHole.destroy()
          }
        })
        args.scene.abilitiesVfxGroup?.add(groundHole)
      }
    }
  ],
  [Ability.PURIFY]: [
    onTarget({ ability: Ability.SMOG, scale: 1 }),
    onCaster({ ability: Ability.MUD_BUBBLE, scale: 1 })
  ],
  [Ability.FOUL_PLAY]: onTarget({ ability: Ability.NIGHT_SLASH }),
  [Ability.WONDER_ROOM]: onTargetScale4,
  [Ability.DOUBLE_IRON_BASH]: onTarget({ ability: Ability.DRAIN_PUNCH }),
  [Ability.FOCUS_PUNCH]: onTargetScale2,
  ["FOCUS_PUNCH_CHARGE"]: onCaster({
    ability: "HYPER_BEAM_CHARGE",
    scale: 1,
    tint: 0xffc0c0
  }),
  ["FOCUS_PUNCH_EJECT"]: onSprite(
    ({ targetSprite, orientation, positionX, positionY, scene, flip }) => {
      const [dx, dy] = OrientationVector[orientation]
      const [x, y] = transformEntityCoordinates(
        positionX + dx * 8,
        positionY + dy * 8,
        flip
      )
      scene.tweens.add({
        targets: targetSprite,
        duration: 1000,
        delay: 100,
        x,
        y
      })
    }
  ),
  [Ability.STONE_EDGE]: onCaster({ ability: Ability.TORMENT }),
  [Ability.MAGNET_PULL]: onCaster({
    ability: Ability.THUNDER_CAGE,
    depth: DEPTH.ABILITY_BELOW_POKEMON
  }),
  [Ability.BIDE]: onCaster({ ability: Ability.COUNTER, scale: 3 }),
  [Ability.SHORE_UP]: onCaster({ ability: Ability.PRECIPICE_BLADES }),
  [Ability.DRUM_BEATING]: onCaster({ positionOffset: [-20, -40], angle: -45 }),
  [Ability.TAUNT]: onCaster({ positionOffset: [0, -30] }),
  ["TAUNT_HIT"]: onTarget({ positionOffset: [0, -30] }),
  ["SMOKE_BALL"]: onCasterScale3,
  [Ability.EXPANDING_FORCE]: onCaster({
    ability: Ability.PSYCHIC,
    tint: 0xff90d0,
    scale: 3,
    depth: DEPTH.ABILITY_BELOW_POKEMON
  }),
  [Ability.TAILWIND]: onCaster({
    oriented: true,
    rotation: -Math.PI / 2,
    scale: 4,
    alpha: 0.5
  }),
  [Ability.SILVER_WIND]: projectile({ ability: Ability.EXTREME_SPEED }),
  [Ability.INFERNAL_PARADE]: projectile({
    ease: "Power2",
    tweenProps: { yoyo: true }
  }),
  [Ability.BLUE_FLARE]: projectile({ scale: 3 }),
  [Ability.GLACIATE]: projectile({ scale: 3, duration: 1000 }),
  [Ability.ICE_BURN]: [
    projectile({ ability: Ability.BLUE_FLARE, scale: 3, tint: 0xC7E2E0 }), 
  ],
  [Ability.FREEZE_SHOCK]: [
    projectile({ ability: Ability.FUSION_BOLT, scale: 3, tint: 0xC7E2E0 }), 
  ],
  [Ability.WHEEL_OF_FIRE]: projectile({
    ease: "Power2",
    tweenProps: { yoyo: true }
  }),
  [Ability.SHADOW_BALL]: projectile({
    duration: 1000,
    scale: 2
  }),
  [Ability.TRICK_ROOM]: onTarget({ 
    ability: Ability.WONDER_ROOM,
    tint:  0xff90d0,
    scale: 4         
  }),
  [Ability.GRUDGE]: projectile({
    duration: 750,
    scale: 2,
    ability: Ability.DARK_HARVEST
  }),
  [Ability.FUSION_BOLT]: projectile({ duration: 750, scale: 3 }),
  [Ability.SOLAR_BEAM]: projectile({
    oriented: true,
    rotation: Math.PI / 2,
    origin: [0.5, 1]
  }),
  [Ability.HYDRO_STEAM]: onCaster({
    ability: Ability.SOLAR_BEAM,
    oriented: true,
    rotation: Math.PI / 2,
    origin: [0.5, 1],
    alpha: 0.8,
    tint: 0xa0c0ff,
    positionOffset: [0, -36],
    scale: [4, 2]
  }),
  [Ability.POWDER]: onCaster({
    ability: "PUFF_PINK",
    scale: 3
  }),
  [Ability.ORIGIN_PULSE]: (args) =>
    projectile({
      startCoords: [0, args.targetY],
      endCoords: [8, args.targetY],
      scale: 3,
      duration: 1000
    })(args),
  ["SCALE_SHOT_CHARGE"]: (args) =>
    projectile({
      ability: Ability.SCALE_SHOT,
      duration: args.delay,
      delay: 0,
      animOptions: { repeat: -1, duration: 300 }
    })(args),
  [Ability.SCALE_SHOT]: projectile({ duration: 400 }),
  [Ability.LAST_RESPECTS]: projectile({
    duration: 800,
    ability: "SMOKE_PURPLE",
    scale: 3
  }),
  ["SOLAR_BLADE_CHARGE"]: projectile({
    ability: Ability.RECOVER,
    animOptions: { repeat: -1, duration: 500 },
    duration: 2000,
    scale: 3
  }),
  [Ability.GOLD_RUSH]: projectile({ duration: 1000 }),
  [Ability.MAKE_IT_RAIN]: projectile({
    ability: Ability.GOLD_RUSH,
    duration: 1000,
    scale: 3
  }),
  [Ability.MUD_SHOT]: projectile({ scale: 4, duration: 350 }),
  [Ability.MOONBLAST]: (args) =>
    projectile({
      scale: 1,
      duration: 200,
      delay: args.delay,
      tweenProps: { scale: 2 },
      hitAnim: onTarget({ ability: "PUFF_PINK" })
    })(args),
  [Ability.POLTERGEIST]: projectile({
    scale: 3,
    duration: 750,
    animOptions: { repeat: -1 },
    startPositionOffset: [0, -50]
  }),
  [Ability.ZAP_CANNON]: projectile({ scale: 3, duration: 500 }),
  [Ability.ELECTRO_BALL]: (args) =>
    projectile({
      ability: Ability.ZAP_CANNON,
      duration: args.delay ?? 300,
      hitAnim: onTarget({ ability: Ability.DISCHARGE, scale: 1 })
    })(args),
  [Ability.SPARKLING_ARIA]: projectile({ scale: 3, duration: 1000 }),
  ["FLYING_SKYDIVE"]: skyfall({}),
  [Ability.SKY_ATTACK]: skyfall({ scale: 1.5, duration: 500 }),
  [Ability.SKY_ATTACK_SHADOW]: skyfall({ scale: 1.5, duration: 500 }),
  [Ability.FLYING_PRESS]: skyfall({
    hitAnim: onTarget({ ability: Ability.HEAVY_SLAM })
  }),
  [Ability.ORDER_UP]: [
    skyfall({
      scale: 1,
      ease: Phaser.Math.Easing.Bounce.Out,
      duration: 1000
    }),
    onTarget({ ability: Ability.HEAVY_SLAM, scale: 1, delay: 300 })
  ],
  [Ability.SUNSTEEL_STRIKE]: skyfall({ hitAnim: shakeCamera({}), scale: 1 }),
  ["COMET_CRASH"]: skyfall({
    ability: Ability.SUNSTEEL_STRIKE,
    scale: 0.5,
    duration: 500,
    tint: 0x2020ff
  }),
  [Ability.DARK_NOVA]: skyfall({
    ability: Ability.SUNSTEEL_STRIKE,
    scale: 1,
    duration: 500,
    tint: 0xffe8ff,
    hitAnim: onCaster({
      ability: Ability.COUNTER,
      scale: 2,
      tint: 0xffe0e0
    })
  }),
  ["PSYCHIC_INFINITY"]: onTarget({
    scale: 3,
    positionOffset: [0, -90]
  }),
  [Ability.ACROBATICS]: (args) =>
    projectile({
      startCoords: [args.targetX + 1, args.targetY + 1],
      duration: 300
    })(args),
  [Ability.ROLLOUT]: projectile({ duration: 1000 }),
  [Ability.ICE_BALL]: projectile({ duration: (8 * 1000) / 15 }),
  [Ability.PRESENT]: projectile({ duration: 1000 }),
  [Ability.TOPSY_TURVY]: projectile({}),
  [Ability.WHIRLWIND]: projectile({ duration: 1000 }),
  [Ability.ACID_SPRAY]: projectile({ duration: 1000 }),
  [Ability.WATER_PULSE]: projectile({ duration: 1000, scale: 3 }),
  [Ability.POWER_WASH]: skyfall({
    ability: Ability.PLASMA_FISSION,
    scale: 2,
    duration: 400,
    hitAnim: onTarget({ ability: "SMOKE_BLACK" })
  }),
  [Ability.GRAV_APPLE]: skyfall({
    ability: Ability.NUTRIENTS,
    scale: 3,
    duration: 400,
    hitAnim: onTarget({ ability: "PUFF_RED" })
  }),
  [Ability.NUTRIENTS]: projectile({
    scale: 2,
    duration: 400,
    hitAnim: onTarget({ ability: "PUFF_GREEN" })
  }),
  [Ability.SYRUP_BOMB]: projectile({
    ability: Ability.NUTRIENTS,
    scale: 2,
    duration: 400,
    hitAnim: onTarget({ ability: "PUFF_RED" })
  }),
  [Ability.APPLE_ACID]: projectile({
    ability: Ability.NUTRIENTS,
    scale: 2,
    duration: 400,
    hitAnim: onTarget({ ability: "PUFF_RED" })
  }),
  [Ability.FICKLE_BEAM]: projectile({ duration: 400 }),
  [Ability.POLLEN_PUFF]: projectile({
    ability: Ability.HEAL_ORDER,
    duration: 1000
  }),
  [Ability.PSYSTRIKE]: projectile({ duration: 1000 }),
  [Ability.EGG_BOMB]: projectile({ duration: 800, scale: 3 }),
  [Ability.SPARK]: projectile({ duration: 250 }),
  [Ability.SUCTION_HEAL]: projectile({
    scale: 3,
    startCoords: "target",
    endCoords: "caster"
  }),
  [Ability.HORN_LEECH]: [
    projectile({
      ability: Ability.SUCTION_HEAL,
      tint: 0x80ff90,
      scale: 3,
      startCoords: "target",
      endCoords: "caster"
    }),
    onTarget({ ability: "FIGHTING_KNOCKBACK", scale: 2, tint: 0x80ff90 })
  ],
  [Ability.ANCIENT_POWER]: projectile({ duration: 1000 }),
  [Ability.MOON_DREAM]: projectile({
    startPositionOffset: [0, -100],
    endCoords: "caster",
    scale: 1.5,
    duration: 500,
    tweenProps: { scale: 0.5 }
  }),
  [Ability.MAGICAL_LEAF]: [
    projectile({}),
    onCaster({ ability: "MAGICAL_LEAF_CHARGE" })
  ],
  [Ability.NATURAL_GIFT]: projectile({ duration: 1000 }),
  [Ability.NIGHT_SHADE]: projectile({ duration: 1000 }),
  [Ability.PARABOLIC_CHARGE]: projectile({ duration: 750 }),
  [Ability.ARMOR_CANNON]: (args) =>
    projectile({ duration: 400, scale: 2 - (args.delay ?? 0) * 0.5 })(args),
  [Ability.FISSURE]: [
    projectile({
      scale: 1,
      tweenProps: { scale: 3, yoyo: true },
      startCoords: "target",
      endCoords: "target",
      duration: 800,
      ease: Phaser.Math.Easing.Sine.InOut,
      depth: DEPTH.ABILITY_GROUND_LEVEL
    })
  ],
  [Ability.ERUPTION]: projectile({
    startCoords: "target",
    startPositionOffset: [72, 72]
  }),

  [Ability.THOUSAND_ARROWS]: (args) =>
    projectile({
      startCoords: [args.targetX, BOARD_HEIGHT - 1, false],
      scale: 4,
      duration: 300
    })(args),
  [Ability.TRI_ATTACK]: projectile({}),
  [Ability.AURA_WHEEL]: projectile({ scale: 1 }),
  [Ability.PSYCHIC]: projectile({ duration: 1000, scale: 2 }),
  [Ability.PYRO_BALL]: projectile({
    scale: 1,
    tweenProps: { scale: 2 },
    duration: 500
  }),
  [Ability.SLUDGE_WAVE]: projectile({
    scale: 1,
    duration: 800,
    tweenProps: { scale: 2 },
    hitAnim: onTarget({
      ability: Ability.DIVE,
      scale: 3,
      tint: 0xf060a0,
      depth: DEPTH.ABILITY_GROUND_LEVEL
    })
  }),
  [Ability.LAVA_PLUME]: projectile({
    ability: Ability.SLUDGE_WAVE,
    scale: 1,
    duration: 800,
    tint: 0xffc020,
    tweenProps: { scale: 2 },
    hitAnim: onTarget({ ability: "FLAME_HIT", scale: 2 })
  }),
  [Ability.PRISMATIC_LASER]: (args) =>
    projectile({
      startCoords: [args.targetX, args.flip ? BOARD_HEIGHT : 0, args.flip],
      endCoords: [args.targetX, args.flip ? 0 : BOARD_HEIGHT, args.flip],
      scale: 5
    })(args),
  ["GULP_MISSILE/pikachu"]: (args) =>
    projectile({
      duration:
        distanceM(args.positionX, args.positionY, args.targetX, args.targetY) *
        150,
      oriented: true,
      rotation: -Math.PI / 2
    })(args),
  ["GULP_MISSILE/arrokuda"]: (args) =>
    projectile({
      duration:
        distanceM(args.positionX, args.positionY, args.targetX, args.targetY) *
        150,
      oriented: true,
      rotation: -Math.PI / 2
    })(args),
  [Ability.DRAGON_DARTS]: projectile({
    scale: 1,
    oriented: true,
    positionOffset: [0, -30],
    duration: 400,
    rotation: -Math.PI / 2,
    hitAnim: onTarget({ ability: "PUFF_PINK", scale: 1 })
  }),
  [Ability.ASTRAL_BARRAGE]: (args) => {
    const pokemonSprite = args.pokemonsOnBoard.find(
      (p) => p.positionX === args.positionX && p.positionY === args.positionY
    )
    projectile({
      scale: 1,
      oriented: true,
      startPosition: pokemonSprite
        ? [pokemonSprite.x, pokemonSprite.y]
        : undefined,
      rotation: -Math.PI
    })(args)
  },
  [Ability.MACH_PUNCH]: poppingIcon({
    ability: "FIGHTING/FIST",
    maxScale: 2,
    startCoords: "target"
  }),
  [Ability.MEGA_PUNCH]: poppingIcon({
    ability: "FIGHTING/FIST",
    maxScale: 3,
    startCoords: "target"
  }),
  [Ability.MAWASHI_GERI]: poppingIcon({
    ability: "FIGHTING/FOOT",
    maxScale: 2,
    startCoords: "target"
  }),
  [Ability.THUNDEROUS_KICK]: poppingIcon({
    ability: "FIGHTING/FOOT",
    maxScale: 3,
    startPositionOffset: [0, -20],
    startCoords: "target"
  }),
  [Ability.TRIPLE_KICK]: [
    poppingIcon({
      ability: "FIGHTING/PAW",
      scale: 1.5,
      maxScale: 2,
      duration: 250,
      startPositionOffset: [50, 0],
      startCoords: "target"
    }),
    poppingIcon({
      ability: "FIGHTING/PAW",
      scale: 1.5,
      maxScale: 2,
      duration: 250,
      delay: 200,
      startPositionOffset: [-25, 43],
      startCoords: "target"
    }),
    poppingIcon({
      ability: "FIGHTING/PAW",
      scale: 1.5,
      maxScale: 2,
      duration: 250,
      delay: 400,
      startPositionOffset: [-25, -43],
      startCoords: "target"
    })
  ],
  [Ability.STRING_SHOT]: projectile({
    duration: 1000,
    ease: Phaser.Math.Easing.Cubic.Out,
    alpha: 0.5,
    scale: 0.25,
    tweenProps: { scale: 2, alpha: 0.9 }
  }),
  [Ability.STICKY_WEB]: projectile({
    duration: 1000,
    ease: Phaser.Math.Easing.Cubic.Out,
    alpha: 0.5,
    scale: 0.25,
    tint: 0xccffcc,
    tweenProps: { scale: 2, alpha: 1 }
  }),
  [Ability.ENTANGLING_THREAD]: projectile({
    ability: Ability.STICKY_WEB,
    duration: 1200,
    ease: Phaser.Math.Easing.Cubic.Out,
    alpha: 0.5,
    scale: 0.25,
    tweenProps: { scale: 3, alpha: 0.9 }
  }),
  [Ability.AERIAL_ACE]: (args) =>
    projectile({ startCoords: [args.targetX, 8, false] })(args),
  [Ability.SPIKES]: projectile({
    scale: 1,
    oriented: true,
    rotation: -Math.PI / 2
  }),
  ["TOXIC_SPIKES"]: projectile({
    scale: 2,
    oriented: true,
    rotation: -Math.PI / 2
  }),
  [Ability.TORCH_SONG]: projectile({ oriented: true, rotation: -Math.PI / 2 }),
  ["CURSE_EFFECT"]: tweenAnimation({
    textureKey: "status",
    duration: 1500,
    endCoords: "caster",
    endPositionOffset: [0, -80]
  }),
  [Ability.MAGNET_BOMB]: projectile({ duration: 400 }),
  ["ELECTRO_SHOT_CHARGE"]: onCaster({
    ability: Ability.MAGNET_BOMB,
    depth: DEPTH.ABILITY_BELOW_POKEMON,
    animOptions: { repeat: 5 }
  }),
  [Ability.ELECTRO_SHOT]: onCaster({
    scale: 4,
    origin: [0, 0.5],
    oriented: true,
    animOptions: { repeat: 3 }
  }),
  [Ability.GUNK_SHOT]: projectile({
    duration: 700,
    ease: "Power2",
    hitAnim: onTarget({
      ability: Ability.DIVE,
      scale: 1.5,
      tint: 0xf060a0,
      depth: DEPTH.ABILITY_GROUND_LEVEL
    })
  }),
  [Ability.TOXIC]: projectile({
    ability: Ability.GUNK_SHOT,
    scale: 1.5,
    duration: 500,
    tint: 0xc0ffa0,
    hitAnim: onTarget({
      ability: Ability.DIVE,
      scale: 1.5,
      tint: 0xc06080,
      depth: DEPTH.ABILITY_GROUND_LEVEL
    })
  }),
  [Ability.CHAIN_CRAZED]: onCaster({
    ability: Ability.STUN_SPORE,
    tint: 0xff60ff,
    scale: 2
  }),
  [Ability.MALIGNANT_CHAIN]: (args) => {
    const distance = distanceE(
      args.positionX,
      args.positionY,
      args.targetX,
      args.targetY
    )
    return tweenAnimation({
      scale: [1, 0],
      origin: [0.5, 0],
      oriented: true,
      rotation: -Math.PI / 2,
      duration: 600,
      tweenProps: {
        scaleY: distance * 1.2
      }
    })(args)
  },
  [Ability.SURF]: projectile({
    duration: 600,
    oriented: true,
    rotation: -(3 / 4) * Math.PI
  }),
  [Ability.JET_PUNCH]: [
    projectile({
      ability: Ability.SURF,
      duration: 300,
      oriented: true,
      rotation: -(3 / 4) * Math.PI,
      ease: Phaser.Math.Easing.Quadratic.Out
    }),
    projectile({
      ability: "FIGHTING/FIST",
      duration: 200,
      oriented: false,
      scale: 2,
      tweenProps: { scale: 3 },
      tint: 0xa0c0ff,
      ease: Phaser.Math.Easing.Quadratic.Out
    })
  ],
  [Ability.BURNING_JEALOUSY]: projectile({
    duration: 400
  }),
  [Ability.STRENGTH]: projectile({
    duration: 450,
    startCoords: "target",
    startPositionOffset: [0, -150],
    ease: Phaser.Math.Easing.Quadratic.In
  }),
  [Ability.DRAGON_PULSE]: projectile({
    depth: DEPTH.ABILITY_BELOW_POKEMON,
    tweenProps: { scale: 4 }
  }),
  [Ability.FREEZE_DRY]: projectile({
    duration: 250,
    depth: DEPTH.ABILITY_BELOW_POKEMON,
    destroyOnComplete: true,
    destroyOnTweenComplete: false
  }),
  [Ability.BOLT_BEAK]: projectile({
    duration: 250,
    depth: DEPTH.ABILITY_BELOW_POKEMON
  }),
  [Ability.DARKEST_LARIAT]: projectile({ depth: DEPTH.ABILITY_BELOW_POKEMON }),
  [Ability.FIRESTARTER]: projectile({
    duration: 800,
    startCoords: "target",
    startPositionOffset: [0, -25],
    endPositionOffset: [0, +25]
  }),
  [Ability.GLAIVE_RUSH]: projectile({
    scale: 3,
    depth: DEPTH.ABILITY_BELOW_POKEMON,
    oriented: true,
    rotation: -Math.PI / 2
  }),
  [Ability.PSYCHO_SHIFT]: [
    projectile({
      ability: Ability.PRESENT,
      duration: 300,
      tweenProps: { yoyo: true, repeat: 1 }
    }),
    projectile({
      ability: Ability.PRESENT,
      duration: 300,
      tweenProps: { yoyo: true, repeat: 1 },
      startCoords: "target",
      endCoords: "caster"
    })
  ],
  [Ability.HYPER_VOICE]: (args) =>
    projectile({
      startCoords: [0, args.targetY, args.flip],
      endCoords: [BOARD_WIDTH, args.targetY, args.flip],
      duration: 1000
    })(args),
  [Ability.WHIRLPOOL]: range(1, 3).map((i) =>
    projectile({
      duration: 1000,
      delay: i * 100,
      scale: 0.5,
      ease: "Power1",
      tweenProps: { scale: 2 }
    })
  ),
  [Ability.HEAT_CRASH]: projectile({
    ability: Ability.SUNSTEEL_STRIKE,
    oriented: true,
    rotation: -Math.PI / 2,
    scale: 0.5,
    duration: 300,
    depth: DEPTH.ABILITY_BELOW_POKEMON
  }),
  [Ability.HIDDEN_POWER_A]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_B]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_C]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_D]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_E]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_F]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_G]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_H]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_I]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_J]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_K]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_L]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_M]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_N]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_O]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_P]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_Q]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_R]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_S]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_T]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_U]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_V]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_W]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_X]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_Y]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_Z]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_QM]: hiddenPowerAnimation,
  [Ability.HIDDEN_POWER_EM]: hiddenPowerAnimation,
  [Ability.ICY_WIND]: projectile({ duration: 2000, distance: 12 }),
  [Ability.POWDER_SNOW]: projectile({ duration: 1600, distance: 12 }),
  [Ability.EERIE_SPELL]: projectile({
    duration: 400,
    ability: Ability.FISSURE,
    tint: 0xff00bf
  }),
  [Ability.HURRICANE]: projectile({ duration: 1000, distance: 5 }),
  [Ability.DRILL_RUN]: projectile({
    ability: Ability.HURRICANE,
    duration: 500,
    distance: 1,
    oriented: true,
    rotation: -Math.PI / 2
  }),
  [Ability.DRILL_PECK]: projectile({
    ability: Ability.HURRICANE,
    duration: 500,
    distance: 1,
    oriented: true,
    rotation: -Math.PI / 2
  }),
  [Ability.ROAR]: projectile({
    ability: Ability.WHIRLWIND,
    oriented: true,
    rotation: Math.PI / 2,
    duration: 400,
    distance: 2
  }),
  [Ability.FLEUR_CANNON]: projectile({ duration: 2000, distance: 8 }),
  [Ability.SANDSEAR_STORM]: projectile({ duration: 2000, distance: 12 }),
  [Ability.WILDBOLT_STORM]: projectile({ duration: 2000, distance: 12 }),
  [Ability.BLEAKWIND_STORM]: projectile({ duration: 2000, distance: 12 }),
  [Ability.SPRINGTIDE_STORM]: projectile({ duration: 2000, distance: 12 }),
  [Ability.SOLAR_BLADE]: projectile({
    distance: 1,
    scale: 2,
    oriented: true,
    rotation: -Math.PI / 2,
    duration: 400
  }),
  [Ability.AXE_BLAST]: [
    onTarget({
      ability: Ability.SOLAR_BLADE,
      rotation: (7 * Math.PI) / 9,
      flipY: true,
      scale: 2.5
    }),
    onTarget({
      ability: Ability.SOLAR_BLADE,
      rotation: (2 * Math.PI) / 9,
      scale: 2.5
    })
  ],
  [Ability.DRAGON_BREATH]: onCaster({
    oriented: true,
    origin: [0.5, 1],
    rotation: Math.PI / 2
  }),
  [Ability.BONEMERANG]: projectile({
    distance: 5,
    duration: 1000,
    ease: "Power2",
    tweenProps: { yoyo: true }
  }),
  [Ability.SHADOW_BONE]: projectile({
    ability: Ability.BONEMERANG,
    distance: 5,
    duration: 1000,
    tint: 0x301030
  }),
  [Ability.AURORA_BEAM]: onCaster({
    ability: Ability.MOONGEIST_BEAM,
    origin: [0.5, 0],
    scale: [1, 2],
    oriented: true,
    rotation: -Math.PI / 2
  }),
  [Ability.SPIRIT_SHACKLE]: projectile({
    distance: 8,
    scale: 1,
    duration: 2000,
    oriented: true
  }),
  [Ability.TRIPLE_ARROWS]: range(1, 3).map((i) =>
    projectile({
      ability: Ability.SPIRIT_SHACKLE,
      scale: 0.8,
      distance: 8,
      duration: 1000,
      oriented: true,
      tint: 0xff0000,
      tweenProps: { delay: i * 200 }
    })
  ),
  [Ability.RAZOR_LEAF]: projectile({ distance: 8, duration: 2000 }),
  [Ability.ESPER_WING]: [
    projectile({
      ability: "MAGICAL_LEAF",
      tint: 0xDA70D6,
    })
  ],
  [Ability.PSYCHO_CUT]: range(1, 3).map((i) =>
    projectile({
      distance: 8,
      duration: 1000,
      oriented: true,
      rotation: +Math.PI / 2,
      tweenProps: { delay: i * 100 }
    })
  ),
  [Ability.MIST_BALL]: projectile({
    distance: 4,
    duration: 1000,
    scale: 1,
    ease: "Power2",
    tweenProps: { yoyo: true }
  }),
  [Ability.LUSTER_PURGE]: projectile({
    distance: 4,
    duration: 1000,
    scale: 1,
    ease: "Power2",
    tweenProps: { yoyo: true }
  }),
  [Ability.STEALTH_ROCKS]: projectile({
    distance: 1,
    scale: 2,
    depth: DEPTH.ABILITY_GROUND_LEVEL
  }),
  [Ability.SPIKY_SHIELD]: OrientationArray.map((orientation) =>
    projectile({
      orientation,
      distance: 8,
      ability: "SPIKE",
      oriented: true,
      rotation: -Math.PI / 2,
      duration: 1000
    })
  ),
  [Ability.SHELTER]: onCaster({
    ability: Ability.REFLECT,
    tint: 0xa080ff,
    positionOffset: [0, -15],
    scale: 2.5,
    animOptions: { repeat: 1 }
  }),
  [Ability.AURASPHERE]: projectile({
    distance: 8,
    duration: 2000,
    oriented: true
  }),
  [Ability.ULTRA_THRUSTERS]: [
    onCaster({ ability: Ability.LANDS_WRATH }),
    (args) => {
      const [dx, dy] = OrientationVector[args.orientation]
      // target is used to pass the new destination coordinates
      const coordinatesTarget = transformEntityCoordinates(
        args.targetX,
        args.targetY,
        args.flip
      )
      return tweenAnimation({
        ability: Ability.MYSTICAL_FIRE,
        startCoords: [args.positionX, args.positionY, args.flip],
        startPositionOffset: [dx * 32, dy * 32],
        tweenProps: { x: coordinatesTarget[0], y: coordinatesTarget[1] },
        scale: 2,
        origin: [0.5, 1],
        duration: 750,
        oriented: true,
        rotation: -Math.PI / 2
      })(args)
    }
  ],
  [Ability.BONE_ARMOR]: OrientationArray.map((orientation) =>
    projectile({
      orientation,
      distance: 0.5,
      ability: Ability.BONEMERANG,
      startCoords: "target",
      endCoords: "caster",
      duration: 1000
    })
  ),
  [Ability.CORE_ENFORCER]: [
    onTarget({ positionOffset: [-96, -96], origin: [0, 0.5] }),
    onTarget({
      positionOffset: [+100, -90],
      origin: [0, 0.5],
      rotation: (Math.PI * 3) / 4,
      delay: 100
    }),
    onTarget({ positionOffset: [-96, +96], origin: [0, 0.5], delay: 200 })
  ],
  [Ability.FOLLOW_ME]: poppingIcon({ maxScale: 1, tweenProps: { yoyo: true } }),
  [Ability.AFTER_YOU]: poppingIcon({ maxScale: 1, tweenProps: { yoyo: true } }),

  [Ability.HYPERSPACE_FURY]: (args) => {
    let nbHits = Number(args.orientation)
    if (isNaN(nbHits) || nbHits < 1 || nbHits > 12) {
      nbHits = 4 // default to 4 hits if orientation is not a valid number
    }
    for (let i = 0; i < nbHits; i++) {
      onTarget({
        scale: 1,
        positionOffset: [randomBetween(-30, +30), randomBetween(-30, +30)],
        rotation: -Math.PI / 2,
        tint: 0xc080ff,
        delay: i * 150
      })(args)
    }
  },
  ["HOOPA_PORTAL"]: onCaster({
    scale: 4,
    positionOffset: [0, -20]
  }),

  [Ability.WATER_SHURIKEN]: (args) => {
    const orientations = [
      args.orientation,
      OrientationArray[(OrientationArray.indexOf(args.orientation) + 1) % 8],
      OrientationArray[(OrientationArray.indexOf(args.orientation) + 7) % 8]
    ]
    orientations.forEach((orientation) => {
      projectile({ orientation, distance: 8, duration: 1000 })(args)
    })
  },

  [Ability.SHADOW_FORCE]: (args) => {
    OrientationArray.forEach((orientation) => {
      projectile({
        orientation,
        distance: 1,
        ability: "SMOKE_BLACK",
        duration: 1000
      })(args)
    })
  },

  [Ability.SNIPE_SHOT]: (args) => {
    const targetAngle = angleBetween(
      [args.positionX, args.positionY],
      [args.targetX, args.targetY]
    )
    const orientationAngle = OrientationAngle[args.orientation] ?? 0
    const coordinates = transformEntityCoordinates(
      args.positionX,
      args.positionY,
      args.flip
    )
    projectile({
      ability: "SNIPE_SHOT/projectile",
      scale: 3,
      duration: 1000,
      rotation: -targetAngle,
      endCoords: [
        args.positionX + Math.round(Math.cos(targetAngle) * 10),
        args.positionY + Math.round(Math.sin(targetAngle) * 10),
        args.flip
      ]
    })(args)
    staticAnimation({
      ability: "SNIPE_SHOT/shoot",
      x: coordinates[0] + Math.round(Math.cos(orientationAngle) * 30),
      y: coordinates[1] - Math.round(Math.sin(orientationAngle) * 50) - 10,
      scale: 1,
      oriented: true,
      rotation: Math.PI / 2,
      origin: [0.5, 1]
    })(args)
  },

  [Ability.GLACIAL_LANCE]: (args) => {
    const targetAngle = angleBetween(
      [args.positionX, args.positionY],
      [args.targetX, args.targetY]
    )
    const orientationAngle = OrientationAngle[args.orientation] ?? 0
    const coordinates = transformEntityCoordinates(
      args.positionX,
      args.positionY,
      args.flip
    )
    projectile({
      ability: Ability.GLACIAL_LANCE,
      scale: 1.5,
      duration: 500,
      rotation: -targetAngle - Math.PI / 2,
      hitAnim: onTarget({ ability: Ability.SHEER_COLD, scale: 2 })
    })(args)
    staticAnimation({
      ability: "SNIPE_SHOT/shoot",
      x: coordinates[0] + Math.round(Math.cos(orientationAngle) * 30),
      y: coordinates[1] - Math.round(Math.sin(orientationAngle) * 50) - 10,
      scale: 1,
      oriented: true,
      rotation: Math.PI / 2,
      origin: [0.5, 0.6]
    })(args)
  },

  [Ability.DARK_HARVEST]: ({ scene, positionX, positionY, flip, ap }) => {
    const darkHarvestGroup = scene.add.group()
    const [x, y] = transformEntityCoordinates(positionX, positionY, flip)

    for (let i = 0; i < 5; i++) {
      const darkHarvestSprite = scene.add
        .sprite(0, 0, "abilities", `${Ability.DARK_HARVEST}/000.png`)
        ?.setScale(2 * (1 + ap / 200))
      darkHarvestSprite.anims.play({
        key: Ability.DARK_HARVEST,
        frameRate: 8
      })
      darkHarvestGroup.add(darkHarvestSprite)
      scene.abilitiesVfxGroup?.add(darkHarvestSprite)
    }

    const circle = new Phaser.Geom.Circle(x, y, 48)
    Phaser.Actions.PlaceOnCircle(darkHarvestGroup.getChildren(), circle)

    scene.tweens.add({
      targets: circle,
      radius: 96,
      ease: Phaser.Math.Easing.Quartic.Out,
      duration: 1000,
      onUpdate: function (tween) {
        Phaser.Actions.RotateAroundDistance(
          darkHarvestGroup.getChildren(),
          { x, y },
          0.08,
          circle.radius
        )
      },
      onComplete: function () {
        darkHarvestGroup.destroy(true, true)
      }
    })
  },
  [Ability.PHANTOM_FORCE]: ({ scene, positionX, positionY, flip, ap }) => {
    const [x, y] = transformEntityCoordinates(positionX, positionY, flip)

    // All 9 cells (center + 8 adjacent) in grid units
    const adjacentOffsets = [
      [-1, -1], [0, -1], [1, -1],
      [-1,  0], [1,  0],
      [-1,  1], [0,  1], [1,  1]
    ]

    // Shuffle so sprites trigger in a random order
    Phaser.Utils.Array.Shuffle(adjacentOffsets)

    // Cell size in pixels (adjust to match your grid)
    const CELL_SIZE = 96

    adjacentOffsets.forEach(([dx, dy], i) => {

      const offsetX = x + dx * CELL_SIZE
      const offsetY = y + dy * CELL_SIZE

      scene.time.delayedCall(i * 40, () => {
        const sprite = scene.add
          .sprite(offsetX, offsetY, "abilities", `${Ability.PHANTOM_FORCE}/000.png`)
          ?.setScale(2 * (1 + ap / 200))
        sprite.anims.play({
          key: Ability.PHANTOM_FORCE,
          frameRate: 16
        })
        scene.abilitiesVfxGroup?.add(sprite)
        sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          sprite.destroy()
        })
      })
    })
  },

  [Ability.TWISTER]: ({ scene, positionX, positionY, flip, ap }) => {
    let [x, y] = transformEntityCoordinates(positionX, positionY, flip)
    y -= 30 // adjust y to make the tornado appear more centered on the target

    const tornadoSprite = scene.add
      .sprite(0, 0, "abilities", `${Ability.TWISTER}/000.png`)
      ?.setScale(2 * (1 + ap / 200))
      ?.setTint(0xc0fff0)
    tornadoSprite.anims.play({
      key: Ability.TWISTER,
      frameRate: 15
    })
    scene.abilitiesVfxGroup?.add(tornadoSprite)

    const circle = new Phaser.Geom.Circle(x, y, 48)
    Phaser.Actions.PlaceOnCircle([tornadoSprite], circle, Math.PI)

    scene.tweens.add({
      targets: circle,
      radius: 96,
      ease: Phaser.Math.Easing.Quartic.Out,
      duration: 1000,
      onUpdate: function (tween) {
        Phaser.Actions.RotateAroundDistance(
          [tornadoSprite],
          { x, y },
          0.05,
          circle.radius
        )
      },
      onComplete: function () {
        tornadoSprite.destroy(true)
      }
    })
  },

  [Ability.TRIMMING_MOWER]: ({ scene, positionX, positionY, flip, ap }) => {
    const group = scene.add.group()
    const [x, y] = transformEntityCoordinates(positionX, positionY, flip)

    for (let i = 0; i < 5; i++) {
      const sprite = scene.add
        .sprite(0, 0, "abilities", `${Ability.DARK_HARVEST}/000.png`)
        ?.setScale(2 * (1 + ap / 200))
      sprite.setTint(0x90ee90)
      sprite.anims.play({
        key: Ability.PLASMA_FISSION,
        frameRate: 8
      })
      group.add(sprite)
      scene.abilitiesVfxGroup?.add(sprite)
    }

    const circle = new Phaser.Geom.Circle(x, y, 48)
    Phaser.Actions.PlaceOnCircle(group.getChildren(), circle)

    scene.tweens.add({
      targets: circle,
      radius: 96,
      ease: Phaser.Math.Easing.Quartic.Out,
      duration: 1000,
      onUpdate: function (tween) {
        Phaser.Actions.RotateAroundDistance(
          group.getChildren(),
          { x, y },
          0.08,
          circle.radius
        )
      },
      onComplete: function () {
        group.destroy(true, true)
      }
    })
  },

  [Ability.SHADOW_CLAW]: (args) => {
    const orientations = [
      args.orientation,
      OrientationArray[(OrientationArray.indexOf(args.orientation) + 1) % 8],
      OrientationArray[(OrientationArray.indexOf(args.orientation) + 7) % 8]
    ]
    orientations.forEach((orientation) => {
      projectile({
        scale: 2,
        orientation,
        distance: 1,
        duration: 500,
        ability: "DARK_HARVEST"
      })(args)
    })
  },

  [Ability.DECORATE]: ({ scene, targetX, targetY, flip, ap }) => {
    const decorateGroup = scene.add.group()
    const [x, y] = transformEntityCoordinates(targetX, targetY, flip)

    Sweets.forEach((sweet) => {
      const sweetSprite = scene.add
        .sprite(0, 0, "item", `${sweet}.png`)
        ?.setScale(0.3 * (1 + max(1000)(ap) / 200))
      decorateGroup.add(sweetSprite)
    })

    const circle = new Phaser.Geom.Circle(x, y, 30)
    Phaser.Actions.PlaceOnCircle(decorateGroup.getChildren(), circle)

    scene.tweens.add({
      targets: circle,
      radius: 60,
      ease: Phaser.Math.Easing.Quartic.Out,
      duration: 1000,
      onUpdate: function (tween) {
        Phaser.Actions.RotateAroundDistance(
          decorateGroup.getChildren(),
          { x, y },
          0.08,
          circle.radius
        )
      },
      onComplete: function () {
        decorateGroup.destroy(true, true)
      }
    })
  },

  ["HAIL_PROJECTILE"]: projectile({
    startCoords: "target",
    startPositionOffset: [+60, -240],
    scale: 1,
    duration: 800,
    delay: randomBetween(0, 300),
    hitAnim: onTarget({ ability: Ability.SHEER_COLD, scale: 1 })
  }),

  [Ability.INFESTATION]: (args) => {
    const { positionX, positionY, targetX, targetY } = args
    if (positionY === 8 || positionY === 0) {
      const duration = distanceM(positionX, positionY, targetX, targetY) * 150
      projectile({ ability: "HEAL_ORDER", scale: 3, duration })(args)
    } else {
      onTarget({ ability: "ATTACK_ORDER" })(args)
    }
  },

  ["TIDAL_WAVE"]: tidalWaveAnimation,
  ["FLOOD_WAVE"]: floodWaveAnimation,

  [Ability.COLUMN_CRUSH]: (args) => {
    const distance = min(1)(
      distanceE(args.positionX, args.positionY, args.targetX, args.targetY)
    )
    // orientation field is used to pass the type of the pillar
    const pillarType = Pillars[args.orientation] ?? Pkm.PILLAR_WOOD
    const animKey = `${PkmIndex[pillarType]}/${PokemonTint.NORMAL}/${AnimationType.Idle}/${SpriteType.ANIM}/${Orientation.DOWN}`
    const frame = `${PokemonTint.NORMAL}/${AnimationType.Idle}/${SpriteType.ANIM}/${Orientation.DOWN}/0000`
    return projectile({
      textureKey: PkmIndex[pillarType],
      frame,
      ability: animKey,
      duration: distance * 200,
      tweenProps: { angle: 270 }
    })(args)
  },

  [Ability.SHELL_SIDE_ARM]: projectile({
    duration: 400,
    ability: Ability.FISSURE,
    tint: 0xff00bf
  }),

  ["ZYGARDE_CELL"]: (args) => {
    let orientation = getOrientation(
      args.targetX,
      args.targetY,
      args.positionX,
      args.positionY
    )
    if (!args.flip) orientation = OrientationFlip[orientation]
    const distance = min(1)(
      distanceE(args.positionX, args.positionY, args.targetX, args.targetY)
    )
    const animName = `ZYGARDE_CELL/${orientation}`
    const duration = max(2000)(Math.round(distance * 400))
    return projectile({
      frame: `${animName}/000.png`,
      ability: animName,
      duration,
      delay: randomBetween(0, max(500)(2000 - duration)),
      depth: DEPTH.ABILITY_BELOW_POKEMON,
      startCoords: "target",
      endCoords: "caster",
      scale: 1
    })(args)
  },

  [Ability.ICICLE_MISSILE]: (args) => {
    const {
      scene,
      ability,
      ap,
      delay,
      positionX,
      positionY,
      targetX,
      targetY,
      flip
    } = args
    const coordinates = transformEntityCoordinates(positionX, positionY, flip)
    const coordinatesTarget = transformEntityCoordinates(targetX, targetY, flip)
    const dx = delay === 1 ? -3 : delay === 2 ? +3 : 0 // delay is used to determine the index of the projectile
    const topCoords = transformEntityCoordinates(
      targetX + dx,
      positionY + 5,
      false
    )
    const angle1 = angleBetween(coordinates, topCoords) - Math.PI / 2
    const angle2 = angleBetween(topCoords, coordinatesTarget) - Math.PI / 2

    const missile = addAbilitySprite(scene, ability, ap, coordinates, {
      rotation: angle1
    })

    scene.tweens.chain({
      targets: missile,
      tweens: [
        {
          x: topCoords[0],
          y: topCoords[1],
          rotation: angle2,
          duration: 500,
          ease: Phaser.Math.Easing.Quadratic.Out
        },
        {
          x: coordinatesTarget[0],
          y: coordinatesTarget[1],
          duration: 500,
          ease: Phaser.Math.Easing.Quadratic.In
        }
      ],
      onComplete: () => {
        missile?.destroy()
      }
    })
  },

  [Ability.MIND_BLOWN]: (args) => {
    const { scene, ability, ap, positionX, positionY, targetX, targetY, flip } =
      args
    const coordinates = transformEntityCoordinates(positionX, positionY, flip)
    const topCoords = transformEntityCoordinates(targetX, targetY + 1, false)
    const head = addAbilitySprite(scene, ability, ap, [
      coordinates[0],
      coordinates[1] - 32 * (flip ? -1 : 1)
    ])

    scene.add.tween({
      targets: head,
      x: { value: topCoords[0], ease: Phaser.Math.Easing.Linear },
      y: {
        value: topCoords[1],
        ease:
          Math.sign(targetY - positionY) === Math.sign(flip ? +1 : -1)
            ? Phaser.Math.Easing.Back.In
            : Phaser.Math.Easing.Back.Out
      },
      duration: 1000,
      onComplete: () => {
        head?.destroy()
      }
    })
  },

  ["MIND_BLOWN_FIREWORK"]: (args) =>
    onTarget({
      ability: Ability.MAGIC_POWDER,
      scale: 3,
      tintFill: [0xd369c3, 0x41acf0, 0xe9ef4d, 0xfefff9][args.delay ?? 0],
      positionOffset: [randomBetween(-50, 50), randomBetween(-50, 50)],
      delay: randomBetween(0, 200)
    })(args),

  [Ability.ARM_THRUST]: (args) => {
    // delay is used to pass the info of the number of hits
    for (let i = 0; i < (args.delay ?? 2); i++) {
      tweenAnimation({
        ability: Ability.BRICK_BREAK,
        startCoords: "target",
        startPositionOffset: [randomBetween(-30, 30), randomBetween(-30, 30)],
        tweenProps: { alpha: 0, delay: i * 250 }
      })(args)
    }
  },

  ["PARTING_SHOT"]: ({ scene, ability, ap, positionX, positionY, flip }) => {
    setTimeout(() => {
      const coordinates = transformEntityCoordinates(positionX, positionY, flip)
      const anim = addAbilitySprite(scene, ability, ap, coordinates)
      //add tween chain to make it bouncy (scale 120% with quad easing before scaling back to 100M) before fading out
      scene.tweens.chain({
        targets: anim,
        tweens: [
          {
            scaleX: 1.2,
            scaleY: 1.2,
            ease: Phaser.Math.Easing.Quadratic.Out,
            duration: 100
          },
          {
            scaleX: 1,
            scaleY: 1,
            ease: Phaser.Math.Easing.Quadratic.In,
            duration: 200
          },
          {
            alpha: 0,
            duration: 200
          }
        ],
        onComplete: () => {
          anim?.destroy()
        }
      })
    }, 750)
  },
  [Ability.ROCK_ARTILLERY]: skyfall({
    frame: "ROCK_ARTILLERY/001.png",
    duration: 200,
    scale: 0.75,
    hitAnim: onTarget({ ability: "ROCK_ARTILLERY", scale: 0.75 })
  }),
  [Ability.MOUNTAIN_GALE]: onSprite(({ casterSprite, ...args }) => {
    const {
      scene,
      ability,
      ap,
      delay,
      positionX,
      positionY,
      targetX,
      targetY,
      flip
    } = args
    const coordinates = transformEntityCoordinates(positionX, positionY, flip)
    const coordinatesTarget = transformEntityCoordinates(targetX, targetY, flip)
    const isBergmite = delay !== undefined && delay >= 0
    const topCoords = transformEntityCoordinates(
      (positionX + targetX) / 2,
      targetY + 2,
      false
    )
    const angle1 = angleBetween(coordinates, topCoords) - Math.PI / 2
    const angle2 = angleBetween(topCoords, coordinatesTarget) - Math.PI / 2
    const midAngle = angleBetween(coordinates, coordinatesTarget) - Math.PI / 2

    const tint = casterSprite?.pokemon?.shiny
      ? PokemonTint.SHINY
      : PokemonTint.NORMAL
    const orientation = casterSprite?.orientation ?? Orientation.DOWN
    const animKey = isBergmite
      ? `${PkmIndex.BERGMITE}/${tint}/${AnimationType.Idle}/${SpriteType.ANIM}/${orientation}`
      : ability
    const frame = isBergmite
      ? `${tint}/${AnimationType.Idle}/${SpriteType.ANIM}/${orientation}/0000`
      : undefined

    const missile = addAbilitySprite(scene, animKey, ap, coordinates, {
      scale: isBergmite ? 2 : 1.5,
      flipY: isBergmite,
      textureKey: isBergmite ? PkmIndex.BERGMITE : undefined,
      frame,
      rotation: angle1
    })

    scene.tweens.chain({
      targets: missile,
      tweens: [
        {
          x: topCoords[0],
          y: topCoords[1],
          rotation: midAngle,
          duration: isBergmite ? 250 : 150,
          ease: Phaser.Math.Easing.Quadratic.Out
        },
        {
          x: coordinatesTarget[0],
          y: coordinatesTarget[1],
          rotation: angle2,
          duration: isBergmite ? 150 : 250,
          ease: Phaser.Math.Easing.Quadratic.In
        }
      ],
      onComplete: () => {
        missile?.destroy()
        onTarget({ ability: Ability.ICE_BALL, scale: 2 })({
          ...args,
          positionX: targetX,
          positionY: targetY
        })
      }
    })

    if (!casterSprite) return
    casterSprite.troopers?.forEach((trooper, i) => {
      setTimeout(() => trooper.destroy(), (i + 3) * 200)
    })
    casterSprite.troopers = []
  }),

  [Ability.ZING_ZAP]: onCaster({
    depth: DEPTH.ABILITY_BELOW_POKEMON,
    ability: Ability.DISCHARGE
  }),
  [Ability.STATIC_SHOCK]: onCaster({
    depth: DEPTH.ABILITY_BELOW_POKEMON,
    ability: Ability.DISCHARGE
  }),
  [Ability.SOUL_TRAP]: onCaster({
    depth: DEPTH.ABILITY_BELOW_POKEMON,
    ability: Ability.DARK_VOID,
    scale: 2
  }),
  ["WISP"]: projectile({
    duration: 1000,
    rotation: Math.PI / 2,
    ability: "WISP",
    oriented: true,
    scale: 1,
    startCoords: "target",
    endCoords: "caster",
    hitAnim: onCaster({
      ability: "BARB_BARRAGE",
      scale: 2,
      depth: DEPTH.ABILITY_BELOW_POKEMON
    })
  }),
  [Ability.GEAR_GRIND]: [
    projectile({
      duration: 500,
      scale: 1,
      hitAnim: onTarget({
        ability: "STEEL/hit",
        textureKey: "attacks",
        oriented: true,
        rotation: (-3 * Math.PI) / 4
      })
    }),
    projectile({
      duration: 500,
      delay: 250,
      scale: 1,
      hitAnim: onTarget({
        ability: "STEEL/hit",
        textureKey: "attacks",
        oriented: true,
        rotation: (-3 * Math.PI) / 4
      })
    })
  ],
  [Ability.RISING_VOLTAGE]: onTarget({ positionOffset: [0, -70], scale: 0.9 }),
  ["SUPERCHARGE"]: ({ scene, pokemonsOnBoard, positionX, positionY }) => {
    const pokemon = pokemonsOnBoard.find(
      (p) => p.positionX === positionX && p.positionY === positionY
    )
    if (pokemon) {
      pokemon.superchargeAnimation(scene, false, true)
    }
  },
  ["AURA"]: ({ scene, pokemonsOnBoard, positionX, positionY }) => {
    const pokemon = pokemonsOnBoard.find(
      (p) => p.positionX === positionX && p.positionY === positionY
    )
    if (pokemon) {
      pokemon.auraAnimation(scene, false, true)
    }
  },
  ["HEALTH_FEATHER"]: featherAnimation,
  ["MUSCLE_FEATHER"]: featherAnimation,
  ["RESIST_FEATHER"]: featherAnimation,
  ["GENIUS_FEATHER"]: featherAnimation,
  ["CLEVER_FEATHER"]: featherAnimation,
  ["SWIFT_FEATHER"]: featherAnimation,
  ["PRETTY_FEATHER"]: featherAnimation,
  ["LOADED_DICE"]: projectile({
    tweenProps: {
      angle: 480,
      easeY: Phaser.Math.Easing.Back.In
    },
    hitAnim: onTarget({ ability: "PUFF_GREEN", scale: 1 }),
    scale: 0.25
  }),
  ["GREEN_ORB"]: onCaster({
    ability: "GREEN_ORB",
    oriented: false,
    scale: 3,
    depth: DEPTH.ABILITY_BELOW_POKEMON
  }),
  ["GREEN_ORB_EMERALD"]: onCaster({
    ability: "GREEN_ORB",
    oriented: false,
    scale: 6,
    depth: DEPTH.ABILITY_BELOW_POKEMON
  }),
  ["COMBAT_BLESSING_ACTIVATION"]: onCaster({
    oriented: false,
    scale: 2,
    depth: DEPTH.ABILITY_BELOW_POKEMON
  }),
  ["GALARIAN_DARMANITAN_ZEN_BURN"]: onCaster({
    ability: "INFERNO",
    depth: DEPTH.ABILITY_BELOW_POKEMON,
    scale: 2
  }),
  ["WARP_WAND"]: onSprite(({ targetSprite, ...args }) => {
    onTarget({ ability: "WARP", scale: 1.5 })(args)
    if (targetSprite) {
      targetSprite.isTeleporting = true
      setTimeout(() => {
        targetSprite.isTeleporting = false
      }, 1000)
    }
  }),
  ["WHIRLWIND_WAND"]: projectile({
    ability: Ability.WHIRLWIND,
    duration: 1500,
    distance: 8
  }),
  ["BALL"]: (args) =>
    projectile({
      delay: 0,
      scale: 1,
      duration: args.delay,
      oriented: true
    })(args)
}

export function displayAbility(args: AbilityAnimationArgs) {
  const anims = AbilitiesAnimations[args.ability]
  if (Array.isArray(anims)) {
    anims.forEach((anim) => anim(args))
  } else if (anims) {
    anims(args)
  }
}

export function clearAbilityAnimations(scene: GameScene | DebugScene) {
  scene.abilitiesVfxGroup?.clear(true, true)
}

export function displayBoost(
  pokemonSprite: PokemonSprite,
  stat: Stat,
  dX: number = 0,
  dY: number = 0,
  debug?: boolean
) {
  const tint =
    {
      [Stat.AP]: 0xff00aa,
      [Stat.PP]: 0x8080ff,
      [Stat.SPEED]: 0xffaa44,
      [Stat.ATK]: 0xff6633,
      [Stat.DEF]: 0xffaa66,
      [Stat.SPE_DEF]: 0xff99cc,
      [Stat.SHIELD]: 0xffcc99
    }[stat] ?? 0xffffff

  const boost = new GameObjects.Sprite(
    pokemonSprite.scene,
    0 + dX * CELL_WIDTH,
    dY * CELL_HEIGHT - 20,
    "abilities",
    `BOOST/000.png`
  )
    .setDepth(DEPTH.BOOST_BACK)
    .setScale(2)
    .setTint(tint)

  pokemonSprite.add(boost)

  boost.anims.play({
    key: "BOOST",
    repeat: debug ? 5 : 0
  })
  boost.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
    boost.destroy()
  })
}
