import { Ability } from "../../types/enum/Ability"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class MagneticFluxStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const armorBonus = [15, 15, 15, 30][pokemon.stars - 1] ?? 30
    const buffAmount = armorBonus * (1 + pokemon.ap / 100) * (crit ? pokemon.critPower : 1)
    const duration = 5000
    const cells = board.getCellsInRadius(
      pokemon.positionX,
      pokemon.positionY,
      2,
      false
    )
    cells.forEach((cell) => {
      if (cell.value && cell.value.team === pokemon.team) {
        const ally = cell.value
        ally.broadcastAbility({
          skill: Ability.MAGNETIC_FLUX,
          positionX: ally.positionX,
          positionY: ally.positionY
        })
        ally.addDefense(buffAmount, pokemon, 0, false)
        ally.addSpecialDefense(buffAmount, pokemon, 0, false)
        if (!ally.status.electricField) {
          pokemon.simulation.room.clock.setTimeout(() => {
            if (!pokemon.simulation || !pokemon.simulation.room || pokemon.simulation.finished) return
            ally.addDefense(-buffAmount, pokemon, 0, false)
            ally.addSpecialDefense(-buffAmount, pokemon, 0, false)
          }, duration)
        }
      }
    })
  }
}
