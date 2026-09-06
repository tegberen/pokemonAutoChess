import { getItemCapacity } from "../../config"
import { AttackType } from "../../types/enum/Game"
import { distanceC } from "../../utils/distance"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class AcrobaticsStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [20, 40, 80, 160][pokemon.stars - 1] ?? 160
    const speedPerEmptySlot = [5, 10, 20, 40][pokemon.stars - 1] ?? 40
    target.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)

    // the free cell still in attack range of the target that is furthest from it
    const candidateDestinationCells = board
      .getCellsInRange(target.positionX, target.positionY, pokemon.range, false)
      .filter((cell) => cell.value === undefined)
      .sort(
        (a, b) =>
          distanceC(b.x, b.y, target.positionX, target.positionY) -
          distanceC(a.x, a.y, target.positionX, target.positionY)
      )
    if (candidateDestinationCells.length > 0) {
      const destination = candidateDestinationCells[0]
      pokemon.moveTo(destination.x, destination.y, board, false)
    }

    const emptyItemSlots =
      getItemCapacity(pokemon.simulation.room?.state.specialGameRule) -
      pokemon.items.size
    if (emptyItemSlots > 0) {
      pokemon.addSpeed(emptyItemSlots * speedPerEmptySlot, pokemon, 1, crit)
    }
  }
}
