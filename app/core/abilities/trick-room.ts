import { Blessing } from "../../types/enum/Blessing"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class TrickRoomStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)

    const damage = [50, 100, 200, 400][pokemon.stars - 1] ?? 400
    const statusDuration =
      [3000, 4000, 5000, 6000][pokemon.stars - 1] ?? 6000
    const enemiesHit = [target]
    board
      .getAdjacentCells(target.positionX, target.positionY, false)
      .forEach((cell) => {
        if (cell.value && cell.value.team !== pokemon.team) {
          enemiesHit.push(cell.value)
        }
      })

    enemiesHit.forEach((enemy) => {
      if (enemy.speed >= pokemon.speed) {
        const speedReduction = Math.floor(enemy.speed / 2)
        enemy.addSpeed(-speedReduction, pokemon, 0, false)
        applyTrickRoomStatuses(pokemon, enemy, statusDuration)
        pokemon.broadcastAbility({
          skill: "TRICK_ROOM_SLOW",
          positionX: enemy.positionX,
          positionY: enemy.positionY
        })
      } else {
        pokemon.broadcastAbility({
          skill: "TRICK_ROOM_HIT",
          targetX: enemy.positionX,
          targetY: enemy.positionY
        })
        enemy.handleSpecialDamage(
          damage,
          board,
          AttackType.SPECIAL,
          pokemon,
          crit
        )
        if (pokemon.heroBlessings?.has(Blessing.DECELERATE)) {
          applyTrickRoomStatuses(pokemon, enemy, statusDuration)
        }
      }
    })
  }
}

function applyTrickRoomStatuses(
  pokemon: PokemonEntity,
  enemy: PokemonEntity,
  duration: number
) {
  enemy.status.triggerFatigue(duration, enemy, pokemon, true)
  enemy.status.triggerBlinded(duration, enemy, pokemon, true)
}
