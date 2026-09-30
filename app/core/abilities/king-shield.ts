import {
  Blessing,
  CYBER_BLADE_MAX_PP
} from "../../types/enum/Blessing"
import { Ability } from "../../types/enum/Ability"
import { Pkm, PkmIndex } from "../../types/enum/Pokemon"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

const KING_SHIELD_FORM_CHANGE_DELAY = 1500

export class KingShieldStrategy extends AbilityStrategy {
  process(
    pokemon: PokemonEntity,
    board: Board,
    target: PokemonEntity,
    crit: boolean
  ) {
    super.process(pokemon, board, target, crit)
    const duration = 1500
    const shield = [10, 20, 40, 80][pokemon.stars - 1] ?? 80
    pokemon.status.triggerProtect(duration)
    pokemon.addShield(shield, pokemon, 1, crit)
    const farthestTarget = pokemon.state.getFarthestTarget(pokemon, board)
    if (farthestTarget) {
      pokemon.moveTo(
        farthestTarget.positionX,
        farthestTarget.positionY,
        board,
        true
      )
    }
    if (pokemon.name === Pkm.AEGISLASH) {
      pokemon.commands.push(
        new DelayedCommand(() => {
          pokemon.addAttack(10, pokemon, 1, crit)
          pokemon.addDefense(-5, pokemon, 1, crit)
          pokemon.addSpecialDefense(-5, pokemon, 1, crit)
          pokemon.name = Pkm.AEGISLASH_BLADE
          pokemon.index = PkmIndex[Pkm.AEGISLASH_BLADE]
          if (pokemon.player) {
            pokemon.player.pokemonsPlayed.add(Pkm.AEGISLASH_BLADE)
          }
        }, KING_SHIELD_FORM_CHANGE_DELAY)
      )
    } else if (pokemon.name === Pkm.AEGISLASH_BLADE) {
      pokemon.commands.push(
        new DelayedCommand(() => {
          pokemon.addAttack(-10, pokemon, 1, crit)
          pokemon.addDefense(5, pokemon, 1, crit)
          pokemon.addSpecialDefense(5, pokemon, 1, crit)
          pokemon.name = Pkm.AEGISLASH
          pokemon.index = PkmIndex[Pkm.AEGISLASH]
        }, KING_SHIELD_FORM_CHANGE_DELAY)
      )
    }

    // pushed after the form change and on the same delay, so Aegislash is
    // already in Blade form when Laser Blade first reads its ATK.
    // PROTECT blocks PP gain, so the PP is refilled to cast Laser Blade at once
    if (pokemon.heroBlessings?.has(Blessing.CYBER_BLADE)) {
      pokemon.commands.push(
        new DelayedCommand(() => {
          pokemon.skill = Ability.LASER_BLADE
          pokemon.maxPP = CYBER_BLADE_MAX_PP
          pokemon.pp = pokemon.maxPP
          // Laser Blade alternates on the cast count, so the first cast is the
          // spin behind the target. Counting up avoids redoing first-cast effects
          if (pokemon.count.ult % 2 === 1) pokemon.count.ult += 1
        }, KING_SHIELD_FORM_CHANGE_DELAY)
      )
    }
  }
}
