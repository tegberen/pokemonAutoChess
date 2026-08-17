import Phaser from "phaser"
import {
  GamePhaseState,
  Orientation,
  PokemonActionState
} from "../../../../types/enum/Game"
import { getOrientation } from "../../../../utils/orientation"
import { preference } from "../../preferences"
import { DEPTH } from "../depths"
import type GameScene from "../scenes/game-scene"
import type PokemonAvatar from "./pokemon-avatar"

const WALKING_AVATAR_SPEED = 200
/* starts at full speed and slows into the target, so it still turns on a dime */
const WALKING_AVATAR_EASE = "Sine.easeOut"
const MIN_WALK_DISTANCE = 4
/* how far one animation cycle is meant to carry the avatar */
const WALK_STRIDE_PX = 48
const MIN_WALK_ANIM_RATE = 0.5
const MAX_WALK_ANIM_RATE = 2.5
export const AVATAR_HOME_X = 504
export const AVATAR_HOME_Y = 696

type Destination = { x: number; y: number }

/**
 * Lets a player walk their own avatar around by clicking, for fun. It only ever
 * moves on that player's own screen; nobody else sees it.
 *
 * On your own board this is the avatar standing in the corner. When you are
 * looking at someone else's board that one is theirs, so it walks your marker
 * from the list of onlookers instead.
 */
export default class WalkingAvatarManager {
  scene: GameScene

  constructor(scene: GameScene) {
    this.scene = scene
  }

  onPointerDown(pointer: Phaser.Input.Pointer) {
    if (!pointer.leftButtonDown() || !this.canWalk()) return
    if (this.isClickClaimedByAnotherObject(pointer)) return

    const camera = this.scene.cameras.main
    this.walkTo(
      camera.worldView.left + pointer.x / camera.zoom,
      camera.worldView.top + pointer.y / camera.zoom
    )
  }

  /* the toggle looks broken if the avatar is left standing wherever it wandered */
  sendHome() {
    this.scene.board?.scoutingAvatars.forEach((scout) => {
      scout.setWandering(false)
    })
    const avatar = this.scene.board?.playerAvatar
    if (!avatar?.scene) return
    this.scene.tweens.killTweensOf(avatar)
    avatar.setPosition(AVATAR_HOME_X, AVATAR_HOME_Y)
    avatar.setWandering(false)
    avatar.orientation = Orientation.UPRIGHT
    this.settle(avatar)
  }

  private walkTo(targetX: number, targetY: number) {
    const avatar = this.getWalkableAvatar()
    if (!avatar) return
    if (this.scene.pokemonDragged || this.scene.itemDragged) return

    const destination = this.clampToMap(targetX, targetY)
    const distance = Phaser.Math.Distance.Between(
      avatar.x,
      avatar.y,
      destination.x,
      destination.y
    )
    if (distance < MIN_WALK_DISTANCE) return

    avatar.setWandering(true)
    this.showClickFeedback(destination)
    this.faceDestination(avatar, destination)
    this.startMoving(avatar, destination, distance)
  }

  private canWalk(): boolean {
    return (
      preference("walkingAvatar") === true &&
      (this.scene.room?.state.phase === GamePhaseState.PICK ||
        this.scene.room?.state.phase === GamePhaseState.FIGHT)
    )
  }

  /**
   * Clicking a pokemon or an item should pick it up, not send the avatar
   * walking. Checking on the press works because a drag can only start on
   * something draggable, so a press on bare ground is always a move order.
   * Zones are ignored: they cover the whole board and only matter to a drag
   * that is already under way.
   */
  private isClickClaimedByAnotherObject(pointer: Phaser.Input.Pointer): boolean {
    return this.scene.input
      .hitTestPointer(pointer)
      .some((object) => object instanceof Phaser.GameObjects.Zone === false)
  }

  private getWalkableAvatar(): PokemonAvatar | null {
    const board = this.scene.board
    if (!board) return null
    const avatar =
      board.player.id === this.scene.uid
        ? board.playerAvatar
        : board.scoutingAvatars.find(
            (scout) => scout.playerId === this.scene.uid
          )
    /* a dead player's avatar is gone even though the reference is still here */
    return avatar?.scene ? avatar : null
  }

  /* the whole map, not just the part currently on screen: zooming in would
     otherwise fence the avatar into whatever the player can see */
  private clampToMap(x: number, y: number): Destination {
    const bounds = this.scene.cameras.main.getBounds()
    return {
      x: Phaser.Math.Clamp(x, bounds.left, bounds.right),
      y: Phaser.Math.Clamp(y, bounds.top, bounds.bottom)
    }
  }

  /* winning leaves the avatar hopping, and it keeps hopping until the round ends */
  private isCelebrating(avatar: PokemonAvatar): boolean {
    return avatar.action === PokemonActionState.HOP
  }

  private faceDestination(avatar: PokemonAvatar, destination: Destination) {
    /* a hop or an emote freezes the sprite until it finishes, and one that
       loops never does. Clicking should win over it */
    const wasFrozen = avatar.animationLocked
    avatar.animationLocked = false

    const action = this.isCelebrating(avatar)
      ? PokemonActionState.HOP
      : PokemonActionState.WALK
    const orientation = getOrientation(
      avatar.x,
      avatar.y,
      destination.x,
      destination.y
    )
    /* only restart the animation when something actually changed, or clicking
       repeatedly keeps resetting it to its first frame and it looks stuck */
    if (
      wasFrozen ||
      orientation !== avatar.orientation ||
      avatar.action !== action
    ) {
      avatar.orientation = orientation
      avatar.action = action
      this.scene.animationManager?.animatePokemon(avatar, action, false)
    }
    this.syncAnimationRateToTravel(avatar)
  }

  /* the mover built into the sprite runs at a flat speed and stops dead, so the
     avatar is tweened instead and can ease as it arrives */
  private startMoving(
    avatar: PokemonAvatar,
    destination: Destination,
    distance: number
  ) {
    this.scene.tweens.killTweensOf(avatar)
    this.scene.tweens.add({
      targets: avatar,
      x: destination.x,
      y: destination.y,
      duration: (distance / WALKING_AVATAR_SPEED) * 1000,
      ease: WALKING_AVATAR_EASE,
      onComplete: () => {
        if (!avatar.scene) return
        if (this.isCelebrating(avatar)) {
          avatar.sprite.anims.timeScale = 1
          return
        }
        this.settle(avatar)
      }
    })
  }

  private settle(avatar: PokemonAvatar) {
    avatar.action = PokemonActionState.IDLE
    this.scene.animationManager?.animatePokemon(avatar, avatar.action, false)
    avatar.sprite.anims.timeScale = 1
  }

  /* each pokemon has its own hand drawn walk cycle, so without this the legs
     move at a speed that has nothing to do with the ground being covered and
     the avatar looks like it is skating */
  private syncAnimationRateToTravel(avatar: PokemonAvatar) {
    const naturalCycleMs = avatar.sprite.anims.currentAnim?.duration
    if (!naturalCycleMs) return
    const travelCycleMs = (WALK_STRIDE_PX / WALKING_AVATAR_SPEED) * 1000
    avatar.sprite.anims.timeScale = Phaser.Math.Clamp(
      naturalCycleMs / travelCycleMs,
      MIN_WALK_ANIM_RATE,
      MAX_WALK_ANIM_RATE
    )
  }

  private showClickFeedback({ x, y }: Destination) {
    const clickAnimation = this.scene.add.sprite(
      x,
      y,
      "attacks",
      "WATER/cell/000.png"
    )
    clickAnimation.setDepth(DEPTH.INDICATOR)
    clickAnimation.anims.play("WATER/cell")
    this.scene.tweens.add({
      targets: clickAnimation,
      x,
      y,
      ease: "linear",
      yoyo: true,
      duration: 200,
      onComplete: () => {
        clickAnimation.destroy()
      }
    })
  }
}
