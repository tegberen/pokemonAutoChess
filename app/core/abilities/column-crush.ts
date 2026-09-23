import PokemonFactory from "../../models/pokemon-factory"
import { Ability } from "../../types/enum/Ability"
import {
  Blessing,
  ITS_GOING_DOWN_DAMAGE_PER_TILE_THROWN
} from "../../types/enum/Blessing"
import { AttackType } from "../../types/enum/Game"
import { Pillars, Pkm } from "../../types/enum/Pokemon"
import { isIn } from "../../utils/array"
import { distanceC, distanceE } from "../../utils/distance"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

export class ColumnCrushStrategy extends AbilityStrategy {
  requiresTarget = false
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    super.process(pokemon, board, target, crit, true)
    const hasItsGoingDown = pokemon.heroBlessings?.has(Blessing.ITS_GOING_DOWN)

    const pillar = board.cells.find(
      (e) => e && e.team === pokemon.team && isIn(Pillars, e.name)
    )
    if (pillar) {
      // If a pillar is already on the board, jumps to it and throw the pillar at the closest target, dealing [50,100,150,SP] + the remaining HP of the pillar as SPECIAL
      const pillarX = pillar.positionX
      const pillarY = pillar.positionY
      const remainingHp = pillar.hp
      const pillarType = pillar.name
      pillar.shield = 0
      pillar.handleSpecialDamage(9999, board, AttackType.TRUE, null, false)
      pokemon.moveTo(pillarX, pillarY, board, false)
      pokemon.resetCooldown(800)

      pokemon.commands.push(
        new DelayedCommand(() => {
          const baseDamage = [50, 100, 150, 300][pokemon.stars - 1] ?? 300

          let enemyHit
          const targetCoordinate = pokemon.state.getNearestTargetAtSight(
            pokemon,
            board
          )
          if (targetCoordinate) {
            enemyHit = targetCoordinate.target
          }
          if (!enemyHit) {
            enemyHit = board.cells.find(
              (entity) => entity && entity.team !== pokemon.team
            )
          }
          if (enemyHit) {
            pokemon.setTarget(enemyHit)
            const landingX = enemyHit.positionX
            const landingY = enemyHit.positionY
            const travelTime =
              distanceE(
                pillarX,
                pillarY,
                enemyHit.positionX,
                enemyHit.positionY
              ) * 160

            pokemon.broadcastAbility({
              positionX: pillar.positionX,
              positionY: pillar.positionY,
              targetX: enemyHit.positionX,
              targetY: enemyHit.positionY,
              orientation: [
                Pkm.PILLAR_WOOD,
                Pkm.PILLAR_IRON,
                Pkm.PILLAR_CONCRETE
              ].indexOf(pillarType)
            })

            pokemon.commands.push(
              new DelayedCommand(() => {
                pokemon.broadcastAbility({
                  skill: Ability.ROCK_SMASH,
                  positionX: landingX,
                  positionY: landingY,
                  targetX: landingX,
                  targetY: landingY
                })

                if (enemyHit && enemyHit.hp > 0) {
                  enemyHit.handleSpecialDamage(
                    hasItsGoingDown
                      ? baseDamage
                      : baseDamage + remainingHp,
                    board,
                    AttackType.SPECIAL,
                    pokemon,
                    crit
                  )
                }
                if (hasItsGoingDown && enemyHit && enemyHit.hp > 0) {
                  const tilesThrown = distanceC(
                    pillarX,
                    pillarY,
                    landingX,
                    landingY
                  )
                  const distanceMultiplier =
                    1 + ITS_GOING_DOWN_DAMAGE_PER_TILE_THROWN * tilesThrown
                  enemyHit.handleSpecialDamage(
                    Math.round(remainingHp * distanceMultiplier),
                    board,
                    AttackType.PHYSICAL,
                    pokemon,
                    crit
                  )
                }
              }, travelTime)
            )
          }
          if (hasItsGoingDown) {
            pokemon.commands.push(
              new DelayedCommand(
                () => throwNewPillar(pokemon, board),
                NEW_PILLAR_THROW_DELAY
              )
            )
          }
        }, 500)
      )
    } else {
      buildPillar(pokemon)
    }
  }
}

const NEW_PILLAR_THROW_DELAY = 300
// matches the client's COLUMN_CRUSH projectile speed
const NEW_PILLAR_FLIGHT_TIME_PER_CELL = 200

//Builds a pillar of 100/200/300 HP and 1/3/5 DEF and SPE_DEF on the closest empty spot.
function buildPillar(pokemon: PokemonEntity) {
  const coord = pokemon.simulation.getClosestFreeCellToPokemonEntity(pokemon)
  if (!coord) return
  addPillar(pokemon, coord.x, coord.y)
}

// thrown to the cell a FLYING unit would fly away to: safe, and far enough that
// the next cast starts with a jump
function throwNewPillar(pokemon: PokemonEntity, board: Board) {
  const landing = board.getFlyAwayCell(pokemon)
  if (!landing) {
    buildPillar(pokemon)
    return
  }
  pokemon.broadcastAbility({
    positionX: pokemon.positionX,
    positionY: pokemon.positionY,
    targetX: landing.x,
    targetY: landing.y,
    orientation: Pillars.indexOf(pillarTypeOf(pokemon))
  })
  const flightTime =
    distanceE(pokemon.positionX, pokemon.positionY, landing.x, landing.y) *
    NEW_PILLAR_FLIGHT_TIME_PER_CELL
  pokemon.commands.push(
    new DelayedCommand(() => {
      const place =
        board.getEntityOnCell(landing.x, landing.y) === undefined
          ? landing
          : board.getClosestAvailablePlace(landing.x, landing.y)
      if (place) addPillar(pokemon, place.x, place.y)
    }, flightTime)
  )
}

function pillarTypeOf(pokemon: PokemonEntity) {
  return Pillars[pokemon.stars - 1] ?? Pkm.PILLAR_CONCRETE
}

function addPillar(pokemon: PokemonEntity, x: number, y: number) {
  const pillar = PokemonFactory.createPokemonFromName(
    pillarTypeOf(pokemon),
    pokemon.player
  )
  pokemon.simulation.addPokemon(pillar, x, y, pokemon.team, true)
}
