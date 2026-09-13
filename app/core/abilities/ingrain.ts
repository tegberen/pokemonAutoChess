import {
  Blessing,
  FLYTRAP_HEAL_PER_LOCKED_ENEMY
} from "../../types/enum/Blessing"
import { FlowerPot } from "../../types/enum/FlowerPot"
import { AttackType } from "../../types/enum/Game"
import { spacesBetween } from "../../utils/distance"
import { FlowerMonByPot } from "../flower-pots"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

const LOCKED_DURATION = 4000
const LOCKED_DURATION_MIN = 1000
const LOCKED_DURATION_LOST_PER_SPACE = 1000
const FALLOFF_PER_SPACE = 0.2

export class IngrainStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const heal = [10, 20, 40, 80][pokemon.stars - 1] ?? 80
    const damage = [10, 20, 40, 80][pokemon.stars - 1] ?? 80

    const rootsReachEqually =
      FlowerMonByPot[FlowerPot.YELLOW].includes(pokemon.name) &&
      pokemon.player?.blessings?.includes(Blessing.FLYTRAP)

    let enemiesLocked = 0
    board
      .getCellsInRange(pokemon.positionX, pokemon.positionY, pokemon.range, true)
      .forEach((cell) => {
        if (!cell.value) return
        const spaces = spacesBetween(
          pokemon.positionX,
          pokemon.positionY,
          cell.x,
          cell.y
        )
        const falloff = Math.max(0, 1 - FALLOFF_PER_SPACE * spaces)
        if (pokemon.team === cell.value.team) {
          cell.value.handleHeal(Math.round(heal * falloff), pokemon, 1, crit)
        } else {
          const lockedDuration = rootsReachEqually
            ? LOCKED_DURATION
            : Math.max(
                LOCKED_DURATION_MIN,
                LOCKED_DURATION - LOCKED_DURATION_LOST_PER_SPACE * spaces
              )
          cell.value.status.triggerLocked(lockedDuration, cell.value)
          enemiesLocked++
          cell.value.handleSpecialDamage(
            Math.round(damage * falloff),
            board,
            AttackType.SPECIAL,
            pokemon,
            crit
          )
        }
      })

    if (rootsReachEqually && enemiesLocked > 0) {
      pokemon.handleHeal(
        enemiesLocked * FLYTRAP_HEAL_PER_LOCKED_ENEMY,
        pokemon,
        1,
        crit
      )
    }
  }
}
