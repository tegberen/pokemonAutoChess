import { chance } from "../../utils/random"
import { WandererBehavior } from "../../types/enum/Wanderer"
import { WandererType } from "../../types/enum/Wanderer"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { AbilityStrategy } from "./ability-strategy"

export class PresentStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const roll = Math.pow(Math.random(), 1 - pokemon.luck / 100)
    /* 80 damage: 40%
       150 damage: 30%
       300 damage: 20%
       heal 50HP: 10%
    */
    if (roll < 0.1) {
      target.handleHeal(50, pokemon, 0, false)
    } else if (roll < 0.5) {
      target.handleSpecialDamage(80, board, AttackType.SPECIAL, pokemon, crit)
    } else if (roll < 0.8) {
      target.handleSpecialDamage(150, board, AttackType.SPECIAL, pokemon, crit)
    } else {
      target.handleSpecialDamage(300, board, AttackType.SPECIAL, pokemon, crit)
    }

    if (chance(0.3, pokemon) && pokemon.player) {
      const randomIcePkm = pokemon.simulation.room.state.shop.presentPull(
        pokemon,
        pokemon.player
      )
      if (randomIcePkm) {
        pokemon.player.spawnWanderingPokemon({
          pkm: randomIcePkm,
          behavior: WandererBehavior.SPECTATE,
          type: WandererType.CATCHABLE
        })
      }
    }
  }
}
