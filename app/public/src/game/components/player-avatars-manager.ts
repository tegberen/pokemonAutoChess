import Phaser from "phaser"
import {
  AVATAR_ROAM_MAX_X,
  AVATAR_ROAM_MAX_Y,
  AVATAR_ROAM_MIN_X,
  AVATAR_ROAM_MIN_Y,
  AVATAR_WALK_SPEED_CELLS_PER_SECOND,
  BOARD_HEIGHT,
  CELL_WIDTH
} from "../../../../config"
import type { IPokemonAvatar } from "../../../../types"
import {
  GamePhaseState,
  Orientation,
  PokemonActionState
} from "../../../../types/enum/Game"
import { getOrientation } from "../../../../utils/orientation"
import { moveAvatar } from "../../network"
import {
  transformEntityCoordinates,
  untransformEntityCoordinates
} from "../../pages/utils/utils"
import { DEPTH } from "../depths"
import type GameScene from "../scenes/game-scene"
import { PokemonAnimations } from "./pokemon-animations"
import PokemonAvatar from "./pokemon-avatar"

/* how much of the gap to the server position a remote avatar closes per frame */
const REMOTE_SMOOTHING = 0.25
/* the chase is exponential and never lands, so it is set outright once close */
const REMOTE_SNAP_PX = 2
/* only correct the local avatar once it has genuinely come apart, which takes a
   lost message rather than ordinary lag */
const RESYNC_DISTANCE_CELLS = 1.5
const ARRIVED_DISTANCE_CELLS = 0.05
/* ground one walk cycle covers. Holding it fixed is what makes it read as
   walking: let it vary and the legs and the body disagree. A stride longer than
   a cell means fewer steps for the same distance, which is what stops the feet
   looking busy relative to the ground being covered */
const WALK_STRIDE_PX = CELL_WIDTH * 1.5
const MIN_WALK_ANIM_RATE = 0.5
const MAX_WALK_ANIM_RATE = 2.5
/* reactions loop forever and the server has already settled on idle, so nothing
   else would end them */
const REACTION_DURATION_MS = 2500
/* The server re-anchors immediately; fade the destination back in so the
   synchronized placement reads as a transition rather than a hard teleport. */
const TRANSITION_FADE_MS = 350

type Predicted = { x: number; y: number; targetX: number; targetY: number }

/**
 * The avatars players walk around with, through the pick phase and fights.
 *
 * The player's own avatar runs the same integration the server does, so a click
 * moves it on the next frame rather than after a round trip, and the server copy
 * is ignored for it unless the two drift far apart. Everyone else's is drawn
 * from server state and eased between patches.
 */
export default class PlayerAvatarsManager {
  scene: GameScene
  sprites: Map<string, PokemonAvatar> = new Map()
  private predicted: Predicted | null = null
  private hidden = false
  private lastFlip = false
  private lastPhase: GamePhaseState | undefined
  private localEmoteController: PokemonAvatar | null = null
  private reactionTimers = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(scene: GameScene) {
    this.scene = scene
  }

  // --- state ---------------------------------------------------------------

  onAdd(avatar: IPokemonAvatar) {
    if (this.sprites.has(avatar.id)) return
    const [x, y] = transformEntityCoordinates(avatar.x, avatar.y, this.flip)
    const sprite = new PokemonAvatar(this.scene, x, y, avatar, avatar.id, false)

    /* PokemonAvatar picks between the carousel's selection ring and a life bar
       from whatever phase is current when it is built, and these are built at
       game start while that is still TOWN. This is never a carousel avatar */
    sprite.circleHitbox?.destroy()
    sprite.circleHitbox = null
    sprite.circleTimer?.destroy()
    sprite.circleTimer = null
    if (!sprite.lifebar) sprite.drawLifebar()

    sprite.setWandering(true)
    /* the server owns facing, and PokemonAvatar defaults it to DOWNLEFT */
    sprite.orientation = avatar.orientation
    sprite.setData({ serverX: x, serverY: y })
    const life = this.scene.room?.state.players.get(avatar.id)?.life
    if (life !== undefined) sprite.updateLife(life)
    this.scene.animationManager?.animatePokemon(
      sprite,
      sprite.action,
      this.flip
    )
    this.sprites.set(avatar.id, sprite)

    if (avatar.id === this.ownId) {
      this.localEmoteController = sprite
      const { x: cellX, y: cellY } = avatar
      this.predicted = { x: cellX, y: cellY, targetX: cellX, targetY: cellY }
    }
  }

  /* the schema listeners are wired up before this manager exists, so anything
     that arrived first has to be picked up once rather than awaited */
  buildExisting() {
    this.scene.room?.state.playerAvatars.forEach((avatar) => this.onAdd(avatar))
  }

  onRemove(id: string) {
    clearTimeout(this.reactionTimers.get(id))
    this.reactionTimers.delete(id)
    const sprite = this.sprites.get(id)
    if (id === this.ownId && sprite?.scene) {
      /* Keep the local avatar as a hidden emote/menu controller after server
         removal; it is no longer part of board rendering. */
      sprite.setVisible(false)
      sprite.hideEmoteMenu()
      this.localEmoteController = sprite
    } else {
      sprite?.destroy()
    }
    this.sprites.delete(id)
    if (id === this.ownId) this.predicted = null
  }

  onServerPosition(id: string, cellX: number, cellY: number) {
    const sprite = this.sprites.get(id)
    if (!sprite?.scene) return
    if (id === this.ownId && this.predicted) {
      const drift = Phaser.Math.Distance.Between(
        this.predicted.x,
        this.predicted.y,
        cellX,
        cellY
      )
      /* deliberate placements arrive through onAnchored, so anything left here
         is genuine desync from a lost message */
      if (drift < RESYNC_DISTANCE_CELLS) return
      this.predicted.x = this.predicted.targetX = cellX
      this.predicted.y = this.predicted.targetY = cellY
    }
    const [x, y] = transformEntityCoordinates(cellX, cellY, this.flip)
    sprite.setData({ serverX: x, serverY: y })
  }

  /** the server placed this avatar rather than walking it: take its word */
  onAnchored(id: string, cellX: number, cellY: number) {
    const sprite = this.sprites.get(id)
    if (!sprite?.scene) return
    if (id === this.ownId && this.predicted) {
      this.predicted.x = this.predicted.targetX = cellX
      this.predicted.y = this.predicted.targetY = cellY
    }
    const [x, y] = transformEntityCoordinates(cellX, cellY, this.flip)
    sprite.setPosition(x, y)
    sprite.setData({ serverX: x, serverY: y })
    if (sprite.action === PokemonActionState.IDLE) {
      sprite.orientation = this.entryOrientation(sprite)
      sprite.animationLocked = false
      this.scene.animationManager?.animatePokemon(
        sprite,
        sprite.action,
        this.flip
      )
    }
  }

  onServerField(
    id: string,
    field: "action" | "orientation",
    value: PokemonActionState | Orientation
  ) {
    /* while walking, the local avatar animates off its own prediction and the
       server has nothing to add. Standing still it is the other way round: a
       reset or an anchor is the only thing that changes its facing */
    if (id === this.ownId && this.isPredictedMoving()) return
    const sprite = this.sprites.get(id)
    if (!sprite?.scene) return
    sprite.animationLocked = false
    if (field === "orientation") {
      /* Walking direction is meaningful; once stopped, board half owns facing. */
      if (sprite.action !== PokemonActionState.IDLE) {
        sprite.orientation = value as Orientation
      }
    } else {
      sprite.action = value as PokemonActionState
    }
    this.scene.animationManager?.animatePokemon(
      sprite,
      sprite.action,
      this.flip
    )
    this.syncAnimationRate(sprite, sprite.action)
  }

  updateLife(id: string, life: number) {
    const sprite = this.sprites.get(id)
    if (sprite?.scene) sprite.updateLife(life)
  }

  // --- input and reactions -------------------------------------------------

  /** a click on bare ground: move now, tell the server after */
  requestMove(worldX: number, worldY: number) {
    if (!this.predicted || !this.ownId) return
    /* only steer while looking at the board the avatar stands on, or clicking
       around someone else's would walk it at home for everyone watching */
    if (!this.visibleIds().has(this.ownId)) return
    const [rawX, rawY] = untransformEntityCoordinates(worldX, worldY, this.flip)
    // Clamp prediction as well as the authoritative server target.
    const x = Phaser.Math.Clamp(rawX, AVATAR_ROAM_MIN_X, AVATAR_ROAM_MAX_X)
    const y = Phaser.Math.Clamp(rawY, AVATAR_ROAM_MIN_Y, AVATAR_ROAM_MAX_Y)
    this.predicted.targetX = x
    this.predicted.targetY = y
    const [borderedWorldX, borderedWorldY] = transformEntityCoordinates(
      x,
      y,
      this.flip
    )
    this.showClickFeedback(borderedWorldX, borderedWorldY)
    moveAvatar(x, y)
  }

  getEmoteMenuHost(fallback: PokemonAvatar): PokemonAvatar {
    if (fallback.visible) return fallback
    for (const id of this.visibleIds()) {
      const sprite = this.sprites.get(id)
      if (sprite?.scene && sprite.visible) return sprite
    }
    return fallback
  }

  reaction(playerId: string, action: PokemonActionState) {
    const sprite = this.sprites.get(playerId)
    if (!sprite?.scene) return
    sprite.animationLocked = false
    sprite.action = action
    this.scene.animationManager?.animatePokemon(sprite, action, this.flip)
    if (playerId === this.ownId && this.predicted) {
      /* stop where it stands rather than sliding through the celebration */
      this.predicted.targetX = this.predicted.x
      this.predicted.targetY = this.predicted.y
    }
    this.scheduleReactionEnd(playerId)
  }

  /** false when this player has no visible avatar, so the caller can fall back */
  showEmote(playerId: string, emote?: string): boolean {
    const sprite = this.sprites.get(playerId)
    if (!sprite?.scene) return false
    const useVisibleHost = !sprite.visible && playerId === this.ownId
    // Consume remote emotes while their walking avatar is transitioning.
    if (!sprite.visible && !useVisibleHost) return true
    const target = useVisibleHost ? this.getEmoteMenuHost(sprite) : sprite
    // Let BoardManager fall back to a visible scouting avatar.
    if (!target.visible) return false
    target.animationLocked = false
    this.scene.animationManager?.play(
      target,
      PokemonAnimations[target.name].emote
    )
    if (emote) target.drawSpeechBubble(emote, playerId !== this.ownId)
    return true
  }

  /** the portal transition owns the screen while it runs */
  setHidden(hidden: boolean) {
    this.hidden = hidden
  }

  // --- render loop ---------------------------------------------------------

  update(delta: number) {
    this.sprites.forEach((sprite) => sprite.clearStaleEmoteDisplay())
    this.localEmoteController?.clearStaleEmoteDisplay()
    this.scene.board?.clearStaleAvatarEmoteDisplays()
    /* a sprite only moves when a patch arrives, but the flip changes at the
       start of a fight without any cell position changing. Anything that stayed
       put would keep the coordinates worked out under the old flip */
    const phase = this.scene.room?.state.phase
    const phaseChanged = phase !== this.lastPhase
    const hadPreviousPhase = this.lastPhase !== undefined
    if (phaseChanged) {
      this.lastPhase = phase
    }
    const flip = this.flip
    const flipChanged = flip !== this.lastFlip
    if (flipChanged) {
      this.lastFlip = flip
      this.refreshPositions()
    }
    if (phaseChanged || flipChanged) {
      // Stop looping reactions and recompute facing after phase/camera changes.
      this.settleAllAvatars()
    }
    if (phaseChanged) this.clearEmoteDisplays()
    this.syncVisibility()
    if (phaseChanged && hadPreviousPhase) this.fadeInAnchoredAvatars()
    this.stepPrediction(delta)
    this.drawRemotes()
  }

  private stepPrediction(delta: number) {
    const own = this.ownId ? this.sprites.get(this.ownId) : undefined
    if (!this.predicted || !own?.scene) return

    const step = (AVATAR_WALK_SPEED_CELLS_PER_SECOND * delta) / 1000
    const dx = this.predicted.targetX - this.predicted.x
    const dy = this.predicted.targetY - this.predicted.y
    const distance = Math.hypot(dx, dy)

    if (distance > ARRIVED_DISTANCE_CELLS) {
      if (distance <= step) {
        this.predicted.x = this.predicted.targetX
        this.predicted.y = this.predicted.targetY
      } else {
        this.predicted.x += (dx / distance) * step
        this.predicted.y += (dy / distance) * step
      }
      /* negated for the same reason the server negates: cells count up, this
         reads screen space. Stored unflipped, mirrored at draw time */
      this.setAnimation(
        own,
        PokemonActionState.WALK,
        getOrientation(0, 0, dx, -dy)
      )
    } else {
      this.setAnimation(own, PokemonActionState.IDLE, own.orientation)
    }

    const [x, y] = transformEntityCoordinates(
      this.predicted.x,
      this.predicted.y,
      this.flip
    )
    own.setPosition(x, y)
  }

  private drawRemotes() {
    this.sprites.forEach((sprite, id) => {
      if (id === this.ownId || !sprite.scene || !sprite.data) return
      const { serverX, serverY } = sprite.data.values
      if (serverX === undefined || serverY === undefined) return
      if (
        Phaser.Math.Distance.Between(sprite.x, sprite.y, serverX, serverY) <
        REMOTE_SNAP_PX
      ) {
        sprite.setPosition(serverX, serverY)
        return
      }
      sprite.x = Phaser.Math.Linear(sprite.x, serverX, REMOTE_SMOOTHING)
      sprite.y = Phaser.Math.Linear(sprite.y, serverY, REMOTE_SMOOTHING)
    })
  }

  private syncVisibility() {
    const visible = this.visibleIds()
    this.sprites.forEach((sprite, id) => {
      if (sprite.scene) sprite.setVisible(visible.has(id))
    })
  }

  private refreshPositions() {
    this.sprites.forEach((sprite, id) => {
      const avatar = this.scene.room?.state.playerAvatars.get(id)
      if (!sprite.scene || !avatar) return
      const [x, y] = transformEntityCoordinates(avatar.x, avatar.y, this.flip)
      sprite.setPosition(x, y)
      sprite.setData({ serverX: x, serverY: y })
      if (id === this.ownId && this.predicted) {
        this.predicted.x = this.predicted.targetX = avatar.x
        this.predicted.y = this.predicted.targetY = avatar.y
      }
    })
  }

  // --- helpers -------------------------------------------------------------

  private isPredictedMoving(): boolean {
    if (!this.predicted) return false
    return (
      Math.hypot(
        this.predicted.targetX - this.predicted.x,
        this.predicted.targetY - this.predicted.y
      ) > ARRIVED_DISTANCE_CELLS
    )
  }

  private get ownId(): string | undefined {
    return this.scene.uid
  }

  /* pick phase boards are never mirrored, a fight is for the red side */
  private get flip(): boolean {
    return this.scene.room?.state.phase === GamePhaseState.FIGHT
      ? (this.scene.battle?.flip ?? false)
      : false
  }

  /** whose avatars belong on the board currently being looked at */
  private visibleIds(): Set<string> {
    const ids = new Set<string>()
    const phase = this.scene.room?.state.phase
    if (
      this.hidden ||
      (phase !== GamePhaseState.PICK && phase !== GamePhaseState.FIGHT)
    ) {
      return ids
    }
    const simulation = this.scene.battle?.simulation
    if (phase === GamePhaseState.FIGHT && simulation) {
      if (simulation.bluePlayerId) ids.add(simulation.bluePlayerId)
      if (simulation.redPlayerId) ids.add(simulation.redPlayerId)
      /* Double Up: the partner fights on the same board */
      if (simulation.bluePartnerPlayerId)
        ids.add(simulation.bluePartnerPlayerId)
    } else {
      const boardOwner = this.scene.board?.player.id
      if (boardOwner) ids.add(boardOwner)
    }
    return ids
  }

  private setAnimation(
    sprite: PokemonAvatar,
    action: PokemonActionState,
    orientation: Orientation
  ) {
    if (sprite.action === action && sprite.orientation === orientation) return
    /* a reaction or an emote locks the sprite until its animation completes,
       and a looping one never does. Moving again releases it */
    sprite.animationLocked = false
    sprite.action = action
    sprite.orientation = orientation
    this.scene.animationManager?.animatePokemon(sprite, action, this.flip)
    this.syncAnimationRate(sprite, action)
  }

  private settleAllAvatars() {
    this.sprites.forEach((sprite) => {
      if (!sprite.scene) return
      sprite.hideEmoteMenu()
      sprite.animationLocked = false
      sprite.action = PokemonActionState.IDLE
      this.scene.animationManager?.animatePokemon(
        sprite,
        sprite.action,
        this.flip
      )
      this.syncAnimationRate(sprite, sprite.action)
    })
  }

  private fadeInAnchoredAvatars() {
    const visible = this.visibleIds()
    this.sprites.forEach((sprite, id) => {
      if (!sprite.scene || !visible.has(id)) return
      this.scene.tweens.killTweensOf(sprite)
      sprite.setAlpha(0)
      this.scene.tweens.add({
        targets: sprite,
        alpha: 1,
        duration: TRANSITION_FADE_MS,
        ease: "Sine.easeOut"
      })
    })
  }

  private clearEmoteDisplays() {
    this.sprites.forEach((sprite) => sprite.clearEmoteDisplay())
    this.localEmoteController?.clearEmoteDisplay()
  }

  // At an entry anchor, lower avatars face north and upper avatars face south.
  private entryOrientation(sprite: PokemonAvatar): Orientation {
    const [, middleY] = transformEntityCoordinates(
      0,
      (BOARD_HEIGHT - 1) / 2,
      this.flip
    )
    const screenOrientation =
      sprite.y >= middleY ? Orientation.UP : Orientation.DOWN
    return this.flip
      ? screenOrientation === Orientation.UP
        ? Orientation.DOWN
        : Orientation.UP
      : screenOrientation
  }

  /* has to run after the animation starts, which resets its speed */
  private syncAnimationRate(sprite: PokemonAvatar, action: PokemonActionState) {
    if (action !== PokemonActionState.WALK) {
      sprite.sprite.anims.timeScale = 1
      return
    }
    const naturalCycleMs = sprite.sprite.anims.currentAnim?.duration
    if (!naturalCycleMs) return
    const speedPxPerSecond = AVATAR_WALK_SPEED_CELLS_PER_SECOND * CELL_WIDTH
    const travelCycleMs = (WALK_STRIDE_PX / speedPxPerSecond) * 1000
    sprite.sprite.anims.timeScale = Phaser.Math.Clamp(
      naturalCycleMs / travelCycleMs,
      MIN_WALK_ANIM_RATE,
      MAX_WALK_ANIM_RATE
    )
  }

  private scheduleReactionEnd(playerId: string) {
    clearTimeout(this.reactionTimers.get(playerId))
    this.reactionTimers.set(
      playerId,
      setTimeout(() => {
        this.reactionTimers.delete(playerId)
        const sprite = this.sprites.get(playerId)
        if (!sprite?.scene) return
        sprite.animationLocked = false
        sprite.action =
          this.scene.room?.state.playerAvatars.get(playerId)?.action ??
          PokemonActionState.IDLE
        this.scene.animationManager?.animatePokemon(
          sprite,
          sprite.action,
          this.flip
        )
        this.syncAnimationRate(sprite, sprite.action)
      }, REACTION_DURATION_MS)
    )
  }

  private showClickFeedback(worldX: number, worldY: number) {
    const ripple = this.scene.add.sprite(
      worldX,
      worldY,
      "attacks",
      "WATER/cell/000.png"
    )
    ripple.setDepth(DEPTH.INDICATOR)
    ripple.anims.play("WATER/cell")
    this.scene.tweens.add({
      targets: ripple,
      x: worldX,
      y: worldY,
      ease: "linear",
      yoyo: true,
      duration: 200,
      onComplete: () => ripple.destroy()
    })
  }
}
