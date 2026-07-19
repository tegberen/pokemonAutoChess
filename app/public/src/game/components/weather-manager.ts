import Phaser from "phaser"
import { preference } from "../../preferences"
import { DEPTH } from "../depths"
import type GameScene from "../scenes/game-scene"

export default class WeatherManager {
  scene: Phaser.Scene
  screen: Phaser.Geom.Rectangle
  colorFilter: Phaser.GameObjects.Rectangle | undefined
  particlesEmitters: Phaser.GameObjects.Particles.ParticleEmitter[]
  image: Phaser.GameObjects.Image | undefined
  images: Phaser.GameObjects.Image[]
  graphics: Phaser.GameObjects.Graphics[]
  timers: Phaser.Time.TimerEvent[]
  tweens: Phaser.Tweens.BaseTween[]
  containers: Phaser.GameObjects.Container[]
  tileSprites: Phaser.GameObjects.TileSprite[]
  rectangles: Phaser.GameObjects.Rectangle[]
  fxs: Phaser.Filters.Controller[]

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.screen = new Phaser.Geom.Rectangle(0, 0, 3000, 2000)
    this.particlesEmitters = []
    this.images = []
    this.graphics = []
    this.timers = []
    this.tweens = []
    this.containers = []
    this.tileSprites = []
    this.rectangles = []
    this.fxs = []
  }

  addRain() {
    const offscreenSource = {
      x: { min: 0, max: 2000 },
      y: { min: 0, max: 100 }
    }

    this.colorFilter = this.scene.add.existing(
      new Phaser.GameObjects.Rectangle(
        this.scene,
        1500,
        1000,
        3000,
        2000,
        0x296383,
        0.3
      ).setDepth(DEPTH.WEATHER_FX)
    )

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "rain", {
        ...offscreenSource,
        deathZone: { source: this.screen, type: "onLeave" },
        frequency: 50,
        speedY: { min: 260, max: 280 },
        lifespan: 5000,
        scale: 0.5
      })
    )

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "rain", {
        ...offscreenSource,
        deathZone: { source: this.screen, type: "onLeave" },
        frequency: 100,
        speedY: { min: 360, max: 380 },
        lifespan: 5000,
        scale: 0.8
      })
    )

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "rain", {
        ...offscreenSource,
        deathZone: { source: this.screen, type: "onLeave" },
        frequency: 200,
        quantity: 4,
        speedY: { min: 460, max: 480 },
        lifespan: 5000
      })
    )
  }

  addSnow() {
    const offscreenSource = {
      x: { min: 0, max: 2000 },
      y: { min: 0, max: 100 }
    }
    this.colorFilter = this.scene.add.existing(
      new Phaser.GameObjects.Rectangle(
        this.scene,
        1500,
        1000,
        3000,
        2000,
        0xa7cade,
        0.3
      ).setDepth(DEPTH.WEATHER_FX)
    )

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "snowflakes", {
        ...offscreenSource,
        deathZone: { source: this.screen, type: "onLeave" },
        frequency: 10,
        speedY: { min: 70, max: 80 },
        lifespan: 5000,
        scale: 0.5
      })
    )

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "snowflakes", {
        ...offscreenSource,
        deathZone: { source: this.screen, type: "onLeave" },
        frequency: 20,
        speedY: { min: 100, max: 110 },
        lifespan: 5000,
        scale: 0.8
      })
    )

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "snowflakes", {
        ...offscreenSource,
        deathZone: { source: this.screen, type: "onLeave" },
        frequency: 40,
        speedY: { min: 200, max: 210 },
        lifespan: 5000
      })
    )
  }

  addSun() {
    this.image = this.scene.add.existing(
      new Phaser.GameObjects.Image(this.scene, 550, 250, "sun")
        .setScale(4, 4)
        .setDepth(DEPTH.WEATHER_FX)
    )
    this.colorFilter = this.scene.add.existing(
      new Phaser.GameObjects.Rectangle(
        this.scene,
        1500,
        1000,
        3000,
        2000,
        0xffe800,
        0.15
      ).setDepth(DEPTH.WEATHER_FX)
    )
  }

  addSandstorm() {
    const leftScreenSource = {
      x: { min: -200, max: 600 },
      y: { min: 500, max: 1500 }
    }
    const deathZoneSource = new Phaser.Geom.Rectangle(0, 0, 2000, 4000)

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "sand", {
        ...leftScreenSource,
        deathZone: { source: deathZoneSource, type: "onLeave" },
        frequency: 25,
        speedX: { min: 560, max: 580 },
        speedY: { min: -500, max: -600 },
        lifespan: 3000,
        scale: 0.8
      }),
      this.scene.add.particles(0, 0, "sand", {
        ...leftScreenSource,
        deathZone: { source: deathZoneSource, type: "onLeave" },
        frequency: 50,
        speedX: { min: 560, max: 580 },
        speedY: { min: -600, max: -700 },
        lifespan: 3000,
        scale: 1.2
      }),
      this.scene.add.particles(0, 0, "sand", {
        ...leftScreenSource,
        deathZone: { source: deathZoneSource, type: "onLeave" },
        frequency: 100,
        quantity: 4,
        scale: 1.5,
        speedX: { min: 660, max: 680 },
        speedY: { min: -600, max: -700 },
        lifespan: 3000
      })
    )

    this.colorFilter = this.scene.add.existing(
      new Phaser.GameObjects.Rectangle(
        this.scene,
        1500,
        1000,
        3000,
        2000,
        0x9a791a,
        0.2
      ).setDepth(DEPTH.WEATHER_FX)
    )
  }

  addNight() {
    this.colorFilter = this.scene.add.existing(
      new Phaser.GameObjects.Rectangle(
        this.scene,
        1500,
        1000,
        3000,
        2000,
        0x141346,
        0.6
      ).setDepth(DEPTH.WEATHER_FX)
    )
  }

  addDrought() {
    this.colorFilter = this.scene.add.existing(
      new Phaser.GameObjects.Rectangle(
        this.scene,
        1500,
        1000,
        3000,
        2000,
        0xa04818,
        0.3
      ).setDepth(DEPTH.WEATHER_FX)
    )

    // Add heat haze effect using WebGL shader
    if (
      this.scene.renderer.type === Phaser.WEBGL &&
      !preference("disableAnimatedTilemap")
    ) {
      this.fxs =
        (this.scene as GameScene).map?.layers.map((layer) => {
          const tilemapLayer = layer.tilemapLayer
          tilemapLayer.enableFilters()
          return tilemapLayer.filters!.external.addDisplacement(
            "distort",
            -0.001,
            0
          )
        }) ?? []

      this.tweens = [
        this.scene.tweens.add({
          targets: this.fxs,
          x: 0.001,
          y: 0,
          yoyo: true,
          loop: -1,
          duration: 500,
          ease: "sine.inout"
        })
      ]
    }
  }

  addBloodMoon() {
    this.colorFilter = this.scene.add.existing(
      new Phaser.GameObjects.Rectangle(
        this.scene,
        1500,
        1000,
        3000,
        2000,
        0x460818,
        0.6
      ).setDepth(DEPTH.WEATHER_FX)
    )

    const offscreenSource = {
      x: { min: 0, max: 2000 },
      y: { min: 0, max: 100 }
    }

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "rain", {
        ...offscreenSource,
        deathZone: { source: this.screen, type: "onLeave" },
        frequency: 400,
        speedY: { min: 260, max: 280 },
        tint: 0xff0000,
        lifespan: 5000,
        scale: 0.7
      })
    )

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "rain", {
        ...offscreenSource,
        deathZone: { source: this.screen, type: "onLeave" },
        frequency: 500,
        speedY: { min: 360, max: 380 },
        tint: 0xff0000,
        lifespan: 5000,
        scale: 0.8
      })
    )

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "rain", {
        ...offscreenSource,
        deathZone: { source: this.screen, type: "onLeave" },
        frequency: 800,
        quantity: 4,
        speedY: { min: 460, max: 480 },
        tint: 0xff0000,
        lifespan: 5000
      })
    )
  }

  addWind() {
    const leftScreenSource = {
      x: { min: 0, max: 100 },
      y: { min: 0, max: 1000 }
    }
    const deathZoneSource = new Phaser.Geom.Rectangle(0, 0, 2000, 4000)

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "wind", {
        ...leftScreenSource,
        deathZone: { source: deathZoneSource, type: "onLeave" },
        frequency: 100,
        speedX: { min: 500, max: 800 },
        speedY: { min: -100, max: 100 },
        lifespan: 2000,
        scale: 1
      }),
      this.scene.add.particles(0, 0, "wind", {
        ...leftScreenSource,
        deathZone: { source: deathZoneSource, type: "onLeave" },
        frequency: 100,
        speedX: { min: 1000, max: 1400 },
        speedY: { min: -100, max: 100 },
        lifespan: 2000,
        scale: 0.5
      })
    )
  }

  addSmog() {
    this.image = this.scene.add.existing(
      new Phaser.GameObjects.Image(this.scene, 1000, 500, "clouds")
        .setTint(0x508050)
        .setScale(3, 2)
        .setOrigin(0.5)
        .setDepth(DEPTH.WEATHER_FX)
        .setAlpha(0.5)
    )
    this.colorFilter = this.scene.add.existing(
      new Phaser.GameObjects.Rectangle(
        this.scene,
        1500,
        1000,
        3000,
        2000,
        0x6e994c,
        0.15
      ).setDepth(DEPTH.WEATHER_FX)
    )

    const leftScreenSource = {
      x: { min: -200, max: -100 },
      y: { min: 0, max: 1000 }
    }
    const rightScreenSource = {
      x: { min: 2100, max: 2200 },
      y: { min: 0, max: 1000 }
    }
    const deathZoneSource = new Phaser.Geom.Rectangle(-250, 0, 2500, 4000)

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "smog", {
        ...leftScreenSource,
        deathZone: { source: deathZoneSource, type: "onLeave" },
        frequency: 400,
        speedX: { min: 100, max: 160 },
        speedY: { min: 0, max: 0 },
        lifespan: 20000,
        scale: 1
      })
    )

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "smog", {
        ...leftScreenSource,
        deathZone: { source: deathZoneSource, type: "onLeave" },
        frequency: 600,
        speedX: { min: 80, max: 140 },
        speedY: { min: 0, max: 0 },
        lifespan: 20000,
        scale: 2
      })
    )

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "smog", {
        ...rightScreenSource,
        deathZone: { source: deathZoneSource, type: "onLeave" },
        frequency: 400,
        speedX: { min: -160, max: -100 },
        speedY: { min: 0, max: 0 },
        lifespan: 20000,
        scale: 1
      })
    )

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "smog", {
        ...rightScreenSource,
        deathZone: { source: deathZoneSource, type: "onLeave" },
        frequency: 600,
        speedX: { min: -140, max: -80 },
        speedY: { min: 0, max: 0 },
        lifespan: 20000,
        scale: 2
      })
    )
  }

  addMurky() {
    this.image = this.scene.add.existing(
      new Phaser.GameObjects.Image(this.scene, 1000, 500, "clouds")
        .setTint(0x80c0a0)
        .setScale(2, 1)
        .setOrigin(0.5)
        .setDepth(DEPTH.WEATHER_FX)
        .setAlpha(0.25)
    )
    this.colorFilter = this.scene.add.existing(
      new Phaser.GameObjects.Rectangle(
        this.scene,
        1500,
        1000,
        3000,
        2000,
        0x142e59,
        0.3
      ).setDepth(DEPTH.WEATHER_FX)
    )

    const leftScreenSource = {
      x: { min: -200, max: -100 },
      y: { min: 0, max: 1000 }
    }
    const rightScreenSource = {
      x: { min: 2100, max: 2200 },
      y: { min: 0, max: 1000 }
    }
    const deathZoneSource = new Phaser.Geom.Rectangle(-250, 0, 2500, 4000)

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "fog", {
        ...leftScreenSource,
        deathZone: { source: deathZoneSource, type: "onLeave" },
        frequency: 600,
        speedX: { min: 20, max: 30 },
        speedY: { min: 0, max: 0 },
        lifespan: 40000,
        scale: 1
      })
    )

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "fog", {
        ...leftScreenSource,
        deathZone: { source: deathZoneSource, type: "onLeave" },
        frequency: 1000,
        speedX: { min: 15, max: 25 },
        speedY: { min: 0, max: 0 },
        lifespan: 40000,
        scale: 2
      })
    )

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "fog", {
        ...rightScreenSource,
        deathZone: { source: deathZoneSource, type: "onLeave" },
        frequency: 600,
        speedX: { min: -20, max: -30 },
        speedY: { min: 0, max: 0 },
        lifespan: 40000,
        scale: 1
      })
    )

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "fog", {
        ...rightScreenSource,
        deathZone: { source: deathZoneSource, type: "onLeave" },
        frequency: 1000,
        speedX: { min: -15, max: -25 },
        speedY: { min: 0, max: 0 },
        lifespan: 40000,
        scale: 2
      })
    )
  }

  addMist() {
    const offscreenSource = {
      x: { min: 0, max: 2000 },
      y: { min: 900, max: 1000 }
    }
    this.image = this.scene.add.existing(
      new Phaser.GameObjects.Image(this.scene, 1000, 500, "clouds")
        .setScale(3, 2)
        .setOrigin(0.5)
        .setDepth(DEPTH.WEATHER_FX)
        .setAlpha(0.4)
    )
    this.colorFilter = this.scene.add.existing(
      new Phaser.GameObjects.Rectangle(
        this.scene,
        1500,
        1000,
        3000,
        2000,
        0x994c6e,
        0.15
      ).setDepth(DEPTH.WEATHER_FX)
    )
    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "snowflakes", {
        ...offscreenSource,
        deathZone: { source: this.screen, type: "onLeave" },
        frequency: 20,
        speedY: { min: -60, max: -40 },
        lifespan: 5000,
        scale: 1,
        tint: 0xff80ae,
        alpha: { start: 1, end: 0 }
      }),
      this.scene.add.particles(0, 0, "snowflakes", {
        ...offscreenSource,
        deathZone: { source: this.screen, type: "onLeave" },
        frequency: 40,
        speedY: { min: -60, max: -40 },
        lifespan: 5000,
        scale: 2,
        tint: 0xff80be,
        alpha: { start: 1, end: 0 }
      })
    )
  }

  addStorm() {
    const offscreenSource = {
      x: { min: 0, max: 2000 },
      y: { min: 0, max: 100 }
    }
    this.colorFilter = this.scene.add.existing(
      new Phaser.GameObjects.Rectangle(
        this.scene,
        1500,
        1000,
        3000,
        2000,
        0x2b3838,
        0.4
      ).setDepth(DEPTH.WEATHER_FX)
    )

    this.particlesEmitters.push(
      this.scene.add.particles(0, 0, "rain", {
        ...offscreenSource,
        deathZone: { source: this.screen, type: "onLeave" },
        frequency: 200,
        quantity: 12,
        speedY: { min: 700, max: 800 },
        speedX: { min: 900, max: 1000 },
        lifespan: 5000,
        scale: 0.8,
        tint: 0xa0a0a0
      }),

      this.scene.add.particles(0, 0, "rain", {
        ...offscreenSource,
        deathZone: { source: this.screen, type: "onLeave" },
        frequency: 200,
        quantity: 8,
        speedY: { min: 800, max: 1000 },
        speedX: { min: 1000, max: 1200 },
        lifespan: 5000,
        scale: 1,
        tint: 0xa0a0a0
      })
    )
  }

  addAurora() {
    const arcColors = [0xefe726, 0xb4436e, 0xa80155, 0x950274]
    const sparkTints = [0xf0c698, 0xefe726, 0xb4436e, 0xa80155, 0x950274]
    const auroraPalette = [
      0xf0c698, // cream
      0xefe726, // yellow
      0xb4436e, // rose
      0xa80155, // magenta
      0x950274, // purple
      0xa80155, // magenta
      0xb4436e // rose
    ]

    const strips = [
      { min: -40, max: 470 },
      { min: 1500, max: 1950 }
    ]

    // --- textures ------------------------------------------------------
    // soft radial glow (for the faint background haze)
    const glowKey = "aurora-blob"
    if (!this.scene.textures.exists(glowKey)) {
      const size = 256
      const tex = this.scene.textures.createCanvas(glowKey, size, size)
      if (tex) {
        const ctx = tex.getContext()
        const r = size / 2
        const glow = ctx.createRadialGradient(r, r, 0, r, r, r)
        glow.addColorStop(0, "rgba(255,255,255,1)")
        glow.addColorStop(0.4, "rgba(255,255,255,0.55)")
        glow.addColorStop(1, "rgba(255,255,255,0)")
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, size, size)
        tex.refresh()
      }
    }
    //---  the metallic sparks
    const sparkKey = "steel-spark"
    if (!this.scene.textures.exists(sparkKey)) {
      const w = 8
      const h = 48
      const tex = this.scene.textures.createCanvas(sparkKey, w, h)
      if (tex) {
        const ctx = tex.getContext()
        const g = ctx.createLinearGradient(0, 0, 0, h)
        g.addColorStop(0, "rgba(255,255,255,0)")
        g.addColorStop(0.5, "rgba(255,255,255,1)")
        g.addColorStop(1, "rgba(255,255,255,0)")
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
        tex.refresh()
      }
    }

    // --- dark backing layer (rendered first, so it sits UNDER the aurora)
    for (const strip of strips) {
      const cx = (strip.min + strip.max) / 2
      const backing = this.scene.add.existing(
        new Phaser.GameObjects.Image(this.scene, cx, 520, glowKey)
          .setOrigin(0.5)
          .setDepth(DEPTH.WEATHER_FX)
          .setBlendMode(Phaser.BlendModes.MULTIPLY)
          .setTint(0x241830)
          .setScale(3.6, 7.2)
          .setAlpha(0.45)
      )
      this.images.push(backing)
    }

    // --- soft aurora base layer
    const count = 12
    for (let i = 0; i < count; i++) {
      const onLeft = i % 2 === 0
      const strip = onLeft ? strips[0] : strips[1]
      const x = strip.min + Phaser.Math.Between(0, strip.max - strip.min)
      const y = 120 + (760 / (count - 1)) * i + Phaser.Math.Between(-40, 40)
      const baseAlpha = 0.16 + Phaser.Math.FloatBetween(0, 0.08)
      const blob = this.scene.add.existing(
        new Phaser.GameObjects.Image(this.scene, x, y, glowKey)
          .setOrigin(0.5)
          .setDepth(DEPTH.WEATHER_FX)
          .setBlendMode(Phaser.BlendModes.SCREEN)
          .setTint(auroraPalette[i % auroraPalette.length])
          .setScale(2.4, 4.0)
          .setAlpha(baseAlpha)
      )
      this.images.push(blob)

      // cross-fade brightness in place
      this.tweens.push(
        this.scene.tweens.add({
          targets: blob,
          alpha: { from: baseAlpha * 0.4, to: baseAlpha + 0.12 },
          duration: 2600 + Phaser.Math.Between(0, 2200),
          delay: Phaser.Math.Between(0, 2000),
          yoyo: true,
          repeat: -1,
          ease: "sine.inout"
        })
      )

      // breathing size + tiny sway so the aurora flows
      this.tweens.push(
        this.scene.tweens.add({
          targets: blob,
          scaleX: { from: 2.2, to: 2.8 },
          scaleY: { from: 3.7, to: 4.4 },
          x: x + Phaser.Math.Between(-50, 50),
          duration: 3500 + Phaser.Math.Between(0, 2500),
          yoyo: true,
          repeat: -1,
          ease: "sine.inout"
        })
      )
    }

    // --- fast, sharp metallic sparks streaking upward
    for (const strip of strips) {
      this.particlesEmitters.push(
        this.scene.add.particles(0, 0, sparkKey, {
          x: { min: strip.min - 40, max: strip.max + 40 },
          y: { min: 120, max: 960 },
          frequency: 80,
          quantity: 1,
          lifespan: { min: 350, max: 1000 },
          speedX: { min: -30, max: 30 },
          speedY: { min: -300, max: -140 },
          scale: { start: 1.0, end: 0.2 },
          alpha: { start: 1, end: 0 },
          rotate: { min: -12, max: 12 },
          tint: sparkTints,
          blendMode: "ADD"
        })
      )
    }

    // --- crackling lightning arcs
    const makeBolt = (x: number, y0: number, y1: number) => {
      const segs = Phaser.Math.Between(5, 9)
      const pts: { x: number; y: number }[] = [{ x, y: y0 }]
      for (let s = 1; s <= segs; s++) {
        const t = s / segs
        const yy = Phaser.Math.Linear(y0, y1, t)
        const jitter = s === segs ? 0 : Phaser.Math.Between(-45, 45)
        pts.push({ x: x + jitter, y: yy })
      }
      return pts
    }
    const stroke = (
      g: Phaser.GameObjects.Graphics,
      pts: { x: number; y: number }[]
    ) => {
      g.beginPath()
      g.moveTo(pts[0].x, pts[0].y)
      for (let s = 1; s < pts.length; s++) g.lineTo(pts[s].x, pts[s].y)
      g.strokePath()
    }
    const spawnArc = () => {
      const strip = Phaser.Utils.Array.GetRandom(strips)
      const x = Phaser.Math.Between(strip.min, strip.max)
      const y0 = Phaser.Math.Between(80, 260)
      const y1 = Phaser.Math.Between(560, 940)
      const color = Phaser.Utils.Array.GetRandom(arcColors)
      const pts = makeBolt(x, y0, y1)
      const g = this.scene.add
        .graphics()
        .setDepth(DEPTH.WEATHER_FX)
        .setBlendMode(Phaser.BlendModes.ADD)
      g.lineStyle(8, color, 0.22)
      stroke(g, pts)
      g.lineStyle(2.5, 0xffffff, 0.95)
      stroke(g, pts)
      this.graphics.push(g)
      this.tweens.push(
        this.scene.tweens.add({
          targets: g,
          alpha: 0,
          duration: Phaser.Math.Between(110, 260),
          ease: "cubic.in",
          onComplete: () => {
            g.destroy()
            const idx = this.graphics.indexOf(g)
            if (idx >= 0) this.graphics.splice(idx, 1)
          }
        })
      )
    }
    // bursty crackle: every tick, fire 0-2 bolts so gaps and clusters happen
    this.timers.push(
      this.scene.time.addEvent({
        delay: 280,
        loop: true,
        callback: () => {
          const n = Phaser.Math.Between(0, 2)
          for (let k = 0; k < n; k++) spawnArc()
        }
      })
    )
  }

  addPlague() {
    // --- dead-ground pall: a dark, desaturated brown-green haze that drains
    // the life out of the battlefield so nothing looks alive underneath
    this.colorFilter = this.scene.add.existing(
      new Phaser.GameObjects.Rectangle(
        this.scene,
        1500,
        1000,
        3000,
        2000,
        0x14160e,
        0.42
      ).setDepth(DEPTH.WEATHER_FX)
    )
    // faint, uneven "rot" throb so the darkness feels alive with decay
    this.tweens.push(
      this.scene.tweens.add({
        targets: this.colorFilter,
        alpha: { from: 0.38, to: 0.5 },
        duration: 3600,
        yoyo: true,
        repeat: -1,
        ease: "sine.inout"
      })
    )

    // --- tiny, noisy "bug" speck texture, generated once. A couple of offset
    // dark dots give each speck an irregular, grainy silhouette.
    const bugKey = "plague-bug"
    if (!this.scene.textures.exists(bugKey)) {
      const size = 6
      const tex = this.scene.textures.createCanvas(bugKey, size, size)
      if (tex) {
        const ctx = tex.getContext()
        ctx.fillStyle = "rgba(20,22,10,1)"
        ctx.fillRect(1, 2, 3, 2) // body
        ctx.fillRect(3, 1, 2, 2) // head / offset chunk
        ctx.fillRect(0, 3, 2, 1) // trailing leg speck
        tex.refresh()
      }
    }

    // muddy green-brown carapaces, a couple lighter so the swarm still reads
    const bugTints = [0x2b3316, 0x39401c, 0x222c12, 0x161c0c, 0x47501f]

    // Spawn from a border frame (canvas is 1950x1000) and cull anything that
    // reaches the centre, so the middle of the field (where the units fight)
    // stays clean while the bugs teem thickest at the edges and thin inward.
    const bands = [
      new Phaser.Geom.Rectangle(0, 0, 300, 1000), // left
      new Phaser.Geom.Rectangle(1650, 0, 300, 1000), // right
      new Phaser.Geom.Rectangle(300, 0, 1350, 160), // top
      new Phaser.Geom.Rectangle(300, 840, 1350, 160) // bottom
    ]
    // single custom emit zone that scatters points across all four bands
    // (Phaser 4 does not reliably honour an array of emit zones)
    const emitZone = {
      type: "random" as const,
      source: {
        getRandomPoint: (vec: Phaser.Types.Math.Vector2Like) => {
          const band = Phaser.Utils.Array.GetRandom(bands)
          vec.x = band.x + Math.random() * band.width
          vec.y = band.y + Math.random() * band.height
          return vec
        }
      }
    }
    const cleanCenter = new Phaser.Geom.Rectangle(300, 160, 1350, 680)

    // --- dark substrate haze so the swarm emerges from gloom at the edges
    // rather than popping against clean dark ground
    const hazeKey = "plague-haze"
    if (!this.scene.textures.exists(hazeKey)) {
      const size = 256
      const tex = this.scene.textures.createCanvas(hazeKey, size, size)
      if (tex) {
        const ctx = tex.getContext()
        const r = size / 2
        const glow = ctx.createRadialGradient(r, r, 0, r, r, r)
        glow.addColorStop(0, "rgba(255,255,255,0.9)")
        glow.addColorStop(0.5, "rgba(255,255,255,0.4)")
        glow.addColorStop(1, "rgba(255,255,255,0)")
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, size, size)
        tex.refresh()
      }
    }
    for (let i = 0; i < 10; i++) {
      const p = new Phaser.Math.Vector2()
      emitZone.source.getRandomPoint(p)
      const baseAlpha = 0.1 + Phaser.Math.FloatBetween(0, 0.08)
      const haze = this.scene.add.existing(
        new Phaser.GameObjects.Image(this.scene, p.x, p.y, hazeKey)
          .setOrigin(0.5)
          .setDepth(DEPTH.WEATHER_FX)
          .setBlendMode(Phaser.BlendModes.MULTIPLY)
          .setTint(0x1c2410)
          .setScale(Phaser.Math.FloatBetween(2.2, 3.4))
          .setAlpha(baseAlpha)
      )
      this.images.push(haze)
      this.tweens.push(
        this.scene.tweens.add({
          targets: haze,
          alpha: { from: baseAlpha * 0.5, to: baseAlpha + 0.06 },
          duration: 3000 + Phaser.Math.Between(0, 2500),
          delay: Phaser.Math.Between(0, 2000),
          yoyo: true,
          repeat: -1,
          ease: "sine.inout"
        })
      )
    }

    // dense swarm darting in every direction — reads as millions of crawling
    // bugs eating everything. Several layers of size/speed give teeming depth.
    const swarm = (
      frequency: number,
      quantity: number,
      speed: number,
      scale: number,
      lifespan: { min: number; max: number },
      alphaStart = 1
    ) =>
      this.scene.add
        .particles(0, 0, bugKey, {
          emitZone,
          deathZone: { source: cleanCenter, type: "onEnter" },
          frequency,
          quantity,
          lifespan,
          speedX: { min: -speed, max: speed },
          speedY: { min: -speed, max: speed },
          scale: { min: scale * 0.55, max: scale },
          rotate: { min: 0, max: 360 },
          alpha: { start: alphaStart, end: 0 },
          tint: bugTints
        })
        .setDepth(DEPTH.WEATHER_FX)

    this.particlesEmitters.push(
      // fast tiny flies flickering everywhere
      swarm(6, 7, 150, 0.6, { min: 500, max: 1100 }),
      // mid layer
      swarm(9, 8, 95, 0.85, { min: 700, max: 1400 }),
      // slower, slightly larger crawlers
      swarm(14, 6, 50, 1.1, { min: 1000, max: 2000 }),
      // big, out-of-focus foreground bugs streaking past the "camera" for depth
      swarm(69, 1, 260, 3.2, { min: 350, max: 700 }, 0.5)
    )
  }

  addEclipse() {
    // the field stays bathed in warm sunlight underneath
    this.colorFilter = this.scene.add.existing(
      new Phaser.GameObjects.Rectangle(
        this.scene,
        1500,
        1000,
        3000,
        2000,
        0xffe0a0,
        0.1
      ).setDepth(DEPTH.WEATHER_FX)
    )

    // a soft dark void that creeps in from the bottom-right corner and keeps
    // growing until it blankets the whole board
    const shadowKey = "eclipse-shadow"
    if (!this.scene.textures.exists(shadowKey)) {
      const size = 512
      const tex = this.scene.textures.createCanvas(shadowKey, size, size)
      if (tex) {
        const ctx = tex.getContext()
        const r = size / 2
        const g = ctx.createRadialGradient(r, r, 0, r, r, r)
        g.addColorStop(0, "rgba(20,12,44,1)")
        g.addColorStop(0.82, "rgba(20,12,44,1)")
        g.addColorStop(1, "rgba(20,12,44,0)") // soft leading edge
        ctx.fillStyle = g
        ctx.fillRect(0, 0, size, size)
        tex.refresh()
      }
    }
    // centred on the bottom-right corner so the darkness is densest there
    const shadow = this.scene.add.existing(
      new Phaser.GameObjects.Image(this.scene, 1950, 1000, shadowKey)
        .setScale(0.6)
        .setAlpha(0)
        .setDepth(DEPTH.WEATHER_FX)
    )
    this.images.push(shadow)
    // fade the void up, then grow it steadily to swallow the board
    this.tweens.push(
      this.scene.tweens.add({
        targets: shadow,
        alpha: 0.29,
        duration: 2000,
        ease: "sine.out"
      })
    )
    this.tweens.push(
      this.scene.tweens.add({
        targets: shadow,
        scale: 9,
        duration: 7000,
        ease: "sine.out"
      })
    )

    // psychic "third eyes"
    const eyeKey = "eclipse-eye"
    if (!this.scene.textures.exists(eyeKey)) {
      const w = 128
      const h = 112
      const tex = this.scene.textures.createCanvas(eyeKey, w, h)
      if (tex) {
        const ctx = tex.getContext()
        const cx = w / 2
        const cy = h / 2
        const eyeW = 58
        const eyeH = 36

        // almond shaped   
        const almond = () => {
          ctx.beginPath()
          ctx.moveTo(cx - eyeW, cy)
          ctx.bezierCurveTo(cx - eyeW * 0.4, cy - eyeH, cx + eyeW * 0.4, cy - eyeH, cx + eyeW, cy)
          ctx.bezierCurveTo(cx + eyeW * 0.4, cy + eyeH, cx - eyeW * 0.4, cy + eyeH, cx - eyeW, cy)
          ctx.closePath()
        }

        // soft inner glow, clipped to the eye so it never bleeds past the border
        ctx.save()
        almond()
        ctx.clip()
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, eyeW)
        glow.addColorStop(0, "rgba(205,140,255,0.55)")
        glow.addColorStop(1, "rgba(205,140,255,0)")
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, w, h)
        ctx.restore()

        // coloured outline
        ctx.strokeStyle = "rgba(232,205,255,0.95)"
        ctx.lineWidth = 3
        almond()
        ctx.stroke()
        tex.refresh()
      }
    }

    const activeEyes: Phaser.GameObjects.Image[] = []
    const removeEye = (eye: Phaser.GameObjects.Image) => {
      eye.destroy()
      let idx = this.images.indexOf(eye)
      if (idx >= 0) this.images.splice(idx, 1)
      idx = activeEyes.indexOf(eye)
      if (idx >= 0) activeEyes.splice(idx, 1)
    }

    const spawnEye = () => {
      const size = Phaser.Math.FloatBetween(1.0, 1.9) // a bit bigger
      const peak = Phaser.Math.FloatBetween(0.48, 0.64)
      const radius = size * 75 // rough footprint used for spacing

      // find a spot clear of every eye currently on screen
      let x = 0
      let y = 0
      let placed = false
      for (let tries = 0; tries < 15 && !placed; tries++) {
        x = Phaser.Math.Between(180, 1770)
        y = Phaser.Math.Between(140, 880)
        placed = activeEyes.every((e) => {
          const er = (e.getData("radius") as number) ?? 75
          return Phaser.Math.Distance.Between(x, y, e.x, e.y) > radius + er
        })
      }
      if (!placed) return

      const eye = this.scene.add.existing(
        new Phaser.GameObjects.Image(this.scene, x, y, eyeKey)
          .setScale(size, size * 0.06)
          .setAlpha(0)
          .setAngle(Phaser.Math.Between(-12, 12))
          .setDepth(DEPTH.WEATHER_FX)
      )
      eye.setData("radius", radius)
      this.images.push(eye)
      activeEyes.push(eye)
      this.tweens.push(
        this.scene.tweens.add({
          targets: eye,
          scaleY: size,
          alpha: peak,
          duration: 1400,
          ease: "sine.out",
          onComplete: () => {
            this.tweens.push(
              this.scene.tweens.add({
                targets: eye,
                alpha: 0,
                delay: 2500,
                duration: 1600,
                ease: "sine.in",
                onComplete: () => removeEye(eye)
              })
            )
          }
        })
      )
    }

    this.timers.push(
      this.scene.time.delayedCall(7000, () => {
        this.timers.push(
          this.scene.time.addEvent({
            delay: 1750,
            loop: true,
            callback: () => {
              const n = Phaser.Math.Between(0, 2)
              for (let k = 0; k < n; k++) spawnEye()
            }
          })
        )
      })
    )
  }

  addFlood() {
    this.colorFilter = this.scene.add.existing(
      new Phaser.GameObjects.Rectangle(
        this.scene,
        1500,
        1000,
        3000,
        2000,
        0x1c5a7a,
        0.28
      ).setDepth(DEPTH.WEATHER_FX)
    )

    // bubble texture used by the incoming wavefronts
    const bubbleKey = "flood-bubble"
    if (!this.scene.textures.exists(bubbleKey)) {
      const size = 28
      const tex = this.scene.textures.createCanvas(bubbleKey, size, size)
      if (tex) {
        const ctx = tex.getContext()
        const r = size / 2
        const fill = ctx.createRadialGradient(r, r, 0, r, r, r)
        fill.addColorStop(0, "rgba(200,235,255,0.15)")
        fill.addColorStop(1, "rgba(200,235,255,0)")
        ctx.fillStyle = fill
        ctx.beginPath()
        ctx.arc(r, r, r - 1, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = "rgba(215,242,255,0.9)"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(r, r, r - 2, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = "rgba(255,255,255,0.9)"
        ctx.beginPath()
        ctx.arc(r - 3, r - 4, 1.5, 0, Math.PI * 2)
        ctx.fill()
        tex.refresh()
      }
    }

    // a diagonal wavefront of bubble splashes rolls across the board (top-down,
    // coming in from NE / SW / NW / SE), one or several at a time
    const spawnWave = (
      dir: { dx: number; dy: number },
      delay: number,
      intensity: number
    ) => {
      const inv = 1 / Math.SQRT2
      const tx = dir.dx * inv
      const ty = dir.dy * inv // unit travel direction
      const px = -ty
      const py = tx // unit vector along the wavefront line

      const fx = 975 - tx * 1500 // start well off the entering edge
      const fy = 500 - ty * 1500
      const frontHalf = 1000
      const travelDist = 3000
      const n = Math.round(Phaser.Math.Between(80, 120) * intensity)
      for (let i = 0; i < n; i++) {
        const along = Phaser.Math.FloatBetween(-frontHalf, frontHalf)
        const jitter = Phaser.Math.FloatBetween(-70, 70)
        const sx = fx + px * along + tx * jitter
        const sy = fy + py * along + ty * jitter
        const baseScale =
          Phaser.Math.FloatBetween(0.06, 0.15) * (0.75 + 0.25 * intensity)
        const baseAlpha = Phaser.Math.FloatBetween(0.55, 0.9)
        const b = this.scene.add.existing(
          new Phaser.GameObjects.Image(this.scene, sx, sy, bubbleKey)
            .setDepth(DEPTH.WEATHER_FX)
            .setScale(baseScale)
            .setAlpha(0)
        )
        this.images.push(b)
        this.tweens.push(
          this.scene.tweens.add({
            targets: b,
            x: sx + tx * travelDist,
            y: sy + ty * travelDist,
            delay,
            duration: Phaser.Math.Between(2400, 3400),
            ease: "linear",
            onUpdate: (tween) => {
              // the crest rises toward the camera at mid-travel, then drops back
              // — a wave crashing in while still moving across the board
              const crest = Math.sin(Math.PI * tween.progress)
              b.setScale(baseScale * (1 + 1.4 * crest))
              b.setAlpha(baseAlpha * (0.25 + 0.75 * crest))
            },
            onComplete: () => {
              b.destroy()
              const idx = this.images.indexOf(b)
              if (idx >= 0) this.images.splice(idx, 1)
            }
          })
        )
      }
    }

    this.timers.push(
      this.scene.time.addEvent({
        delay: 5200,
        loop: true,
        callback: () => {
          // a wave is really its splatter: a light leading splash, the main
          // crest, then a trailing splash — all from the same direction
          const dir = Phaser.Utils.Array.GetRandom([
            { dx: 1, dy: 1 },
            { dx: -1, dy: 1 },
            { dx: 1, dy: -1 },
            { dx: -1, dy: -1 }
          ])
          spawnWave(dir, 0, 0.35) // pre-splatter
          spawnWave(dir, 550, 1) // main wave
          spawnWave(dir, 1250, 0.45) // post-splatter
        }
      })
    )

    // a couple of slow drifting mist banks reusing the clouds sprite, tinted
    // watery, so the surface reads as flooded rather than just tinted
    this.image = this.scene.add.existing(
      new Phaser.GameObjects.Image(this.scene, 1000, 520, "clouds")
        .setTint(0x4a8fb0)
        .setScale(3, 1.6)
        .setOrigin(0.5)
        .setDepth(DEPTH.WEATHER_FX)
        .setAlpha(0.18)
    )
    this.tweens.push(
      this.scene.tweens.add({
        targets: this.image,
        x: 1100,
        alpha: { from: 0.12, to: 0.22 },
        duration: 6000,
        yoyo: true,
        repeat: -1,
        ease: "sine.inout"
      })
    )
  }

  addElderStorm() {
    // centre on the real battlefield (from the board cell transform) so the eye
    // lines up with the arena: cells span x 672..1344, y 184..664 (centres)
    const cx = 1008
    const cy = 424
    const tilt = 0.5 // vertical squash ≈ 30° view onto the plane

    // --- gloom: tints the whole scene and is the fallback fill behind the
    // clouds, so any area the vortex doesn't reach is still storm-coloured (no
    // hard boundary anywhere)
    this.colorFilter = this.scene.add.existing(
      new Phaser.GameObjects.Rectangle(
        this.scene,
        1500,
        1000,
        3000,
        2000,
        0x201024,
        0.34
      ).setDepth(DEPTH.WEATHER_FX)
    )
    this.tweens.push(
      this.scene.tweens.add({
        targets: this.colorFilter,
        alpha: { from: 0.3, to: 0.42 },
        duration: 4600,
        yoyo: true,
        repeat: -1,
        ease: "sine.inout"
      })
    )

    // --- soft radial glow texture (white, tinted per-use) for the currents
    const glowKey = "elder-glow"
    if (!this.scene.textures.exists(glowKey)) {
      const size = 256
      const tex = this.scene.textures.createCanvas(glowKey, size, size)
      if (tex) {
        const ctx = tex.getContext()
        const r = size / 2
        const g = ctx.createRadialGradient(r, r, 0, r, r, r)
        g.addColorStop(0, "rgba(255,255,255,1)")
        g.addColorStop(0.45, "rgba(255,255,255,0.5)")
        g.addColorStop(1, "rgba(255,255,255,0)")
        ctx.fillStyle = g
        ctx.fillRect(0, 0, size, size)
        tex.refresh()
      }
    }

    // Vortex geometry, in texture px (the texture is drawn at high res so the
    // cloud puffs stay fine even though the sprite is scaled up a lot). The eye
    // and wall land at these radii * ringScale in world space.
    const innerR = 150 // clear eye radius
    const peakR = 225 // cloud wall crest
    const wallOuter = 330 // outer limit of wall detail
    const ringScale = 700 / innerR // eye world-radius ≈ 700px (whole board fits)

    // --- vortex texture: a clear eye, a cloudy wall, then a SOLID cloud fill
    // sustained all the way to the edge. The outer fill is radially symmetric,
    // so rotation never opens a gap and there is no outer ring edge — the cloud
    // just runs off the board. Wall puffs give the rim its churn.
    const vortexKey = "elder-vortex-v3"
    if (!this.scene.textures.exists(vortexKey)) {
      const size = 1024
      const tex = this.scene.textures.createCanvas(vortexKey, size, size)
      if (tex) {
        const ctx = tex.getContext()
        const r = size / 2
        // base: transparent eye -> ramp -> sustained (slightly translucent) fill
        // to the edge. Sitting a touch below full opacity lets the billows below
        // read as rolling masses with depth between them.
        const base = ctx.createRadialGradient(r, r, 0, r, r, r)
        base.addColorStop(0, "rgba(255,255,255,0)")
        base.addColorStop(innerR / r, "rgba(255,255,255,0)")
        base.addColorStop(peakR / r, "rgba(255,255,255,0.82)")
        base.addColorStop(1, "rgba(255,255,255,0.82)")
        ctx.fillStyle = base
        ctx.fillRect(0, 0, size, size)
        // cloudy wall detail (visible where the base is still ramping)
        for (let i = 0; i < 1800; i++) {
          const t = Math.random()
          const rr = innerR + t * (wallOuter - innerR)
          const theta =
            Math.random() * Math.PI * 2 +
            ((rr - innerR) / (wallOuter - innerR)) * 1.6 // spiral curl
          const x = r + Math.cos(theta) * rr
          const y = r + Math.sin(theta) * rr
          const w =
            rr < peakR
              ? (rr - innerR) / (peakR - innerR)
              : 1 - (rr - peakR) / (wallOuter - peakR)
          const ww = Math.max(0, Math.min(1, w))
          const blob = Phaser.Math.Linear(5, 20, ww)
          const alpha = 0.1 * ww
          const grad = ctx.createRadialGradient(x, y, 0, x, y, blob)
          grad.addColorStop(0, `rgba(255,255,255,${alpha})`)
          grad.addColorStop(1, "rgba(255,255,255,0)")
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(x, y, blob, 0, Math.PI * 2)
          ctx.fill()
        }
        // outer billows: big, soft, sparse masses across the whole outer field
        // so the far cloud rolls in 3D (with the layers spinning at different
        // speeds) instead of being a flat wall
        for (let i = 0; i < 1400; i++) {
          const rr = peakR + Math.random() * (r - peakR)
          const theta =
            Math.random() * Math.PI * 2 +
            ((rr - innerR) / (r - innerR)) * 2.4 // long banding sweep
          const x = r + Math.cos(theta) * rr
          const y = r + Math.sin(theta) * rr
          const blob = Phaser.Math.Linear(22, 72, Math.random())
          const alpha = 0.03 + 0.05 * Math.random()
          const grad = ctx.createRadialGradient(x, y, 0, x, y, blob)
          grad.addColorStop(0, `rgba(255,255,255,${alpha})`)
          grad.addColorStop(1, "rgba(255,255,255,0)")
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(x, y, blob, 0, Math.PI * 2)
          ctx.fill()
        }
        tex.refresh()
      }
    }

    // --- the vortex lives in a container tilted ~30° toward the ground: its
    // children rotate in-plane, then the container foreshortens Y, so the ring
    // spins like a hurricane seen at an angle instead of tumbling like a coin
    const vortex = this.scene.add
      .container(cx, cy)
      .setDepth(DEPTH.WEATHER_FX)
      .setScale(1, tilt)
    this.containers.push(vortex)

    // --- inner tint: eases the harsh brightness gap between a bright battlefield
    // and the dark storm wall. Faint over the centre so the fight stays readable,
    // deepening toward the eye rim to meet the cloud, then gone under the wall.
    const eyeTintKey = "elder-eyetint"
    if (!this.scene.textures.exists(eyeTintKey)) {
      const size = 1024
      const tex = this.scene.textures.createCanvas(eyeTintKey, size, size)
      if (tex) {
        const ctx = tex.getContext()
        const r = size / 2
        const g = ctx.createRadialGradient(r, r, 0, r, r, r)
        g.addColorStop(0, "rgba(255,255,255,0.1)")
        g.addColorStop((innerR * 0.5) / r, "rgba(255,255,255,0.12)")
        g.addColorStop(innerR / r, "rgba(255,255,255,0.45)")
        g.addColorStop((innerR + (peakR - innerR) * 0.55) / r, "rgba(255,255,255,0)")
        g.addColorStop(1, "rgba(255,255,255,0)")
        ctx.fillStyle = g
        ctx.fillRect(0, 0, size, size)
        tex.refresh()
      }
    }
    const eyeTint = new Phaser.GameObjects.Image(this.scene, 0, 0, eyeTintKey)
      .setOrigin(0.5)
      .setBlendMode(Phaser.BlendModes.NORMAL)
      .setTint(0x201024)
      .setScale(ringScale)
      .setAlpha(0.9)
    vortex.add(eyeTint)

    // Stacked cloud layers twirling the same way at different speeds. A shared
    // warm-purple family (plum -> mauve-brown -> shadow) so the tints blend
    // instead of fighting; all dark + NORMAL-blended so it reads as storm cloud.
    const donutLayers = [
      { scale: ringScale, alpha: 0.55, tint: 0x3a2246, duration: 26000 },
      { scale: ringScale * 0.94, alpha: 0.5, tint: 0x4a2f3e, duration: 17000 },
      { scale: ringScale * 1.03, alpha: 0.42, tint: 0x160b1a, duration: 21000 },
      // faint inner haze: a slightly smaller copy so a whisper of tint bleeds
      // just inside the eye rim, easing the clear->cloud edge (very subtle)
      { scale: ringScale * 0.92, alpha: 0.09, tint: 0x5a3a5e, duration: 30000 }
    ]
    for (const layer of donutLayers) {
      const donut = new Phaser.GameObjects.Image(this.scene, 0, 0, vortexKey)
        .setOrigin(0.5)
        .setBlendMode(Phaser.BlendModes.NORMAL)
        .setTint(layer.tint)
        .setScale(layer.scale)
        .setAlpha(layer.alpha)
      vortex.add(donut)
      // continuous rotation = the hurricane twirling
      this.tweens.push(
        this.scene.tweens.add({
          targets: donut,
          angle: 360,
          duration: layer.duration,
          repeat: -1,
          ease: "linear"
        })
      )
      // slow breathe on scale + alpha so the wall of cloud churns and pulses
      this.tweens.push(
        this.scene.tweens.add({
          targets: donut,
          scale: layer.scale * 1.04,
          alpha: layer.alpha * 0.78,
          duration: 5200,
          yoyo: true,
          repeat: -1,
          ease: "sine.inout"
        })
      )
    }

    // --- currents: bright energy caught in the wall of cloud, riding the band.
    // A round glow stretched along the tangent reads as a fast-moving streak.
    const currentColors = [0xc6a2f0, 0xd9a24e] // soft lilac + warm gold
    const bandR = peakR * ringScale // ride the wall crest
    const spawnCurrent = (opts: {
      alpha: number
      scale: number
      duration: number
      sweep: number
      stretch: number
    }) => {
      const a0 = Phaser.Math.FloatBetween(0, Math.PI * 2)
      const rr = bandR * Phaser.Math.FloatBetween(0.82, 1.12)
      const cur = new Phaser.GameObjects.Image(
        this.scene,
        Math.cos(a0) * rr,
        Math.sin(a0) * rr,
        glowKey
      )
        .setOrigin(0.5)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(Phaser.Utils.Array.GetRandom(currentColors))
        .setAlpha(0)
      vortex.add(cur)
      const driver = { p: 0 }
      this.tweens.push(
        this.scene.tweens.add({
          targets: driver,
          p: 1,
          duration: opts.duration,
          ease: "sine.inout",
          onUpdate: () => {
            const ang = a0 + opts.sweep * driver.p // same direction as the spin
            const fade = Math.sin(Math.PI * driver.p)
            cur
              .setPosition(Math.cos(ang) * rr, Math.sin(ang) * rr)
              .setRotation(ang + Math.PI / 2) // lie along the tangent
              .setScale(
                opts.scale * opts.stretch * (0.7 + 0.5 * fade),
                opts.scale * (0.55 + 0.3 * fade)
              )
              .setAlpha(opts.alpha * fade)
          },
          onComplete: () => cur.destroy()
        })
      )
    }

    // gentle constant drift so the cloud is always subtly moving
    this.timers.push(
      this.scene.time.addEvent({
        delay: 850,
        loop: true,
        callback: () =>
          spawnCurrent({
            alpha: 0.16,
            scale: 1.0,
            duration: Phaser.Math.Between(3200, 4200),
            sweep: Phaser.Math.FloatBetween(0.5, 1.0),
            stretch: 2.2
          })
      })
    )

    // every 2s (matching the weather's stat-buff cadence) a stronger current
    // rips around the eye — the reminder that this is a hurricane
    this.timers.push(
      this.scene.time.addEvent({
        delay: 2000,
        loop: true,
        callback: () => {
          const n = Phaser.Math.Between(2, 3)
          for (let k = 0; k < n; k++) {
            spawnCurrent({
              alpha: 0.5,
              scale: 1.3,
              duration: Phaser.Math.Between(1100, 1500),
              sweep: Phaser.Math.FloatBetween(1.6, 2.4),
              stretch: 3.0
            })
          }
        }
      })
    )

    // --- orbiting cloud wisps: soft, cloud-tinted masses that ride around the
    // eye so the whole wall visibly turns (not just the bright currents). Spread
    // across the wall + outer field, long-lived, NORMAL-blended so they read as
    // cloud rather than glow.
    const wispTints = [0x4a2f3e, 0x3a2246, 0x5a3a5e]
    const spawnWisp = () => {
      const a0 = Phaser.Math.FloatBetween(0, Math.PI * 2)
      const rr = bandR * Phaser.Math.FloatBetween(0.7, 1.5) // wall + outer field
      const sweep = Phaser.Math.FloatBetween(1.2, 2.6)
      const baseAlpha = Phaser.Math.FloatBetween(0.1, 0.22)
      const baseScale = Phaser.Math.FloatBetween(1.6, 3.2)
      const wisp = new Phaser.GameObjects.Image(
        this.scene,
        Math.cos(a0) * rr,
        Math.sin(a0) * rr,
        glowKey
      )
        .setOrigin(0.5)
        .setBlendMode(Phaser.BlendModes.NORMAL)
        .setTint(Phaser.Utils.Array.GetRandom(wispTints))
        .setAlpha(0)
      vortex.add(wisp)
      const driver = { p: 0 }
      this.tweens.push(
        this.scene.tweens.add({
          targets: driver,
          p: 1,
          duration: Phaser.Math.Between(4500, 7500),
          ease: "sine.inout",
          onUpdate: () => {
            const ang = a0 + sweep * driver.p // same direction as the spin
            const fade = Math.sin(Math.PI * driver.p)
            wisp
              .setPosition(Math.cos(ang) * rr, Math.sin(ang) * rr)
              .setRotation(ang + Math.PI / 2) // stretch along the tangent
              .setScale(
                baseScale * 1.9 * (0.8 + 0.3 * fade),
                baseScale * (0.9 + 0.3 * fade)
              )
              .setAlpha(baseAlpha * fade)
          },
          onComplete: () => wisp.destroy()
        })
      )
    }
    this.timers.push(
      this.scene.time.addEvent({
        delay: 480,
        loop: true,
        callback: () => {
          const n = Phaser.Math.Between(1, 2)
          for (let k = 0; k < n; k++) spawnWisp()
        }
      })
    )

    // --- glow-motes: a sparse, always-on sprinkle that eases in and out as it
    // rides the spin — a soft rose counterpoint to the explosive white surges
    const moteColors = [0xe878c8, 0xf0a0d8]
    const spawnGlowMote = () => {
      const a0 = Phaser.Math.FloatBetween(0, Math.PI * 2)
      const rr = bandR * Phaser.Math.FloatBetween(0.8, 1.2)
      const sweep = Phaser.Math.FloatBetween(0.3, 0.6) // gentle, with the spin
      const baseScale = Phaser.Math.FloatBetween(0.05, 0.11)
      const mote = new Phaser.GameObjects.Image(
        this.scene,
        Math.cos(a0) * rr,
        Math.sin(a0) * rr,
        glowKey
      )
        .setOrigin(0.5)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(Phaser.Utils.Array.GetRandom(moteColors))
        .setAlpha(0)
      vortex.add(mote)
      const driver = { p: 0 }
      this.tweens.push(
        this.scene.tweens.add({
          targets: driver,
          p: 1,
          duration: Phaser.Math.Between(1000, 1700),
          ease: "sine.inout",
          onUpdate: () => {
            const ang = a0 + sweep * driver.p // rides the spin
            const env = Math.sin(Math.PI * driver.p) // glow in and out
            const flick = 0.7 + 0.3 * Math.sin(driver.p * Math.PI * 6)
            mote
              .setPosition(Math.cos(ang) * rr, Math.sin(ang) * rr)
              .setRotation(ang + Math.PI / 2)
              .setScale(baseScale * 2.2, baseScale)
              .setAlpha(0.8 * env * flick)
          },
          onComplete: () => mote.destroy()
        })
      )
    }
    this.timers.push(
      this.scene.time.addEvent({
        delay: 650,
        loop: true,
        callback: () => {
          if (Math.random() < 0.85) spawnGlowMote() // keep it sparse
        }
      })
    )

    // --- energetic sparks: come in explosive surges. A cluster of long, sharp
    // streaks rips along one stretch of the wall, flares instantly, then decays.
    // Not lightning — aether embers snapping around in the hurricane's spin.
    const sparkColors = [0xe8c6ff, 0xffe6a6, 0xffffff]
    const spawnSparkSurge = () => {
      const base = Phaser.Math.FloatBetween(0, Math.PI * 2) // where the surge hits
      const n = Phaser.Math.Between(3, 6)
      for (let k = 0; k < n; k++) {
        const a0 = base + Phaser.Math.FloatBetween(-0.25, 0.25)
        const rr = bandR * Phaser.Math.FloatBetween(0.85, 1.15)
        // always sweep with the spin (clockwise), never against it
        const sweep = Phaser.Math.FloatBetween(0.7, 1.3) // long fast arc
        const baseScale = Phaser.Math.FloatBetween(0.06, 0.13)
        const spark = new Phaser.GameObjects.Image(
          this.scene,
          Math.cos(a0) * rr,
          Math.sin(a0) * rr,
          glowKey
        )
          .setOrigin(0.5)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setTint(Phaser.Utils.Array.GetRandom(sparkColors))
          .setAlpha(0)
        vortex.add(spark)
        const driver = { p: 0 }
        this.tweens.push(
          this.scene.tweens.add({
            targets: driver,
            p: 1,
            delay: Phaser.Math.Between(0, 160), // stagger so the surge ripples
            duration: Phaser.Math.Between(450, 800),
            ease: "sine.out",
            onUpdate: () => {
              const ang = a0 + sweep * driver.p // rides the spin
              const rad = rr + Math.sin(driver.p * Math.PI) * 14 // bows outward
              const env = Math.pow(1 - driver.p, 1.3) // flare instantly, decay
              spark
                .setPosition(Math.cos(ang) * rad, Math.sin(ang) * rad)
                .setRotation(ang + Math.PI / 2)
                .setScale(baseScale * 5.5, baseScale * 0.8) // long, sharp streak
                .setAlpha(env)
            },
            onComplete: () => spark.destroy()
          })
        )
      }
    }
    this.timers.push(
      this.scene.time.addEvent({
        delay: 700,
        loop: true,
        callback: () => spawnSparkSurge()
      })
    )
  }

  addDistortion() {
    // A weather that doesn't exist IRL: the arena reads as a corrupted simulation
    // — space is physically warped (WebGL displacement), overlaid with a uniform
    // holographic grid + scanlines, and periodically the whole field glitches.
    // Full-arena footprint so the look stays identical over bright OR dark maps.
    const ax = 1500,
      ay = 1000,
      aw = 3000,
      ah = 2000

    // ---- 1. consistent base tint -------------------------------------------
    // A near-opaque dark indigo compresses the underlying scene's brightness so
    // a sunlit town and a midnight cave both settle to the same sci-fi gloom.
    this.colorFilter = this.scene.add.existing(
      new Phaser.GameObjects.Rectangle(this.scene, ax, ay, aw, ah, 0x160a2e, 0.55)
        .setDepth(DEPTH.WEATHER_FX)
    )
    this.tweens.push(
      this.scene.tweens.add({
        targets: this.colorFilter,
        alpha: { from: 0.5, to: 0.6 },
        duration: 3200,
        yoyo: true,
        repeat: -1,
        ease: "sine.inout"
      })
    )
    // additive violet/cyan energy wash for the colour grade (SCREEN keeps it
    // uniform: it lifts the flattened base by the same amount everywhere)
    const energyWash = this.scene.add.graphics().setDepth(DEPTH.WEATHER_FX)
    energyWash.setBlendMode(Phaser.BlendModes.SCREEN)
    energyWash.fillStyle(0x4a2a9c, 1)
    energyWash.fillRect(0, 0, aw, ah)
    energyWash.setAlpha(0.1)
    this.graphics.push(energyWash)
    this.tweens.push(
      this.scene.tweens.add({
        targets: energyWash,
        alpha: { from: 0.07, to: 0.16 },
        duration: 2600,
        yoyo: true,
        repeat: -1,
        ease: "sine.inout"
      })
    )

    // ---- 3. holographic grid + scanlines (uniform digital overlay) ---------
    // A seamless tile of neon grid lines + fine scanlines, scrolled a single
    // period on loop so the whole field shimmers evenly (no localized hotspots).
    const gridKey = "distortion-grid"
    const tile = 48 // grid + scroll period
    if (!this.scene.textures.exists(gridKey)) {
      const tex = this.scene.textures.createCanvas(gridKey, tile, tile)
      if (tex) {
        const ctx = tex.getContext()
        ctx.clearRect(0, 0, tile, tile)
        // grid lines (cyan)
        ctx.strokeStyle = "rgba(120,235,255,0.5)"
        ctx.lineWidth = 1
        ctx.strokeRect(0.5, 0.5, tile, tile)
        // fine scanlines every 6px (violet-white)
        ctx.fillStyle = "rgba(190,170,255,0.22)"
        for (let y = 0; y < tile; y += 6) ctx.fillRect(0, y, tile, 1)
        tex.refresh()
      }
    }
    const grid = this.scene.add
      .tileSprite(ax, ay, aw, ah, gridKey)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0.17)
      .setDepth(DEPTH.WEATHER_FX)
    this.tileSprites.push(grid)
    // slow diagonal scroll of the grid = the simulation "flowing"
    this.tweens.push(
      this.scene.tweens.add({
        targets: grid,
        tilePositionX: tile,
        tilePositionY: tile,
        duration: 6000,
        loop: -1,
        ease: "linear"
      })
    )
    // subtle brightness flicker on the whole grid
    this.tweens.push(
      this.scene.tweens.add({
        targets: grid,
        alpha: { from: 0.14, to: 0.23 },
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: "sine.inout"
      })
    )

    // ---- 4. glitch tear bands ----------------------------------------------
    // Occasional screen-wide horizontal tears for texture. Muted cyan/violet
    // palette (never white). They snap in fast and explosive, hold for a beat,
    // then fade back out. Only one tear is ever on screen at a time.
    let glitchActive = false
    const glitchPulse = () => {
      glitchActive = true
      const split = Phaser.Math.Between(8, 18)
      const bands: Phaser.GameObjects.Rectangle[] = []
      const nbBands = Phaser.Math.Between(1, 3)
      for (let i = 0; i < nbBands; i++) {
        const band = this.scene.add.existing(
          new Phaser.GameObjects.Rectangle(
            this.scene,
            ax + Phaser.Math.Between(-split, split),
            Phaser.Math.Between(240, 620),
            aw,
            Phaser.Math.Between(3, 12),
            Phaser.Math.RND.pick([0x18f0ff, 0xb0a0ff, 0xff2d7a, 0xffe066]),
            1
          )
            .setBlendMode(Phaser.BlendModes.SCREEN)
            .setAlpha(0)
            .setDepth(DEPTH.WEATHER_FX)
        )
        bands.push(band)
        // tracked so clearWeather() tears them down if the fight ends mid-tear
        this.rectangles.push(band)
      }
      // Procedurally build an erratic "dying signal" timeline so every tear
      // dies to its own rhythm: snap in, then a random mix of steady HOLDs and
      // quick flicker bursts. Holds dim and flickers grow more frequent toward
      // the end, as if the energy is slowly running out; then a final fade.
      const peak = Phaser.Math.FloatBetween(0.15, 0.18)
      const steps: object[] = []
      // ~20% of tears stutter in with a flicker; the rest snap in cleanly
      if (Math.random() < 0.2) {
        const flickers = Phaser.Math.Between(2, 4)
        for (let k = 0; k < flickers; k++) {
          steps.push({ alpha: peak, duration: Phaser.Math.Between(20, 40) })
          steps.push({ alpha: 0.02, duration: Phaser.Math.Between(20, 40) })
        }
        steps.push({ alpha: peak, duration: Phaser.Math.Between(30, 50) })
      } else {
        steps.push({
          alpha: peak,
          duration: Phaser.Math.Between(35, 55),
          ease: "quad.out"
        })
      }
      const beats = Phaser.Math.Between(2, 4)
      for (let i = 0; i < beats; i++) {
        const drain = i / beats // 0 → 1 across the tear's life
        if (Math.random() < 0.12 + 0.28 * drain) {
          // an occasional quick flicker, snapping back to full brightness
          const n = Phaser.Math.Between(1, 2)
          for (let f = 0; f < n; f++) {
            steps.push({
              alpha: Phaser.Math.FloatBetween(0.03, 0.07),
              duration: Phaser.Math.Between(28, 48),
              yoyo: true
            })
          }
        } else {
          // a steady hold at full brightness — the light does not dim
          steps.push({ alpha: peak, duration: Phaser.Math.Between(1100, 1500) })
        }
      }
      // it's light — it doesn't fade, it just cuts out
      steps.push({ alpha: 0, duration: 0 })
      const chain = this.scene.tweens.chain({
        targets: bands,
        tweens: steps,
        onComplete: () => {
          bands.forEach((b) => b.destroy())
          // drop the now-destroyed bands from the tracking array
          this.rectangles = this.rectangles.filter((r) => !bands.includes(r))
          glitchActive = false
        }
      })
      // tracked so clearWeather() stops the timeline on phase change
      this.tweens.push(chain)
    }
    // slow, irregular cadence — but never start a new tear while one is live
    this.timers.push(
      this.scene.time.addEvent({
        delay: 2200,
        loop: true,
        callback: () => {
          if (!glitchActive && Math.random() < 0.6) glitchPulse()
        }
      })
    )
  }

  setTownDaytime(stageLevel: number) {
    // ambient light based on day time
    let red = 255,
      green = 255,
      blue = 255,
      alpha = 0

    if (stageLevel === 0) {
      // dawn light
      red = 255
      green = 160
      blue = 50
      alpha = 0.15
    } else if (stageLevel === 20) {
      // sunset light
      red = 150
      green = 0
      blue = 50
      alpha = 0.15
    } else if (stageLevel > 20) {
      // night light
      red = 0
      green = 20
      blue = 255
      alpha = 0.15
    }

    this.colorFilter = this.scene.add.existing(
      new Phaser.GameObjects.Rectangle(
        this.scene,
        1500,
        1000,
        3000,
        2000,
        new Phaser.Display.Color(red, green, blue).color,
        alpha
      ).setDepth(DEPTH.WEATHER_FX)
    )
  }

  clearWeather() {
    this.particlesEmitters.forEach((emitter) => emitter.destroy())
    this.particlesEmitters = []
    if (this.colorFilter) {
      this.colorFilter.destroy()
      this.colorFilter = undefined
    }
    if (this.image) {
      this.image.destroy()
      this.image = undefined
    }
    if (this.images) {
      this.images.forEach((image) => image.destroy())
      this.images = []
    }
    if (this.timers) {
      this.timers.forEach((timer) => timer.remove(false))
      this.timers = []
    }
    if (this.graphics) {
      this.graphics.forEach((g) => g.destroy())
      this.graphics = []
    }
    if (this.tweens) {
      this.tweens.forEach((tween) => tween.destroy())
      this.tweens = []
    }
    if (this.containers) {
      this.containers.forEach((container) => container.destroy())
      this.containers = []
    }
    if (this.tileSprites) {
      this.tileSprites.forEach((ts) => ts.destroy())
      this.tileSprites = []
    }
    if (this.rectangles) {
      this.rectangles.forEach((r) => r.destroy())
      this.rectangles = []
    }
    if (this.fxs) {
      this.fxs.forEach((effect) => effect.destroy())
      this.fxs = []
      const scene = this.scene as GameScene
      scene.map?.layers.forEach((layer) => {
        layer.tilemapLayer.filters?.internal.clear()
        layer.tilemapLayer.filters?.external.clear()
      })
    }
  }
}
