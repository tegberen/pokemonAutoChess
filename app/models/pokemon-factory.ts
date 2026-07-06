import { MapSchema } from "@colyseus/schema"
import { Emotion, type IPlayer, type PkmCustom } from "../types"
import { Ability } from "../types/enum/Ability"
import type { Stat } from "../types/enum/Game"
import { Pkm, PkmFamily, PkmIndex } from "../types/enum/Pokemon"
import { type TownEncounter, TownEncounters } from "../types/enum/TownEncounter"

import { isOnBench } from "../utils/board"
import { logger } from "../utils/logger"
import type Player from "./colyseus-models/player"
import { Pokemon, PokemonClasses } from "./colyseus-models/pokemon"
import { getPkmWithCustom } from "./colyseus-models/pokemon-customs"
import {
  DOUBLE_UP_PVE_HP_BIAS,
  DOUBLE_UP_PVE_MAX_SCALE,
  DOUBLE_UP_PVE_MIN_SCALE,
  DOUBLE_UP_PVE_STAGE_TUNING,
  getDoubleUpPvePowerFactor,
  type PVEStage
} from "./pve-stages"

export default class PokemonFactory {
  static makePveBoard(
    pveStage: PVEStage,
    shinyEncounter: boolean,
    townEncounter: TownEncounter | null
  ): MapSchema<Pokemon> {
    const pokemons = new MapSchema<Pokemon>()
    pveStage.board.forEach(([pkm, x, y], index) => {
      const pokemon = PokemonFactory.createPokemonFromName(pkm, {
        emotion: pveStage.emotion ?? Emotion.NORMAL,
        shiny: shinyEncounter
      })
      pokemon.positionX = x
      pokemon.positionY = y
      for (const stat in pveStage.statBoosts) {
        pokemon.applyStat(stat as Stat, pveStage.statBoosts[stat])
      }
      if (
        townEncounter === TownEncounters.MAROWAK &&
        pveStage.marowakItems &&
        index in pveStage.marowakItems
      ) {
        pveStage.marowakItems[index]!.forEach((item) => pokemon.items.add(item))
      }
      pokemons.set(pokemon.id, pokemon)
    })
    return pokemons
  }

  /**
   * In Double Up, both players of a team fight the PVE encounter together,
   * so the encounter is scaled to the combined raw-stat power of the two
   * boards.
   */
  static scalePveBoardForDoubleUp(
    pokemons: MapSchema<Pokemon>,
    players: Player[],
    stageLevel: number
  ) {
    const teamPower = (units: Pokemon[]): number => {
      let totalHP = 0
      let totalDPS = 0
      for (const unit of units) {
        const itemFactor = 1 + 0.4 * unit.items.size
        totalHP += unit.hp * itemFactor
        totalDPS += unit.atk * unit.speed * itemFactor
      }
      return totalHP * totalDPS
    }

    const playerUnits: Pokemon[] = []
    players.forEach((player) =>
      player.board.forEach((pokemon) => {
        if (!isOnBench(pokemon)) playerUnits.push(pokemon)
      })
    )
    const playersPower = teamPower(playerUnits)
    const pvePower = teamPower([...pokemons.values()])
    if (playersPower <= 0 || pvePower <= 0) return

    const scale =
      Math.min(
        DOUBLE_UP_PVE_MAX_SCALE,
        Math.max(
          DOUBLE_UP_PVE_MIN_SCALE,
          Math.sqrt(
            (getDoubleUpPvePowerFactor(stageLevel) * playersPower) / pvePower
          )
        )
      ) * (DOUBLE_UP_PVE_STAGE_TUNING[stageLevel] ?? 1)
    const hpScale = Math.pow(scale, DOUBLE_UP_PVE_HP_BIAS)
    const atkScale = Math.pow(scale, 2 - DOUBLE_UP_PVE_HP_BIAS)

    const hpScalingAbilities: Ability[] = [Ability.SCHOOLING]

    pokemons.forEach((pokemon) => {
      pokemon.addMaxHP(Math.round(pokemon.hp * (hpScale - 1)))
      pokemon.addAttack(Math.round(pokemon.atk * (atkScale - 1)))
      if (hpScalingAbilities.includes(pokemon.skill)) {
        pokemon.addAbilityPower(Math.round(100 * (1 / hpScale - 1)))
      }
    })
  }

  static createPokemonFromName(
    name: Pkm,
    custom?: PkmCustom | Player
  ): Pokemon {
    let shiny = false
    let emotion = Emotion.NORMAL
    if (custom && "pokemonCustoms" in custom) {
      const pkmWithCustom = getPkmWithCustom(
        PkmIndex[name],
        (custom as IPlayer).pokemonCustoms
      )
      shiny = pkmWithCustom.shiny ?? false
      emotion = pkmWithCustom.emotion ?? Emotion.NORMAL
    } else if (custom) {
      shiny = custom.shiny ?? false
      emotion = custom.emotion ?? Emotion.NORMAL
    }
    if (name in PokemonClasses) {
      const PokemonClass = PokemonClasses[name]
      const pokemon = new PokemonClass(name, shiny, emotion)
      pokemon.postConstructor()      
      return pokemon
    } else {
      logger.warn(`No pokemon with name "${name}" found, return MissingNo`)
      return new Pokemon(Pkm.DEFAULT, shiny, emotion)
    }
  }
}

export function getPokemonBaseline(name: Pkm) {
  switch (name) {
    case Pkm.VAPOREON:
    case Pkm.JOLTEON:
    case Pkm.FLAREON:
    case Pkm.ESPEON:
    case Pkm.UMBREON:
    case Pkm.LEAFEON:
    case Pkm.SYLVEON:
    case Pkm.GLACEON:
      return Pkm.EEVEE
    case Pkm.SHEDINJA:
      return Pkm.NINCADA
    case Pkm.WORMADAM_PLANT:
      return Pkm.BURMY_PLANT
    case Pkm.WORMADAM_SANDY:
      return Pkm.BURMY_SANDY
    case Pkm.WORMADAM_TRASH:
      return Pkm.BURMY_TRASH
    case Pkm.FLABEBE_BLUE:
    case Pkm.FLABEBE_ORANGE:
    case Pkm.FLABEBE_YELLOW:
    case Pkm.FLABEBE_WHITE:
    case Pkm.FLOETTE_BLUE:
    case Pkm.FLOETTE_ORANGE:
    case Pkm.FLOETTE_YELLOW:
    case Pkm.FLOETTE_WHITE:
    case Pkm.FLORGES_BLUE:
    case Pkm.FLORGES_ORANGE:
    case Pkm.FLORGES_YELLOW:
    case Pkm.FLORGES_WHITE:
      return Pkm.FLABEBE

    default:
      if (PkmFamily[name] === Pkm.UNOWN_A) {
        return name
      }
      return PkmFamily[name]
  }
}

export function isSameFamily(pkm1: Pkm, pkm2: Pkm): boolean {
  return getPokemonBaseline(pkm1) === getPokemonBaseline(pkm2)
}
