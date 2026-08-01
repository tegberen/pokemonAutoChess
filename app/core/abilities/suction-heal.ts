import { AttackType } from "../../types/enum/Game"
import { Passive } from "../../types/enum/Passive"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class SuctionHealStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    const damage = [15, 30, 60, 80, 120][pokemon.stars - 1] ?? 120
    const cells = board.getCellsInFront(pokemon, target, 2)

    cells.forEach((cell) => {
      if (cell.value && pokemon.team != cell.value.team) {
        const attack = cell.value.handleSpecialDamage(
          damage,
          board,
          AttackType.SPECIAL,
          pokemon,
          crit
        )
        pokemon.broadcastAbility({
          positionX: pokemon.positionX,
          positionY: pokemon.positionY,
          targetX: cell.value.positionX,
          targetY: cell.value.positionY
        })
        const { overheal } = pokemon.handleHeal(
          attack.takenDamage * 0.5,
          pokemon,
          0,
          false
        )
        if (overheal > 0 && pokemon.passive === Passive.MEGA_EELEKTROSS) {
          pokemon.addShield(overheal, pokemon, 0, false)
        }
      }
    })
  }
}
