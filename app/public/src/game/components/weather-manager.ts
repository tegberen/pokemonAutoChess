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
  tweens: Phaser.Tweens.Tween[]
  fxs: Phaser.Filters.Controller[]

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.screen = new Phaser.Geom.Rectangle(0, 0, 3000, 2000)
    this.particlesEmitters = []
    this.images = []
    this.graphics = []
    this.timers = []
    this.tweens = []
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
