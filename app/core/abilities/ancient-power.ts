import {
  ANCIENT_POWER_CHARGE_MS,
  ANCIENT_POWER_LAUNCH_STAGGER_MS,
  ANCIENT_POWER_ROCK_FLIGHT_MS,
  ANCIENT_POWER_ROCKS_BY_STAR
} from "../../config/game/abilities"
import { Ability } from "../../types/enum/Ability"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

const ROCK_DAMAGE = 20

export class AncientPowerStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    // the id lets the client throw the rocks this charge raised
    pokemon.broadcastAbility({
      skill: Ability.ANCIENT_POWER,
      casterId: pokemon.id
    })
    const rocks = ANCIENT_POWER_ROCKS_BY_STAR[pokemon.stars - 1] ?? 8
    let rockTarget = target
    for (let rock = 0; rock < rocks; rock++) {
      pokemon.commands.push(
        new DelayedCommand(() => {
          if (rockTarget.hp <= 0) {
            const nextTarget = board.getClosestEnemy(
              rockTarget.positionX,
              rockTarget.positionY,
              rockTarget.team
            )
            if (!nextTarget) return
            rockTarget = nextTarget
          }
          const struck = rockTarget
          pokemon.broadcastAbility({
            skill: "ANCIENT_POWER_ROCK",
            targetX: struck.positionX,
            targetY: struck.positionY,
            casterId: pokemon.id
          })
          pokemon.commands.push(
            new DelayedCommand(() => {
              if (struck.hp <= 0) return
              struck.handleSpecialDamage(
                ROCK_DAMAGE,
                board,
                AttackType.SPECIAL,
                pokemon,
                crit
              )
            }, ANCIENT_POWER_ROCK_FLIGHT_MS)
          )
        }, ANCIENT_POWER_CHARGE_MS + rock * ANCIENT_POWER_LAUNCH_STAGGER_MS)
      )
    }
    // after the last rock, so a cast never powers up its own rocks
    pokemon.commands.push(
      new DelayedCommand(
        () => pokemon.addAbilityPower(25, pokemon, 0, false),
        ANCIENT_POWER_CHARGE_MS +
          (rocks - 1) * ANCIENT_POWER_LAUNCH_STAGGER_MS +
          ANCIENT_POWER_ROCK_FLIGHT_MS
      )
    )
  }
}
