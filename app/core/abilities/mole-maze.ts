import { BOARD_HEIGHT, BOARD_WIDTH } from "../../config"
import {
  MOLE_MAZE_EMERGE_DELAY,
  MOLE_MAZE_POP_DELAY
} from "../../types/enum/Blessing"
import { AttackType, Team } from "../../types/enum/Game"
import { pickRandomIn } from "../../utils/random"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

type BoardCell = { x: number; y: number }

const toCellIndex = ({ x, y }: BoardCell) => y * BOARD_WIDTH + x

export class MoleMazeStrategy extends AbilityStrategy {
  canCritByDefault = true
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    const burrowCell = { x: pokemon.positionX, y: pokemon.positionY }
    const popHoles = getDugHoles(pokemon).filter(
      (hole) => toCellIndex(hole) !== toCellIndex(burrowCell)
    )
    pokemon.simulation.moleMazeHoles.add(toCellIndex(burrowCell))
    broadcastMoleMaze(pokemon, "MOLE_MAZE_BURROW", burrowCell, burrowCell)

    const popHole = popHoles.length > 0 ? pickRandomIn(popHoles) : undefined
    const undergroundDuration = popHole
      ? MOLE_MAZE_EMERGE_DELAY
      : MOLE_MAZE_POP_DELAY
    pokemon.status.vanishing = true
    pokemon.cooldown = undergroundDuration
    if (popHole) {
      pokemon.commands.push(
        new DelayedCommand(() => {
          if (pokemon.hp <= 0) return
          broadcastMoleMaze(pokemon, "MOLE_MAZE_POP", burrowCell, popHole)
          eruptFromHole(pokemon, board, popHole, crit)
        }, MOLE_MAZE_POP_DELAY)
      )
    }

    pokemon.commands.push(
      new DelayedCommand(
        () => {
          pokemon.status.vanishing = false
          if (pokemon.hp <= 0) return
          const exitCell = findExitCell(pokemon, board, target)
          if (exitCell) {
            pokemon.simulation.moleMazeHoles.add(toCellIndex(exitCell))
            pokemon.moveTo(exitCell.x, exitCell.y, board, false)
          }
          const landingCell = exitCell ?? {
            x: pokemon.positionX,
            y: pokemon.positionY
          }
          broadcastMoleMaze(
            pokemon,
            "MOLE_MAZE_EMERGE",
            burrowCell,
            landingCell
          )
          eruptFromHole(pokemon, board, landingCell, crit)
        },
        undergroundDuration
      )
    )
  }
}

// fight-only holes plus the fully dug holes of the owner's own half
function getDugHoles(pokemon: PokemonEntity): BoardCell[] {
  const holeIndexes = new Set(pokemon.simulation.moleMazeHoles)
  const player = pokemon.player
  if (player && !pokemon.isGhostOpponent) {
    for (let row = 0; row < BOARD_HEIGHT / 2; row++) {
      for (let col = 0; col < BOARD_WIDTH; col++) {
        if (player.groundHoles[row * BOARD_WIDTH + col] !== 5) continue
        const y = pokemon.team === Team.RED_TEAM ? BOARD_HEIGHT - 1 - row : row
        holeIndexes.add(toCellIndex({ x: col, y }))
      }
    }
  }
  return [...holeIndexes].map((index) => ({
    x: index % BOARD_WIDTH,
    y: Math.floor(index / BOARD_WIDTH)
  }))
}

// a new, undug free cell next to the target; any free neighbour if all are dug
function findExitCell(
  pokemon: PokemonEntity,
  board: Board,
  target: PokemonEntity
): BoardCell | undefined {
  const center =
    target.hp > 0
      ? { x: target.positionX, y: target.positionY }
      : { x: pokemon.positionX, y: pokemon.positionY }
  const freeCells = board
    .getAdjacentCells(center.x, center.y)
    .filter((cell) => cell.value === undefined)
  const undugCells = freeCells.filter(
    (cell) => !pokemon.simulation.moleMazeHoles.has(toCellIndex(cell))
  )
  const candidates = undugCells.length > 0 ? undugCells : freeCells
  return candidates.length > 0 ? pickRandomIn(candidates) : undefined
}

function eruptFromHole(
  pokemon: PokemonEntity,
  board: Board,
  hole: BoardCell,
  crit: boolean
) {
  const damage = Math.round(pokemon.atk + pokemon.def)
  board.getAdjacentCells(hole.x, hole.y, true).forEach((cell) => {
    if (cell.value && cell.value.team !== pokemon.team) {
      cell.value.handleSpecialDamage(
        damage,
        board,
        AttackType.SPECIAL,
        pokemon,
        crit
      )
    }
  })
}

// the caster is always passed at its burrow cell, so the client can find its
// sprite before the move to the exit hole reaches it
function broadcastMoleMaze(
  pokemon: PokemonEntity,
  skill: string,
  burrowCell: BoardCell,
  hole: BoardCell
) {
  pokemon.broadcastAbility({
    skill,
    positionX: burrowCell.x,
    positionY: burrowCell.y,
    targetX: hole.x,
    targetY: hole.y
  })
}
