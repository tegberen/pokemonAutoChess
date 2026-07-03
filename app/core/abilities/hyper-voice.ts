import { Passive } from "../../types/enum/Passive"
import { AttackType } from "../../types/enum/Game"
import { chance } from "../../utils/random"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class HyperVoiceStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const damage = [30, 60, 120, 240][pokemon.stars - 1] ?? 240
    const confusionDuration = [1000, 2000, 3000, 6000][pokemon.stars - 1] ?? 6000
    let confusedCount = 0
    board.forEach((x: number, y: number, tg: PokemonEntity | undefined) => {
      if (tg && pokemon.team != tg.team && target.positionY == y) {
        tg.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
        if (chance(0.3, pokemon)) {
          tg.status.triggerConfusion(confusionDuration, tg, pokemon)
          confusedCount++
        }
      }
    })
    if (confusedCount > 0 && pokemon.passive === Passive.ALTARIA) {
      for (let i = 0; i < confusedCount; i++) {
        pokemon.addStack()
      }
    }
  }
}
