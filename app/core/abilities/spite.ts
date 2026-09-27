import { Ability } from "../../types/enum/Ability"
import { Blessing } from "../../types/enum/Blessing"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class SpiteStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    const ppDrain = [20, 40, 60, 100][pokemon.stars - 1] ?? 100

    const drainedEnemies = [target]
    if (pokemon.heroBlessings.has(Blessing.CURSED_COFFIN)) {
      board
        .getAdjacentCells(pokemon.positionX, pokemon.positionY)
        .forEach((cell) => {
          if (
            cell.value &&
            cell.value.team !== pokemon.team &&
            cell.value !== target
          ) {
            drainedEnemies.push(cell.value)
          }
        })
    }

    let totalPPDrained = 0
    for (const enemy of drainedEnemies) {
      pokemon.broadcastAbility({
        targetX: enemy.positionX,
        targetY: enemy.positionY,
        skill: pokemon.heroBlessings.has(Blessing.CURSED_COFFIN)
          ? "CURSED_COFFIN_SPITE_DRAIN"
          : Ability.PSYCHIC_FANGS
      })

      // Drain PP from target
      const ppBefore = enemy.pp
      enemy.addPP(-ppDrain, pokemon, 1, crit) //addPP handles pp underflow, ap, crit
      totalPPDrained += ppBefore - enemy.pp
    }

    if (pokemon.heroBlessings.has(Blessing.CURSED_COFFIN)) {
      pokemon.handleHeal(totalPPDrained, pokemon, 0, false)
    }

    const ppToRedistribute = pokemon.heroBlessings.has(Blessing.CURSED_COFFIN)
      ? totalPPDrained
      : ppDrain
    const adjacentAllies = board
      .getAdjacentCells(pokemon.positionX, pokemon.positionY)
      .filter((cell) => cell.value && cell.value.team === pokemon.team)
      .map((cell) => cell.value)

    // Redistribute PP to adjacent allies
    if (adjacentAllies.length > 0) {
      for (const ally of adjacentAllies) {
        if (ally) {
          pokemon.broadcastAbility({
            targetX: ally.positionX,
            targetY: ally.positionY
          })
          ally.addPP(ppToRedistribute / adjacentAllies.length, pokemon, 1, crit) //divide by number of allies to redistribute
        }
      }
    }
  }
}
