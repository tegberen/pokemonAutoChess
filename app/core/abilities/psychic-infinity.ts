import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { getStrongestUnit } from "../unit-score"
import { AbilityStrategy } from "./ability-strategy"

export class PsychicInfinityStrategy extends AbilityStrategy {
  process(pokemon: PokemonEntity, board: Board, target: PokemonEntity, crit: boolean) {
    super.process(pokemon, board, target, crit, true)
    const damage = [20,40,60,80,160][pokemon.stars - 1] ?? 160
    const enemies = board.cells.filter(
      (cell) => cell && cell.team !== pokemon.team && cell.hp > 0
    ) as PokemonEntity[]
    const strongest = getStrongestUnit(enemies) ?? target
    pokemon.broadcastAbility({
      positionX: pokemon.positionX,
      positionY: pokemon.positionY,
      targetX: strongest.positionX,
      targetY: strongest.positionY
    })
    strongest.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
    pokemon.addAbilityPower(-20, pokemon, 0, false)
    if (pokemon.ap > 0 && pokemon.ap > strongest.ap) {
      pokemon.addPP(pokemon.maxPP, pokemon, 0, false)
    }
  }
}
