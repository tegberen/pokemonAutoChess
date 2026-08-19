import type Phaser from "phaser"
import { GameObjects } from "phaser"
import PokemonFactory from "../../../../models/pokemon-factory"
import type { Emotion, IPokemonAvatar } from "../../../../types"
import { GamePhaseState } from "../../../../types/enum/Game"
import type { Item } from "../../../../types/enum/Item"
import { getAvatarString } from "../../../../utils/avatar"
import { throttle } from "../../../../utils/function"
import { showEmote } from "../../network"
import { playSound, SOUNDS } from "../../pages/utils/audio"
import store from "../../stores"
import { DEPTH } from "../depths"
import type GameScene from "../scenes/game-scene"
import { EmoteBubble } from "./emote-bubble"
import EmoteMenu from "./emote-menu"
import LifeBar from "./life-bar"
import PokemonSprite from "./pokemon"

export const WANDERING_AVATAR_ALPHA = 0.65

export default class PokemonAvatar extends PokemonSprite {
  scene: GameScene
  circleHitbox: GameObjects.Ellipse | null = null
  circleTimer: GameObjects.Graphics | null = null
  isCurrentPlayerAvatar: boolean
  emoteBubble: EmoteBubble | null
  emoteMenu: EmoteMenu | null
  private emotePhase: GamePhaseState | undefined
  private emoteStageLevel: number | undefined
  constructor(
    scene: GameScene,
    x: number,
    y: number,
    pokemon: IPokemonAvatar,
    playerId: string,
    scouting?: boolean
  ) {
    super(
      scene,
      x,
      y,
      PokemonFactory.createPokemonFromName(pokemon.name, {
        shiny: pokemon.shiny
      }),
      playerId,
      false,
      false
    )
    this.scene = scene
    this.shouldShowTooltip = false
    this.draggable = false
    this.emoteBubble = null
    this.emoteMenu = null
    this.isCurrentPlayerAvatar = this.playerId === scene.uid
    if (scene.room?.state.phase === GamePhaseState.TOWN) {
      this.drawCircles()
    } else if (!scouting) {
      this.drawLifebar()
    }
    if (!this.isCurrentPlayerAvatar) {
      this.disableInteractive()
    }
    this.setDepth(DEPTH.POKEMON)
    this.sendEmote = throttle(this.sendEmote, 1000).bind(this)
    this.sendItemEmote = this.sendItemEmote.bind(this)
    this.sendTextEmote = this.sendTextEmote.bind(this)
  }

  /* out among the units the avatar looks like just another pokemon, so it is
     faded and kept behind them. Its health bar stays solid */
  setWandering(wandering: boolean) {
    const alpha = wandering ? WANDERING_AVATAR_ALPHA : 1
    this.setDepth(wandering ? DEPTH.INANIMATE_OBJECTS : DEPTH.POKEMON)
    this.sprite.setAlpha(alpha)
    /* the shadow fades with the sprite, or a solid shadow sits under a
       translucent pokemon and the pair stop reading as one thing */
    this.shadow?.setAlpha(alpha)
  }

  drawCircles() {
    const scene = this.scene as GameScene
    this.circleHitbox = new GameObjects.Ellipse(scene, 0, 0, 50, 50)
    this.add(this.circleHitbox)
    this.circleHitbox.setDepth(DEPTH.INDICATOR_BELOW_POKEMON)
    this.circleHitbox.setVisible(
      scene.room?.state.phase === GamePhaseState.TOWN
    )
    this.circleTimer = new GameObjects.Graphics(scene)
    this.add(this.circleTimer)
    this.circleTimer.setDepth(DEPTH.INDICATOR_BELOW_POKEMON)
    if (this.isCurrentPlayerAvatar) {
      this.circleHitbox.setStrokeStyle(2, 0xffffff, 0.8)
    } else {
      this.circleHitbox.setStrokeStyle(1, 0xffffff, 0.5)
    }
  }

  updateCircleTimer(timer: number) {
    if (timer <= 0) {
      this.circleTimer?.destroy()
      if (this.isCurrentPlayerAvatar) {
        playSound(SOUNDS.CAROUSEL_UNLOCK)
      }
    } else {
      this.circleTimer?.clear()
      this.circleTimer?.lineStyle(
        8,
        0x32ffea,
        this.isCurrentPlayerAvatar ? 0.8 : 0.5
      )
      this.circleTimer?.beginPath()

      const angle = (Math.min(timer, 8000) / 8000) * Math.PI * 2
      this.circleTimer?.arc(0, 0, 30, 0, angle)
      this.circleTimer?.strokePath()
    }
  }

  updateLife(life: number) {
    this.lifebar?.setHp(life)
  }

  drawSpeechBubble(emoteAvatar: string, isOpponent: boolean) {
    if (this.emoteMenu) {
      this.emoteMenu.destroy()
      this.emoteMenu = null
    }

    this.emoteBubble?.destroy()
    const bubble = new EmoteBubble(this.scene, emoteAvatar, isOpponent)
    this.emoteBubble = bubble
    this.emotePhase = this.scene.room?.state.phase
    this.emoteStageLevel = this.scene.room?.state.stageLevel
    this.add(bubble)

    const x = isOpponent ? -40 : +40
    const y = isOpponent ? +100 : -120
    bubble.setPosition(x, y)

    setTimeout(() => {
      /* A previous bubble's timer must never destroy or retain its replacement. */
      if (bubble.scene) bubble.destroy()
      if (this.emoteBubble === bubble) {
        this.emoteBubble = null
        this.emotePhase = undefined
        this.emoteStageLevel = undefined
      }
    }, 3000)
  }

  drawLifebar() {
    this.lifebar = new LifeBar(
      this.scene,
      0,
      28,
      100,
      100,
      0,
      this.isCurrentPlayerAvatar ? 0 : 1,
      false
    )
    this.add(this.lifebar)
  }

  showEmoteMenu() {
    if (this.isCurrentPlayerAvatar && !this.emoteMenu) {
      const host = this.scene.playerAvatars?.getEmoteMenuHost(this) ?? this
      this.emoteMenu = new EmoteMenu(
        this.scene as GameScene,
        this.pokemon.index,
        this.pokemon.shiny,
        this.sendEmote,
        this.sendItemEmote,
        this.sendTextEmote
      )
      host.add(this.emoteMenu)
    }
  }

  hideEmoteMenu() {
    if (this.emoteMenu) {
      this.emoteMenu.destroy()
      this.emoteMenu = null
    }
  }

  clearEmoteDisplay() {
    this.hideEmoteMenu()
    this.emoteBubble?.destroy()
    this.emoteBubble = null
    this.emotePhase = undefined
    this.emoteStageLevel = undefined
  }

  clearStaleEmoteDisplay() {
    if (
      this.emoteBubble &&
      (this.emotePhase !== this.scene.room?.state.phase ||
        this.emoteStageLevel !== this.scene.room?.state.stageLevel)
    ) {
      this.clearEmoteDisplay()
    }
  }

  toggleEmoteMenu() {
    if (this.emoteMenu) this.hideEmoteMenu()
    else this.showEmoteMenu()
  }

  sendEmote(emotion: Emotion) {
    const state = store.getState()
    if (state.game.emotesUnlocked.includes(emotion)) {
      const emote = getAvatarString(
        this.pokemon.index,
        this.pokemon.shiny,
        emotion
      )
      this.displayLocalEmote(emote)
      showEmote(emote)
      this.hideEmoteMenu()
    }
  }

  playAnimation() {
    try {
      this.displayLocalEmote()
      showEmote()
    } catch (err) {
      console.error("could not play animation", err)
    }
  }

  onPointerDown(pointer: Phaser.Input.Pointer, event): void {
    super.onPointerDown(pointer, event)
    const scene = this.scene as GameScene

    if (!this.isCurrentPlayerAvatar) return

    if (pointer.rightButtonDown()) {
      this.toggleEmoteMenu()
    } else if (scene.room?.state.phase !== GamePhaseState.TOWN) {
      this.playAnimation()
    }
  }

  sendItemEmote(item: Item) {
    const emote = "item/" + item
    this.displayLocalEmote(emote)
    showEmote(emote)
    this.hideEmoteMenu()
  }
  sendTextEmote(text: string) {
    const emote = "text/" + text
    this.displayLocalEmote(emote)
    showEmote(emote)
    this.hideEmoteMenu()
  }

  private displayLocalEmote(emote?: string) {
    this.scene.showLocalEmote(emote)
  }
}
