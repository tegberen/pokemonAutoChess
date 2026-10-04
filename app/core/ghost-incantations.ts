import { SynergyTiersThresholds } from "../config"
import {
  FATED_DOOM_DELAY,
  FATED_ECHO_CHANCE,
  FATED_RESURRECT_ACTIVATIONS,
  FATED_SPAWN_GHOST_CHANCE,
  FATED_SPAWN_RARITY_WEIGHTS,
  FATED_SPREAD_HEX_TARGETS,
  FATED_SPREAD_STATUS_DURATION,
  FatedHexing,
  FatedRitual,
  type GhostIncantation,
  getHexingStrength,
  getRitualStrength,
  HEXING_LOSS_VALUES,
  HEXING_STAT_LOSS_VALUES,
  HexingLoss,
  HexingStatus,
  HexingTarget,
  INCANTATION_STATUS_DURATION,
  IncantationKind,
  RITUAL_BONUS_VALUES,
  RITUAL_EFFECT_VALUES,
  RITUAL_GOLD_CHANCE_VALUES,
  RITUAL_SILENCE_VALUES,
  RitualBonus,
  RitualEffect,
  RitualTrigger
} from "../config/game/ghost-incantations"
import { SynergyTiers } from "../config/game/synergies"
import type Player from "../models/colyseus-models/player"
import type { Pokemon } from "../models/colyseus-models/pokemon"
import PokemonFactory from "../models/pokemon-factory"
import { getPokemonData } from "../models/precomputed/precomputed-pokemon-data"
import { PRECOMPUTED_POKEMONS_PER_TYPE_AND_CATEGORY } from "../models/precomputed/precomputed-types-and-categories"
import type { EffectEnum } from "../types/enum/Effect"
import { Rarity, Team } from "../types/enum/Game"
import type { Pkm } from "../types/enum/Pokemon"
import { Synergy } from "../types/enum/Synergy"
import {
  getBenchSize,
  getFirstAvailablePositionInBench
} from "../utils/board"
import { distanceC } from "../utils/distance"
import { chance, pickRandomIn, randomWeighted } from "../utils/random"
import type { Board } from "./board"
import type { PokemonEntity } from "./pokemon-entity"
import type Simulation from "./simulation"
import { getStrongestUnit } from "./unit-score"

export interface IncantationSide {
  team: Team
  player: Player
  hexings: { slot: number; incantation: GhostIncantation }[]
  ritual: GhostIncantation | null
  fated: GhostIncantation | null
  hexingStrength: number
  ritualStrength: number
  canEarnRewards: boolean
  ritualActivations: number
}

export interface Hex {
  side: IncantationSide
  slot: number
  incantation: GhostIncantation
}

interface RitualContext {
  source?: PokemonEntity
  target?: PokemonEntity
  enemiesDamagedByCast?: PokemonEntity[]
  origin?: PokemonEntity
}

export function createIncantationSide(
  team: Team,
  player: Player | undefined,
  effects: Set<EffectEnum>,
  canEarnRewards: boolean
): IncantationSide | null {
  if (!player || player.ghostIncantations.length === 0) return null
  const ghostTier = SynergyTiers[Synergy.GHOST].findLastIndex((effect) =>
    effects.has(effect)
  )
  if (ghostTier < 0) return null
  const ghostLevel = SynergyTiersThresholds[Synergy.GHOST][ghostTier]
  const active = player.ghostIncantations.slice(0, ghostTier + 1)
  return {
    team,
    player,
    hexings: active
      .map((incantation, slot) => ({ slot, incantation }))
      .filter(({ incantation }) => incantation.kind === IncantationKind.HEXING),
    ritual:
      active.find(({ kind }) => kind === IncantationKind.RITUAL) ?? null,
    fated: active.find(({ kind }) => kind === IncantationKind.FATED) ?? null,
    hexingStrength: getHexingStrength(ghostLevel),
    ritualStrength: getRitualStrength(ghostLevel),
    canEarnRewards,
    ritualActivations: 0
  }
}

function getTeamEntities(simulation: Simulation, team: Team) {
  const entities =
    team === Team.BLUE_TEAM ? simulation.blueTeam : simulation.redTeam
  return [...entities.values()].filter((entity) => entity.hp > 0)
}

function getOpposingTeam(team: Team) {
  return team === Team.BLUE_TEAM ? Team.RED_TEAM : Team.BLUE_TEAM
}

function getCurser(simulation: Simulation, side: IncantationSide) {
  const allies = getTeamEntities(simulation, side.team)
  return allies.find((ally) => ally.types.has(Synergy.GHOST)) ?? allies[0]
}

const HEX_TARGET_SCORE: {
  [target in HexingTarget]: (enemy: PokemonEntity) => number
} = {
  HIGHEST_DEFENSES: (enemy) => enemy.def + enemy.speDef,
  HIGHEST_AP: (enemy) => enemy.ap,
  HIGHEST_ATK: (enemy) => enemy.atk,
  HIGHEST_SPEED: (enemy) => enemy.speed
}

export function applyHexingIncantations(
  simulation: Simulation,
  side: IncantationSide
) {
  const targetsPerHex =
    side.fated?.cause === FatedHexing.TWO_TARGETS ? 2 : 1
  for (const hexing of side.hexings) {
    for (let count = 0; count < targetsPerHex; count++) {
      hexNewEnemy(simulation, side, hexing.slot, hexing.incantation)
    }
  }
}

function hexNewEnemy(
  simulation: Simulation,
  side: IncantationSide,
  slot: number,
  incantation: GhostIncantation
) {
  const candidates = getTeamEntities(
    simulation,
    getOpposingTeam(side.team)
  ).filter(
    (enemy) =>
      !enemy.hexes.some((hex) => hex.side === side && hex.slot === slot)
  )
  const score = HEX_TARGET_SCORE[incantation.cause as HexingTarget]
  if (candidates.length === 0 || !score) return
  const highestScore = Math.max(...candidates.map(score))
  const target = pickRandomIn(
    candidates.filter((enemy) => score(enemy) === highestScore)
  )
  const curser = getCurser(simulation, side)
  if (!target || !curser) return
  applyHex(side, slot, incantation, target, curser)
}

function applyHex(
  side: IncantationSide,
  slot: number,
  incantation: GhostIncantation,
  target: PokemonEntity,
  curser: PokemonEntity
) {
  const strength = side.hexingStrength
  const loss = incantation.effect as HexingLoss
  if (loss === HexingLoss.STAT) {
    const cause = incantation.cause as HexingTarget
    const { values, isPercent } = HEXING_STAT_LOSS_VALUES[cause]
    const value = values[strength]
    if (cause === HexingTarget.HIGHEST_DEFENSES) {
      target.addDefense(-value, curser, 0, false)
      target.addSpecialDefense(-value, curser, 0, false)
    } else if (cause === HexingTarget.HIGHEST_AP) {
      target.addAbilityPower(-value, curser, 0, false)
    } else if (cause === HexingTarget.HIGHEST_ATK) {
      const atkLoss = isPercent ? Math.round((target.atk * value) / 100) : value
      target.addAttack(-atkLoss, curser, 0, false)
    } else if (cause === HexingTarget.HIGHEST_SPEED) {
      target.addSpeed(-value, curser, 0, false)
    }
  } else if (loss === HexingLoss.LUCK) {
    target.addLuck(-HEXING_LOSS_VALUES[loss][strength], curser, 0, false)
  } else if (loss === HexingLoss.MAX_PP) {
    const increase = HEXING_LOSS_VALUES[loss][strength]
    target.maxPP = Math.min(
      255,
      Math.round((target.maxPP * (100 + increase)) / 100)
    )
  } else if (loss === HexingLoss.MAX_HP) {
    const hpLoss = Math.round(
      (target.maxHP * HEXING_LOSS_VALUES[loss][strength]) / 100
    )
    target.addMaxHP(-hpLoss, curser, 0, false)
  }

  triggerHexStatus(
    target,
    incantation.bonus as HexingStatus,
    INCANTATION_STATUS_DURATION
  )
  target.hexes.push({ side, slot, incantation })
  if (slot === 0) target.status.curseVulnerability = true
  else target.status.curseWeakness = true

  if (side.fated?.cause === FatedHexing.DOOM) {
    target.status.curseFate = true
    target.status.triggerCurse(FATED_DOOM_DELAY, target)
  }
}

function triggerHexStatus(
  target: PokemonEntity,
  status: HexingStatus,
  duration: number
) {
  if (status === HexingStatus.FLINCH) {
    target.status.triggerFlinch(duration, target)
  } else if (status === HexingStatus.ARMOR_BREAK) {
    target.status.triggerArmorReduction(duration, target)
  } else if (status === HexingStatus.FATIGUE) {
    target.status.triggerFatigue(duration, target, null)
  } else if (status === HexingStatus.PARALYSIS) {
    target.status.triggerParalysis(duration, target, null)
  }
}

function hasHexStatus(target: PokemonEntity, status: HexingStatus) {
  if (status === HexingStatus.FLINCH) return target.status.flinch
  if (status === HexingStatus.ARMOR_BREAK) return target.status.armorReduction
  if (status === HexingStatus.FATIGUE) return target.status.fatigue
  return target.status.paralysis
}

// like the old GHOST curses, hexes come back after a cleanse
export function reapplyHexStatuses(target: PokemonEntity) {
  for (const hex of target.hexes) {
    const status = hex.incantation.bonus as HexingStatus
    if (!hasHexStatus(target, status)) {
      triggerHexStatus(target, status, INCANTATION_STATUS_DURATION)
    }
  }
  if (target.status.curseFate && !target.status.curse) {
    target.status.triggerCurse(FATED_DOOM_DELAY, target)
  }
}

export function onHexedEnemyKnockedOut(
  simulation: Simulation,
  enemy: PokemonEntity,
  board: Board
) {
  for (const hex of enemy.hexes) {
    const { side, incantation } = hex
    if (incantation.effect === HexingLoss.GOLD_ON_KO && !enemy.isSpawn) {
      grantIncantationGold(
        side,
        HEXING_LOSS_VALUES[HexingLoss.GOLD_ON_KO][side.hexingStrength]
      )
    }
    if (side.fated?.cause === FatedHexing.SPREAD_STATUS) {
      board
        .getAdjacentCells(enemy.positionX, enemy.positionY)
        .forEach((cell) => {
          if (cell.value && cell.value.team === enemy.team) {
            triggerHexStatus(
              cell.value,
              incantation.bonus as HexingStatus,
              FATED_SPREAD_STATUS_DURATION
            )
          }
        })
    }
    if (side.fated?.cause === FatedHexing.SPREAD_HEX) {
      for (let count = 0; count < FATED_SPREAD_HEX_TARGETS; count++) {
        hexNewEnemy(simulation, side, hex.slot, incantation)
      }
    }
  }
}

function grantIncantationGold(side: IncantationSide, gold: number) {
  if (!side.canEarnRewards) return
  side.player.addMoney(gold, true, null)
  if (side.player.ghostIncantationsRef) {
    side.player.ghostIncantationsRef.goldEarned += gold
  }
}

export function triggerRitual(
  simulation: Simulation,
  side: IncantationSide | undefined,
  trigger: RitualTrigger,
  context: RitualContext
) {
  if (!side?.ritual || side.ritual.cause !== trigger) return
  activateRitual(simulation, side, side.ritual, trigger, context)
  if (
    side.fated?.effect === FatedRitual.ECHO &&
    chance(FATED_ECHO_CHANCE / 100, context.source)
  ) {
    activateRitual(simulation, side, side.ritual, trigger, context)
  }

  side.ritualActivations++
  if (
    side.fated?.effect === FatedRitual.RESURRECT &&
    side.ritualActivations % FATED_RESURRECT_ACTIVATIONS[trigger] === 0
  ) {
    const strongestAlly = getStrongestUnit(
      getTeamEntities(simulation, side.team).filter(
        (ally) => !ally.status.resurrection
      )
    )
    strongestAlly?.status.addResurrection(strongestAlly)
  }
  if (
    side.fated?.effect === FatedRitual.SPAWN_GHOST &&
    side.canEarnRewards &&
    chance(FATED_SPAWN_GHOST_CHANCE[trigger] / 100, context.source)
  ) {
    benchRandomGhost(side.player)
  }
}

function activateRitual(
  simulation: Simulation,
  side: IncantationSide,
  ritual: GhostIncantation,
  trigger: RitualTrigger,
  context: RitualContext
) {
  const strength = side.ritualStrength
  const allies = getTeamEntities(simulation, side.team)
  const ghostAllies = allies.filter((ally) => ally.types.has(Synergy.GHOST))
  const enemies = getTeamEntities(simulation, getOpposingTeam(side.team))
  const effect = ritual.effect as RitualEffect

  if (effect === RitualEffect.SILENCE) {
    silenceEnemies(trigger, strength, enemies, context)
  } else {
    const value = RITUAL_EFFECT_VALUES[effect][trigger][strength]
    if (effect === RitualEffect.GHOST_LUCK) {
      ghostAllies.forEach((ally) => ally.addLuck(value, ally, 0, false))
    } else if (effect === RitualEffect.ENEMY_LUCK_LOSS) {
      const curser = getCurser(simulation, side)
      if (curser) {
        enemies.forEach((enemy) => enemy.addLuck(-value, curser, 0, false))
      }
    } else if (effect === RitualEffect.GHOST_SPEED) {
      ghostAllies.forEach((ally) => ally.addSpeed(value, ally, 0, false))
    } else if (effect === RitualEffect.GHOST_PP) {
      ghostAllies.forEach((ally) => ally.addPP(value, ally, 0, false))
    } else if (effect === RitualEffect.GHOST_MAX_HP) {
      ghostAllies.forEach((ally) => ally.addMaxHP(value, ally, 0, false))
    }
  }

  const rewardMultiplier =
    side.fated?.effect === FatedRitual.DOUBLE_REWARDS ? 2 : 1
  const bonus = ritual.bonus as RitualBonus
  if (bonus === RitualBonus.GOLD_CHANCE) {
    const { chance: goldChance, gold } = RITUAL_GOLD_CHANCE_VALUES[trigger]
    if (chance(goldChance[strength] / 100, context.source)) {
      grantIncantationGold(side, gold[strength] * rewardMultiplier)
    }
    return
  }

  const ownUnits = allies.filter(
    (ally) => ally.player === side.player && !ally.isSpawn
  )
  const value = RITUAL_BONUS_VALUES[bonus][trigger][strength] * rewardMultiplier
  const highestBy = (score: (ally: PokemonEntity) => number) => {
    const highest = Math.max(...ownUnits.map(score))
    return pickRandomIn(ownUnits.filter((ally) => score(ally) === highest))
  }
  if (bonus === RitualBonus.PERMANENT_HP) {
    const ally = highestBy((unit) => unit.maxHP)
    ally?.addMaxHP(value, ally, 0, false, true)
  } else if (bonus === RitualBonus.PERMANENT_PP) {
    const ally = highestBy((unit) => unit.ap)
    if (ally) {
      ally.addPP(value, ally, 0, false)
      const boardPokemon = ally.refToBoardPokemon as Pokemon
      if (!ally.isGhostOpponent) boardPokemon.addPP(value)
    }
  } else if (bonus === RitualBonus.PERMANENT_SPEED) {
    const ally = highestBy((unit) => unit.atk)
    ally?.addSpeed(value, ally, 0, false, true)
  }
}

function silenceEnemies(
  trigger: RitualTrigger,
  strength: number,
  enemies: PokemonEntity[],
  context: RitualContext
) {
  const { targets, seconds } = RITUAL_SILENCE_VALUES[trigger]
  const duration = seconds[strength] * 1000
  const silence = (enemy: PokemonEntity) =>
    enemy.status.triggerSilence(duration, enemy, context.source)

  if (trigger === RitualTrigger.GHOST_CASTS) {
    context.enemiesDamagedByCast?.forEach(silence)
  } else if (trigger === RitualTrigger.GHOST_ATTACKS) {
    if (context.target && context.target.hp > 0) silence(context.target)
  } else if (context.origin) {
    const origin = context.origin
    const distanceToOrigin = (enemy: PokemonEntity) =>
      distanceC(
        enemy.positionX,
        enemy.positionY,
        origin.positionX,
        origin.positionY
      )
    enemies
      .filter((enemy) => !enemy.status.silence)
      .sort((a, b) => distanceToOrigin(a) - distanceToOrigin(b))
      .slice(0, targets[strength])
      .forEach(silence)
  }
}

function benchRandomGhost(player: Player) {
  const x = getFirstAvailablePositionInBench(
    player.board,
    getBenchSize(player.blessings)
  )
  if (x === null) return
  const rarity = randomWeighted(FATED_SPAWN_RARITY_WEIGHTS)
  if (!rarity) return
  const ghosts = PRECOMPUTED_POKEMONS_PER_TYPE_AND_CATEGORY[Synergy.GHOST]
  const candidates = [
    ...(ghosts?.pokemons ?? []),
    ...(ghosts?.additionalPokemons ?? [])
  ].filter((pkm) => {
    const data = getPokemonData(pkm as Pkm)
    return data.stars === 1 && data.rarity === (rarity as Rarity)
  }) as Pkm[]
  const name = pickRandomIn(candidates)
  if (!name) return
  const pokemon = PokemonFactory.createPokemonFromName(name, player)
  pokemon.positionX = x
  pokemon.positionY = 0
  player.board.set(pokemon.id, pokemon)
}
