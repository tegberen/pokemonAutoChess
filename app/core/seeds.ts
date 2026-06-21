import { EffectEnum } from "../types/enum/Effect"
import { type Seeds, Item, ItemComponents } from "../types/enum/Item"
import { Synergy } from "../types/enum/Synergy"
import { AttackType, Team } from "../types/enum/Game"
import { chance, pickNRandomIn, pickRandomIn } from "../utils/random"
import {
  type Effect,
  OnSpawnEffect,
  OnSkyDiveAttackEffect,
  OnSimulationStartEffect,
  OnKillEffect
} from "./effects/effect"
import { PokemonEntity } from "./pokemon-entity"
import PokemonFactory from "../models/pokemon-factory"
import { Pkm } from "../types/enum/Pokemon"
import { Transfer } from "../types"
import { DungeonPMDO } from "../types/enum/Dungeon"
import { WandererType, WandererBehavior } from "../types/enum/Wanderer"
import { DelayedCommand } from "./simulation-command"

export const SeedEffects: Record<(typeof Seeds)[number], Effect[]> = {
  // ---- Group 1: CC seeds, 300% Sky Dive damage + status on user & target ----

  // "BAN_SEED": "All Sky Dive attacks deal 300% of user ATK. The user and the target are SILENCE for 3s."
  BAN_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, target }) => {
      target.status.triggerSilence(3000, target, pokemon)
      pokemon.status.triggerSilence(3000, pokemon, pokemon)
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
      pokemon.status.triggerSleep(3000, pokemon)
    })
  ],

  // "STUN_SEED": "All Sky Dive attacks deal 300% of user ATK. The user and the target are PARALYSIS for 3s."
  STUN_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, target }) => {
      target.status.triggerParalysis(3000, target, pokemon)
      pokemon.status.triggerParalysis(3000, pokemon, pokemon)
    })
  ],

  // "TOTTER_SEED": "All Sky Dive attacks deal 300% of user ATK. The user and the target are CONFUSION for 3s."
  TOTTER_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, target }) => {
      target.status.triggerConfusion(3000, target, pokemon)
      pokemon.status.triggerConfusion(3000, pokemon, pokemon)
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
      entity.addMaxHP(5 * freeAdjacent, entity, 0, false)
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
      entity.addSpeed(3 * freeAdjacent, entity, 0, false)
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
        entity.addDefense(entity.baseDef * 2, entity, 0, false)
      } else if (entity.positionY === midRow) {
        entity.addSpecialDefense(entity.baseSpeDef, entity, 0, false)
      } else if (entity.positionY === backRow) {
        entity.addAttack(0.5 * entity.baseAtk, entity, 0, false)
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

  // "BLAST_SEED": "At the start of the fight, all allies gain 100% of the users base ATK and are BURN for the rest of the fight."
  BLAST_SEED: [
    new OnSpawnEffect((entity, player, isSpawn) => {
      if (!entity.types.has(Synergy.FLYING)) return
      entity.addAttack(entity.baseAtk, entity, 0, false)
      entity.status.triggerBurn(300000, entity, entity)
    })
  ],

  // ---- Group 4: team-wide Sky Dive modifiers ----


  // "EYEDROP_SEED": "All allies gain +2 RANGE. Sky Dive attacks FLINCH the target for 5s."
  EYEDROP_SEED: [
    new OnSimulationStartEffect(({ entity }) => {
      entity.range += 2
    }),
    new OnSkyDiveAttackEffect(({ pokemon, target }) => {
      target.status.triggerFlinch(5000, target, pokemon)
    })
  ],

  // "HEAL_SEED": "All Sky Dive attacks grant the user SHIELD equal to 100% of the damage dealt." note: PROTECT pokemon cannot heal, thus SHIELD
  HEAL_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, damage }) => {
      pokemon.addShield(damage * 1.5, pokemon, 0, false)
    })
  ],

  // "PURE_SEED": "After the Sky Dive attacks, allies gain RUNE_PROTECT for the rest of the fight 
  PURE_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon }) => {
      pokemon.status.triggerRuneProtect(300000, pokemon, pokemon)
    })
  ],

  // "TRAINING_SEED": "Flying allies gain 3 ATK, 5 SPEED and 10 max HP for each of their own KOs."
  TRAINING_SEED: [
    new OnKillEffect(({ attacker }) => {
      if (!attacker.types.has(Synergy.FLYING)) return
      attacker.addAttack(3, attacker, 0, false, true)
      attacker.addSpeed(5, attacker, 0, false, true)
      attacker.addMaxHP(10, attacker, 0, false, true)
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
      if (attacker.player && chance(0.3, attacker)) { 
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
      pickNRandomIn(allies, 3).forEach((ally) => {
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
        ally.addSpeed(0.5 * ally.speed, ally, 0, false)
        ally.addAttack(0.5 * ally.atk, ally, 0, false)
      })
    })
  ],

  // "WARP_SEED": "After the Sky Dive attack of the STRONGEST ally, change the opponents region."
  WARP_SEED: [
    new OnSkyDiveAttackEffect(({ pokemon, target }) => {
      if (!pokemon.isStrongestAllyThisFight) return
      const opponent = target.player
      if (!opponent) return
      const room = pokemon.simulation.room
      const previousMap = opponent.map
      const maps = Object.values(DungeonPMDO).filter((m) => m !== previousMap)
      const newMap = pickRandomIn(maps)
      room.broadcast(Transfer.PRELOAD_MAPS, [newMap])
      opponent.spawnWanderingPokemon({
        pkm: Pkm.LAPRAS,
        type: WandererType.DIALOG,
        behavior: WandererBehavior.SPECTATE,
        data: newMap
      })
      room.clock.setTimeout(() => {
        opponent.map = newMap
        opponent.regions.push(newMap)
        opponent.updateRegionalPool(room.state, true, previousMap)
      }, 10000)
    })
  ],
  // ---- Group 6: misc ----

  // "PLAIN_SEED":  lowroll sad bear
  PLAIN_SEED: [],
  // "EMPOWERMENT_SEED":  -> checked in pokemon-entity.ts fly away
  EMPOWERMENT_SEED: [],
  // "DECOY_SEED": -> checked in pokemon-entity.ts fly away
  DECOY_SEED: []

}
