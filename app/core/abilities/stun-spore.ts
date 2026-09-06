import { AttackType } from "../../types/enum/Game"
import { spacesBetween } from "../../utils/distance"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

const PARALYSIS_DURATION = 4000
const PARALYSIS_DURATION_MIN = 1000
const PARALYSIS_DURATION_LOST_PER_SPACE = 1000

export class StunSporeStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [15, 30, 60, 120][pokemon.stars - 1] ?? 120
    board
      .getCellsInRange(pokemon.positionX, pokemon.positionY, pokemon.range, false)
      .forEach((cell) => {
        if (cell.value && cell.value.team !== pokemon.team) {
          const paralysisDuration = Math.max(
            PARALYSIS_DURATION_MIN,
            PARALYSIS_DURATION -
              PARALYSIS_DURATION_LOST_PER_SPACE *
                spacesBetween(
                  pokemon.positionX,
                  pokemon.positionY,
                  cell.x,
                  cell.y
                )
          )
          cell.value.status.triggerParalysis(
            paralysisDuration,
            cell.value,
            pokemon
          )
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
}
