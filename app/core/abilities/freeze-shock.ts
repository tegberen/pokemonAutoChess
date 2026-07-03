import { Ability } from "../../types/enum/Ability"
import { AttackType } from "../../types/enum/Game"
import { Synergy } from "../../types/enum/Synergy"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class FreezeShockStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const iceSynergyLevel = pokemon.player?.synergies.get(Synergy.ICE) ?? 0
    const electricSynergyLevel = pokemon.player?.synergies.get(Synergy.ELECTRIC) ?? 0
    const baseDamage = [10, 30, 50, 70][pokemon.stars - 1] ?? 70
    const extraDamage = [10, 10, 10, 20][pokemon.stars - 1] ?? 20
    const damage = baseDamage + iceSynergyLevel * extraDamage + electricSynergyLevel * extraDamage

    const cells = board.getAdjacentCells(target.positionX, target.positionY, true)
    cells.forEach((cell) => {
      if (cell.value && cell.value.team !== pokemon.team) {
        cell.value.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
        cell.value.status.triggerParalysis(2000, cell.value, pokemon)
      }
    })

    pokemon.simulation.room.clock.setTimeout(() => {
      if (!pokemon.simulation || !pokemon.simulation.room || pokemon.simulation.finished) return
      cells.forEach((cell) => {
        if (cell.value && cell.value.team !== pokemon.team && cell.value.status.paralysis) {
          pokemon.broadcastAbility({
            targetX: cell.value.positionX,
            targetY: cell.value.positionY,
            skill: Ability.SHEER_COLD
          })
          cell.value.handleSpecialDamage(9999, board, AttackType.SPECIAL, pokemon, crit)
        }
      })
    }, 5000)
  }
}
