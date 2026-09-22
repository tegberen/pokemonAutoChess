import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import { effectInLine } from "../board"
import { OnAttackEffect } from "../effects/effect"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

const CIRCUIT_CANNON_DURATION = 6000
const CIRCUIT_CANNON_MIN_DAMAGE_RATIO = 0.2

class CircuitCannonEffect extends OnAttackEffect {
  constructor(falloffPerEnemy: number) {
    super(({ pokemon, target, board, crit }) => {
      if (!target) return
      pokemon.broadcastAbility({
        skill: "CIRCUIT_CANNON_SHOT",
        targetX: target.positionX,
        targetY: target.positionY
      })
      let enemiesPassed = 0
      effectInLine(board, pokemon, target, (cell) => {
        const enemy = cell.value
        if (!enemy || enemy.team === pokemon.team) return
        if (enemy !== target) {
          const damageRatio = Math.max(
            CIRCUIT_CANNON_MIN_DAMAGE_RATIO,
            1 - falloffPerEnemy * enemiesPassed
          )
          enemy.handleSpecialDamage(
            pokemon.atk * damageRatio,
            board,
            AttackType.PHYSICAL,
            pokemon,
            crit,
            false
          )
        }
        enemiesPassed++
      })
    })
  }
}

export class CircuitCannonStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity | null,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit, true)
    pokemon.broadcastAbility({
      targetX: target?.positionX ?? -1,
      targetY: target?.positionY ?? -1,
      ap: 0
    })
    const duration = Math.round(
      CIRCUIT_CANNON_DURATION * (1 + pokemon.ap / 100)
    )
    const speedGain = [10, 20, 40][pokemon.stars - 1] ?? 40
    const falloffPerEnemy = [0.2, 0.1, 0][pokemon.stars - 1] ?? 0

    pokemon.status.triggerSilence(duration, pokemon, pokemon)
    pokemon.resetCooldown(0)
    const speedBefore = pokemon.speed
    pokemon.addSpeed(speedGain, pokemon, 1, false)
    const speedGained = pokemon.speed - speedBefore

    const cannon = new CircuitCannonEffect(falloffPerEnemy)
    pokemon.effectsSet.add(cannon)
    pokemon.commands.push(
      new DelayedCommand(() => {
        pokemon.effectsSet.delete(cannon)
        pokemon.speed = Math.max(0, pokemon.speed - speedGained)
      }, duration)
    )
  }
}
