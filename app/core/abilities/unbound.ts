import { DelayedCommand } from "../simulation-command"
import { pickRandomIn } from "../../utils/random"
import { Ability } from "../../types/enum/Ability"
import { Pkm, PkmIndex } from "../../types/enum/Pokemon"
import { LegendaryPool } from "../../config/game/pools"
import PokemonFactory from "../../models/pokemon-factory"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

const HoopaLegendaryPool = LegendaryPool.filter((p): p is Pkm => p in Pkm)

export class UnboundStrategy extends AbilityStrategy {
  requiresTarget = false
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    super.process(pokemon, board, target, crit)

    // Portal open + vanish
    pokemon.broadcastAbility({
      skill: "HOOPA_PORTAL",
      positionX: pokemon.positionX,
      positionY: pokemon.positionY
    })
    pokemon.status.vanishing = true
    pokemon.cooldown = 2000

    pokemon.commands.push(
      new DelayedCommand(() => {
        // Transform while still invisible
        pokemon.index = PkmIndex[Pkm.HOOPA_UNBOUND]
        pokemon.skill = Ability.HYPERSPACE_FURY
        pokemon.addAttack(7, pokemon, 0, false)
        pokemon.addMaxHP(70, pokemon, 0, false)
        pokemon.toMovingState()
        if (pokemon.player) {
          pokemon.player.pokemonsPlayed.add(Pkm.HOOPA_UNBOUND)
        }

        // Portal at Hoopa's position, then reappear after delay
        pokemon.broadcastAbility({
          skill: "HOOPA_PORTAL",
          positionX: pokemon.positionX,
          positionY: pokemon.positionY
        })
        pokemon.commands.push(
          new DelayedCommand(() => {
            pokemon.status.vanishing = false // reappear after portal plays
          }, 200)
        )

        // Portal at legendary spawn position
        const coord = pokemon.simulation.getClosestFreeCellToPokemonEntity(pokemon)
        if (coord) {
          pokemon.broadcastAbility({
            skill: "HOOPA_PORTAL",
            positionX: coord.x,
            positionY: coord.y,
            targetX: coord.x,
            targetY: coord.y
          })

          // Spawn legendary after portal plays
          pokemon.commands.push(
            new DelayedCommand(() => {
              const chosen = pickRandomIn(HoopaLegendaryPool)
              const summoned = PokemonFactory.createPokemonFromName(chosen, pokemon.player)
              const entity = pokemon.simulation.addPokemon(
                summoned,
                coord.x,
                coord.y,
                pokemon.team,
                true
              )
              const scale = (1 + pokemon.ap * 0.5 / 100) * (crit ? 1 + (pokemon.critPower - 1) * 0.5 : 1)
              entity.maxHP = Math.round(entity.maxHP * scale / 2) // half scaling
              entity.hp = entity.maxHP
              if (pokemon.player) pokemon.player.pokemonsPlayed.add(chosen)
            }, 200)
          )
        }
      }, 2000)
    )
  }
}
