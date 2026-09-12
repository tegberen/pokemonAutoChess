import { EffectEnum } from "../types/enum/Effect"
import { Rarity, Team } from "../types/enum/Game"
import {
  type Seeds,
  Item,
  ItemComponents,
  ItemComponentsNoScarf
} from "../types/enum/Item"
import { Synergy } from "../types/enum/Synergy"
import { chance, pickNRandomIn, pickRandomIn } from "../utils/random"
import {
  type Effect,
  OnKillEffect,
  OnSimulationStartEffect,
  OnSkyDiveAttackEffect,
  OnSpawnEffect
} from "./effects/effect"
import type { Board } from "./board"
import { PokemonEntity } from "./pokemon-entity"

function countFreeAdjacentCells(entity: PokemonEntity): number {
  return entity.simulation.board
    .getAdjacentCells(entity.positionX, entity.positionY)
    .filter((cell) => cell.value === undefined).length
}

function alliesOf(pokemon: PokemonEntity, board: Board): PokemonEntity[] {
  return board.cells.filter(
    (cell): cell is PokemonEntity =>
      cell instanceof PokemonEntity && cell.team === pokemon.team
  )
}

export const SeedEffects: Record<(typeof Seeds)[number], Effect[]> = {
  BAN_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, target }) => {
      target.status.triggerSilence(2000, target, pokemon)
    })
  ],

  BLINKER_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, target, board }) => {
      const cells = [
        { x: target.positionX, y: target.positionY },
        ...board.getAdjacentCells(target.positionX, target.positionY)
      ]
      cells.forEach((cell) => {
        board.addBoardEffect(
          cell.x,
          cell.y,
          EffectEnum.SMOKE,
          pokemon.simulation
        )
      })
    })
  ],

  SLEEP_SEED: [
    new OnSkyDiveAttackEffect(({ target }) => {
      target.status.triggerSleep(2000, target)
    })
  ],

  STUN_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, target }) => {
      target.status.triggerParalysis(2000, target, pokemon)
    })
  ],

  TOTTER_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, target }) => {
      target.status.triggerConfusion(2000, target, pokemon)
    })
  ],

  LIFE_SEED: [
    new OnSimulationStartEffect(({ entity }) => {
      if (!entity.types.has(Synergy.FLYING)) return
      entity.addMaxHP(10 * countFreeAdjacentCells(entity), entity, 0, false)
    })
  ],

  QUICK_SEED: [
    new OnSimulationStartEffect(({ entity }) => {
      if (!entity.types.has(Synergy.FLYING)) return
      entity.addSpeed(5 * countFreeAdjacentCells(entity), entity, 0, false)
    })
  ],

  ENERGY_SEED: [
    new OnSimulationStartEffect(({ entity }) => {
      if (!entity.types.has(Synergy.FLYING)) return
      const isRedTeam = entity.team === Team.RED_TEAM
      const frontRow = isRedTeam ? 3 : 2
      const midRow = isRedTeam ? 4 : 1
      const backRow = isRedTeam ? 5 : 0
      if (entity.positionY === frontRow) {
        entity.addDefense(entity.baseDef, entity, 0, false)
      } else if (entity.positionY === midRow) {
        entity.addSpecialDefense(entity.baseSpeDef, entity, 0, false)
      } else if (entity.positionY === backRow) {
        entity.addAttack(entity.baseAtk * 0.25, entity, 0, false)
      }
    })
  ],

  DOOM_SEED: [
    new OnSimulationStartEffect(({ entity, simulation }) => {
      if (!entity.isDoomSeedTarget) return
      const flyAwayCell = entity.flyAway(simulation.board, true, false)
      if (flyAwayCell?.target) {
        flyAwayCell.target.status.triggerCurse(8000, flyAwayCell.target)
      }
    })
  ],

  BLAST_SEED: [
    new OnSpawnEffect((entity) => {
      if (!entity.types.has(Synergy.FLYING)) return
      entity.addAttack(entity.baseAtk * 0.5, entity, 0, false)
      entity.status.triggerBurn(300000, entity, entity)
    })
  ],

  EYEDROP_SEED: [
    new OnSimulationStartEffect(({ entity }) => {
      if (!entity.types.has(Synergy.FLYING)) return
      entity.range += 2
    }),
    new OnSkyDiveAttackEffect(({ pokemon, target }) => {
      target.status.triggerFlinch(2000, target, pokemon)
    })
  ],

  // SHIELD rather than heal, because a PROTECT pokemon cannot be healed
  HEAL_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, damage }) => {
      pokemon.addShield(damage * 2, pokemon, 0, false)
    })
  ],

  PURE_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon }) => {
      pokemon.status.triggerRuneProtect(300000, pokemon, pokemon)
      pokemon.addAbilityPower(25, pokemon, 0, false, false)
    })
  ],

  TRAINING_SEED: [
    new OnKillEffect(({ attacker }) => {
      if (!attacker.types.has(Synergy.FLYING)) return
      attacker.addAttack(1, attacker, 0, false, true)
    })
  ],

  VIOLENT_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon }) => {
      if (!pokemon.types.has(Synergy.FLYING)) return
      pokemon.status.triggerRage(2000, pokemon)
    })
  ],

  JOY_SEED: [
    new OnKillEffect(({ attacker }) => {
      if (!attacker.types.has(Synergy.FLYING)) return
      if (attacker.player && chance(0.05, attacker)) {
        attacker.player.items.push(pickRandomIn(ItemComponents))
      }
    })
  ],

  REVIVER_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, board }) => {
      if (!pokemon.isStrongestAllyThisFight) return
      pickNRandomIn(alliesOf(pokemon, board), 2).forEach((ally) => {
        ally.status.addResurrection(ally)
      })
    })
  ],

  TINY_REVIVER_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, board }) => {
      if (!pokemon.isStrongestAllyThisFight) return
      pickNRandomIn(alliesOf(pokemon, board), 1).forEach((ally) => {
        ally.status.addResurrection(ally)
        ally.addAttack(ally.atk, ally, 0, false)
      })
    })
  ],

  WARP_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, target, board }) => {
      if (!chance(0.3, pokemon)) return
      const farthestTarget = pokemon.state.getFarthestTarget(pokemon, board)
      if (!farthestTarget || farthestTarget.id === target.id) return
      pokemon.broadcastAbility({
        skill: "WARP_WAND",
        targetX: target.positionX,
        targetY: target.positionY
      })
      pokemon.broadcastAbility({
        skill: "WARP_WAND",
        targetX: farthestTarget.positionX,
        targetY: farthestTarget.positionY
      })
      target.moveTo(
        farthestTarget.positionX,
        farthestTarget.positionY,
        board,
        true
      )
      target.status.triggerConfusion(1000, target, pokemon)
    })
  ],

  EMPOWERMENT_SEED: [
    new OnSimulationStartEffect(({ entity }) => {
      if (!entity.types.has(Synergy.FLYING)) return
      entity.addCritPower(10, entity, 0, false)
    })
  ],

  // no effect of their own: both are read by flyAway in pokemon-entity
  PLAIN_SEED: [],
  DECOY_SEED: []
}

type ExplorerBonusRow = {
  nothing: number
  nugget: number
  rustyCoin: number
  component: number
}

export const EXPLORER_BONUS_TIERS: {
  rarities: Rarity[]
  rewards: ExplorerBonusRow
}[] = [
  {
    rarities: [Rarity.COMMON, Rarity.UNCOMMON],
    rewards: {
      nothing: 0.2,
      nugget: 0.4,
      rustyCoin: 0.4,
      component: 0
    }
  },
  {
    rarities: [Rarity.RARE, Rarity.EPIC],
    rewards: {
      nothing: 0.2,
      nugget: 0.2,
      rustyCoin: 0.5,
      component: 0.1
    }
  },
  {
    rarities: [Rarity.ULTRA, Rarity.UNIQUE],
    rewards: {
      nothing: 0.2,
      nugget: 0,
      rustyCoin: 0.4,
      component: 0.4
    }
  }
]

export function rollExplorerBonusReward(rarity: Rarity): Item | null {
  const table = EXPLORER_BONUS_TIERS.find((tier) =>
    tier.rarities.includes(rarity)
  )?.rewards
  if (!table) return null
  const roll = Math.random()
  let threshold = table.nothing
  if (roll < threshold) return null
  threshold += table.nugget
  if (roll < threshold) return Item.NUGGET
  threshold += table.rustyCoin
  if (roll < threshold) return Item.COIN
  threshold += table.component
  if (roll < threshold) return pickRandomIn(ItemComponentsNoScarf)
  return null
}
