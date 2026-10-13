import { t } from "i18next"
import type Phaser from "phaser"
import type { Emotion } from "../../../../types"
import { Orientation, PokemonActionState } from "../../../../types/enum/Game"
import type { Pkm } from "../../../../types/enum/Pokemon"
import { getPokemonCustomFromAvatar } from "../../../../utils/avatar"
import { pickRandomIn } from "../../../../utils/random"
import { DEPTH } from "../depths"
import type GameScene from "../scenes/game-scene"
import PokemonSpecial from "./pokemon-special"

type DailyDuelTeamMember = { name: Pkm; shiny?: boolean; emotion?: Emotion }

export type DailyDuelFinisher = {
  name: string
  avatar: string
  team: DailyDuelTeamMember[]
}

type Point = { x: number; y: number }

// world positions of the town map, where the sprites are drawn. The podium is
// where yesterday's top 3 stand outside the victory scene
const PODIUM_X = 6.5 * 48 + 24
const PODIUM_Y = 12.5 * 48 + 24
const PODIUM_OFFSETS_BY_RANK = [0, -64, 64]
// the center of the plaza, shared by the ring, the title and the players
const PLAZA_X = 1004
const PLAZA_Y = 404
// the teams stand in one ring around the plaza, open at the bottom for the
// three players to walk out. Angles in degrees, 90 being straight down
const RING_RADIUS_X = 300
const RING_RADIUS_Y = 190
const RING_GAP_DEGREES = 36
const TEAM_SEGMENT_ORDER_BY_RANK = [1, 0, 2]
const AVATAR_OFFSETS_BY_RANK = [0, -64, 64]
// the player nearest the bridge leads, so nobody walks through another and
// each turns off onto the podium spot that lies first on the way
const WALK_ORDER_BY_RANK = [1, 0, 2]
const AVATAR_Y = PLAZA_Y + 124
// the sand path along the bottom of the plaza, then across the bridge
const PATH_Y = 676
const BRIDGE_EAST_X = 590
const BRIDGE_WEST_X = 430
const WALK_SPEED_PX_PER_MS = 0.18
const WALK_START_DELAY_MS = 1500
const WALK_STAGGER_MS = 450
// in the middle of the ring, with the players below it
const TITLE_Y = PLAZA_Y - 56
const NAMES_Y = PLAZA_Y - 4
// every dancer keeps its own beat, a bit faster or slower than its neighbours
// and starting at a random point, so the crowd never moves in unison
const DANCE_BEAT_MS = 950
const DANCE_BEAT_SPREAD = 0.4
const DANCE_JUMP_PX = 6
const DANCE_JUMP_MS = 170
const DANCE_MOVES = [PokemonActionState.HOP, PokemonActionState.EMOTE]
const DANCE_FACINGS = [
  Orientation.DOWN,
  Orientation.DOWNLEFT,
  Orientation.DOWNRIGHT
]

const REDUCED_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true

function facing(dx: number, dy: number): Orientation {
  const directions = [
    Orientation.RIGHT,
    Orientation.DOWNRIGHT,
    Orientation.DOWN,
    Orientation.DOWNLEFT,
    Orientation.LEFT,
    Orientation.UPLEFT,
    Orientation.UP,
    Orientation.UPRIGHT
  ]
  const octant = Math.round(Math.atan2(dy, dx) / (Math.PI / 4))
  return directions[(octant + 8) % 8]
}

// PokemonSpecial draws itself 24px off the position it is given
function spawnAt(
  scene: GameScene,
  point: Point,
  member: DailyDuelTeamMember,
  dialog?: string
) {
  return new PokemonSpecial({
    scene,
    x: point.x - 24,
    y: point.y - 24,
    name: member.name,
    shiny: member.shiny,
    emotion: member.emotion,
    orientation: Orientation.DOWN,
    dialog
  })
}

// the ring left of the gap is split in 3 equal stretches, going from the
// bottom left round over the top to the bottom right
function spawnTeamOnRing(
  scene: GameScene,
  team: DailyDuelTeamMember[],
  segment: number
) {
  const ringStart = 90 + RING_GAP_DEGREES / 2
  const segmentSpan = (360 - RING_GAP_DEGREES) / 3
  return team.map((member, index) => {
    const degrees =
      ringStart + segmentSpan * (segment + (index + 0.5) / team.length)
    const radians = (degrees * Math.PI) / 180
    const x = PLAZA_X + RING_RADIUS_X * Math.cos(radians)
    const y = PLAZA_Y + RING_RADIUS_Y * Math.sin(radians)
    const pokemon = spawnAt(scene, { x, y }, member)
    // without motion the players are already gone, so nobody looks inward
    pokemon.orientation = REDUCED_MOTION
      ? Orientation.DOWN
      : facing(PLAZA_X - x, PLAZA_Y - y)
    // lower on the screen is nearer, so it is drawn in front
    pokemon.sprite.setDepth(DEPTH.POKEMON + y / 1000)
    return pokemon
  })
}

function startDancing(scene: GameScene, pokemon: PokemonSpecial) {
  const groundY = pokemon.y
  const beat = DANCE_BEAT_MS * (1 + (Math.random() - 0.5) * DANCE_BEAT_SPREAD)
  return scene.time.addEvent({
    delay: beat,
    startAt: Math.random() * beat,
    loop: true,
    callback: () => {
      pokemon.orientation = pickRandomIn(DANCE_FACINGS)
      scene.animationManager?.animatePokemon(
        pokemon,
        pickRandomIn(DANCE_MOVES),
        false,
        false
      )
      if (REDUCED_MOTION) return
      scene.tweens.add({
        targets: pokemon,
        y: groundY - DANCE_JUMP_PX,
        duration: DANCE_JUMP_MS,
        ease: "Quad.easeOut",
        yoyo: true,
        onComplete: () => {
          pokemon.y = groundY
        }
      })
    }
  })
}

function walkAlong(
  scene: GameScene,
  pokemon: PokemonSpecial,
  path: Point[],
  delay: number,
  onArrive: () => void
) {
  const [next, ...rest] = path
  if (!next) {
    pokemon.orientation = Orientation.DOWN
    scene.animationManager?.animatePokemon(
      pokemon,
      PokemonActionState.IDLE,
      false
    )
    onArrive()
    return
  }
  const dx = next.x - pokemon.x
  const dy = next.y - pokemon.y
  scene.tweens.add({
    targets: pokemon,
    x: next.x,
    y: next.y,
    ease: "Linear",
    delay,
    duration: Math.hypot(dx, dy) / WALK_SPEED_PX_PER_MS,
    onStart: () => {
      pokemon.orientation = facing(dx, dy)
      scene.animationManager?.animatePokemon(
        pokemon,
        PokemonActionState.WALK,
        false
      )
    },
    onComplete: () => walkAlong(scene, pokemon, rest, 0, onArrive)
  })
}

// finishers are in rank order: the winner first
export function showDailyDuelVictory(
  scene: GameScene,
  finishers: DailyDuelFinisher[]
): () => void {
  const teams = finishers.flatMap((finisher, rank) =>
    spawnTeamOnRing(scene, finisher.team, TEAM_SEGMENT_ORDER_BY_RANK[rank])
  )

  const podiumSpots = finishers.map((_, rank) => ({
    x: PODIUM_X + PODIUM_OFFSETS_BY_RANK[rank],
    y: PODIUM_Y
  }))
  const avatars = finishers.map((finisher, rank) => {
    const startX = PLAZA_X + AVATAR_OFFSETS_BY_RANK[rank]
    const avatar = spawnAt(
      scene,
      REDUCED_MOTION ? podiumSpots[rank] : { x: startX, y: AVATAR_Y },
      getPokemonCustomFromAvatar(finisher.avatar),
      finisher.name
    )
    // the winner stands in front of the two others
    avatar.sprite.setDepth(DEPTH.POKEMON + 3 - rank)
    return avatar
  })

  const textStyle = {
    fontFamily: "Jost",
    color: "#ffffff",
    stroke: "#000000",
    align: "center"
  }
  const title = scene.add
    .text(PLAZA_X, TITLE_Y, t("daily_duel_victory"), {
      ...textStyle,
      fontSize: "60px",
      fontStyle: "bold",
      color: "#ffc107",
      strokeThickness: 7,
      letterSpacing: 8
    })
    .setOrigin(0.5)
    .setDepth(DEPTH.TEXT)
  const names = scene.add
    .text(
      PLAZA_X,
      NAMES_Y,
      `${finishers[0]?.name ?? ""}\n${t("daily_duel_victory_subtitle")}`,
      { ...textStyle, fontSize: "22px", strokeThickness: 4, lineSpacing: 6 }
    )
    .setOrigin(0.5, 0)
    .setDepth(DEPTH.TEXT)

  // the Admin panel's event NPC stands on the bridge, in the players' way
  const eventNpc = scene.minigameManager?.eventNpcVillager ?? null
  const dances: Phaser.Time.TimerEvent[] = []
  const startDancingAll = (dancers: PokemonSpecial[]) =>
    dancers.forEach((pokemon) => dances.push(startDancing(scene, pokemon)))
  const startCelebration = () => {
    title.setVisible(true)
    names.setVisible(true)
    eventNpc?.setVisible(true)
    startDancingAll(avatars)
  }
  // the middle is empty once the players walk off, so the crowd turns down
  // and dances while they head for the podium
  const startCrowdDance = () => {
    teams.forEach((pokemon) => {
      pokemon.orientation = Orientation.DOWN
      scene.animationManager?.animatePokemon(
        pokemon,
        PokemonActionState.IDLE,
        false
      )
    })
    startDancingAll(teams)
  }

  let crowdDanceStart: Phaser.Time.TimerEvent | null = null
  if (REDUCED_MOTION) {
    startCrowdDance()
    startCelebration()
  } else {
    title.setVisible(false)
    names.setVisible(false)
    eventNpc?.setVisible(false)
    crowdDanceStart = scene.time.delayedCall(
      WALK_START_DELAY_MS,
      startCrowdDance
    )
    // cheering waits for the last one, so nobody is cut off mid-walk
    let avatarsOnPodium = 0
    avatars.forEach((avatar, rank) => {
      const spot = podiumSpots[rank]
      walkAlong(
        scene,
        avatar,
        [
          { x: avatar.x, y: PATH_Y },
          { x: BRIDGE_EAST_X, y: PATH_Y },
          { x: BRIDGE_WEST_X, y: PATH_Y },
          { x: spot.x, y: PATH_Y },
          spot
        ],
        WALK_START_DELAY_MS + WALK_ORDER_BY_RANK[rank] * WALK_STAGGER_MS,
        () => {
          avatarsOnPodium++
          if (avatarsOnPodium === avatars.length) startCelebration()
        }
      )
    })
  }

  return () => {
    ;[...avatars, ...teams].forEach((pokemon) =>
      scene.tweens.killTweensOf(pokemon)
    )
    crowdDanceStart?.remove()
    dances.forEach((dance) => dance.remove())
    eventNpc?.setVisible(true)
    ;[...teams, ...avatars, title, names].forEach((object) => object.destroy())
  }
}
