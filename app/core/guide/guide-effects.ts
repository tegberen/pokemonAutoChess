import type Player from "../../models/colyseus-models/player"
import PokemonFactory from "../../models/pokemon-factory"
import type { Item } from "../../types/enum/Item"
import { type Pkm, PkmFamily } from "../../types/enum/Pokemon"
import { getFirstAvailablePositionInBench } from "../../utils/board"

/* What a step's `onEnter` may do to set itself up. Read-only checks live in
   guide-conditions.ts; anything that changes the player's board or bag belongs
   here, so a lesson never reaches into the Player schema directly.

   `onEnter` fires exactly once, when the step becomes active. That makes it the
   place to hand over a unit the shop cannot sell, or to unwind what a previous
   branch produced before teaching the alternative. */

/** Puts a unit on the bench. For units no shop will ever offer. */
export function giveGuidePokemon(player: Player, pkm: Pkm, count = 1) {
  for (let i = 0; i < count; i++) {
    const x = getFirstAvailablePositionInBench(player.board)
    if (x === null) return
    const pokemon = PokemonFactory.createPokemonFromName(pkm, player)
    pokemon.positionX = x
    pokemon.positionY = 0
    player.board.set(pokemon.id, pokemon)
    pokemon.onAcquired(player)
  }
}

/* Removes every unit of that family, evolutions included, and hands whatever
   they were holding back to the inventory - the same thing selling would do.
   Deleting a unit that carries the lesson's items would otherwise destroy them
   and strand every later step that expects them. */
export function removeGuidePokemon(player: Player, pkm: Pkm) {
  const doomed: string[] = []
  player.board.forEach((pokemon, id) => {
    if (PkmFamily[pokemon.name] !== PkmFamily[pkm]) return
    pokemon.items.forEach((item) => player.items.push(item))
    doomed.push(id)
  })
  doomed.forEach((id) => player.board.delete(id))
  player.updateSynergies()
}

export function giveGuideItems(player: Player, ...items: Item[]) {
  items.forEach((item) => player.items.push(item))
}
