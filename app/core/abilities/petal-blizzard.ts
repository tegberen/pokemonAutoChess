import { AttackType } from "../../types/enum/Game"
import { spacesBetween } from "../../utils/distance"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

const DAMAGE_LOST_PER_SPACE = 0.2
const DAMAGE_RATIO_MIN = 0.2

export class PetalBlizzardStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [10, 20, 30, 50][pokemon.stars - 1] ?? 50
    board
      .getCellsInRange(pokemon.positionX, pokemon.positionY, pokemon.range, false)
      .forEach((cell) => {
        if (cell.value && cell.value.team !== pokemon.team) {
          const damageRatio = Math.max(
            DAMAGE_RATIO_MIN,
            1 -
              DAMAGE_LOST_PER_SPACE *
                spacesBetween(
                  pokemon.positionX,
                  pokemon.positionY,
                  cell.x,
                  cell.y
                )
          )
          cell.value.handleSpecialDamage(
            Math.round(damage * damageRatio),
            board,
            AttackType.SPECIAL,
            pokemon,
            crit
          )
        }
      })
    pokemon.addAbilityPower(10, pokemon, 0, false)
  }
}
