import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class FairyWindStrategy extends AbilityStrategy {
  requiresTarget = false
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    super.process(pokemon, board, target, crit)
    const ppGain = [5, 10, 20, 40][pokemon.stars - 1] ?? 40
    const debuf = [2, 4, 6, 12][pokemon.stars - 1] ?? 12
    board.forEach((x: number, y: number, tg: PokemonEntity | undefined) => {
      if (tg && pokemon.team === tg.team && tg.id !== pokemon.id) {
        tg.addPP(ppGain, pokemon, 0.5, crit)
      }
      if (tg && pokemon.team !== tg.team) {
        pokemon.broadcastAbility({
          skill: "STUN_SPORE_PINK",
          positionX: pokemon.positionX,
          positionY: pokemon.positionY,
          targetX: tg.positionX,
          targetY: tg.positionY
        })
        tg.addSpeed(-debuf, pokemon, 0, false)
      }
    })
  }
}
