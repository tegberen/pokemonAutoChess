import Phaser from "phaser"
import type {
  AvatarCosmetic,
  AvatarTrail
} from "../../cosmetics/avatar-cosmetics"
import { DEPTH } from "../depths"
import type GameScene from "../scenes/game-scene"
import type PokemonAvatar from "./pokemon-avatar"

type TrailState = {
  elapsed: number
  emissions: number
  lastX: number
  lastY: number
  directionX: number
  directionY: number
  fireHeading?: number
  surfHeading?: number
}

type AuraLayer = {
  atlas: "abilities" | "status"
  animation: string
  x?: number
  y?: number
  scale: number
  alpha?: number
  additive?: boolean
  ground?: boolean
  delay?: number
  frameRate?: number
}

type ActiveAura = {
  avatar: PokemonAvatar
  trail: AvatarTrail
  sprites: Phaser.GameObjects.Sprite[]
  electricGlow?: Phaser.Filters.Glow
  surfSwell?: Phaser.GameObjects.Container
}

const MAX_ACTIVE_TRAIL_EFFECTS = 48
const TRAIL_LIFETIME_MS: Record<AvatarTrail, number> = {
  confetti: 1300,
  flowers: 1400,
  electric: 480,
  water: 750,
  fire: 560
}

const AURA_LAYERS: Partial<Record<AvatarTrail, AuraLayer[]>> = {
  flowers: [
    {
      atlas: "status",
      animation: "FAIRY_FIELD",
      y: 10,
      scale: 2.1,
      alpha: 0.72,
      additive: true,
      ground: true
    },
    {
      atlas: "abilities",
      animation: "PETAL_DANCE",
      y: -20,
      scale: 1.45,
      alpha: 0.82
    },
    {
      atlas: "abilities",
      animation: "PETAL_DANCE",
      x: -14,
      y: -6,
      scale: 1.05,
      alpha: 0.68,
      delay: 720,
      frameRate: 24
    }
  ]
}

export class AvatarCosmeticsRenderer {
  private activeAuras = new Map<string, ActiveAura>()
  private activeTrailEffects = new Set<Phaser.GameObjects.GameObject>()
  private states = new Map<string, TrailState>()

  constructor(private scene: GameScene) {}

  update(
    playerId: string,
    avatar: PokemonAvatar,
    cosmetic: AvatarCosmetic,
    moving: boolean,
    delta: number
  ) {
    if (!avatar.scene || !cosmetic.trail) {
      this.remove(playerId)
      return
    }
    if (!Number.isFinite(delta) || delta < 0) return
    const state = this.states.get(playerId) ?? this.createState(avatar)
    this.states.set(playerId, state)

    if (!moving) {
      this.removeAura(playerId)
      state.elapsed = 0
      state.lastX = avatar.x
      state.lastY = avatar.y
      state.fireHeading = undefined
      state.surfHeading = undefined
      return
    }

    this.ensureAura(playerId, avatar, cosmetic.trail)
    const dx = avatar.x - state.lastX
    const dy = avatar.y - state.lastY
    const distance = Math.hypot(dx, dy)
    if (distance > 0.5) {
      state.directionX = dx / distance
      state.directionY = dy / distance
      if (cosmetic.trail === "fire") {
        const heading = Math.atan2(dy, dx)
        if (state.fireHeading === undefined || distance > 128 || delta > 200) {
          state.fireHeading = heading
        } else {
          const turn = Phaser.Math.Angle.Wrap(heading - state.fireHeading)
          state.fireHeading += turn * (1 - Math.exp(-delta / 85))
        }
        state.directionX = Math.cos(state.fireHeading)
        state.directionY = Math.sin(state.fireHeading)
      } else {
        state.fireHeading = undefined
      }
    }
    state.lastX = avatar.x
    state.lastY = avatar.y

    const surfSwell = this.activeAuras.get(playerId)?.surfSwell
    if (surfSwell) {
      const heading = Math.atan2(state.directionY, state.directionX)
      if (state.surfHeading === undefined || distance > 128 || delta > 200) {
        state.surfHeading = heading
      } else {
        state.surfHeading +=
          Phaser.Math.Angle.Wrap(heading - state.surfHeading) *
          (1 - Math.exp(-delta / 85))
      }
      state.directionX = Math.cos(state.surfHeading)
      state.directionY = Math.sin(state.surfHeading)
      surfSwell
        .setPosition(
          avatar.x + state.directionX * 16,
          avatar.y + 18 + state.directionY * 16
        )
        .setRotation(state.surfHeading + Math.PI / 2)
    } else {
      state.surfHeading = undefined
    }

    state.elapsed += delta
    if (state.elapsed < (cosmetic.emissionIntervalMs ?? 100)) return
    state.elapsed = 0
    state.emissions++
    this.emitFootprint(
      cosmetic.trail,
      avatar.x - state.directionX * 24,
      avatar.y - state.directionY * 24 + 18,
      state
    )
  }

  remove(playerId: string) {
    this.removeAura(playerId)
    this.states.delete(playerId)
  }

  clear() {
    for (const playerId of this.activeAuras.keys()) this.removeAura(playerId)
    this.activeTrailEffects.forEach((effect) => {
      this.scene.tweens.killTweensOf(effect)
      effect.destroy()
    })
    this.activeTrailEffects.clear()
    this.states.clear()
  }

  private ensureAura(
    playerId: string,
    avatar: PokemonAvatar,
    trail: AvatarTrail
  ) {
    const current = this.activeAuras.get(playerId)
    if (current?.trail === trail && current.avatar === avatar) return
    this.removeAura(playerId)

    if (trail === "water") {
      const surfSwell = this.scene.add
        .container(avatar.x, avatar.y + 18)
        .setDepth(DEPTH.GROUND_DECORATION)
      const wave = this.scene.add.graphics()
      this.drawSurfCrest(wave)
      surfSwell.add(wave)
      for (const side of [-1, 0, 1]) {
        const crest = this.scene.add
          .sprite(
            side * 18,
            side === 0 ? -10 : 2,
            "abilities",
            "WAVE_SPLASH/000.png"
          )
          .setOrigin(0.5, 0.8)
          .setScale(side === 0 ? 1.9 : 1.5, side === 0 ? 1.3 : 1.1)
          .setAngle(side * 22)
          .setAlpha(side === 0 ? 0.4 : 0.3)
        crest.anims.play({
          key: "WAVE_SPLASH",
          repeat: -1,
          frameRate: 16,
          delay: (side + 1) * 110
        })
        surfSwell.add(crest)
      }
      const sprites = [-1, 1].map((side) => {
        const spray = this.scene.add
          .sprite(side * 22, 14, "abilities", "WAVE_SPLASH/000.png")
          .setOrigin(0.5, 0.8)
          .setScale(1.2)
          .setAngle(side * 24)
          .setAlpha(0.45)
        spray.anims.play({
          key: "WAVE_SPLASH",
          repeat: -1,
          frameRate: 16,
          delay: side === 1 ? 180 : 0
        })
        avatar.add(spray)
        avatar.sendToBack(spray)
        return spray
      })
      this.activeAuras.set(playerId, { avatar, trail, sprites, surfSwell })
      return
    }
    if (trail === "fire") {
      avatar.addIgniteFlame()
      this.activeAuras.set(playerId, {
        avatar,
        trail,
        sprites: []
      })
      return
    }
    if (trail === "electric") {
      avatar.addElectricField()
      let electricGlow: Phaser.Filters.Glow | undefined
      if (this.scene.game.renderer.type === Phaser.WEBGL) {
        avatar.sprite.enableFilters()
        electricGlow = avatar.sprite.filters?.internal.addGlow(
          0xffe080,
          0.75,
          0,
          0.05
        )
      }
      this.activeAuras.set(playerId, {
        avatar,
        trail,
        sprites: [],
        electricGlow
      })
      return
    }

    const sprites = (AURA_LAYERS[trail] ?? []).map((layer) => {
      const sprite = this.scene.add
        .sprite(
          layer.x ?? 0,
          layer.y ?? 0,
          layer.atlas,
          `${layer.animation}/000.png`
        )
        .setScale(layer.scale)
        .setAlpha(layer.alpha ?? 1)
      if (layer.additive) sprite.setBlendMode(Phaser.BlendModes.ADD)
      sprite.anims.play({
        key: layer.animation,
        repeat: -1,
        delay: layer.delay ?? 0,
        frameRate: layer.frameRate
      })
      avatar.add(sprite)
      if (layer.ground) avatar.sendToBack(sprite)
      return sprite
    })

    this.activeAuras.set(playerId, { avatar, trail, sprites })
  }

  private removeAura(playerId: string) {
    const aura = this.activeAuras.get(playerId)
    if (!aura) return
    aura.surfSwell?.destroy()
    if (aura.avatar.scene) {
      if (aura.trail === "fire") aura.avatar.removeIgniteFlame()
      if (aura.trail === "electric") aura.avatar.removeElectricField()
    }
    if (aura.electricGlow) {
      const filters = aura.avatar.sprite.filters?.internal
      if (filters) filters.remove(aura.electricGlow)
      else aura.electricGlow.destroy()
    }
    aura.sprites.forEach((sprite) => sprite.destroy())
    this.activeAuras.delete(playerId)
  }

  private createState(avatar: PokemonAvatar): TrailState {
    return {
      elapsed: 0,
      emissions: 0,
      lastX: avatar.x,
      lastY: avatar.y,
      directionX: 0,
      directionY: 1
    }
  }

  private emitFootprint(
    trail: AvatarTrail,
    x: number,
    y: number,
    state: TrailState
  ) {
    if (this.activeTrailEffects.size >= MAX_ACTIVE_TRAIL_EFFECTS) return
    const accent = state.emissions % 6 === 0
    if (trail === "fire") this.spawnTrailingFlame(x, y, accent)
    const effect = this.createGraphics(x, y)
    if (!effect) return

    if (trail === "fire") this.drawEmbers(effect, accent)
    else if (trail === "electric") this.drawSparks(effect, accent, state)
    else if (trail === "flowers") this.drawFlowerStep(effect, accent)
    else if (trail === "confetti") this.drawConfetti(effect, accent, state)
    else if (trail === "water") this.drawSurf(effect, accent, state)

    this.animateFootprint(effect, trail, x, y, state)
  }

  private drawEmbers(effect: Phaser.GameObjects.Graphics, accent: boolean) {
    const count = accent ? 8 : 5
    for (let i = 0; i < count; i++) {
      effect.fillStyle(i % 2 === 0 ? 0xffd45c : 0xff6124, 0.95)
      effect.fillCircle(
        Phaser.Math.Between(-16, 16),
        Phaser.Math.Between(-7, 9),
        Phaser.Math.Between(1, accent ? 4 : 3)
      )
    }
    effect.setBlendMode(Phaser.BlendModes.ADD)
  }

  private drawSparks(
    effect: Phaser.GameObjects.Graphics,
    accent: boolean,
    state: TrailState
  ) {
    const sideX = -state.directionY
    const sideY = state.directionX
    const dischargeSide = state.emissions % 2 === 0 ? -1 : 1
    const startOffset = dischargeSide * Phaser.Math.Between(8, 20)
    const length = Phaser.Math.Between(accent ? 95 : 60, accent ? 120 : 85)
    const points = Array.from({ length: 6 }, (_, segment) => {
      const distance = (segment / 5) * length
      const offset = startOffset + Phaser.Math.Between(-14, 14)
      return new Phaser.Math.Vector2(
        -state.directionX * distance + sideX * offset,
        -state.directionY * distance + sideY * offset
      )
    })
    effect.lineStyle(accent ? 7 : 5, 0xffe080, 0.12)
    effect.strokePoints(points)
    effect.lineStyle(accent ? 2.5 : 1.5, 0xfff4ab, accent ? 0.95 : 0.8)
    effect.strokePoints(points)

    const reach = Phaser.Math.Between(32, accent ? 65 : 48)
    const sideArc = [
      new Phaser.Math.Vector2(sideX * -startOffset, sideY * -startOffset),
      new Phaser.Math.Vector2(
        sideX * -dischargeSide * reach * 0.5 + state.directionX * 10,
        sideY * -dischargeSide * reach * 0.5 + state.directionY * 10
      ),
      new Phaser.Math.Vector2(
        sideX * -dischargeSide * reach * 0.75 - state.directionX * 7,
        sideY * -dischargeSide * reach * 0.75 - state.directionY * 7
      ),
      new Phaser.Math.Vector2(
        sideX * -dischargeSide * reach + state.directionX * 16,
        sideY * -dischargeSide * reach + state.directionY * 16
      )
    ]
    effect.lineStyle(4, 0xffe080, 0.1)
    effect.strokePoints(sideArc)
    effect.lineStyle(1.5, 0xfff4ab, 0.7)
    effect.strokePoints(sideArc)

    const frontReach = Phaser.Math.Between(52, accent ? 72 : 62)
    const frontArc = Array.from({ length: 5 }, (_, segment) => {
      const across = (segment - 2) / 2
      const forward = frontReach - Math.abs(across) * 30
      const sideways = across * 28 + Phaser.Math.Between(-4, 4)
      return new Phaser.Math.Vector2(
        state.directionX * forward + sideX * sideways,
        state.directionY * forward + sideY * sideways
      )
    })
    effect.lineStyle(6, 0xffe080, 0.12)
    effect.strokePoints(frontArc)
    effect.lineStyle(2, 0xfff4ab, 0.85)
    effect.strokePoints(frontArc)

    for (let branch = 0; branch < (accent ? 3 : 2); branch++) {
      const start = points[branch + 1]
      const side = branch % 2 === 0 ? -1 : 1
      const reach = Phaser.Math.Between(18, accent ? 42 : 30)
      const fork = [
        start,
        new Phaser.Math.Vector2(
          start.x - state.directionX * 8 + sideX * side * reach * 0.6,
          start.y - state.directionY * 8 + sideY * side * reach * 0.6
        ),
        new Phaser.Math.Vector2(
          start.x - state.directionX * 22 + sideX * side * reach,
          start.y - state.directionY * 22 + sideY * side * reach
        )
      ]
      effect.lineStyle(1, 0xffe080, 0.65)
      effect.strokePoints(fork)
    }
    effect.fillStyle(0xfff4ab, 0.7)
    effect.fillCircle(0, 0, accent ? 3 : 2)
    effect.setBlendMode(Phaser.BlendModes.ADD)
  }

  private drawSurfCrest(effect: Phaser.GameObjects.Graphics) {
    for (const [width, color, alpha] of [
      [9, 0x63dce5, 0.11],
      [4, 0x8ee9ed, 0.28],
      [2.2, 0xe0fff9, 0.68]
    ]) {
      const edges = [-1, 1].map((side) =>
        Array.from({ length: 41 }, (_, i) => {
          const t = i / 20 - 1
          const slope = 32 * t + 48 * t * t * t
          const normalLength = Math.hypot(42, slope)
          const taper = Math.pow(Math.sin((i / 40) * Math.PI), 1.5)
          const offset = (side * width * taper) / 2
          return new Phaser.Math.Vector2(
            t * 42 - (slope / normalLength) * offset,
            -24 + 16 * t * t + 12 * t ** 4 + (42 / normalLength) * offset
          )
        })
      )
      effect.fillStyle(color, alpha)
      effect.fillPoints([...edges[0], ...edges[1].reverse()], true)
    }
  }

  private drawSurf(
    effect: Phaser.GameObjects.Graphics,
    accent: boolean,
    state: TrailState
  ) {
    const sideX = -state.directionY
    const sideY = state.directionX
    const point = (forward: number, sideways: number) =>
      new Phaser.Math.Vector2(
        state.directionX * forward + sideX * sideways,
        state.directionY * forward + sideY * sideways
      )
    for (let patch = 0; patch < 3; patch++) {
      const wake = Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * Math.PI * 2
        return point(
          16 - patch * 32 + Math.cos(angle) * 30,
          Math.sin(angle) * (32 - patch * 8)
        )
      })
      effect.fillStyle(0x58cfde, 0.25 - patch * 0.07)
      effect.fillPoints(wake, true)
    }
    if (state.emissions % 2 === 0) {
      this.spawnSurfWake(effect.x, effect.y, state)
      for (let i = 0; i < (accent ? 2 : 1); i++) {
        const offset = point(
          Phaser.Math.Between(-30, 30),
          Phaser.Math.Between(-30, 30)
        )
        this.spawnSurfBubble(effect.x + offset.x, effect.y + offset.y)
      }
    }
  }

  private spawnSurfWake(x: number, y: number, state: TrailState) {
    if (this.activeTrailEffects.size >= MAX_ACTIVE_TRAIL_EFFECTS) return
    const wake = this.scene.add
      .sprite(
        x + state.directionX * 16,
        y + state.directionY * 16,
        "abilities",
        "WAVE_SPLASH/000.png"
      )
      .setDepth(DEPTH.GROUND_DECORATION)
      .setOrigin(0.5, 0.8)
      .setRotation(Math.atan2(state.directionY, state.directionX) - Math.PI / 2)
      .setScale(1.8, 2)
      .setAlpha(0.55)
    wake.anims.play({ key: "WAVE_SPLASH", repeat: -1, frameRate: 16 })
    this.activeTrailEffects.add(wake)
    this.scene.tweens.add({
      targets: wake,
      x: wake.x - state.directionX * 20,
      y: wake.y - state.directionY * 20,
      scaleX: 0.5,
      scaleY: 0.8,
      alpha: 0,
      duration: 800,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.activeTrailEffects.delete(wake)
        wake.destroy()
      }
    })
  }

  private spawnSurfBubble(x: number, y: number) {
    const bubble = this.createGraphics(x, y)
    if (!bubble) return
    const radius = Phaser.Math.Between(3, 6)
    bubble.setDepth(DEPTH.HIT_FX_ABOVE_POKEMON)
    bubble.fillStyle(0x63d5ec, 0.15)
    bubble.fillCircle(0, 0, radius)
    bubble.lineStyle(1, 0xc9f8ff, 0.65)
    bubble.strokeCircle(0, 0, radius)
    bubble.fillStyle(0xf2fdff, 0.85)
    bubble.fillCircle(-radius * 0.3, -radius * 0.3, 1)
    this.scene.tweens.add({
      targets: bubble,
      x: x + Phaser.Math.Between(-10, 10),
      y: y - Phaser.Math.Between(22, 38),
      scale: 1.6,
      alpha: 0,
      duration: Phaser.Math.Between(450, 650),
      ease: "Sine.easeIn",
      onComplete: () => {
        this.activeTrailEffects.delete(bubble)
        bubble.destroy()
      }
    })
  }

  private drawFlowerStep(effect: Phaser.GameObjects.Graphics, accent: boolean) {
    const flowers = accent ? 5 : 3
    const colors = [0xff8fbd, 0xffd6eb, 0xb59bff, 0xff836c]
    for (let flower = 0; flower < flowers; flower++) {
      const x = Phaser.Math.Between(-32, 32)
      const y = Phaser.Math.Between(-18, 16)
      const radius = Phaser.Math.Between(4, accent ? 8 : 6)
      const rotation = Phaser.Math.FloatBetween(0, Math.PI * 2)
      effect.fillStyle(0x6da96a, 0.65)
      effect.fillEllipse(x - radius * 1.5, y + radius, radius * 2.5, radius)
      effect.fillEllipse(x + radius * 1.5, y + radius, radius * 2.5, radius)
      effect.fillStyle(Phaser.Math.RND.pick(colors), 0.9)
      for (let petal = 0; petal < 5; petal++) {
        const angle = rotation + (petal / 5) * Math.PI * 2
        effect.fillCircle(
          x + Math.cos(angle) * radius,
          y + Math.sin(angle) * radius,
          radius * 0.8
        )
      }
      effect.fillStyle(0xffe168, 1)
      effect.fillCircle(x, y, radius * 0.5)
      effect.fillStyle(0xfff7df, 0.85)
      effect.fillCircle(x - 1, y - 1, 1.5)
    }
    effect.setScale(0.7)
  }

  private drawConfetti(
    effect: Phaser.GameObjects.Graphics,
    accent: boolean,
    state: TrailState
  ) {
    const colors = [0xff477e, 0xffd447, 0x35d9c5, 0x7289ff, 0xf6f2ff]
    const pieces = accent ? 26 : 18
    const sideX = -state.directionY
    const sideY = state.directionX
    for (let i = 0; i < pieces; i++) {
      effect.fillStyle(colors[i % colors.length], 0.95)
      const distance = Phaser.Math.Between(0, accent ? 100 : 70)
      const spread = Phaser.Math.Between(-28, 28)
      const x = -state.directionX * distance + sideX * spread
      const y = -state.directionY * distance + sideY * spread
      if (i % 3 === 0) effect.fillCircle(x, y, Phaser.Math.Between(2, 4))
      else {
        const width = Phaser.Math.Between(2, 5)
        const height = Phaser.Math.Between(5, 9)
        effect.fillRect(x - width / 2, y - height / 2, width, height)
      }
    }
  }

  private createGraphics(x: number, y: number) {
    if (this.activeTrailEffects.size >= MAX_ACTIVE_TRAIL_EFFECTS) return
    const graphics = this.scene.add
      .graphics()
      .setPosition(x, y)
      .setDepth(DEPTH.GROUND_DECORATION)
    this.activeTrailEffects.add(graphics)
    return graphics
  }

  private spawnTrailingFlame(x: number, y: number, accent: boolean) {
    if (this.activeTrailEffects.size >= MAX_ACTIVE_TRAIL_EFFECTS) return
    const flame = this.scene.add
      .sprite(
        x + 3 + Phaser.Math.Between(-8, 8),
        y + 32 + Phaser.Math.Between(-3, 3),
        "abilities",
        "EMBER/000.png"
      )
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.GROUND_DECORATION)
      .setScale(
        Phaser.Math.FloatBetween(accent ? 3.4 : 2.8, accent ? 4.2 : 3.6),
        Phaser.Math.FloatBetween(accent ? 7 : 5.5, accent ? 9 : 7.5)
      )
      .setAlpha(0.9)
    flame.anims.play({
      key: "EMBER",
      repeat: -1,
      frameRate: Phaser.Math.Between(12, 18)
    })
    this.activeTrailEffects.add(flame)
    this.scene.tweens.add({
      targets: flame,
      alpha: 0,
      y: flame.y - Phaser.Math.Between(4, 10),
      scaleX: flame.scaleX * 0.25,
      scaleY: flame.scaleY * 0.15,
      duration: accent ? 1800 : 1500,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.activeTrailEffects.delete(flame)
        flame.destroy()
      }
    })
  }

  private animateFootprint(
    effect: Phaser.GameObjects.Graphics,
    trail: AvatarTrail,
    x: number,
    y: number,
    state: TrailState
  ) {
    const rises = trail === "fire"
    const scatters = trail === "confetti" || trail === "flowers"
    const sideX = -state.directionY
    const sideY = state.directionX
    this.scene.tweens.add({
      targets: effect,
      x: x + (scatters ? sideX * Phaser.Math.Between(-18, 18) : 0),
      y:
        y +
        (rises ? -Phaser.Math.Between(20, 34) : 0) +
        (scatters ? sideY * Phaser.Math.Between(-12, 12) : 0),
      angle:
        trail === "confetti"
          ? Phaser.Math.Between(-12, 12)
          : scatters
            ? Phaser.Math.Between(-50, 50)
            : 0,
      scale:
        trail === "fire"
          ? 0.55
          : trail === "electric" || trail === "water"
            ? 1
            : 1.18,
      alpha: 0,
      duration: TRAIL_LIFETIME_MS[trail],
      ease:
        trail === "confetti" || trail === "flowers"
          ? "Sine.easeIn"
          : "Sine.easeOut",
      onComplete: () => {
        this.activeTrailEffects.delete(effect)
        effect.destroy()
      }
    })
  }
}
