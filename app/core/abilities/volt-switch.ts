import {
  APEX_PREDATOR_FEAR_DURATION,
  APEX_PREDATOR_FEAR_RANGE,
  APEX_PREDATOR_PREY_DURATION,
  Blessing
} from "../../types/enum/Blessing"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

// the prey is blinded and wounded, and every other enemy nearby flees in fear
function pounceAsApexPredator(
  pokemon: PokemonEntity,
  prey: PokemonEntity,
  board: Board
) {
  prey.status.triggerBlinded(APEX_PREDATOR_PREY_DURATION, prey, pokemon)
  prey.status.triggerWound(APEX_PREDATOR_PREY_DURATION, prey, pokemon)
  pokemon.broadcastAbility({ skill: "APEX_PREDATOR_FEAR" })
  board
    .getCellsInRange(
      pokemon.positionX,
      pokemon.positionY,
      APEX_PREDATOR_FEAR_RANGE,
      false
    )
    .forEach(({ value }) => {
      if (value && value.team !== pokemon.team && value !== prey) {
        value.status.triggerFear(APEX_PREDATOR_FEAR_DURATION, value, pokemon)
      }
    })
}

export class VoltSwitchStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    const farthestCoordinate =
      board.getFarthestTargetCoordinateAvailablePlace(pokemon)
    // the bolt is drawn along the real dash, not toward the ability's target
    super.process(pokemon, board, target, crit, farthestCoordinate !== null)
    const damage = [25, 50, 100, 200][pokemon.stars - 1] ?? 200
    const targetsHit: Set<PokemonEntity> = new Set()

    if (farthestCoordinate) {
      pokemon.broadcastAbility({
        targetX: farthestCoordinate.x,
        targetY: farthestCoordinate.y
      })
      const cells = board.getCellsBetween(
        pokemon.positionX,
        pokemon.positionY,
        farthestCoordinate.x,
        farthestCoordinate.y
      )
      cells.forEach((cell) => {
        if (cell.value && cell.value.team != pokemon.team) {
          targetsHit.add(cell.value)
        }
      })

      pokemon.moveTo(farthestCoordinate.x, farthestCoordinate.y, board, false)

      if (pokemon.heroBlessings?.has(Blessing.APEX_PREDATOR)) {
        pounceAsApexPredator(pokemon, farthestCoordinate.target, board)
      }
    }

    if (targetsHit.size === 0) targetsHit.add(target) // guarantee at least the target is hit
    targetsHit.forEach((enemy) => {
      enemy.handleSpecialDamage(
        damage,
        board,
        AttackType.SPECIAL,
        pokemon,
        crit
      )
    })
  }
}
