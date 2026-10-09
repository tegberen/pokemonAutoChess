import { SynergyTiersThresholds } from "../config"
import {
  FATED_DOOM_DELAY,
  FATED_ECHO_CHANCE,
  FATED_RESURRECT_ACTIVATIONS,
  FATED_SPAWN_GHOST_CHANCE,
  FATED_SPAWN_RARITY_WEIGHTS,
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
  RITUAL_PERMANENT_STAT_CAP,
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
import { Item } from "../types/enum/Item"
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
  goldPaidHexSlots: Set<number>
  doomedHexSlots: Set<number>
}

export interface Hex {
  side: IncantationSide
  slot: number
  incantation: GhostIncantation
}

interface RitualContext {
  source?: PokemonEntity
  target?: PokemonEntity
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
    ritualActivations: 0,
    goldPaidHexSlots: new Set(),
    doomedHexSlots: new Set()
  }
}

// the owner, not the current team: a charmed GHOST still feeds its own ritual
function getOwner(entity: PokemonEntity) {
  if (entity.sourcePlayer) return entity.sourcePlayer
  // a Double Up summon made outside a cast could belong to either partner
  if (
    entity.isSpawn &&
    entity.baseTeam === Team.BLUE_TEAM &&
    entity.simulation.bluePartnerPlayer
  ) {
    return undefined
  }
  return entity.baseTeam === Team.BLUE_TEAM
    ? entity.simulation.bluePlayer
    : entity.simulation.redPlayer
}

export function getIncantationSideOf(entity: PokemonEntity) {
  const owner = getOwner(entity)
  return owner ? entity.simulation.incantationSides.get(owner.id) : undefined
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
  const ownAllies = allies.filter((ally) => getOwner(ally) === side.player)
  return (
    ownAllies.find((ally) => ally.types.has(Synergy.GHOST)) ??
    ownAllies[0] ??
    allies[0]
  )
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
  const target = getStrongestUnit(
    candidates.filter((enemy) => score(enemy) === highestScore)
  )
  const curser = getCurser(simulation, side)
  if (!target || !curser) return
  applyHex(side, slot, incantation, target, curser, getReaper(simulation, side))
}

// resurrect() rebuilds these stats, so they are applied again after a revive
// only applyHex passes a REAP reaper, so re-applying after a revive never pays
// it twice
function applyHexStatLoss(
  side: IncantationSide,
  incantation: GhostIncantation,
  target: PokemonEntity,
  curser: PokemonEntity,
  reaper?: PokemonEntity
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
      reaper?.addDefense(value, reaper, 0, false)
      reaper?.addSpecialDefense(value, reaper, 0, false)
    } else if (cause === HexingTarget.HIGHEST_AP) {
      target.addAbilityPower(-value, curser, 0, false)
      reaper?.addAbilityPower(value, reaper, 0, false)
    } else if (cause === HexingTarget.HIGHEST_ATK) {
      const atkLoss = isPercent ? Math.round((target.atk * value) / 100) : value
      target.addAttack(-atkLoss, curser, 0, false)
      reaper?.addAttack(atkLoss, reaper, 0, false)
    } else if (cause === HexingTarget.HIGHEST_SPEED) {
      target.addSpeed(-value, curser, 0, false)
      reaper?.addSpeed(value, reaper, 0, false)
    }
  } else if (loss === HexingLoss.LUCK) {
    const luckLoss = HEXING_LOSS_VALUES[loss][strength]
    target.addLuck(-luckLoss, curser, 0, false)
    reaper?.addLuck(luckLoss, reaper, 0, false)
  } else if (loss === HexingLoss.MAX_HP) {
    const hpLoss = Math.round(
      (target.maxHP * HEXING_LOSS_VALUES[loss][strength]) / 100
    )
    target.addMaxHP(-hpLoss, curser, 0, false)
    reaper?.addMaxHP(hpLoss, reaper, 0, false)
  }
}

function getReaper(simulation: Simulation, side: IncantationSide) {
  if (side.fated?.cause !== FatedHexing.REAP) return undefined
  return getStrongestUnit(
    getTeamEntities(simulation, side.team).filter(
      (ally) =>
        ally.types.has(Synergy.GHOST) &&
        getOwner(ally) === side.player &&
        !ally.isSpawn
    )
  )
}

export function reapplyHexStatLosses(
  simulation: Simulation,
  target: PokemonEntity
) {
  for (const hex of target.hexes) {
    const curser = getCurser(simulation, hex.side)
    if (curser) applyHexStatLoss(hex.side, hex.incantation, target, curser)
  }
}

function applyHex(
  side: IncantationSide,
  slot: number,
  incantation: GhostIncantation,
  target: PokemonEntity,
  curser: PokemonEntity,
  reaper?: PokemonEntity
) {
  applyHexStatLoss(side, incantation, target, curser, reaper)
  if (incantation.effect === HexingLoss.MAX_PP) {
    const increase = HEXING_LOSS_VALUES[HexingLoss.MAX_PP][side.hexingStrength]
    target.maxPP = Math.min(
      255,
      Math.round((target.maxPP * (100 + increase)) / 100)
    )
    if (reaper) {
      reaper.maxPP = Math.round((reaper.maxPP * (100 - increase)) / 100)
    }
  }

  const status = incantation.bonus as HexingStatus
  triggerHexStatus(target, status, INCANTATION_STATUS_DURATION)
  if (side.fated?.cause === FatedHexing.PLAGUE) {
    target.simulation.board
      .getAdjacentCells(target.positionX, target.positionY)
      .forEach(({ value: neighbour }) => {
        if (!neighbour || neighbour.team !== target.team) return
        neighbour.plagueHexStatuses.add(status)
        triggerHexStatus(neighbour, status, INCANTATION_STATUS_DURATION)
      })
  }
  target.hexes.push({ side, slot, incantation })
  if (slot === 0) target.status.curseVulnerability = true
  else target.status.curseWeakness = true

  if (
    side.fated?.cause === FatedHexing.DOOM &&
    !side.doomedHexSlots.has(slot)
  ) {
    side.doomedHexSlots.add(slot)
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

// hex and plague statuses come back after a cleanse, like the old curses
export function reapplyHexStatuses(target: PokemonEntity) {
  const reapply = (status: HexingStatus) => {
    if (!hasHexStatus(target, status)) {
      triggerHexStatus(target, status, INCANTATION_STATUS_DURATION)
    }
  }
  for (const hex of target.hexes) reapply(hex.incantation.bonus as HexingStatus)
  target.plagueHexStatuses.forEach(reapply)
  if (target.status.curseFate && !target.status.curse) {
    target.status.triggerCurse(FATED_DOOM_DELAY, target)
  }
}

export function onHexedEnemyKnockedOut(enemy: PokemonEntity) {
  for (const hex of enemy.hexes) {
    const { side, incantation } = hex
    if (
      incantation.effect === HexingLoss.GOLD_ON_KO &&
      !enemy.isSpawn &&
      !side.goldPaidHexSlots.has(hex.slot)
    ) {
      side.goldPaidHexSlots.add(hex.slot)
      const reapMultiplier = side.fated?.cause === FatedHexing.REAP ? 2 : 1
      grantIncantationGold(
        side,
        HEXING_LOSS_VALUES[HexingLoss.GOLD_ON_KO][side.hexingStrength] *
          reapMultiplier
      )
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
    benchRandomGhost(simulation, side.player)
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
  const ghostAllies = allies.filter(
    (ally) => ally.types.has(Synergy.GHOST) && getOwner(ally) === side.player
  )
  const enemies = getTeamEntities(simulation, getOpposingTeam(side.team))
  const effect = ritual.effect as RitualEffect

  if (effect === RitualEffect.SILENCE) {
    silenceEnemies(simulation.board, trigger, strength, enemies, context)
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
  const highestBy = (
    units: PokemonEntity[],
    score: (ally: PokemonEntity) => number
  ) => {
    const highest = Math.max(...units.map(score))
    return getStrongestUnit(units.filter((ally) => score(ally) === highest))
  }
  if (bonus === RitualBonus.PERMANENT_HP) {
    const ally = highestBy(
      ownUnits.filter((unit) => getPermanentHPRoom(unit) > 0),
      (unit) => unit.maxHP
    )
    if (ally) {
      const gain = fitGainToRoom(ally, value, getPermanentHPRoom(ally))
      ally.addMaxHP(gain, ally, 0, false, true)
      if (!ally.isGhostOpponent) {
        const boardPokemon = ally.refToBoardPokemon as Pokemon
        boardPokemon.ghostRitualHPGained += withBeltBonus(ally, gain)
      }
    }
  } else if (bonus === RitualBonus.PERMANENT_PP) {
    const ally = highestBy(
      ownUnits.filter((unit) => getPermanentPPRoom(unit) > 0),
      (unit) => unit.ap
    )
    if (ally) {
      const gain = Math.min(value, getPermanentPPRoom(ally))
      ally.addPP(gain, ally, 0, false)
      const boardPokemon = ally.refToBoardPokemon as Pokemon
      if (!ally.isGhostOpponent) {
        boardPokemon.addPP(gain)
        boardPokemon.ghostRitualPPGained += gain
      }
    }
  } else if (bonus === RitualBonus.PERMANENT_SPEED) {
    const ally = highestBy(
      ownUnits.filter((unit) => getPermanentSpeedRoom(unit) > 0),
      (unit) => unit.atk
    )
    if (ally) {
      const gain = fitGainToRoom(ally, value, getPermanentSpeedRoom(ally))
      ally.addSpeed(gain, ally, 0, false, true)
      if (!ally.isGhostOpponent) {
        const boardPokemon = ally.refToBoardPokemon as Pokemon
        boardPokemon.ghostRitualSpeedGained += withBeltBonus(ally, gain)
      }
    }
  }
}

// Big Eater Belt adds 25% on top, so the cap is checked on what really lands.
// The SPEED a Melmetal turns into ATK still counts, or its gains never stop
function withBeltBonus(unit: PokemonEntity, value: number) {
  return unit.items.has(Item.BIG_EATER_BELT) ? Math.floor(value * 1.25) : value
}

function fitGainToRoom(unit: PokemonEntity, value: number, room: number) {
  let gain = Math.min(value, room)
  while (gain > 0 && withBeltBonus(unit, gain) > room) gain--
  return gain
}

function getPermanentHPRoom(unit: PokemonEntity) {
  const boardPokemon = unit.refToBoardPokemon as Pokemon
  return (
    Math.floor(getPokemonData(unit.name).hp * RITUAL_PERMANENT_STAT_CAP) -
    boardPokemon.ghostRitualHPGained
  )
}

function getPermanentPPRoom(unit: PokemonEntity) {
  const boardPokemon = unit.refToBoardPokemon as Pokemon
  return (
    Math.floor(boardPokemon.maxPP * RITUAL_PERMANENT_STAT_CAP) -
    boardPokemon.ghostRitualPPGained
  )
}

function getPermanentSpeedRoom(unit: PokemonEntity) {
  const boardPokemon = unit.refToBoardPokemon as Pokemon
  return (
    Math.floor(unit.baseSpeed * RITUAL_PERMANENT_STAT_CAP) -
    boardPokemon.ghostRitualSpeedGained
  )
}

function getEnemiesInLineBehindTarget(
  board: Board,
  source: PokemonEntity,
  target: PokemonEntity
) {
  const stepX = Math.sign(target.positionX - source.positionX)
  const stepY = Math.sign(target.positionY - source.positionY)
  const enemiesBehindTarget: PokemonEntity[] = []
  if (stepX === 0 && stepY === 0) return enemiesBehindTarget
  for (
    let x = target.positionX + stepX, y = target.positionY + stepY;
    board.isOnBoard(x, y);
    x += stepX, y += stepY
  ) {
    const entity = board.getEntityOnCell(x, y)
    if (entity && entity.team === target.team && entity.hp > 0) {
      enemiesBehindTarget.push(entity)
    }
  }
  return enemiesBehindTarget
}

function silenceEnemies(
  board: Board,
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
    // the farthest back first, like Sing
    enemies
      .sort((a, b) =>
        a.team === Team.BLUE_TEAM
          ? a.positionY - b.positionY
          : b.positionY - a.positionY
      )
      .slice(0, targets[strength])
      .forEach(silence)
  } else if (trigger === RitualTrigger.GHOST_ATTACKS) {
    if (context.source && context.target) {
      getEnemiesInLineBehindTarget(
        board,
        context.source,
        context.target
      ).forEach(silence)
    }
  } else if (context.origin) {
    const origin = context.origin
    const distanceToOrigin = (enemy: PokemonEntity) =>
      distanceC(
        enemy.positionX,
        enemy.positionY,
        origin.positionX,
        origin.positionY
      )
    const isAdjacentToOrigin = (enemy: PokemonEntity) =>
      trigger !== RitualTrigger.ENEMY_KOD || distanceToOrigin(enemy) <= 1
    enemies
      .filter((enemy) => !enemy.status.silence && isAdjacentToOrigin(enemy))
      .sort((a, b) => distanceToOrigin(a) - distanceToOrigin(b))
      .slice(0, targets[strength])
      .forEach(silence)
  }
}

function benchRandomGhost(simulation: Simulation, player: Player) {
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
  pokemon.onAcquired(player)
  simulation.room?.checkEvolutionsAfterPokemonAcquired(player.id)
}
