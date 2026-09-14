import { AttackType } from "../../types/enum/Game"
import { spacesBetween } from "../../utils/distance"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

const DAMAGE_LOST_PER_SPACE = 0.2
const DAMAGE_RATIO_MIN = 0.2
const FLAT_DAMAGE = 20
const AP_SCALED_DAMAGE = 10
const ABILITY_POWER_PER_CAST = 10

export class PetalBlizzardStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = FLAT_DAMAGE + AP_SCALED_DAMAGE * (1 + pokemon.ap / 100)
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
            crit,
            false
          )
        }
      })
    pokemon.addAbilityPower(ABILITY_POWER_PER_CAST, pokemon, 0, false)
  }
}
