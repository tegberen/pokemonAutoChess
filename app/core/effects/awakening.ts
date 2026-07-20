import { AttackType, Team } from "../../types/enum/Game"
import { Awakening } from "../../types/enum/Awakening"
import { BoardEffects, EffectEnum } from "../../types/enum/Effect"
import { distanceC } from "../../utils/distance"
import { DelayedCommand } from "../simulation-command"
import {
  type Effect,
  OnAbilityCastEffect,
  OnAttackEffect,
  OnDamageReceivedEffect,
  OnDeathEffect,
  OnHitEffect,
  OnSimulationStartEffect,
  PeriodicEffect
} from "./effect"
import { chance, pickRandomIn } from "../../utils/random"
import { Item } from "../../types"
import { schemaValues } from "../../utils/schemas"
import { isOnBench } from "../../utils/board"

const O = EffectEnum.CRYSTALLISATION // effect origin tag

export const AwakeningEffects: Partial<
  Record<Awakening, (Effect | (() => Effect))[]>
> = {
  [Awakening.SUN_STONE]: [
    new PeriodicEffect(
      (pokemon) => {
        pokemon.addAbilityPower(5, pokemon, 0, false)
        pokemon.addAttack(2, pokemon, 0, false)
      },
      O,
      3000
    ),
    () => {
      let triggered = false
      return new OnDamageReceivedEffect(({ pokemon }) => {
        if (!triggered && pokemon.hp <= 0.3 * pokemon.maxHP) {
          triggered = true
          pokemon.addAttack(pokemon.baseAtk - pokemon.atk, pokemon, 0, false)
          pokemon.addAbilityPower(-pokemon.ap, pokemon, 0, false)
          pokemon.handleHeal(0.5 * pokemon.maxHP, pokemon, 0, false)
        }
      })
    }
  ],

  [Awakening.HEAT_ROCK]: [
    () => {
      let overheated = false
      return new OnAttackEffect(({ pokemon, board }) => {
        pokemon.addAttack(2, pokemon, 0, false)
        if (!overheated && pokemon.atk >= 4 * pokemon.baseAtk) {
          overheated = true
          pokemon.status.triggerRage(4000, pokemon)
          if (!pokemon.items.has(Item.PROTECTIVE_PADS)) {
            pokemon.commands.push(
              new DelayedCommand(() => {
                pokemon.handleSpecialDamage(
                  9999,
                  board,
                  AttackType.TRUE,
                  pokemon,
                  false
                )
              }, 4000)
            )
          }
        }
      })
    },
    new OnDeathEffect(({ pokemon, board }) => {
      board
        .getAdjacentCells(pokemon.positionX, pokemon.positionY)
        .forEach((cell) => {
          if (cell.value && cell.value.team !== pokemon.team) {
            cell.value.handleSpecialDamage(
              0.5 * pokemon.atk,
              board,
              AttackType.TRUE,
              pokemon,
              false
            )
          }
        })
    })
  ],

  [Awakening.DAMP_ROCK]: [
    new OnAbilityCastEffect((pokemon, board, _target, crit) => {
      pokemon.maxPP = Math.max(20, Math.round(pokemon.maxPP * 0.97))
      const enemies = board.cells.filter(
        (e): e is NonNullable<typeof e> => e != null && e.team !== pokemon.team
      )
      enemies
        .sort(
          (a, b) =>
            distanceC(
              pokemon.positionX,
              pokemon.positionY,
              a.positionX,
              a.positionY
            ) -
            distanceC(
              pokemon.positionX,
              pokemon.positionY,
              b.positionX,
              b.positionY
            )
        )
        .slice(0, 3)
        .forEach((enemy) => {
          pokemon.broadcastAbility({
            skill: "WATER_RANGE",
            targetX: enemy.positionX,
            targetY: enemy.positionY
          })
          enemy.handleSpecialDamage(10, board, AttackType.SPECIAL, pokemon, crit)
        })
    })
  ],

  [Awakening.ICY_ROCK]: [
    new PeriodicEffect(
      (pokemon, board) => {
        board
          .getCellsInRadius(pokemon.positionX, pokemon.positionY, pokemon.range, false)
          .forEach((cell) => {
            if (cell.value && cell.value.team !== pokemon.team) {
              cell.value.addSpeed(-3, pokemon, 0, false)
              pokemon.addSpeed(3, pokemon, 0, false)
            }
          })
      },
      O,
      5000
    ),
    new OnHitEffect(({ attacker, target, board }) => {
      target.handleSpecialDamage(
        0.2 * attacker.speDef,
        board,
        AttackType.SPECIAL,
        attacker,
        false
      )
    })
  ],

  [Awakening.SMOOTH_ROCK]: [
    new OnSimulationStartEffect(({ entity }) => {
      entity.addMaxHP(
        Math.round(0.3 * (entity.def + entity.speDef)),
        entity,
        0,
        false
      )
    }),
    new PeriodicEffect(
      (pokemon, board) => {
        board
          .getAdjacentCells(pokemon.positionX, pokemon.positionY)
          .forEach((cell) => {
            if (cell.value && cell.value.team !== pokemon.team) {
              cell.value.handleSpecialDamage(
                0.01 * pokemon.maxHP,
                board,
                AttackType.TRUE,
                pokemon,
                false
              )
            }
          })
      },
      O,
      3000
    )
  ],

  // "reduce incoming damage by 15% per 100% CRIT_POWER" handled in pokemon-state.ts; handleDamage
  [Awakening.BLACK_AUGURITE]: [],

  // "+10 SPEED when a ROCK ally is KO'd" handled in pokemon-entity.onDeath
  [Awakening.FLOAT_STONE]: [
    new OnDeathEffect(({ pokemon, board }) => {
      board
        .getAdjacentCells(pokemon.positionX, pokemon.positionY)
        .forEach((cell) => {
          if (cell.value && cell.value.team !== pokemon.team) {
            cell.value.handleSpecialDamage(
              0.2 * pokemon.speed,
              board,
              AttackType.PHYSICAL,
              pokemon,
              false
            )
          }
        })
    })
  ],

  // "charges up (+5 SPEED, +10 SHIELD) when a nearby ally casts" handled in abilities/cast.ts
  [Awakening.ELECTRIC_QUARTZ]: [],

  [Awakening.MIST_STONE]: [
    new OnAttackEffect(({ pokemon, target }) => {
      if (!target) return

      if (chance(1 / 6, pokemon)) target.addAttack(-2, pokemon, 0, false)
      if (chance(1 / 6, pokemon)) target.addAbilityPower(-5, pokemon, 0, false)
      if (chance(1 / 6, pokemon)) target.addDefense(-2, pokemon, 0, false)
      if (chance(1 / 6, pokemon)) target.addSpecialDefense(-2, pokemon, 0, false)
      if (chance(1 / 6, pokemon)) target.addSpeed(-5, pokemon, 0, false)
      if (chance(1 / 6, pokemon)) target.addLuck(-5, pokemon, 0, false)
    })
  ],

  [Awakening.BLOOD_STONE]: [
    new OnSimulationStartEffect(({ entity }) => {
      entity.addAttack(Math.round(0.20 * entity.def), entity, 0, false)
      entity.addDefense(-Math.round(0.5 * entity.def), entity, 0, false)
    }),
    new OnDeathEffect(({ pokemon, board }) => {
      board
        .getAdjacentCells(pokemon.positionX, pokemon.positionY)
        .forEach((cell) => {
          if (cell.value && cell.value.team === pokemon.team) {
            cell.value.status.triggerRage(2000, cell.value)
          }
        })
    })
  ],

  // heal of poison damage handled in status.updatePoison
  [Awakening.SMELLY_CLAY]: [
    new OnDeathEffect(({ pokemon, board }) => {
      board
        .getCellsInRadius(pokemon.positionX, pokemon.positionY, 2, false)
        .forEach((cell) => {
          if (cell.value && cell.value.team !== pokemon.team) {
            cell.value.status.triggerPoison(3000, cell.value, pokemon)
            cell.value.status.triggerPoison(3000, cell.value, pokemon)
          }
        })
    })
  ],

  [Awakening.ODD_KEYSTONE]: [
    () => {
      let lastDodge = 0
      return new PeriodicEffect(
        (pokemon) => {
          const d = pokemon.count.dodgeCount
          if (d > lastDodge) {
            const gained = d - lastDodge
            pokemon.addLuck(1 * gained, pokemon, 0, false)
            pokemon.addAbilityPower(2 * gained, pokemon, 0, false)
            lastDodge = d
          }
        },
        O,
        250
      )
    },
    new OnDeathEffect(({ pokemon }) => {
      const enemyTeam =
        pokemon.team === Team.BLUE_TEAM ? Team.RED_TEAM : Team.BLUE_TEAM
      pokemon.simulation.applyCurse(EffectEnum.CURSE_OF_WEAKNESS, enemyTeam)
      pokemon.simulation.applyCurse(EffectEnum.CURSE_OF_TORMENT, enemyTeam)
    })
  ],
  [Awakening.METAL_ALLOY]: [
    new OnAttackEffect(({ pokemon, target, board }) => {
      if (target) {
        if (chance(0.05, pokemon) && target.range > 1 && !target.items.has(Item.PROTECTIVE_PADS)) {
          target.range -= 1
          pokemon.range += 1
        } else {
          const orientation = board.orientation(
            pokemon.positionX,
            pokemon.positionY,
            target.positionX,
            target.positionY,
            pokemon,
            undefined
          )
          for (let i = 0; i < pokemon.range; i++) {
            const destination = board.getKnockBackPlace(
              target.positionX,
              target.positionY,
              orientation
            )
            if (!destination) break
            target.moveTo(destination.x, destination.y, board, true)
          }
          target.status.triggerLocked(2000, target)
        }
      }
    })
  ],

  // handled in effects/synergies.ts
  [Awakening.STICKY_GLOB]: [],

  [Awakening.ECLIPSE_STONE]: [
    new OnSimulationStartEffect(({ entity }) => {
      entity.addAbilityPower(entity.def, entity, 0, false)
      entity.addPP(Math.round(0.5 * entity.def), entity, 0, false)
    })
  ],

  [Awakening.PEARL_STONE]: [],

  // "Attacks have [1,LK]% chance per STAR on your board to deal the target's
  // remaining SHIELD as PHYSICAL, SPECIAL or TRUE ON_ATTACK"
  [Awakening.ELDER_CRYSTAL]: [
    new OnAttackEffect(({ pokemon, target, board }) => {
      if (!target || target.shield <= 0 || !pokemon.player) return
      const totalStars = schemaValues(pokemon.player.board).reduce(
        (acc, p) => acc + (!isOnBench(p) ? p.stars : 0),
        0
      )
      if (chance(0.01 * totalStars, pokemon)) {
        const attackType = pickRandomIn([
          AttackType.PHYSICAL,
          AttackType.SPECIAL,
          AttackType.TRUE
        ])
        target.handleSpecialDamage(
          target.shield,
          board,
          attackType,
          pokemon,
          false,
          false
        )
      }
    })
  ],

  [Awakening.DISTORTION_SLATE]: [
    new OnAttackEffect(({ pokemon, target, board }) => {
      if (!target) return
      if (chance(0.05, pokemon)) {
        const boardEffect = pickRandomIn(BoardEffects)
        const cells = board.getAdjacentCells(
          target.positionX,
          target.positionY,
          true
        )
        cells.forEach((cell) => {
          if (cell.value && cell.value.team === target.team) {
            board.addBoardEffect(
              cell.x,
              cell.y,
              boardEffect,
              pokemon.simulation
            )
          }
        })
      }
    })
  ],
  [Awakening.FOSSIL_FRAGMENT]: [],

  [Awakening.CLOUD_ORB]: [
    new PeriodicEffect(
      (pokemon) => {
        if (pokemon.status.hasNegativeStatus() && !pokemon.status.runeProtect) {
          const defLoss = Math.round(0.2 * pokemon.def)
          if (defLoss > 0) {
            pokemon.addDefense(-defLoss, pokemon, 0, false)
            pokemon.commands.push(
              new DelayedCommand(() => {
                pokemon.addDefense(defLoss, pokemon, 0, false)
              }, 5000)
            )
          }
          pokemon.status.triggerRuneProtect(5000, pokemon, pokemon)
        }
      },
      O,
      250
    )
  ],

  [Awakening.PEAT_BLOCK]: [
    new OnDeathEffect(({ pokemon, board }) => {
      const allies = board
        .getCellsInRadius(pokemon.positionX, pokemon.positionY, 2, false)
        .filter((cell) => cell.value != null && cell.value.team === pokemon.team)
      if (allies.length === 0) return
      const defShare = Math.floor(pokemon.def / allies.length)
      const speedShare = Math.floor(pokemon.speed / allies.length)
      allies.forEach((cell) => {
        if (!cell.value) return
        if (defShare > 0) cell.value.addDefense(defShare, cell.value, 0, false)
        if (speedShare > 0) cell.value.addSpeed(speedShare, cell.value, 0, false)
      })
    })
  ]
}
