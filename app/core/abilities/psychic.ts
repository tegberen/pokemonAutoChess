import {
  Blessing,
  CELL_BRAWLER_ABILITY_LIFESTEAL,
  CELL_BRAWLER_OVERHEAL_TO_MAX_HP
} from "../../types/enum/Blessing"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class PsychicStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [40, 80, 160, 320][pokemon.stars - 1] ?? 320
    const cells = board.getAdjacentCells(
      target.positionX,
      target.positionY,
      true
    )
    let totalDamageDealt = 0
    cells.forEach((cell) => {
      if (cell.value && cell.value.team !== pokemon.team) {
        const { takenDamage } = cell.value.handleSpecialDamage(
          damage,
          board,
          AttackType.SPECIAL,
          pokemon,
          crit
        )
        totalDamageDealt += takenDamage
        cell.value.addPP(-15, pokemon, 0, false)
        cell.value.count.manaBurnCount++
      }
    })

    if (pokemon.heroBlessings?.has(Blessing.CELL_BRAWLER)) {
      const { overheal } = pokemon.handleHeal(
        CELL_BRAWLER_ABILITY_LIFESTEAL * totalDamageDealt,
        pokemon,
        0,
        false
      )
      if (overheal > 0) {
        pokemon.addMaxHP(
          CELL_BRAWLER_OVERHEAL_TO_MAX_HP * overheal,
          pokemon,
          0,
          false
        )
      }
    }
  }
}
