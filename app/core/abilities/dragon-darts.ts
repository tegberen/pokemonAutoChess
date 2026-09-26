import { DRAGON_DARTS_DART_FLIGHT_MS } from "../../config/game/abilities"
import PokemonFactory from "../../models/pokemon-factory"
import { Ability } from "../../types/enum/Ability"
import {
  Blessing,
  DREEPY_DEPLOYMENT_SPAWN_CHANCE,
  DREEPY_DEPLOYMENT_SPAWN_DISTANCE
} from "../../types/enum/Blessing"
import { AttackType } from "../../types/enum/Game"
import { Pkm } from "../../types/enum/Pokemon"
import { chance, pickRandomIn } from "../../utils/random"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

const DRAGON_DARTS_COUNT = 3

export class DragonDartsStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    const damage = [10, 20, 40, 80][pokemon.stars - 1] ?? 80
    const isDeploymentHero = pokemon.heroBlessings?.has(
      Blessing.DREEPY_DEPLOYMENT
    )

    // once a dart KO's the target no further dart is thrown, so none can deal
    // damage or deploy a Dreepy
    const throwDart = (dartsLeft: number) => {
      if (dartsLeft === 0 || target.hp <= 0 || pokemon.hp <= 0) return
      pokemon.broadcastAbility({
        skill: Ability.DRAGON_DARTS,
        targetX: target.positionX,
        targetY: target.positionY
      })
      pokemon.commands.push(
        new DelayedCommand(() => {
          if (target.hp <= 0) return
          target.handleSpecialDamage(
            damage,
            board,
            AttackType.SPECIAL,
            pokemon,
            crit
          )
          const dartKnockedOut = target.hp <= 0
          if (
            isDeploymentHero &&
            (dartKnockedOut || chance(DREEPY_DEPLOYMENT_SPAWN_CHANCE, pokemon))
          ) {
            deployDreepy(pokemon, board, target)
          }
          if (dartKnockedOut) {
            const ppRegained = [40, 40, 40, 80][pokemon.stars - 1] ?? 80
            pokemon.addPP(ppRegained, pokemon, 0, false)
            return
          }
          throwDart(dartsLeft - 1)
        }, DRAGON_DARTS_DART_FLIGHT_MS)
      )
    }
    throwDart(DRAGON_DARTS_COUNT)
  }
}

// the spawned Dreepy is an ordinary unit, not the hero, so it cannot deploy more
function deployDreepy(
  dreepy: PokemonEntity,
  board: Board,
  target: PokemonEntity
) {
  const cellsAtDistance = board
    .getCellsInRadius(
      target.positionX,
      target.positionY,
      DREEPY_DEPLOYMENT_SPAWN_DISTANCE,
      false
    )
    .filter(
      (cell) =>
        cell.value === undefined &&
        Math.max(
          Math.abs(cell.x - target.positionX),
          Math.abs(cell.y - target.positionY)
        ) === DREEPY_DEPLOYMENT_SPAWN_DISTANCE
    )
  const landing =
    cellsAtDistance.length > 0
      ? pickRandomIn(cellsAtDistance)
      : dreepy.simulation.getClosestFreeCellTo(
          target.positionX,
          target.positionY,
          dreepy.team
        )
  if (!landing) return
  const deployed = dreepy.simulation.addPokemon(
    PokemonFactory.createPokemonFromName(Pkm.DREEPY, dreepy.player),
    landing.x,
    landing.y,
    dreepy.team,
    true
  )
  deployed.pp = deployed.maxPP
}
