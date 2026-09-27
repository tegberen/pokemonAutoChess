import { Item } from "../../types/enum/Item"
import { Synergy } from "../../types/enum/Synergy"
import { schemaValues } from "../../utils/schemas"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { getStrongestUnit } from "../unit-score"
import { AbilityStrategy } from "./ability-strategy"

export class ElectrifyStrategy extends AbilityStrategy {
  requiresTarget = false
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    // Give to your STRONGEST non-ELECTRIC ally ELECTRIC_FIELD and all the effects of active ELECTRIC synergy + [15,30,60,SP] SHIELD.
    super.process(pokemon, board, target, crit)
    const nonElectricAllies = board.cells.filter(
      (entity) =>
        entity &&
        entity.team === pokemon.team &&
        entity.id !== pokemon.id &&
        entity.types.has(Synergy.ELECTRIC) === false &&
        entity.status.electricField !== true
    ) as PokemonEntity[]
    const strongestAlly = getStrongestUnit(nonElectricAllies)
    const buffedUnit = strongestAlly ?? pokemon //  If no ally is found, self-cast instead.
    electrify(pokemon, buffedUnit, crit)
  }
}

export function electrify(
  caster: PokemonEntity,
  buffedUnit: PokemonEntity,
  crit: boolean
) {
  const shield = [15, 30, 60, 120][caster.stars - 1] ?? 120
  buffedUnit.status.addElectricField(buffedUnit)
  buffedUnit.addShield(shield, caster, 1, crit)
  if (buffedUnit.types.has(Synergy.ELECTRIC) === false) {
    buffedUnit.types.add(Synergy.ELECTRIC)
    caster.simulation.applySynergyEffects(buffedUnit, Synergy.ELECTRIC)
    if (caster.player) {
      const nbCellBatteries = schemaValues(caster.player.items).filter(
        (item) => item === Item.CELL_BATTERY
      ).length
      if (nbCellBatteries > 0) {
        buffedUnit.addSpeed(2 * nbCellBatteries, caster, 0, false)
      }
    }
  }
}
