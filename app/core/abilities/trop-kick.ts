import { Ability } from "../../types/enum/Ability"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

const TROP_KICK_DELAY_BETWEEN_KICKS = 150
const TROP_KICK_MAX_KICKS = 8

export class TropKickStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    const damage = [30, 60, 120, 240][pokemon.stars - 1] ?? 240
    const atkDebuff = [1, 2, 3, 6][pokemon.stars - 1] ?? 6
    const nbKicks = Math.min(pokemon.count.ult + 1, TROP_KICK_MAX_KICKS)
    const enemyTeam = target.team
    let currentTarget: PokemonEntity | undefined = target

    for (let i = 0; i < nbKicks; i++) {
      pokemon.commands.push(
        new DelayedCommand(() => {
          if (pokemon.hp <= 0) return
          if (!currentTarget || currentTarget.hp <= 0) {
            currentTarget = board
              .getAdjacentCells(pokemon.positionX, pokemon.positionY)
              .map((cell) => cell.value)
              .find(
                (entity) =>
                  entity && entity.team === enemyTeam && entity.hp > 0
              )
          }
          if (!currentTarget) return
          pokemon.broadcastAbility({
            skill: i === nbKicks - 1 ? "TROP_KICK_FINISHER" : Ability.TROP_KICK,
            targetX: currentTarget.positionX,
            targetY: currentTarget.positionY
          })
          currentTarget.addAttack(-atkDebuff, pokemon, 1, crit)
          currentTarget.handleSpecialDamage(
            damage,
            board,
            AttackType.SPECIAL,
            pokemon,
            crit
          )
        }, TROP_KICK_DELAY_BETWEEN_KICKS * i)
      )
    }
  }
}
