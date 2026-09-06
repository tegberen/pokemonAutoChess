import { GameMode } from "../../types/enum/Game"
import { Passive } from "../../types/enum/Passive"
import { healPlayerLife } from "../../utils/player-life"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

const TIME_TRAVEL_MAX_LIFE_HEAL_PER_ROUND = 2

export class TimeTravelStrategy extends AbilityStrategy {
  requiresTarget = false
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    super.process(pokemon, board, target, crit)
    const heal = [25, 25, 25, 50][pokemon.stars - 1] ?? 50
    board
      .getCellsInRange(pokemon.positionX, pokemon.positionY, pokemon.range, true)
      .forEach((cell) => {
        if (cell.value && pokemon.team === cell.value.team) {
          cell.value.handleHeal(heal, pokemon, 1, crit)
          cell.value.status.clearNegativeStatus(cell.value, pokemon)
          cell.value.range += 1
        }
      })

    if (
      pokemon.passive === Passive.CELEBI &&
      !pokemon.isGhostOpponent &&
      pokemon.player &&
      pokemon.simulation.room
    ) {
      const state = pokemon.simulation.room.state
      // the duo heals twice as fast, so only Double Up caps what one round gives back
      const isCapped =
        state.gameMode === GameMode.DOUBLE_UP &&
        pokemon.timeTravelLifeHealedThisFight >=
          TIME_TRAVEL_MAX_LIFE_HEAL_PER_ROUND
      if (!isCapped) {
        // healPlayerLife carries the heal to the Double Up partner and clamps to maxLife
        healPlayerLife(pokemon.player, 1, state)
        pokemon.timeTravelLifeHealedThisFight += 1
        pokemon.addStack()
      }
    }
  }
}
