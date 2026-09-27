import { Blessing } from "../../types/enum/Blessing"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class SandTombStrategy extends AbilityStrategy {
  requiresTarget = false

  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity | null,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)

    const vortexRadius = 4
    const vortexDuration = 5000
    const damageMultiplier = [1, 2, 3, 4][pokemon.stars - 1] ?? 4
    const castPositionX = pokemon.positionX
    const castPositionY = pokemon.positionY
    pokemon.sandTombVortexes += 1

    // drawn in before the silence is measured, so they end up silenced longer
    if (pokemon.heroBlessings?.has(Blessing.WINDY_SANDS)) {
      pullEnemiesOneTileCloser(pokemon, board, vortexRadius)
    }

    board
      .getCellsInRadius(castPositionX, castPositionY, vortexRadius, false)
      .forEach((cell) => {
        if (!cell.value) return

        const distance = Math.round(
          Math.hypot(cell.x - castPositionX, cell.y - castPositionY)
        )
        const silenceDuration = (5 - distance) * 1000
        if (silenceDuration > 0) {
          cell.value.status.triggerSilence(silenceDuration, cell.value, pokemon)
        }
      })

    pokemon.simulation.room.clock.setTimeout(() => {
      pokemon.sandTombVortexes = Math.max(0, pokemon.sandTombVortexes - 1)
      if (
        !pokemon.simulation ||
        !pokemon.simulation.room ||
        pokemon.simulation.finished ||
        pokemon.hp <= 0
      ) {
        return
      }

      const damage = Math.round(pokemon.atk * damageMultiplier)
      board
        .getCellsInRadius(castPositionX, castPositionY, vortexRadius, false)
        .forEach((cell) => {
          if (cell.value && cell.value.team !== pokemon.team) {
            pokemon.broadcastAbility({
              skill: "SAND_TOMB_HIT",
              targetX: cell.x,
              targetY: cell.y
            })
            cell.value.handleSpecialDamage(
              damage,
              board,
              AttackType.SPECIAL,
              pokemon,
              crit
            )
          }
        })
    }, vortexDuration)
  }
}

// nearest first, so each one frees the tile the next enemy is pulled into
function pullEnemiesOneTileCloser(
  hippopotas: PokemonEntity,
  board: Board,
  radius: number
) {
  const distanceToHippopotas = (enemy: PokemonEntity) =>
    Math.hypot(
      enemy.positionX - hippopotas.positionX,
      enemy.positionY - hippopotas.positionY
    )
  board
    .getCellsInRadius(hippopotas.positionX, hippopotas.positionY, radius, false)
    .map((cell) => cell.value)
    .filter(
      (enemy): enemy is PokemonEntity =>
        enemy !== undefined && enemy.team !== hippopotas.team && enemy.hp > 0
    )
    .sort((a, b) => distanceToHippopotas(a) - distanceToHippopotas(b))
    .forEach((enemy) => {
      const x =
        enemy.positionX + Math.sign(hippopotas.positionX - enemy.positionX)
      const y =
        enemy.positionY + Math.sign(hippopotas.positionY - enemy.positionY)
      if (board.getEntityOnCell(x, y) !== undefined) return
      enemy.moveTo(x, y, board, true)
    })
}
