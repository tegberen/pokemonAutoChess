import { AttackType } from "../../types/enum/Game"
import { Item } from "../../types/enum/Item"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

const castersThatDroppedAnApple = new WeakSet<PokemonEntity>()

export class AppleAcidStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    const cells = board.getCellsInFront(pokemon, target)
    const damageRatio = [0.5, 1, 2, 4][pokemon.stars - 1] ?? 4
    const damage = damageRatio * (pokemon.def + pokemon.speDef)
    cells.forEach((cell) => {
      if (cell.value && cell.value.team !== pokemon.team) {
        cell.value.handleSpecialDamage(
          damage,
          board,
          AttackType.SPECIAL,
          pokemon,
          crit
        )
        pokemon.broadcastAbility({
          positionX: pokemon.positionX,
          positionY: pokemon.positionY,
          targetX: cell.value.positionX,
          targetY: cell.value.positionY
        })
      }
    })
    if (
      pokemon.player &&
      !pokemon.isGhostOpponent &&
      !castersThatDroppedAnApple.has(pokemon)
    ) {
      castersThatDroppedAnApple.add(pokemon)
      pokemon.player.addFreshApple(Item.SWEET_APPLE)
    }
  }
}
