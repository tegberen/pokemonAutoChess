import { Blessing } from "../../types/enum/Blessing"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class ShellSmashStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [25, 50, 100, 200][pokemon.stars - 1] ?? 200
    const cells = board.getAdjacentCells(pokemon.positionX, pokemon.positionY)
    cells.forEach((cell) => {
      if (cell && cell.value && cell.value.team !== pokemon.team) {
        cell.value.handleSpecialDamage(
          damage,
          board,
          AttackType.SPECIAL,
          pokemon,
          crit
        )
      }
    })
    const hasFrostGear = pokemon.heroBlessings.has(Blessing.FROST_GEAR)
    pokemon.addAbilityPower(25, pokemon, 0, false)
    pokemon.addAttack(5, pokemon, hasFrostGear ? 1 : 0, hasFrostGear && crit)
    pokemon.addSpeed(25, pokemon, 0, false)
    pokemon.addDefense(-5, pokemon, 0, false)
    pokemon.addSpecialDefense(-5, pokemon, 0, false)
  }
}
