import Player from "../models/colyseus-models/player"
import { Blessing } from "../types/enum/Blessing"
import { EffectEnum } from "../types/enum/Effect"
import { Rarity, Team } from "../types/enum/Game"
import { type Seeds, CraftableNoStonesOrScarves, Item, ItemComponents, ItemComponentsNoScarf } from "../types/enum/Item"
import { Synergy } from "../types/enum/Synergy"
import { chance, pickNRandomIn, pickRandomIn } from "../utils/random"
import { schemaValues } from "../utils/schemas"
import {
  type Effect,
  OnKillEffect,
  OnSimulationStartEffect,
  OnSkyDiveAttackEffect,
  OnSpawnEffect
} from "./effects/effect"
import { PokemonEntity } from "./pokemon-entity"

export const SeedEffects: Record<(typeof Seeds)[number], Effect[]> = {
  // ---- Group 1: CC seeds, 300% Sky Dive damage + status on user & target ----

  // "BAN_SEED": "All Sky Dive attacks deal 300% of user ATK. The user and the target are SILENCE for 3s."
  BAN_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, target }) => {
      target.status.triggerSilence(3000, target, pokemon)
    })
  ],

  // "BLINKER_SEED": "All Sky Dive attacks deal 300% of user ATK. Apply smoke to the target and ADJACENT tiles. Pokemon in the smoke are BLINDED."
  BLINKER_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, target, board }) => {
      board.addBoardEffect(
        target.positionX,
        target.positionY,
        EffectEnum.SMOKE,
        pokemon.simulation
      )
      board
        .getAdjacentCells(target.positionX, target.positionY)
        .forEach((cell) => {
          board.addBoardEffect(
            cell.x,
            cell.y,
            EffectEnum.SMOKE,
            pokemon.simulation
          )
        })
    })
  ],

  // "SLEEP_SEED": "All Sky Dive attacks deal 300% of user ATK. The user and the target are SLEEP for 3s."
  SLEEP_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, target }) => {
      target.status.triggerSleep(3000, target)
    })
  ],

  // "STUN_SEED": "All Sky Dive attacks deal 300% of user ATK. The user and the target are PARALYSIS for 3s."
  STUN_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, target }) => {
      target.status.triggerParalysis(3000, target, pokemon)
    })
  ],

  // "TOTTER_SEED": "All Sky Dive attacks deal 300% of user ATK. The user and the target are CONFUSION for 3s."
  TOTTER_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, target }) => {
      target.status.triggerConfusion(3000, target, pokemon)
    })
  ],

  // ---- Group 2: fight-start, scale by adjacent free tiles ----

  // "LIFE_SEED": "At the start of the fight, all allies gain 5 max HP for each ADJACENT free tile."
  LIFE_SEED: [
    new OnSimulationStartEffect(({ entity }) => {
      const adjacentCells = entity.simulation.board.getAdjacentCells(
        entity.positionX,
        entity.positionY
      )
      const freeAdjacent = adjacentCells.filter(
        (cell) => cell.value === undefined
      ).length
      entity.addMaxHP(10 * freeAdjacent, entity, 0, false)
    })
  ],

  // "QUICK_SEED": "At the start of the fight, each ally FLYING pokemon gain 3 SPEED for each ADJACENT free tile, that has no pokemon on it."
  QUICK_SEED: [
    new OnSimulationStartEffect(({ entity }) => {
      if (!entity.types.has(Synergy.FLYING)) {
        return
      }
      const adjacentCells = entity.simulation.board.getAdjacentCells(
        entity.positionX,
        entity.positionY
      )
      console.log(
        adjacentCells.length,
        adjacentCells.map((c) => ({ x: c.x, y: c.y, occupied: c.value !== undefined }))
      )
      const freeAdjacent = adjacentCells.filter(
        (cell) => cell.value === undefined
      ).length
      entity.addSpeed(5 * freeAdjacent, entity, 0, false)
    })
  ],


  // "ENERGY_SEED": "FLYING allies in the front row gain 100% of base DEF, middle row gain 100% of base SPE_DEF, back row gain 50% of base ATK."
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

  //	"DOOM_SEED": "At the start of the fight, a random ally Sky Dive attacks immediately with cursed energy. The target is CURSE and KO'd after 4s.",
  DOOM_SEED: [
    new OnSimulationStartEffect(({ entity, simulation }) => {
      if (!entity.isDoomSeedTarget) return
      const flyAwayCell = entity.flyAway(simulation.board, true, false)
      if (flyAwayCell?.target) {
        flyAwayCell.target.status.triggerCurse(4000, flyAwayCell.target)
      }
    })
  ],

  // ---- Group 3: fight-start, Flying-only ----

  // "BLAST_SEED": "At the start of the fight, all allies gain 150% of the users base ATK and are BURN for the rest of the fight."
  BLAST_SEED: [
    new OnSpawnEffect((entity, player, isSpawn) => {
      if (!entity.types.has(Synergy.FLYING)) return
      entity.addAttack(entity.baseAtk * 0.5, entity, 0, false)
      entity.status.triggerBurn(300000, entity, entity)
    })
  ],

  // ---- Group 4: team-wide Sky Dive modifiers ----


  // "EYEDROP_SEED": "All allies gain +2 RANGE. Sky Dive attacks FLINCH the target for 5s and gain 50 SPEED". -> up to 100 SPEED
  EYEDROP_SEED: [
    new OnSimulationStartEffect(({ entity }) => {
      entity.range += 3
    }),
    new OnSkyDiveAttackEffect(({ pokemon, target }) => {
      target.status.triggerFlinch(5000, target, pokemon)
      pokemon.addSpeed(20, pokemon, 0, false)
    })
  ],

  // "HEAL_SEED": "All Sky Dive attacks grant the user SHIELD equal to 100% of the damage dealt." note: PROTECT pokemon cannot heal, thus SHIELD
  HEAL_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, damage }) => {
      pokemon.addShield(damage * 2, pokemon, 0, false)
    })
  ],

  // "PURE_SEED": "After the Sky Dive attacks, allies gain RUNE_PROTECT for the rest of the fight 
  PURE_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon }) => {
      pokemon.status.triggerRuneProtect(300000, pokemon, pokemon)
      pokemon.addAbilityPower(50, pokemon, 0, false, false)
    })
  ],

  TRAINING_SEED: [
    new OnKillEffect(({ attacker }) => {
      if (!attacker.types.has(Synergy.FLYING)) return
      attacker.addAttack(1, attacker, 0, false, true)
      attacker.addSpeed(1, attacker, 0, false, true)
    })
  ],

  // "VIOLENT_SEED": "After the Sky Dive attacks, ENRAGE the allies for 2s."
  VIOLENT_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon }) => {
      if (!pokemon.types.has(Synergy.FLYING)) return
      pokemon.status.triggerRage(2000, pokemon)
    })
  ],

  // "JOY_SEED": "Flying allies grant the player 1 random component for each of their own KOs."
  JOY_SEED: [
    new OnKillEffect(({ attacker }) => {
      if (!attacker.types.has(Synergy.FLYING)) return
      if (attacker.player && chance(0.05, attacker)) { 
        attacker.player.items.push(pickRandomIn(ItemComponents))
      }
    })
  ],  // ---- Group 5: strongest-ally targeted ----


  // "REVIVER_SEED": "After the Sky Dive attack of the STRONGEST ally, give RESURRECTION to three random allied pokemon."
  REVIVER_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, board }) => {
      if (!pokemon.isStrongestAllyThisFight) return
      const allies = board.cells.filter(
        (c): c is PokemonEntity =>
          c instanceof PokemonEntity && c.team === pokemon.team
      )
      pickNRandomIn(allies, 2).forEach((ally) => {
        ally.status.addResurrection(ally)
      })
    })
  ],

  // "TINY_REVIVER_SEED": "After the Sky Dive attack of the STRONGEST ally, give RESURRECTION to one random allied pokemon and raise the allies base SPEED, ATK by 50%"
  TINY_REVIVER_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, board }) => {
      if (!pokemon.isStrongestAllyThisFight) return
      const allies = board.cells.filter(
        (c): c is PokemonEntity =>
          c instanceof PokemonEntity && c.team === pokemon.team
      )
      pickNRandomIn(allies, 1).forEach((ally) => {
        ally.status.addResurrection(ally)
      })
      allies.forEach((ally) => {
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
      target.moveTo(farthestTarget.positionX, farthestTarget.positionY, board, true)
      target.status.triggerConfusion(1000, target, pokemon)
    })
  ],
  // ---- Group 6: misc ----

  // "PLAIN_SEED":  lowroll sad bear
  PLAIN_SEED: [],
  // "EMPOWERMENT_SEED":  -> checked in pokemon-entity.ts fly away
  EMPOWERMENT_SEED: [
    new OnSimulationStartEffect(({ entity }) => {
      entity.addCritPower(25, entity, 0, false)
    })  
  ],
  // "DECOY_SEED": -> checked in pokemon-entity.ts fly away
  DECOY_SEED: []

}

type ExplorerBonusRow = {
  nothing: number
  bigNugget: number
  nugget: number
  rustyCoin: number
  component: number
  fullItem: number
  sharpBeak: number
}

export const EXPLORER_BONUS_TABLE: Partial<Record<Rarity, ExplorerBonusRow>> = {
  [Rarity.COMMON]:    { nothing: 0.20, bigNugget: 0.1,  nugget: 0.30, rustyCoin: 0.40, component: 0,    fullItem: 0,    sharpBeak: 0    },
  [Rarity.UNCOMMON]:  { nothing: 0.20, bigNugget: 0,    nugget: 0.20, rustyCoin: 0.50, component: 0.05, fullItem: 0.05, sharpBeak: 0    },
  [Rarity.RARE]:      { nothing: 0.20, bigNugget: 0,    nugget: 0.10, rustyCoin: 0.50, component: 0.10, fullItem: 0.05, sharpBeak: 0.05 },
  [Rarity.EPIC]:      { nothing: 0.20, bigNugget: 0,    nugget: 0.05, rustyCoin: 0.45, component: 0.15, fullItem: 0.10, sharpBeak: 0.05 },
  [Rarity.ULTRA]:     { nothing: 0.20, bigNugget: 0,    nugget: 0,    rustyCoin: 0.35, component: 0.15, fullItem: 0.15, sharpBeak: 0.15 },
  [Rarity.UNIQUE]:    { nothing: 0.20, bigNugget: 0,    nugget: 0,    rustyCoin: 0.20, component: 0.20, fullItem: 0.10, sharpBeak: 0.30 },
  [Rarity.LEGENDARY]: { nothing: 0.20, bigNugget: 0,    nugget: 0,    rustyCoin: 0,    component: 0.20, fullItem: 0.10, sharpBeak: 0.50 },
  [Rarity.SPECIAL]:   { nothing: 0.20, bigNugget: 0,    nugget: 0,    rustyCoin: 0,    component: 0,    fullItem: 0.80, sharpBeak: 0    }
}

export function rollExplorerBonusReward(rarity: Rarity, player: Player): Item | null {
  const table = EXPLORER_BONUS_TABLE[rarity]
  if (!table) return null
  const roll = Math.random()
  let threshold = table.nothing
  /* BIG_PECKS blessing: the first Letter of the game skips the rarity roll
     entirely and always comes back with a Sharp Beak */
  if (
    player.blessings?.includes(Blessing.BIG_PECKS) &&
    !player.bigPecksSharpBeakGranted
  ) {
    player.bigPecksSharpBeakGranted = true
    return Item.SHARP_BEAK
  }

  if (roll < threshold) return null
  threshold += table.bigNugget
  if (roll < threshold) return Item.BIG_NUGGET
  threshold += table.nugget
  if (roll < threshold) return Item.NUGGET
  threshold += table.rustyCoin
  if (roll < threshold) return Item.COIN
  threshold += table.component
  if (roll < threshold) return pickRandomIn(ItemComponentsNoScarf)
  threshold += table.fullItem
  if (roll < threshold) return pickRandomIn(CraftableNoStonesOrScarves)
  const alreadyHasSharpBeak =
    player.items.includes(Item.SHARP_BEAK) ||
    schemaValues(player.board).some((p) => p.items.has(Item.SHARP_BEAK))
  return alreadyHasSharpBeak ? pickRandomIn(CraftableNoStonesOrScarves) : Item.SHARP_BEAK
}
