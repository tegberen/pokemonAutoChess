import { Ability } from "../../types/enum/Ability"
import { Blessing } from "../../types/enum/Blessing"
import { AttackType } from "../../types/enum/Game"
import { Synergy } from "../../types/enum/Synergy"
import { spacesBetween } from "../../utils/distance"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

// each row further from the caster takes 50% less than the row before it
const SOLAR_BLADE_LOSS_PER_TILE = 0.5

export class SolarBladeStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)

    if (!pokemon.status.light) {
      pokemon.cooldown = 2000
      pokemon.broadcastAbility({
        skill: "SOLAR_BLADE_CHARGE",
        positionX: pokemon.positionX,
        positionY: pokemon.positionY
      })
    }

    pokemon.commands.push(
      new DelayedCommand(
        () => {
          const damage = [30, 60, 120, 240][pokemon.stars - 1] ?? 240
          // FLORA: the blade reaches as deep as the caster's RANGE
          const reach = Math.max(1, pokemon.range)
          const cells = board.getCellsInFront(pokemon, target, reach)
          pokemon.broadcastAbility({
            skill: Ability.SOLAR_BLADE,
            positionX: pokemon.positionX,
            positionY: pokemon.positionY,
            orientation: pokemon.orientation,
            delay: reach
          })
          const isFleurDeLure = pokemon.heroBlessings?.has(
            Blessing.FLEUR_DE_LURE
          )
          cells.forEach((cell) => {
            if (cell.value && cell.value.team !== pokemon.team) {
              const tilesBehind = spacesBetween(
                pokemon.positionX,
                pokemon.positionY,
                cell.x,
                cell.y
              )
              const damageAtDepth = Math.round(
                damage * (1 - SOLAR_BLADE_LOSS_PER_TILE) ** tilesBehind
              )
              const isInfatuated = isFleurDeLure && cell.value.status.charm
              if (isInfatuated && cell.value.types.has(Synergy.BUG)) {
                cell.value.handleSpecialDamage(
                  9999,
                  board,
                  AttackType.TRUE,
                  pokemon,
                  crit
                )
                return
              }
              cell.value.handleSpecialDamage(
                damageAtDepth,
                board,
                AttackType.TRUE,
                pokemon,
                crit || isInfatuated
              )
            }
          })
        },
        pokemon.status.light ? 0 : 2000
      )
    )
  }
}
