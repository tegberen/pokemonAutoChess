import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class DragonTailStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const swappedTarget = pokemon.state.getFarthestTarget(pokemon, board)
    if (
      !swappedTarget ||
      swappedTarget.id === target.id ||
      !swappedTarget.canBeMoved ||
      !target.canBeMoved
    ) {
      const damage = [30, 60, 100, 150][pokemon.stars - 1] ?? 150
      target.handleSpecialDamage(
        damage,
        board,
        AttackType.SPECIAL,
        pokemon,
        crit
      )
      return
    }
    // the cast plays the wipe on the user and the dust on the target, this adds
    // the dust on the other end
    pokemon.broadcastAbility({
      skill: "DRAGON_TAIL_DUST",
      targetX: swappedTarget.positionX,
      targetY: swappedTarget.positionY
    })
    target.moveTo(swappedTarget.positionX, swappedTarget.positionY, board, true)
    const defenseBuff =
      ([2, 4, 8, 16][pokemon.stars - 1] ?? 16) * swappedTarget.stars
    pokemon.addDefense(defenseBuff, pokemon, 1, crit)
    pokemon.addSpecialDefense(defenseBuff, pokemon, 1, crit)
  }
}
