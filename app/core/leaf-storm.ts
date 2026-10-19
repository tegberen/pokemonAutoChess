import {
  LEAF_STORM_GROWTH_MS,
  LEAF_STORM_START_RADIUS,
  LEAF_STORM_STRIKE_FLIGHT_MS
} from "../config/game/abilities"
import { AttackType, type Team } from "../types/enum/Game"
import { distanceE } from "../utils/distance"
import type { PokemonEntity } from "./pokemon-entity"
import type Simulation from "./simulation"

const AP_DRAINED_PER_SECOND_BY_STAR = [10, 20, 30]
const HEAL_PER_SECOND_BY_STAR = [10, 20, 30]
const DRAINED_AP_DAMAGE_RATIO = 1

export class LeafStorm {
  radius = LEAF_STORM_START_RADIUS
  growthTimer = LEAF_STORM_GROWTH_MS
  drainedAP = 0
  losses = new Map<PokemonEntity, { ap: number; atk: number }>()
  strikeTimer: number | null = null
  targets: PokemonEntity[] = []
  finished = false

  constructor(
    readonly caster: PokemonEntity,
    readonly team: Team,
    readonly x: number,
    readonly y: number,
    readonly crit: boolean
  ) {}

  update(dt: number, simulation: Simulation) {
    if (this.strikeTimer !== null) {
      this.strikeTimer -= dt
      if (this.strikeTimer <= 0) this.strike(simulation)
      return
    }
    if (this.caster.hp <= 0 || this.caster.status.resurrecting) {
      this.fade()
      return
    }
    this.growthTimer -= dt
    if (this.growthTimer > 0) return
    this.growthTimer += LEAF_STORM_GROWTH_MS
    this.radius += 1
    const tier = this.caster.stars - 1
    const drain = AP_DRAINED_PER_SECOND_BY_STAR[tier] ?? 30
    const heal = HEAL_PER_SECOND_BY_STAR[tier] ?? 30
    simulation.board.forEach((x, y, unit) => {
      if (!unit || unit.hp <= 0) return
      if (distanceE(x, y, this.x, this.y) > this.radius) return
      if (unit.team === this.team) {
        unit.handleHeal(heal, this.caster, 0, false)
      } else {
        // measured, since the AP floor or a Nullify Bandanna changes the loss
        const apBefore = unit.ap
        const atkBefore = unit.atk
        unit.addAbilityPower(-drain, this.caster, 0, false)
        const loss = this.losses.get(unit) ?? { ap: 0, atk: 0 }
        loss.ap += apBefore - unit.ap
        loss.atk += atkBefore - unit.atk
        this.losses.set(unit, loss)
        this.drainedAP += apBefore - unit.ap
      }
    })
    if (this.coversBoard(simulation)) this.release(simulation)
  }

  coversBoard(simulation: Simulation) {
    const { columns, rows } = simulation.board
    return [
      [0, 0],
      [columns - 1, 0],
      [0, rows - 1],
      [columns - 1, rows - 1]
    ].every(([x, y]) => distanceE(x, y, this.x, this.y) <= this.radius)
  }

  release(simulation: Simulation) {
    simulation.board.forEach((x, y, unit) => {
      if (unit && unit.hp > 0 && unit.team !== this.team) {
        this.targets.push(unit)
      }
    })
    this.caster.broadcastAbility({
      skill: "LEAF_STORM_RELEASE",
      positionX: this.x,
      positionY: this.y,
      casterId: this.caster.id
    })
    this.targets.forEach((target) =>
      this.caster.broadcastAbility({
        skill: "LEAF_STORM_STRIKE",
        positionX: this.x,
        positionY: this.y,
        targetX: target.positionX,
        targetY: target.positionY,
        casterId: this.caster.id
      })
    )
    this.strikeTimer = LEAF_STORM_STRIKE_FLIGHT_MS
  }

  strike(simulation: Simulation) {
    this.finished = true
    const survivors = this.targets.filter((target) => target.hp > 0)
    if (survivors.length > 0) {
      const damage =
        (this.drainedAP * DRAINED_AP_DAMAGE_RATIO) / survivors.length
      survivors.forEach((target) =>
        target.handleSpecialDamage(
          damage,
          simulation.board,
          AttackType.SPECIAL,
          this.caster,
          this.crit
        )
      )
    }
    this.giveBackLosses()
  }

  fade() {
    this.finished = true
    this.giveBackLosses()
    this.caster.broadcastAbility({
      skill: "LEAF_STORM_FADE",
      positionX: this.x,
      positionY: this.y,
      casterId: this.caster.id
    })
  }

  // written directly, so stat gain boosts cannot pay back more than was taken
  giveBackLosses() {
    this.losses.forEach((loss, unit) => {
      if (unit.hp <= 0) return
      unit.ap += loss.ap
      unit.atk += loss.atk
    })
    this.losses.clear()
  }
}
