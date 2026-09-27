import type Player from "../../models/colyseus-models/player"
import type { Pokemon } from "../../models/colyseus-models/pokemon"
import type { IPlayer } from "../../types"
import {
  type CountEvolutionRule,
  type EvolutionRule,
  EvolutionRuleType,
  type HatchEvolutionRule,
  type MoneyEvolutionRule,
  type PlacementEvolutionRule,
  type StackEvolutionRule,
  type StateEvolutionRule
} from "../../types/EvolutionRules"
import { PlayerChoice } from "../../models/colyseus-models/player-choice"
import {
  Blessing,
  CRYSTAL_GUARDIAN_ROCKS_GRANTED,
  HERO_BLESSING_FAMILY,
  SELECTIVE_GENETICS_SHINY_ITEM_OPTIONS
} from "../../types/enum/Blessing"
import { PokemonActionState } from "../../types/enum/Game"
import { Item, ShinyItems, WeatherRocks } from "../../types/enum/Item"
import { pickNRandomIn, pickRandomIn } from "../../utils/random"
import { Passive } from "../../types/enum/Passive"
import { Pkm, PkmFamily } from "../../types/enum/Pokemon"
import { OnEvolutionEffect } from "../effects/effect"
import { PassiveEffects } from "../effects/passives"
import { CountEvolutionHandler } from "./count-evolution-handler"
import type { EvolutionHandler } from "./evolution-handler"
import { HatchEvolutionHandler } from "./hatch-evolution-handler"
import { getHatchTime } from "./hatch-time"
import PokemonFactory from "../../models/pokemon-factory"
import {
  getBenchSize,
  getFirstAvailablePositionInBench
} from "../../utils/board"

const TOXTRICITY_OTHER_FORM: Partial<Record<Pkm, Pkm>> = {
  [Pkm.TOXTRICITY]: Pkm.TOXTRICITY_LOW_KEY,
  [Pkm.TOXTRICITY_LOW_KEY]: Pkm.TOXTRICITY
}
import { ItemEvolutionHandler } from "./item-evolution-handler"
import { MoneyEvolutionHandler } from "./money-evolution-handler"
import { PlacementEvolutionHandler } from "./placement-evolution-handler"
import { StackEvolutionHandler } from "./stack-evolution-handler"
import { StateEvolutionHandler } from "./state-evolution-handler"

export const EvolutionManager = {
  getHandler(evolutionRule: EvolutionRule): EvolutionHandler<any[]> {
    switch (evolutionRule.type) {
      case EvolutionRuleType.ITEM:
        return new ItemEvolutionHandler(evolutionRule)
      case EvolutionRuleType.STATE:
        return new StateEvolutionHandler(evolutionRule as StateEvolutionRule)
      case EvolutionRuleType.MONEY:
        return new MoneyEvolutionHandler(evolutionRule as MoneyEvolutionRule)
      case EvolutionRuleType.PLACEMENT:
        return new PlacementEvolutionHandler(
          evolutionRule as PlacementEvolutionRule
        )
      case EvolutionRuleType.HATCH:
        return new HatchEvolutionHandler(evolutionRule as HatchEvolutionRule)
      case EvolutionRuleType.STACK:
        return new StackEvolutionHandler(evolutionRule as StackEvolutionRule)
      case EvolutionRuleType.COUNT:
      default:
        return new CountEvolutionHandler(evolutionRule as CountEvolutionRule)
    }
  },

  tryEvolve(
    pokemon: Pokemon,
    player: Player,
    ...additionalArgs: unknown[]
  ): void | Pokemon {
    const handler = this.getHandler(pokemon.evolutionRule)
    if (handler.canEvolve(pokemon, player, ...additionalArgs)) {
      const pokemonEvolved = this.evolve(pokemon, player, ...additionalArgs)
      return pokemonEvolved
    }
  },

  evolve(
    pokemon: Pokemon,
    player: Player,
    ...additionalArgs: unknown[]
  ): Pokemon {
    // counted here rather than in tryEvolve so every rule type is included
    player.advanceBlessingQuest(Blessing.QUEST_EVOLVE_II)
    const handler = this.getHandler(pokemon.evolutionRule)
    const pokemonEvolved = handler.evolve(pokemon, player, ...additionalArgs)
    this.afterEvolve(pokemonEvolved, pokemon, player, ...additionalArgs)
    return pokemonEvolved
  },

  // a free promotion: the same COUNT handler asked for a single copy, so the
  // Pokemon evolves alone while keeping its cell, items and permanent stats
  evolveWithoutCopies(pokemon: Pokemon, player: Player): Pokemon | undefined {
    const rule = pokemon.evolutionRule
    const handler = new CountEvolutionHandler({
      type: EvolutionRuleType.COUNT,
      numberRequired: 1,
      divergentEvolution:
        rule.type === EvolutionRuleType.COUNT
          ? rule.divergentEvolution
          : undefined
    })
    // the handler consumes only what it recognises as a copy, so an Eviolite
    // holder or a locked unit would leave it nothing to evolve from
    if (!handler.countsAsCopy(pokemon, pokemon)) return
    player.advanceBlessingQuest(Blessing.QUEST_EVOLVE_II)
    const pokemonEvolved = handler.evolve(pokemon, player)
    this.afterEvolve(pokemonEvolved, pokemon, player)
    return pokemonEvolved
  },

  afterEvolve(
    pokemonEvolved: Pokemon,
    pokemonBeforeEvolution: Pokemon,
    player: Player,
    ...additionalArgs: unknown[]
  ) {
    player.updateSynergies()
    if (pokemonBeforeEvolution.supercharged) pokemonEvolved.supercharged = true // preserve supercharged state on evolution

    if (
      player.blessings?.includes(Blessing.SINNOHS_COOLEST) &&
      !player.sinnohsCoolestRewardGranted &&
      PkmFamily[pokemonEvolved.name] === Pkm.STARLY &&
      pokemonEvolved.stars >= 3
    ) {
      player.items.push(Item.SAFETY_GOGGLES)
      player.sinnohsCoolestRewardGranted = true
    }

    if (
      pokemonEvolved.name === Pkm.STEELIX &&
      player.blessings?.includes(Blessing.CRYSTAL_GUARDIAN) &&
      !player.crystalGuardianRocksGranted
    ) {
      player.crystalGuardianRocksGranted = true
      // collected rocks show up in the inventory as far as the ROCK tier allows
      for (let i = 0; i < CRYSTAL_GUARDIAN_ROCKS_GRANTED; i++) {
        player.weatherRocks.push(pickRandomIn(WeatherRocks))
      }
      player.updateWeatherRocks()
    }

    const otherToxtricityForm = TOXTRICITY_OTHER_FORM[pokemonEvolved.name]
    if (
      otherToxtricityForm &&
      player.blessings?.includes(Blessing.THUNDER_AND_LIGHTNING) &&
      !player.thunderAndLightningFormGranted
    ) {
      const freeBenchX = getFirstAvailablePositionInBench(
        player.board,
        getBenchSize(player.blessings)
      )
      // a full bench leaves the flag down, so the next Toxtricity still grants it
      if (freeBenchX !== null) {
        const otherForm = PokemonFactory.createPokemonFromName(
          otherToxtricityForm,
          player
        )
        otherForm.positionX = freeBenchX
        otherForm.positionY = 0
        player.board.set(otherForm.id, otherForm)
        otherForm.onAcquired(player)
        player.thunderAndLightningFormGranted = true
        player.updateSynergies()
      }
    }

    if (
      pokemonBeforeEvolution.name === Pkm.EGG &&
      "legendEgg" in pokemonBeforeEvolution &&
      pokemonBeforeEvolution.legendEgg === true
    ) {
      const heroBlessing = (Object.keys(HERO_BLESSING_FAMILY) as Blessing[]).find(
        (blessing) =>
          HERO_BLESSING_FAMILY[blessing] === PkmFamily[pokemonEvolved.name]
      )
      if (heroBlessing && !player.blessings.includes(heroBlessing)) {
        player.blessings.push(heroBlessing)
        player.blessingsRef?.blessings.push(heroBlessing)
      }
    }

    if (
      pokemonBeforeEvolution.name === Pkm.EGG &&
      pokemonBeforeEvolution.shiny &&
      player.blessings?.includes(Blessing.SELECTIVE_GENETICS)
    ) {
      player.choices.push(
        new PlayerChoice({
          type: "item",
          items: pickNRandomIn(
            ShinyItems.filter((item) => item !== Item.RED_SCALE),
            SELECTIVE_GENETICS_SHINY_ITEM_OPTIONS
          )
        })
      )
    }

    if (pokemonEvolved.passive in PassiveEffects) {
      PassiveEffects[pokemonEvolved.passive]!.forEach((effect) => {
        if (effect instanceof OnEvolutionEffect) {
          effect.apply({ pokemonEvolved, player })
        }
      })
    }

    player.board.forEach((pokemon) => {
      if (
        (pokemon.passive === Passive.COSMOG ||
          pokemon.passive === Passive.COSMOEM) &&
        pokemonEvolved.passive !== Passive.COSMOG &&
        pokemonEvolved.passive !== Passive.COSMOEM
      ) {
        pokemon.addMaxHP(10)
        pokemon.stacks++
        this.tryEvolve(pokemon, player)
      }
    })

    // check evolutions again if it can evolve twice in a row
    this.tryEvolve(pokemonEvolved, player, ...additionalArgs)
  },

  getEvolution(
    pokemon: Pokemon,
    player: IPlayer,
    ...additionalArgs: unknown[]
  ): Pkm {
    const handler = this.getHandler(pokemon.evolutionRule)
    return handler.getEvolution(pokemon, player, ...additionalArgs)
  },

  canEvolve(
    pokemon: Pokemon,
    player: Player,
    ...additionalArgs: unknown[]
  ): boolean {
    const handler = this.getHandler(pokemon.evolutionRule)
    return handler.canEvolve(pokemon, player, ...additionalArgs)
  },

  canEvolveIfGettingOne(pokemon: Pokemon, player: Player): boolean {
    if (pokemon.evolutionRule.type !== EvolutionRuleType.COUNT) return false
    const handler = this.getHandler(
      pokemon.evolutionRule
    ) as CountEvolutionHandler
    return handler.canEvolveIfGettingOne(pokemon, player)
  },

  updateHatch(pokemon: Pokemon, player: Player) {
    if (pokemon.evolutionRule.type !== EvolutionRuleType.HATCH) return
    pokemon.stacks++
    const willHatch = this.canEvolve(pokemon, player)
    if (willHatch) {
      pokemon.action = PokemonActionState.HOP
      setTimeout(() => {
        this.tryEvolve(pokemon, player)
      }, 2000)
    } else if (pokemon.name === Pkm.EGG) {
      const hatchTime = getHatchTime(pokemon, player)
      if (pokemon.stacks >= hatchTime) {
        pokemon.action = PokemonActionState.HOP
      } else if (pokemon.stacks >= hatchTime - 1) {
        pokemon.action = PokemonActionState.EMOTE
      } else {
        pokemon.action = PokemonActionState.IDLE
      }
    }
  }
}
