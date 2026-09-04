import { Ability } from "../../types/enum/Ability"
import { AttackType } from "../../types/enum/Game"
import { Weather } from "../../types/enum/Weather"
import type { Board } from "../board"
import { effectInLine } from "../board"

import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

// the two charged skies that spare Electro Shot its wind-up
const ELECTRO_SHOT_INSTANT_WEATHERS: Weather[] = [
  Weather.STORM,
  Weather.MAGNET_STORM
]

export class ElectroShotStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)

    const shootsInstantly = ELECTRO_SHOT_INSTANT_WEATHERS.includes(
      pokemon.simulation.weather
    )

    if (!shootsInstantly) {
      pokemon.cooldown = 2000
      pokemon.broadcastAbility({
        skill: "ELECTRO_SHOT_CHARGE",
        positionX: pokemon.positionX,
        positionY: pokemon.positionY
      })
    }

    pokemon.commands.push(
      new DelayedCommand(
        () => {
          const damage = [80, 100, 120, 240][pokemon.stars - 1] ?? 240
          const apBoost = 40
          pokemon.addAbilityPower(apBoost, pokemon, 0, false)
          pokemon.broadcastAbility({
            skill: Ability.ELECTRO_SHOT,
            targetX: target.positionX,
            targetY: target.positionY
          })
          effectInLine(board, pokemon, target, (cell) => {
            if (cell.value != null && cell.value.team !== pokemon.team) {
              cell.value.handleSpecialDamage(
                damage,
                board,
                AttackType.SPECIAL,
                pokemon,
                crit
              )
            }
          })
        },
        shootsInstantly ? 0 : 2000
      )
    )
  }
}
