import {
  Blessing,
  CLANGOROUS_SOULBLAZE_BUFF_MULTIPLIER
} from "../../types/enum/Blessing"
import type { Board } from "../board"
import { recordClangorousSoulblazeBuffs } from "../clangorous-soulblaze"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class ClangorousSoulStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const buff = [2, 4, 8, 16][pokemon.stars - 1] ?? 16

    if (pokemon.heroBlessings?.has(Blessing.CLANGOROUS_SOULBLAZE)) {
      const atkBefore = pokemon.atk
      const defBefore = pokemon.def
      const speDefBefore = pokemon.speDef
      const selfBuff = buff * CLANGOROUS_SOULBLAZE_BUFF_MULTIPLIER
      pokemon.addAttack(selfBuff, pokemon, 1, crit)
      pokemon.addDefense(selfBuff, pokemon, 1, crit)
      pokemon.addSpecialDefense(selfBuff, pokemon, 1, crit)
      recordClangorousSoulblazeBuffs(pokemon, {
        atk: pokemon.atk - atkBefore,
        def: pokemon.def - defBefore,
        speDef: pokemon.speDef - speDefBefore
      })
      return
    }

    const cells = board.getCellsInRange(pokemon.positionX, pokemon.positionY, pokemon.range, true)

    cells.forEach((cell) => {
      if (cell.value && pokemon.team == cell.value.team) {
        cell.value.addAttack(buff, pokemon, 1, crit)
        cell.value.addDefense(buff, pokemon, 1, crit)
        cell.value.addSpecialDefense(buff, pokemon, 1, crit)
      }
    })
  }
}
