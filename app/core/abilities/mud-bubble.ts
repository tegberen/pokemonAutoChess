import { MUD_BUBBLE_HOP_MS } from "../../config/game/abilities"
import { AttackType } from "../../types/enum/Game"
import type { Board } from "../board"
import type { PokemonEntity } from "../pokemon-entity"
import { DelayedCommand } from "../simulation-command"
import { AbilityStrategy } from "./ability-strategy"

export class MudBubbleStrategy extends AbilityStrategy {
  process(pokemon: PokemonEntity, board: Board, target: null, crit: boolean) {
    super.process(pokemon, board, target, crit)
    const heal = [20, 40, 80, 160][pokemon.stars - 1] ?? 160
    const blindDuration = [2000, 4000, 6000, 12000][pokemon.stars - 1] ?? 12000
    const damage = [15, 30, 60, 120][pokemon.stars - 1] ?? 120

    pokemon.handleHeal(heal, pokemon, 1, crit)
    pokemon.resetCooldown(250, pokemon.speed)

    pokemon.commands.push(
      new DelayedCommand(() => {
        board
          .getAdjacentCells(pokemon.positionX, pokemon.positionY)
          .forEach((cell) => {
            if (cell.value && cell.value.team !== pokemon.team) {
              const wasBlinded = cell.value.status.blinded
              if (!wasBlinded) {
                cell.value.status.triggerBlinded(
                  blindDuration,
                  cell.value,
                  pokemon
                )
              }
              cell.value.handleSpecialDamage(
                wasBlinded ? damage * 2 : damage,
                board,
                AttackType.SPECIAL,
                pokemon,
                crit
              )
            }
          })
      }, MUD_BUBBLE_HOP_MS)
    )
  }
}
