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
    const damageMultiplier = [2, 3, 4, 5][pokemon.stars - 1] ?? 5
    const castPositionX = pokemon.positionX
    const castPositionY = pokemon.positionY
    pokemon.sandTombVortexes += 1

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
