import {
  WATER_SHURIKEN_FLIGHT_MS,
  WATER_SHURIKEN_GIANT_MS_PER_CELL,
  WATER_SHURIKEN_GIANT_WINDUP_MS,
  WATER_SHURIKEN_STAGGER_MS
} from "../../config/game/abilities"
import { AttackType } from "../../types/enum/Game"
import { distanceC } from "../../utils/distance"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"
import { getEnemiesInLineOfFire } from "./snipe-shot"

const WATER_SHURIKEN_COUNT = 3
const GIANT_SHURIKEN_DAMAGE_MULTIPLIER = 3

const giantShurikenReady = new WeakSet<PokemonEntity>()

export class WaterShurikenStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    const damage = [10, 20, 30, 60][pokemon.stars - 1] ?? 60

    if (giantShurikenReady.has(pokemon)) {
      giantShurikenReady.delete(pokemon)
      throwGiantShuriken(pokemon, board, target, damage, crit)
      return
    }

    const enemiesByDistance: PokemonEntity[] = []
    board.forEach((x, y, enemy) => {
      if (enemy && enemy.team !== pokemon.team && enemy.hp > 0) {
        enemiesByDistance.push(enemy)
      }
    })
    const distanceTo = (enemy: PokemonEntity) =>
      distanceC(
        enemy.positionX,
        enemy.positionY,
        pokemon.positionX,
        pokemon.positionY
      )
    enemiesByDistance.sort((a, b) => distanceTo(a) - distanceTo(b))
    if (enemiesByDistance.length === 0) return

    for (let shuriken = 0; shuriken < WATER_SHURIKEN_COUNT; shuriken++) {
      const shurikenTarget =
        enemiesByDistance[shuriken % enemiesByDistance.length]
      pokemon.commands.push(
        new DelayedCommand(() => {
          pokemon.broadcastAbility({
            skill: "WATER_SHURIKEN_THROW",
            targetX: shurikenTarget.positionX,
            targetY: shurikenTarget.positionY,
            delay: shuriken
          })
          pokemon.commands.push(
            new DelayedCommand(() => {
              if (shurikenTarget.hp <= 0) return
              const { death } = shurikenTarget.handleSpecialDamage(
                damage,
                board,
                AttackType.SPECIAL,
                pokemon,
                crit
              )
              if (death) giantShurikenReady.add(pokemon)
            }, WATER_SHURIKEN_FLIGHT_MS)
          )
        }, shuriken * WATER_SHURIKEN_STAGGER_MS)
      )
    }
  }
}

// aimed like Snipe Shot: at the farthest enemy, piercing everyone on the way
function throwGiantShuriken(
  pokemon: PokemonEntity,
  board: Board,
  target: PokemonEntity,
  damage: number,
  crit: boolean
) {
  const farthestTarget =
    pokemon.state.getFarthestTarget(pokemon, board) ?? target
  pokemon.broadcastAbility({
    skill: "WATER_SHURIKEN_GIANT",
    targetX: farthestTarget.positionX,
    targetY: farthestTarget.positionY
  })
  const enemiesHit = getEnemiesInLineOfFire(pokemon, farthestTarget, board)
  if (enemiesHit.size === 0) enemiesHit.add(farthestTarget)
  enemiesHit.forEach((enemy) => {
    const cellsAway = distanceC(
      enemy.positionX,
      enemy.positionY,
      pokemon.positionX,
      pokemon.positionY
    )
    const hitDelay =
      WATER_SHURIKEN_GIANT_WINDUP_MS +
      cellsAway * WATER_SHURIKEN_GIANT_MS_PER_CELL
    pokemon.commands.push(
      new DelayedCommand(() => {
        if (enemy.hp <= 0) return
        pokemon.broadcastAbility({
          skill: "WATER_SHURIKEN_GIANT_HIT",
          targetX: enemy.positionX,
          targetY: enemy.positionY
        })
        const { death } = enemy.handleSpecialDamage(
          damage * GIANT_SHURIKEN_DAMAGE_MULTIPLIER,
          board,
          AttackType.SPECIAL,
          pokemon,
          crit
        )
        if (death) giantShurikenReady.add(pokemon)
      }, hitDelay)
    )
  })
}
