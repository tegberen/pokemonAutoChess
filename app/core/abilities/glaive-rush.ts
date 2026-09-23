import { BOARD_HEIGHT } from "../../config"
import {
  Blessing,
  GLAIVE_STRIKE_DAMAGE_RATIO,
  GLAIVE_STRIKE_DELAY,
  GLAIVE_STRIKE_SHATTER_DELAY,
  GLAIVE_STRIKE_SHATTER_SPREAD_DELAY,
  GLAIVE_STRIKE_SWORD_FALL_DURATION
} from "../../types/enum/Blessing"
import { AttackType, Team } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

export class GlaiveRushStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    const damage = [50, 100, 200, 400][pokemon.stars - 1] ?? 400
    pokemon.status.triggerArmorReduction(6000, pokemon)
    const destinationRow =
      pokemon.team === Team.RED_TEAM
        ? pokemon.positionY <= 1
          ? BOARD_HEIGHT - 1
          : 0
        : pokemon.positionY >= BOARD_HEIGHT - 2
          ? 0
          : BOARD_HEIGHT - 1

    const rushColumn = target.positionX
    const destination = board.getClosestAvailablePlace(
      rushColumn,
      destinationRow
    )
    const enemiesHit = new Set<PokemonEntity>()
    if (destination) {
      pokemon.broadcastAbility({
        positionX: pokemon.positionX,
        positionY: pokemon.positionY,
        targetX: destination.x,
        targetY: destination.y
      })
      const cells = board.getCellsBetween(
        rushColumn,
        pokemon.positionY,
        rushColumn,
        destinationRow
      )
      pokemon.moveTo(destination.x, destination.y, board, false)

      cells.forEach((cell) => {
        if (cell.value && cell.value.team != pokemon.team) {
          enemiesHit.add(cell.value)
        }
      })
    }

    if (enemiesHit.size === 0) enemiesHit.add(target) // ensure to at least hit the target
    enemiesHit.forEach((enemy) => {
      enemy.status.triggerArmorReduction(6000, pokemon)
      enemy.handleSpecialDamage(
        damage,
        board,
        AttackType.SPECIAL,
        pokemon,
        crit
      )
    })

    if (pokemon.heroBlessings?.has(Blessing.GLAIVE_STRIKE)) {
      enemiesHit.forEach((enemy) => markForGlaiveStrike(pokemon, enemy, board))
    }
  }
}

function markForGlaiveStrike(
  pokemon: PokemonEntity,
  marked: PokemonEntity,
  board: Board
) {
  pokemon.broadcastAbility({
    skill: "GLAIVE_STRIKE_MARK",
    positionX: marked.positionX,
    positionY: marked.positionY
  })
  pokemon.commands.push(
    new DelayedCommand(() => {
      const impactX = marked.positionX
      const impactY = marked.positionY
      pokemon.broadcastAbility({
        skill: "GLAIVE_STRIKE_SWORD",
        positionX: impactX,
        positionY: impactY
      })
      pokemon.commands.push(
        new DelayedCommand(() => {
          hitWithGlaiveStrike(
            pokemon,
            board.getEntityOnCell(impactX, impactY),
            board
          )
        }, GLAIVE_STRIKE_SWORD_FALL_DURATION),
        new DelayedCommand(() => {
          board
            .getAdjacentCells(impactX, impactY)
            .forEach((cell) => hitWithGlaiveStrike(pokemon, cell.value, board))
        }, GLAIVE_STRIKE_SWORD_FALL_DURATION +
          GLAIVE_STRIKE_SHATTER_DELAY +
          GLAIVE_STRIKE_SHATTER_SPREAD_DELAY)
      )
    }, GLAIVE_STRIKE_DELAY - GLAIVE_STRIKE_SWORD_FALL_DURATION)
  )
}

function hitWithGlaiveStrike(
  pokemon: PokemonEntity,
  enemy: PokemonEntity | undefined,
  board: Board
) {
  if (!enemy || enemy.team === pokemon.team) return
  enemy.handleSpecialDamage(
    (pokemon.atk + pokemon.speDef) * GLAIVE_STRIKE_DAMAGE_RATIO,
    board,
    AttackType.SPECIAL,
    pokemon,
    false
  )
}
