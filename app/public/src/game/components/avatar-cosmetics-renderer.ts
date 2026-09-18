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
  sprites: Phaser.GameObjects.GameObject[]
  electricGlow?: Phaser.Filters.Glow
  surfSwell?: Phaser.GameObjects.Container
  dragonKingGlow?: Phaser.Filters.Glow
  dragonKingSprites?: Array<
    Phaser.GameObjects.Image | Phaser.GameObjects.Sprite
  >
  dragonKingAlphas?: number[]
  dragonKingFadeIn?: Phaser.Tweens.Tween
  dragonKingFade?: Phaser.Tweens.Tween
  dragonKingGlowFade?: Phaser.Tweens.Tween
  dragonKingUnderlays?: Phaser.GameObjects.Image[]
  dragonKingUnderlayAlphas?: number[]
  dragonKingUnderlayFade?: Phaser.Tweens.Tween
}

const MAX_ACTIVE_TRAIL_EFFECTS = 48
const DRAGON_KING_IDLE_GRACE_MS = 2000
const DRAGON_KING_AURA_FADE_MS = 1800
const SLIPSTREAM_FEATHER = "PRETTY_FEATHER"
const TRAIL_LIFETIME_MS: Record<AvatarTrail, number> = {
  confetti: 1300,
  flowers: 1400,
  electric: 480,
  water: 750,
  fire: 560,
  dragonKing: 700,
  slipstream: 1700
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
      if (cosmetic.trail === "dragonKing") this.fadeDragonKingAura(playerId)
      else this.removeAura(playerId)
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
    if (current?.trail === trail && current.avatar === avatar) {
      if (trail === "dragonKing" && current.dragonKingFade) {
        current.dragonKingFade.stop()
        current.dragonKingFade = undefined
        current.dragonKingGlowFade?.stop()
        current.dragonKingGlowFade = undefined
        if (current.dragonKingGlow) current.dragonKingGlow.outerStrength = 1.05
        current.dragonKingUnderlayFade?.stop()
        current.dragonKingUnderlayFade = undefined
        current.dragonKingUnderlays?.forEach((underlay, index) => {
          underlay.setAlpha(current.dragonKingUnderlayAlphas?.[index] ?? 1)
        })
        current.dragonKingSprites?.forEach((sprite, index) => {
          sprite.setAlpha(current.dragonKingAlphas?.[index] ?? 1)
        })
      }
      return
    }
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
    if (trail === "dragonKing") {
      const startingPhase = Phaser.Math.Between(0, 359)
      const orbitPhase = (base: number) =>
        (startingPhase + base + Phaser.Math.Between(-20, 20) + 360) % 360
      const underlays = [
        this.createDragonKingVoidHaze(avatar),
        this.createDragonKingUnderlay(avatar)
      ]
      const sprites = [
        ...underlays,
        this.createDragonKingCurrent(
          avatar,
          orbitPhase(248),
          48,
          29,
          0.16,
          3.2,
          0.62,
          0xa04dd1,
          4800
        ),
        this.createDragonKingCurrent(
          avatar,
          orbitPhase(82),
          45,
          27,
          0.12,
          3.5,
          0.56,
          0xef6a32,
          5600
        ),
        this.createDragonKingCurrent(
          avatar,
          orbitPhase(322),
          58,
          35,
          0.1,
          4.4,
          0.54,
          0xae54d8,
          3600
        ),
        this.createDragonKingOrb(
          avatar,
          "DRAGON_PULSE",
          orbitPhase(0),
          50,
          32,
          0.85,
          0x9a45c4,
          0.66,
          5900
        ),
        this.createDragonKingOrb(
          avatar,
          "DRAGON_PULSE",
          orbitPhase(180),
          46,
          30,
          0.72,
          0xe95c30,
          0.56,
          5400
        ),
        this.createDragonKingOrb(
          avatar,
          "WISP",
          orbitPhase(92),
          43,
          34,
          0.72,
          0x813bb1,
          0.58,
          4400
        ),
        this.createDragonKingOrb(
          avatar,
          "WISP",
          orbitPhase(272),
          39,
          30,
          0.6,
          0xa143a9,
          0.5,
          4600
        ),
        this.createDragonKingOrb(
          avatar,
          "DRAGON_ENERGY",
          orbitPhase(48),
          57,
          36,
          0.16,
          0x9b4dc1,
          0.32,
          3600
        ),
        this.createDragonKingOrb(
          avatar,
          "DRAGON_ENERGY",
          orbitPhase(228),
          54,
          34,
          0.14,
          0xe66035,
          0.28,
          4100
        ),
        this.createDragonKingOrb(
          avatar,
          "DRAGON_ENERGY",
          orbitPhase(136),
          62,
          39,
          0.11,
          0x9348b8,
          0.22,
          3300
        ),
        this.createDragonKingOrb(
          avatar,
          "ELECTRIC/hit",
          orbitPhase(36),
          26,
          18,
          0.24,
          0xa75ddd,
          0.7,
          1800
        ),
        this.createDragonKingOrb(
          avatar,
          "ELECTRIC/hit",
          orbitPhase(168),
          23,
          16,
          0.2,
          0xe06a3c,
          0.58,
          2200
        ),
        this.createDragonKingOrb(
          avatar,
          "ELECTRIC/hit",
          orbitPhase(284),
          20,
          14,
          0.17,
          0x7d49b5,
          0.5,
          1600
        )
      ]
      const dragonKingSprites = sprites.slice(underlays.length) as Array<
        Phaser.GameObjects.Image | Phaser.GameObjects.Sprite
      >
      const dragonKingAlphas = dragonKingSprites.map((sprite) => sprite.alpha)
      dragonKingSprites.forEach((sprite) => sprite.setAlpha(0))
      const fadeInDriver = { progress: 0 }
      const dragonKingFadeIn = this.scene.tweens.add({
        targets: fadeInDriver,
        progress: 1,
        duration: 600,
        ease: "Sine.easeOut",
        onUpdate: () => {
          dragonKingSprites.forEach((sprite, index) => {
            sprite.setAlpha(dragonKingAlphas[index] * fadeInDriver.progress)
          })
        }
      })
      let dragonKingGlow: Phaser.Filters.Glow | undefined
      if (this.scene.game.renderer.type === Phaser.WEBGL) {
        avatar.sprite.enableFilters()
        dragonKingGlow = avatar.sprite.filters?.internal.addGlow(
          0x9e4bcb,
          1.05,
          0,
          0.09
        )
      }
      this.activeAuras.set(playerId, {
        avatar,
        trail,
        sprites,
        dragonKingGlow,
        dragonKingSprites,
        dragonKingAlphas,
        dragonKingFadeIn,
        dragonKingUnderlays: underlays,
        dragonKingUnderlayAlphas: underlays.map((underlay) => underlay.alpha)
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
    if (aura.dragonKingGlow) {
      const filters = aura.avatar.sprite.filters?.internal
      if (filters) filters.remove(aura.dragonKingGlow)
      else aura.dragonKingGlow.destroy()
    }
    aura.dragonKingFadeIn?.stop()
    aura.dragonKingFade?.stop()
    aura.dragonKingGlowFade?.stop()
    aura.dragonKingUnderlayFade?.stop()
    aura.sprites.forEach((sprite) => {
      this.scene.tweens.killTweensOf(sprite)
      sprite.destroy()
    })
    this.activeAuras.delete(playerId)
  }

  private fadeDragonKingAura(playerId: string) {
    const aura = this.activeAuras.get(playerId)
    if (
      !aura ||
      aura.trail !== "dragonKing" ||
      aura.dragonKingFade ||
      !aura.dragonKingSprites?.length
    ) {
      return
    }
    aura.dragonKingFadeIn?.stop()
    aura.dragonKingFade = this.scene.tweens.add({
      targets: aura.dragonKingSprites,
      alpha: 0,
      delay: DRAGON_KING_IDLE_GRACE_MS,
      duration: DRAGON_KING_AURA_FADE_MS,
      ease: "Sine.easeOut",
      onComplete: () => {
        if (this.activeAuras.get(playerId) === aura) this.removeAura(playerId)
      }
    })
    if (aura.dragonKingGlow) {
      aura.dragonKingGlowFade = this.scene.tweens.add({
        targets: aura.dragonKingGlow,
        outerStrength: 0,
        delay: DRAGON_KING_IDLE_GRACE_MS,
        duration: DRAGON_KING_AURA_FADE_MS,
        ease: "Sine.easeOut"
      })
    }
    if (aura.dragonKingUnderlays?.length) {
      aura.dragonKingUnderlayFade = this.scene.tweens.add({
        targets: aura.dragonKingUnderlays,
        alpha: 0,
        delay: DRAGON_KING_IDLE_GRACE_MS,
        duration: DRAGON_KING_AURA_FADE_MS,
        ease: "Sine.easeOut"
      })
    }
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
    if (trail === "dragonKing") return
    if (trail === "slipstream") {
      const primarySide: -1 | 1 = state.emissions % 2 === 0 ? -1 : 1
      this.spawnSlipstreamGust(x, y, state, primarySide)
      if (state.emissions % 3 === 0) {
        this.spawnSlipstreamFeather(x, y, state, accent, primarySide)
      }
      return
    }
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

  private createDragonKingCurrent(
    avatar: PokemonAvatar,
    phase: number,
    radiusX: number,
    radiusY: number,
    scale: number,
    stretch: number,
    alpha: number,
    tint: number,
    duration: number,
    additive = true
  ) {
    const avatarScale = Math.max(
      1,
      Math.max(avatar.sprite.displayWidth, avatar.sprite.displayHeight) / 64
    )
    const orbitRadiusX = radiusX * avatarScale
    const orbitRadiusY = radiusY * avatarScale
    const orbitScale = scale * avatarScale
    const image = this.scene.add
      .image(0, -7, this.getDragonKingGlowTexture())
      .setOrigin(0.5)
      .setBlendMode(
        additive ? Phaser.BlendModes.ADD : Phaser.BlendModes.MULTIPLY
      )
      .setTint(tint)
      .setAlpha(alpha)
    avatar.add(image)
    const orbitingImage = image as Phaser.GameObjects.Image & {
      orbitAngle: number
    }
    orbitingImage.orbitAngle = phase

    const setCurrentPosition = () => {
      const angle = Phaser.Math.DegToRad(orbitingImage.orbitAngle)
      const breathe = 0.84 + Math.sin(angle * 2) * 0.16
      image
        .setPosition(
          Math.cos(angle) * orbitRadiusX,
          -7 + Math.sin(angle) * orbitRadiusY
        )
        .setRotation(angle + Math.PI / 2)
        .setScale(
          orbitScale * stretch * breathe,
          orbitScale * (0.5 + breathe * 0.2)
        )
      if (Math.sin(angle) < -0.15) avatar.sendToBack(image)
      else avatar.bringToTop(image)
    }
    setCurrentPosition()
    this.scene.tweens.add({
      targets: orbitingImage,
      orbitAngle: phase + 360,
      duration,
      ease: "Sine.easeInOut",
      repeat: -1,
      onUpdate: setCurrentPosition
    })
    return image
  }

  private getDragonKingGlowTexture() {
    const textureKey = "dragon-king-elder-glow"
    if (this.scene.textures.exists(textureKey)) return textureKey

    const size = 128
    const texture = this.scene.textures.createCanvas(textureKey, size, size)
    if (!texture) return textureKey
    const context = texture.getContext()
    const radius = size / 2
    const gradient = context.createRadialGradient(
      radius,
      radius,
      0,
      radius,
      radius,
      radius
    )
    gradient.addColorStop(0, "rgba(255,255,255,0.94)")
    gradient.addColorStop(0.28, "rgba(255,255,255,0.58)")
    gradient.addColorStop(0.7, "rgba(255,255,255,0.14)")
    gradient.addColorStop(1, "rgba(255,255,255,0)")
    context.fillStyle = gradient
    context.fillRect(0, 0, size, size)
    texture.refresh()
    return textureKey
  }

  private createDragonKingUnderlay(avatar: PokemonAvatar) {
    const avatarScale = Math.max(
      1,
      Math.max(avatar.sprite.displayWidth, avatar.sprite.displayHeight) / 64
    )
    const underlay = this.scene.add
      .image(0, 7, this.getDragonKingGlowTexture())
      .setOrigin(0.5)
      .setScale(0.92 * avatarScale, 0.64 * avatarScale)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setTint(0x11243a)
      .setAlpha(0.48)
    avatar.add(underlay)
    avatar.sendToBack(underlay)
    this.scene.tweens.add({
      targets: underlay,
      scaleX: 1.02 * avatarScale,
      scaleY: 0.7 * avatarScale,
      duration: 2600,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1
    })
    return underlay
  }

  private createDragonKingVoidHaze(avatar: PokemonAvatar) {
    const avatarScale = Math.max(
      1,
      Math.max(avatar.sprite.displayWidth, avatar.sprite.displayHeight) / 64
    )
    const haze = this.scene.add
      .image(0, 4, this.getDragonKingGlowTexture())
      .setOrigin(0.5)
      .setScale(1.35 * avatarScale, 0.88 * avatarScale)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setTint(0x09182b)
      .setAlpha(0.3)
    avatar.add(haze)
    avatar.sendToBack(haze)
    this.scene.tweens.add({
      targets: haze,
      scaleX: 1.48 * avatarScale,
      scaleY: 0.96 * avatarScale,
      duration: 3800,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1
    })
    return haze
  }

  private createDragonKingOrb(
    avatar: PokemonAvatar,
    animation: "DRAGON_ENERGY" | "DRAGON_PULSE" | "ELECTRIC/hit" | "WISP",
    phase: number,
    radiusX: number,
    radiusY: number,
    scale: number,
    tint: number,
    alpha: number,
    duration: number
  ) {
    const avatarScale = Math.max(
      1,
      Math.max(avatar.sprite.displayWidth, avatar.sprite.displayHeight) / 64
    )
    const orbitRadiusX = radiusX * avatarScale
    const orbitRadiusY = radiusY * avatarScale
    const orbitScale = scale * avatarScale
    const atlas = animation === "ELECTRIC/hit" ? "attacks" : "abilities"
    const sprite = this.scene.add
      .sprite(0, -7, atlas, `${animation}/000.png`)
      .setOrigin(0.5)
      .setScale(orbitScale)
      .setAlpha(alpha)
      .setTint(tint)
      .setBlendMode(Phaser.BlendModes.ADD)
    sprite.anims.play({
      key: animation,
      repeat: -1,
      frameRate:
        animation === "ELECTRIC/hit" ? 20 : animation === "WISP" ? 10 : 12
    })
    avatar.add(sprite)
    sprite.setAngle(phase)

    const setOrbitPosition = () => {
      const angle = Phaser.Math.DegToRad(sprite.angle)
      const pulse = 0.9 + Math.sin(angle * 2) * 0.12
      sprite.setPosition(
        Math.cos(angle) * orbitRadiusX,
        -7 + Math.sin(angle) * orbitRadiusY
      )
      sprite.setScale(orbitScale * pulse)
      if (Math.sin(angle) < -0.15) avatar.sendToBack(sprite)
      else avatar.bringToTop(sprite)
    }
    setOrbitPosition()
    this.scene.tweens.add({
      targets: sprite,
      angle: phase + 360,
      duration,
      ease: "Linear",
      repeat: -1,
      onUpdate: setOrbitPosition
    })
    return sprite
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

  private spawnSlipstreamFeather(
    x: number,
    y: number,
    state: TrailState,
    accent: boolean,
    driftDirection: -1 | 1
  ) {
    if (this.activeTrailEffects.size >= MAX_ACTIVE_TRAIL_EFFECTS) return

    const sideX = -state.directionY
    const sideY = state.directionX
    const driftWidth = Phaser.Math.Between(26, accent ? 48 : 40)
    const startHeight = Phaser.Math.Between(2, accent ? 18 : 12)
    const scale =
      Phaser.Math.FloatBetween(accent ? 0.9 : 0.68, accent ? 1.04 : 0.84) * 0.85
    const baseAngle = Phaser.Math.Between(-28, 28)
    const originX = x + state.directionX * 24
    const originY = y + state.directionY * 24 - 16
    const startX = originX + sideX * driftDirection * driftWidth * 0.35
    const startY = originY - startHeight
    const streamDistance = Phaser.Math.Between(94, accent ? 142 : 122)
    const endX =
      startX -
      state.directionX * streamDistance +
      sideX * driftDirection * Phaser.Math.Between(8, 22)
    const endY =
      startY -
      state.directionY * streamDistance +
      sideY * driftDirection * Phaser.Math.Between(8, 22)
    const flight = { progress: 0 }

    const effect = this.scene.add
      .image(
        startX,
        startY,
        "abilities",
        `FEATHER_DANCE/${SLIPSTREAM_FEATHER}.png`
      )
      .setOrigin(0.5)
      .setDepth(DEPTH.ABILITY_BELOW_POKEMON)
      .setScale(scale)
      .setAlpha(0)
      .setAngle(baseAngle)
    this.activeTrailEffects.add(effect)

    this.scene.tweens.add({
      targets: flight,
      progress: 1,
      duration: Phaser.Math.Between(1250, 1550),
      ease: "Sine.easeInOut",
      onUpdate: () => {
        const progress = flight.progress
        const sway = Math.sin(progress * Math.PI) * driftDirection
        const fadeIn = Math.min(1, progress / 0.16)
        const fadeOut = Math.max(0, 1 - (progress - 0.62) / 0.38)
        const fade = Math.min(fadeIn, fadeOut)
        const shrink = 1 - Math.max(0, (progress - 0.58) / 0.42) * 0.58

        effect
          .setPosition(
            Phaser.Math.Linear(startX, endX, progress) + sideX * sway * 4,
            Phaser.Math.Linear(startY, endY, progress) + sideY * sway * 4
          )
          .setAngle(baseAngle + driftDirection * (8 + progress * 34) + sway * 8)
          .setScale(scale * shrink * (1 + sway * 0.025))
          .setAlpha(0.96 * fade)
      },
      onComplete: () => {
        this.activeTrailEffects.delete(effect)
        effect.destroy()
      }
    })
  }

  private spawnSlipstreamGust(
    x: number,
    y: number,
    state: TrailState,
    side: -1 | 1
  ) {
    if (this.activeTrailEffects.size >= MAX_ACTIVE_TRAIL_EFFECTS) return

    const sideX = -state.directionY
    const sideY = state.directionX
    const heading = Math.atan2(state.directionY, state.directionX)
    const gust = this.scene.add
      .sprite(
        x - state.directionX * 8 + sideX * side * Phaser.Math.Between(34, 62),
        y - state.directionY * 8 + sideY * side * Phaser.Math.Between(34, 62),
        "abilities",
        "TAILWIND/000.png"
      )
      .setOrigin(0.5)
      .setDepth(DEPTH.ABILITY_BELOW_POKEMON)
      .setRotation(heading + Math.PI / 2)
      .setScale(1.15, 1.55)
      .setTint(0xbfeaff)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.34)
    gust.anims.play({ key: "TAILWIND", repeat: -1, frameRate: 24 })
    this.activeTrailEffects.add(gust)
    this.scene.tweens.add({
      targets: gust,
      x: gust.x - state.directionX * Phaser.Math.Between(46, 74),
      y: gust.y - state.directionY * Phaser.Math.Between(46, 74),
      scaleX: 0.55,
      scaleY: 0.9,
      alpha: 0,
      duration: 720,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.activeTrailEffects.delete(gust)
        gust.destroy()
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
