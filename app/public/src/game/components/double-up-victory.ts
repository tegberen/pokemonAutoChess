import { t } from "i18next"
import type { Emotion } from "../../../../types"
import { Orientation, PokemonActionState } from "../../../../types/enum/Game"
import type { Pkm } from "../../../../types/enum/Pokemon"
import { getPokemonCustomFromAvatar } from "../../../../utils/avatar"
import { pickNRandomIn } from "../../../../utils/random"
import { DEPTH } from "../depths"
import type GameScene from "../scenes/game-scene"
import PokemonSpecial from "./pokemon-special"

type VictoryTeamMember = { name: Pkm; shiny?: boolean; emotion?: Emotion }

export type VictoryWinner = {
  name: string
  avatar: string
  team: VictoryTeamMember[]
}

const PLAZA_X = 980
const PLAZA_Y = 404
const TEAM_RADIUS_X = 300
const TEAM_RADIUS_Y = 190
const WINNER_SPACING = 40
const WINNERS_Y = PLAZA_Y + 60
const TITLE_Y = PLAZA_Y - 92
const NAMES_Y = PLAZA_Y - 40
const CELEBRATION_INTERVAL_MS = 1400
const TEAM_CHEERERS_PER_BEAT = 5

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

function spawnTeamArc(
  scene: GameScene,
  team: VictoryTeamMember[],
  fromAngle: number,
  toAngle: number
) {
  return team.map((pokemon, index) => {
    const ratio = team.length === 1 ? 0.5 : index / (team.length - 1)
    const angle = fromAngle + (toAngle - fromAngle) * ratio
    const x = PLAZA_X + TEAM_RADIUS_X * Math.cos(angle)
    const y = PLAZA_Y + TEAM_RADIUS_Y * Math.sin(angle)
    return new PokemonSpecial({
      scene,
      x,
      y,
      name: pokemon.name,
      shiny: pokemon.shiny,
      emotion: pokemon.emotion,
      orientation: facing(PLAZA_X - x, PLAZA_Y - y)
    })
  })
}

export function showDoubleUpVictory(
  scene: GameScene,
  winners: VictoryWinner[]
): () => void {
  const toRadians = Math.PI / 180
  const [left, right] = winners
  const halfArc = (team: VictoryTeamMember[]) =>
    (Math.min(Math.max(team.length * 14, 110), 170) / 2) * toRadians
  const teamSprites = [
    ...(left
      ? spawnTeamArc(
          scene,
          left.team,
          Math.PI - halfArc(left.team),
          Math.PI + halfArc(left.team)
        )
      : []),
    ...(right
      ? spawnTeamArc(scene, right.team, -halfArc(right.team), halfArc(right.team))
      : [])
  ]

  const avatars = winners.map((winner, index) => {
    const { name, shiny, emotion } = getPokemonCustomFromAvatar(winner.avatar)
    const offset = (index - (winners.length - 1) / 2) * WINNER_SPACING * 2
    return new PokemonSpecial({
      scene,
      x: PLAZA_X + offset,
      y: WINNERS_Y,
      name,
      shiny,
      emotion,
      orientation: Orientation.DOWN,
      dialog: winner.name
    })
  })

  const celebration = scene.time.addEvent({
    delay: CELEBRATION_INTERVAL_MS,
    loop: true,
    callback: () =>
      [...avatars, ...pickNRandomIn(teamSprites, TEAM_CHEERERS_PER_BEAT)].forEach(
        (pokemon) =>
          scene.animationManager?.animatePokemon(
            pokemon,
            PokemonActionState.EMOTE,
            false,
            false
          )
      )
  })

  const textStyle = {
    fontFamily: "Jost",
    color: "#ffffff",
    stroke: "#000000",
    align: "center"
  }
  const title = scene.add
    .text(PLAZA_X + 24, TITLE_Y, t("double_up_victory"), {
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
      PLAZA_X + 24,
      NAMES_Y,
      `${winners.map((winner) => winner.name).join(" & ")}\n${t("double_up_victory_subtitle")}`,
      { ...textStyle, fontSize: "22px", strokeThickness: 4, lineSpacing: 6 }
    )
    .setOrigin(0.5, 0)
    .setDepth(DEPTH.TEXT)

  return () => {
    celebration.remove()
    ;[...teamSprites, ...avatars, title, names].forEach((object) =>
      object.destroy()
    )
  }
}
