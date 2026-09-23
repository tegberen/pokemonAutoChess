import {
  Blessing,
  ROLLOUT_RALLY_ALLY_SPEED,
  ROLLOUT_RALLY_BOUNCE_DAMAGE_RATIO,
  ROLLOUT_RALLY_BOUNCE_DELAY,
  ROLLOUT_RALLY_SPEED_PER_BOUNCE
} from "../../types/enum/Blessing"
import { AttackType } from "../../types/enum/Game"
import { chance } from "../../utils/random"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

export class SteamrollerStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    roll(pokemon, board, target, crit)

    if (pokemon.heroBlessings?.has(Blessing.ROLLOUT_RALLY)) {
      bounce(
        pokemon,
        board,
        crit,
        Math.floor(pokemon.speed / ROLLOUT_RALLY_SPEED_PER_BOUNCE),
        ROLLOUT_RALLY_BOUNCE_DAMAGE_RATIO
      )
    }
  }
}

// each bounce rolls on to the enemy farthest from where the last roll ended,
// dealing less than the one before
function bounce(
  pokemon: PokemonEntity,
  board: Board,
  crit: boolean,
  bouncesLeft: number,
  damageRatio: number
) {
  if (bouncesLeft <= 0) return
  pokemon.commands.push(
    new DelayedCommand(() => {
      const target = pokemon.state.getNearestTargetAtSight(pokemon, board)
        ?.target
      if (!target) return
      roll(pokemon, board, target, crit, damageRatio)
      bounce(
        pokemon,
        board,
        crit,
        bouncesLeft - 1,
        damageRatio * ROLLOUT_RALLY_BOUNCE_DAMAGE_RATIO
      )
    }, ROLLOUT_RALLY_BOUNCE_DELAY)
  )
}

function roll(
  pokemon: PokemonEntity,
  board: Board,
  target: PokemonEntity,
  crit: boolean,
  damageRatio = 1
) {
  const damage = Math.round(
    ([0.4, 0.8, 1.5, 3.0][pokemon.stars - 1] ?? 3.0) *
      pokemon.speed *
      damageRatio
  )

  const farthestCoordinate =
    board.getFarthestTargetCoordinateAvailablePlace(pokemon)
  const targetsHit = new Set<PokemonEntity>()

  if (farthestCoordinate) {
    const cells = board.getCellsBetween(
      pokemon.positionX,
      pokemon.positionY,
      farthestCoordinate.x,
      farthestCoordinate.y
    )
    cells.forEach((cell) => {
      if (cell.value && cell.value.team != pokemon.team) {
        targetsHit.add(cell.value)
      } else if (
        cell.value &&
        cell.value !== pokemon &&
        pokemon.heroBlessings?.has(Blessing.ROLLOUT_RALLY)
      ) {
        cell.value.addSpeed(ROLLOUT_RALLY_ALLY_SPEED, pokemon, 0, false)
      }
    })
    pokemon.moveTo(farthestCoordinate.x, farthestCoordinate.y, board, false)
  }

  if (targetsHit.size === 0) targetsHit.add(target) // guarantee at least the target is hit
  targetsHit.forEach((enemy) => {
    enemy.handleSpecialDamage(damage, board, AttackType.SPECIAL, pokemon, crit)
    if (chance(0.5, pokemon)) {
      enemy.status.triggerFlinch(3000, enemy, pokemon)
    }
  })
}
