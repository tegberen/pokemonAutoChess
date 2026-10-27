import { SynergyTiers } from "../config/game/synergies"
import type Player from "../models/colyseus-models/player"
import type { Egg } from "../models/colyseus-models/pokemon"
import PokemonFactory from "../models/pokemon-factory"
import { getPokemonData } from "../models/precomputed/precomputed-pokemon-data"
import { PRECOMPUTED_POKEMONS_PER_RARITY } from "../models/precomputed/precomputed-rarity"
import type GameState from "../rooms/states/game-state"
import {
  BABY_OPENER_LIFE_PER_EGG,
  Blessing
} from "../types/enum/Blessing"
import { EvolutionRuleType } from "../types/EvolutionRules"
import { GamePhaseState, PokemonActionState } from "../types/enum/Game"
import { Pkm } from "../types/enum/Pokemon"
import { Synergy } from "../types/enum/Synergy"
import { getFirstAvailablePositionInBench,
  getBenchSize
} from "../utils/board"
import { healPlayerLife } from "../utils/player-life"
import { pickRandomIn } from "../utils/random"
import { schemaValues } from "../utils/schemas"
import { EvolutionManager } from "./evolution-logic/evolution-manager"
import { getHatchTime } from "./evolution-logic/hatch-time"

export function createRandomEgg(player: Player, shiny: boolean): Egg {
  const hatchList = PRECOMPUTED_POKEMONS_PER_RARITY.HATCH.filter(
    (p) => getPokemonData(p).stars === 1
  )
  const egg = PokemonFactory.createPokemonFromName(Pkm.EGG, { shiny }) as Egg
  egg.action = PokemonActionState.SLEEP
  egg.stacksRequired = getHatchTime(egg, player)

  if (player) {
    const remainingEggs = hatchList.filter(
      (p) => !player.randomEggsGiven.includes(p)
    )
    egg.evolution = pickRandomIn(
      remainingEggs.length > 0 ? remainingEggs : hatchList
    )
    player.randomEggsGiven.push(egg.evolution)
  } else {
    egg.evolution = pickRandomIn(hatchList)
  }

  return egg as Egg
}

export function giveRandomEgg(
  player: Player,
  shiny: boolean,
  state: GameState
): Egg | undefined {
  const egg = createRandomEgg(player, shiny)

  const x = getFirstAvailablePositionInBench(player.board, getBenchSize(player.blessings))
  if (x !== null) {
    egg.positionX = x
    egg.positionY = 0
    player.board.set(egg.id, egg)
    player.pokemonsPlayed.add(Pkm.EGG)
    if (player.blessings?.includes(Blessing.BABY_OPENER)) {
      healPlayerLife(player, BABY_OPENER_LIFE_PER_EGG, state)
    }
    if (
      SynergyTiers[Synergy.PRODIGY].some((effect) => player.effects.has(effect))
    ) {
      advanceHatchingPokemons(player, egg, state)
    }
    return egg
  }
}

function advanceHatchingPokemons(
  player: Player,
  newEgg: Egg,
  state: GameState
) {
  schemaValues(player.board).forEach((pokemon) => {
    if (pokemon === newEgg) return
    if (pokemon.evolutionRule.type !== EvolutionRuleType.HATCH) return
    // hatching mid-fight would swap out a unit the simulation still holds,
    // so the extra turn is banked and pays out at the next round start
    if (state.phase === GamePhaseState.FIGHT) {
      pokemon.stacks++
    } else {
      EvolutionManager.updateHatch(pokemon, player)
    }
  })
}
