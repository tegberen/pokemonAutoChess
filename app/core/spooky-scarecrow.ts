import PokemonFactory from "../models/pokemon-factory"
import {
  Blessing,
  SPOOKY_SCARECROW_DEF_PER_ALLY_KO,
  SPOOKY_SCARECROW_MURKROWS_ON_OWN_KO
} from "../types/enum/Blessing"
import { Pkm } from "../types/enum/Pokemon"
import type { Board } from "./board"
import type { PokemonEntity } from "./pokemon-entity"

// kept apart from the ability files: the entity's death hook reads it

// its own Murkrows falling would summon more Murkrows forever
const summonedMurkrows = new WeakSet<PokemonEntity>()

export function summonSpookyScarecrowMurkrows(
  fallen: PokemonEntity,
  board: Board
) {
  if (summonedMurkrows.has(fallen) || fallen.isSpawn) return

  if (fallen.heroBlessings.has(Blessing.SPOOKY_SCARECROW)) {
    for (let i = 0; i < SPOOKY_SCARECROW_MURKROWS_ON_OWN_KO; i++) {
      summonMurkrowNear(fallen, fallen)
    }
    return
  }

  let scarecrow: PokemonEntity | undefined
  board.forEach((x, y, ally) => {
    if (
      ally &&
      ally !== fallen &&
      ally.team === fallen.team &&
      ally.hp > 0 &&
      ally.heroBlessings.has(Blessing.SPOOKY_SCARECROW)
    ) {
      scarecrow = ally
    }
  })
  if (!scarecrow) return
  scarecrow.addDefense(SPOOKY_SCARECROW_DEF_PER_ALLY_KO, scarecrow, 0, false)
  summonMurkrowNear(scarecrow, scarecrow)
}

function summonMurkrowNear(summoner: PokemonEntity, anchor: PokemonEntity) {
  const landing = summoner.simulation.getClosestFreeCellTo(
    anchor.positionX,
    anchor.positionY,
    summoner.team
  )
  if (!landing) return
  const murkrow = summoner.simulation.addPokemon(
    PokemonFactory.createPokemonFromName(Pkm.MURKROW, summoner.player),
    landing.x,
    landing.y,
    summoner.team,
    true
  )
  murkrow.pp = murkrow.maxPP
  summonedMurkrows.add(murkrow)
}
