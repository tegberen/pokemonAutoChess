import { AttackType } from "../../types/enum/Game"
import { type Board, effectInLine } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class LightOfRuinStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const base = [5, 10, 15, 20, 40][pokemon.stars - 1] ?? 20
    const nbPokemon = board.cells.filter(c => c != null).length
    const damage = base * nbPokemon
    effectInLine(board, pokemon, target, (cell) => {
      if (cell.value != null && cell.value.team !== pokemon.team) {
        cell.value.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
      }
    })
    const lostMaxHP = Math.floor(pokemon.maxHP * 0.75)
    pokemon.addMaxHP(-lostMaxHP, pokemon, 0, false)

  }
}
