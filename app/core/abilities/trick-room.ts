import { TRICK_ROOM_TILES_MS } from "../../config/game/abilities"
import { Blessing } from "../../types/enum/Blessing"
import { AttackType } from "../../types/enum/Game"
import { distanceC } from "../../utils/distance"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

export class TrickRoomStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)

    const maxPPIncrease = [5, 10, 20, 20][pokemon.stars - 1] ?? 20
    const maxPPDamagePercent = [25, 50, 100, 100][pokemon.stars - 1] ?? 100
    const statusDuration =
      [3000, 4000, 5000, 6000][pokemon.stars - 1] ?? 6000
    // the speed it entered the fight with, so buffs gained since never let the
    // room speed an enemy up
    const roomSpeed = pokemon.refToBoardPokemon.speed
    const room = findLargestEnemyGroup(pokemon, board, target)

    pokemon.broadcastAbility({ targetX: room.x, targetY: room.y })
    pokemon.commands.push(
      new DelayedCommand(() => {
        board
          .getAdjacentCells(room.x, room.y, true)
          .forEach(({ value: enemy }) => {
            if (!enemy || enemy.team === pokemon.team) return
            pokemon.broadcastAbility({
              skill: "TRICK_ROOM_SLOW",
              positionX: enemy.positionX,
              positionY: enemy.positionY
            })
            if (enemy.speed > roomSpeed) {
              enemy.addSpeed(roomSpeed - enemy.speed, pokemon, 0, false)
            }
            // the same 255 cap as the max PP hex, since every cast stacks
            enemy.maxPP = Math.min(
              255,
              Math.round((enemy.maxPP * (100 + maxPPIncrease)) / 100)
            )
            enemy.handleSpecialDamage(
              Math.round((enemy.maxPP * maxPPDamagePercent) / 100),
              board,
              AttackType.SPECIAL,
              pokemon,
              crit
            )
            if (pokemon.heroBlessings?.has(Blessing.DECELERATE)) {
              applyTrickRoomStatuses(pokemon, enemy, statusDuration)
            }
          })
      }, TRICK_ROOM_TILES_MS)
    )
  }
}

// the 3x3 holding the most enemies, its centre kept off the board's edges so
// the whole room shows; ties go to the one closest to the user's target
function findLargestEnemyGroup(
  pokemon: PokemonEntity,
  board: Board,
  target: PokemonEntity
) {
  let best = { x: target.positionX, y: target.positionY }
  let bestCount = -1
  let bestDistance = Infinity
  for (let y = 1; y < board.rows - 1; y++) {
    for (let x = 1; x < board.columns - 1; x++) {
      const count = board
        .getAdjacentCells(x, y, true)
        .filter(({ value }) => value && value.team !== pokemon.team).length
      const distance = distanceC(x, y, target.positionX, target.positionY)
      if (
        count > bestCount ||
        (count === bestCount && distance < bestDistance)
      ) {
        best = { x, y }
        bestCount = count
        bestDistance = distance
      }
    }
  }
  return best
}

function applyTrickRoomStatuses(
  pokemon: PokemonEntity,
  enemy: PokemonEntity,
  duration: number
) {
  enemy.status.triggerFatigue(duration, enemy, pokemon, true)
  enemy.status.triggerBlinded(duration, enemy, pokemon, true)
}
