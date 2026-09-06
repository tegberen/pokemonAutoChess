import { Blessing } from "../../types/enum/Blessing"
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

export class IngrainStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const heal = [15, 30, 60, 120][pokemon.stars - 1] ?? 120
    const damage = [15, 30, 60, 120][pokemon.stars - 1] ?? 120

    const rootsReachEqually =
      FlowerMonByPot[FlowerPot.YELLOW].includes(pokemon.name) &&
      pokemon.player?.blessings?.includes(Blessing.FLYTRAP)

    board
      .getCellsInRange(pokemon.positionX, pokemon.positionY, pokemon.range, true)
      .forEach((cell) => {
        if (!cell.value) return
        if (pokemon.team === cell.value.team) {
          cell.value.handleHeal(heal, pokemon, 1, crit)
        } else {
          const lockedDuration = rootsReachEqually
            ? LOCKED_DURATION
            : Math.max(
                LOCKED_DURATION_MIN,
                LOCKED_DURATION -
                  LOCKED_DURATION_LOST_PER_SPACE *
                    spacesBetween(
                      pokemon.positionX,
                      pokemon.positionY,
                      cell.x,
                      cell.y
                    )
              )
          cell.value.status.triggerLocked(lockedDuration, cell.value)
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
