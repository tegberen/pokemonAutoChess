import {
  Blessing,
  ROLLING_SNOWBALL_PP,
  ROLLING_SNOWBALL_SHIELD
} from "../../types/enum/Blessing"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class IceBallStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const baseDamage = [10, 20, 40, 80][pokemon.stars - 1] ?? 80
    const multiplier = [0.5, 1, 2, 4][pokemon.stars - 1] ?? 4
    const speDefBoost = [10, 10, 20, 40][pokemon.stars - 1] ?? 40

    pokemon.addSpecialDefense(speDefBoost, pokemon, 0, false)
    const { death } = target.handleSpecialDamage(
      baseDamage + multiplier * pokemon.speDef,
      board,
      AttackType.SPECIAL,
      pokemon,
      crit
    )

    if (death && pokemon.heroBlessings.has(Blessing.ROLLING_SNOWBALL)) {
      rollThrough(pokemon, board, target)
    }
  }
}

function rollThrough(
  spheal: PokemonEntity,
  board: Board,
  knockedOut: PokemonEntity
) {
  const cellBehindX =
    knockedOut.positionX + Math.sign(knockedOut.positionX - spheal.positionX)
  const cellBehindY =
    knockedOut.positionY + Math.sign(knockedOut.positionY - spheal.positionY)
  if (
    board.isOnBoard(cellBehindX, cellBehindY) &&
    !board.getEntityOnCell(cellBehindX, cellBehindY)
  ) {
    spheal.broadcastAbility({
      skill: "ROLLING_SNOWBALL_IMPACT",
      targetX: knockedOut.positionX,
      targetY: knockedOut.positionY
    })
    spheal.moveTo(cellBehindX, cellBehindY, board, false)
  }
  spheal.addShield(ROLLING_SNOWBALL_SHIELD, spheal, 0, false)
  spheal.addPP(ROLLING_SNOWBALL_PP, spheal, 0, false)
}
