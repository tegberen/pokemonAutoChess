import {
  Blessing,
  MULTISHOT_BASE_EXTRA_SHOTS,
  MULTISHOT_DAMAGE_RATIO,
  MULTISHOT_SHOT_INTERVAL
} from "../../types/enum/Blessing"
import { AttackType } from "../../types/enum/Game"
import { pickRandomIn } from "../../utils/random"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

export class SnipeShotStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    const damage = [40, 80, 160, 320][pokemon.stars - 1] ?? 320
    const farthestTarget =
      pokemon.state.getFarthestTarget(pokemon, board) ?? target
    super.process(pokemon, board, farthestTarget, crit)
    const targetsHit = getEnemiesInLineOfFire(pokemon, farthestTarget, board)

    if (targetsHit.size === 0) targetsHit.add(target) // guarantee at least the target is hit
    targetsHit.forEach((enemy) => {
      enemy.handleSpecialDamage(
        damage,
        board,
        AttackType.SPECIAL,
        pokemon,
        crit
      )
    })

    if (pokemon.heroBlessings?.has(Blessing.MULTISHOT)) {
      // count.ult already includes this cast, so the first one fires the base amount
      const extraShots = MULTISHOT_BASE_EXTRA_SHOTS + pokemon.count.ult - 1
      for (let shot = 1; shot <= extraShots; shot++) {
        pokemon.commands.push(
          new DelayedCommand(
            () => fireMultishot(pokemon, board, damage, crit),
            shot * MULTISHOT_SHOT_INTERVAL
          )
        )
      }
    }
  }
}

function getEnemiesInLineOfFire(
  pokemon: PokemonEntity,
  target: PokemonEntity,
  board: Board
) {
  const enemiesHit = new Set<PokemonEntity>()
  board
    .getCellsBetween(
      pokemon.positionX,
      pokemon.positionY,
      target.positionX,
      target.positionY
    )
    .forEach((cell) => {
      if (cell.value && cell.value.team != pokemon.team) {
        enemiesHit.add(cell.value)
      }
    })
  return enemiesHit
}

function fireMultishot(
  pokemon: PokemonEntity,
  board: Board,
  damage: number,
  crit: boolean
) {
  const enemies = board.cells.filter(
    (entity): entity is PokemonEntity =>
      entity !== undefined && entity.team !== pokemon.team && entity.hp > 0
  )
  if (enemies.length === 0) return
  const shotTarget = pickRandomIn(enemies)
  pokemon.broadcastAbility({
    skill: "MULTISHOT",
    targetX: shotTarget.positionX,
    targetY: shotTarget.positionY
  })
  getEnemiesInLineOfFire(pokemon, shotTarget, board).forEach((enemy) => {
    enemy.handleSpecialDamage(
      MULTISHOT_DAMAGE_RATIO * damage,
      board,
      AttackType.SPECIAL,
      pokemon,
      crit
    )
  })
}
