import { AttackType } from "../../types/enum/Game"
import { Item } from "../../types/enum/Item"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

const castersThatDroppedAnApple = new WeakSet<PokemonEntity>()

export class SyrupBombStrategy extends AbilityStrategy {
  requiresTarget = false
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    super.process(pokemon, board, target, crit, true)
    const damage = [30, 40, 50, 100][pokemon.stars - 1] ?? 100

    const highestSpeedEnemy = (
      board.cells.filter(
        (cell) => cell && cell.team !== pokemon.team
      ) as PokemonEntity[]
    ).sort((a, b) => b.speed - a.speed)[0]

    if (highestSpeedEnemy) {
      const speedDebuff = 30
      highestSpeedEnemy.addSpeed(-speedDebuff, pokemon, 1, crit)
      highestSpeedEnemy.handleSpecialDamage(
        damage,
        board,
        AttackType.SPECIAL,
        pokemon,
        crit
      )

      pokemon.broadcastAbility({
        positionX: pokemon.positionX,
        positionY: pokemon.positionY,
        targetX: highestSpeedEnemy.positionX,
        targetY: highestSpeedEnemy.positionY
      })
    }
    if (
      pokemon.player &&
      !pokemon.isGhostOpponent &&
      !castersThatDroppedAnApple.has(pokemon)
    ) {
      castersThatDroppedAnApple.add(pokemon)
      pokemon.player.addFreshApple(Item.SIRUPY_APPLE)
    }
  }
}
