import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

const VORTEX_RADIUS = 4
const VORTEX_DURATION = 5000

export class SandResetStrategy extends AbilityStrategy {
  requiresTarget = false

  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity | null,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)

    const damageMultiplier = [2, 3, 4, 5][pokemon.stars - 1] ?? 5
    pokemon.sandResetVortexes += 1

    board
      .getCellsInRadius(
        pokemon.positionX,
        pokemon.positionY,
        VORTEX_RADIUS,
        false
      )
      .forEach((cell) => {
        if (!cell.value) return

        const distance = Math.round(
          Math.hypot(cell.x - pokemon.positionX, cell.y - pokemon.positionY)
        )
        const silenceDuration = (5 - distance) * 1000
        if (silenceDuration > 0) {
          cell.value.status.triggerSilence(silenceDuration, cell.value, pokemon)
        }
      })

    pokemon.simulation.room.clock.setTimeout(() => {
      pokemon.sandResetVortexes = Math.max(0, pokemon.sandResetVortexes - 1)
      if (
        !pokemon.simulation ||
        !pokemon.simulation.room ||
        pokemon.simulation.finished
      ) {
        return
      }

      const damage = Math.round(pokemon.atk * damageMultiplier)
      board
        .getCellsInRadius(
          pokemon.positionX,
          pokemon.positionY,
          VORTEX_RADIUS,
          false
        )
        .forEach((cell) => {
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
    }, VORTEX_DURATION)
  }
}
