import type Player from "../models/colyseus-models/player"
import type { Pokemon } from "../models/colyseus-models/pokemon"
import { getPokemonData } from "../models/precomputed/precomputed-pokemon-data"
import { Ability } from "../types/enum/Ability"
import { Rarity } from "../types/enum/Game"
import { Item } from "../types/enum/Item"
import { Pkm, PkmDuos } from "../types/enum/Pokemon"
import { isMegaEvolutionLocked } from "../types/enum/SpecialGameRule"

const KEY_STONE_COOLDOWN_BY_RARITY: Partial<Record<Rarity, number>> = {
  [Rarity.COMMON]: 3,
  [Rarity.UNCOMMON]: 3,
  [Rarity.RARE]: 4,
  [Rarity.EPIC]: 5,
  [Rarity.ULTRA]: 5,
  [Rarity.UNIQUE]: 5,
  [Rarity.LEGENDARY]: 6
}
const MEGA_DUO_COOLDOWN = 10

let preMegaPool: Pkm[] | null = null

// the form right before each Mega; Zygarde's forms share one Mega, so only the
// highest one is offered
export function getPreMegaPool(): Pkm[] {
  if (preMegaPool) return preMegaPool
  const preMegaByMega = new Map<Pkm, Pkm>()
  for (const pkm of Object.values(Pkm)) {
    const { evolution, stars, skill } = getPokemonData(pkm)
    if (!evolution || !isMegaEvolutionLocked(evolution)) continue
    if (skill === Ability.DEFAULT) continue
    const current = preMegaByMega.get(evolution)
    if (!current || getPokemonData(current).stars < stars) {
      preMegaByMega.set(evolution, pkm)
    }
  }
  preMegaPool = [...preMegaByMega.values()]
  return preMegaPool
}

// a duo is offered once, since picking either one grants both
export function getPreMegaCarouselPool(): Pkm[] {
  return getPreMegaPool().filter((pkm, index, pool) => {
    const partnerIndex = pool.indexOf(getMegaDuoPartner(pkm) ?? pkm)
    return partnerIndex === -1 || partnerIndex >= index
  })
}

// one Mega per fight: the active one blocks the stone until it reverts
export function canMegaEvolveWithKeyStone(player: Player, pokemon: Pokemon) {
  return (
    player.activeMegas.length === 0 &&
    pokemon.megaCooldown === 0 &&
    isMegaEvolutionLocked(pokemon.evolution)
  )
}

const RARITIES_WITH_LONG_LINE_BONUS = [
  Rarity.COMMON,
  Rarity.UNCOMMON,
  Rarity.RARE,
  Rarity.EPIC
]

// both members of a duo can Mega Evolve (Latias and Latios)
function getMegaDuo(preMega: Pkm): Pkm[] | undefined {
  return Object.values(PkmDuos).find(
    (duo) =>
      duo.includes(preMega) &&
      duo.every((pkm) =>
        isMegaEvolutionLocked(getPokemonData(pkm).evolution ?? Pkm.DEFAULT)
      )
  )
}

// a 4 STAR Mega closes a longer line than its rarity says (Gardevoir is
// COMMON), so it sits out one fight more; every UNIQUE and LEGENDARY Mega is
// 4 STAR, so their rarity alone sets it. A duo Mega Evolves two UNIQUE at
// once, so it waits for both
export function getKeyStoneCooldown(mega: Pkm) {
  const { rarity, stars } = getPokemonData(mega)
  const preMega = getPreMegaPool().find(
    (pkm) => getPokemonData(pkm).evolution === mega
  )
  if (preMega && getMegaDuo(preMega)) return MEGA_DUO_COOLDOWN
  const longLineBonus =
    RARITIES_WITH_LONG_LINE_BONUS.includes(rarity) && stars >= 4 ? 1 : 0
  return (KEY_STONE_COOLDOWN_BY_RARITY[rarity] ?? 4) + longLineBonus
}

export function getMegaDuoPartner(preMega: Pkm): Pkm | undefined {
  return getMegaDuo(preMega)?.find((pkm) => pkm !== preMega)
}

export function megaEvolveWithKeyStone(player: Player, pokemon: Pokemon) {
  const partnerName = getMegaDuoPartner(pokemon.name)
  // a partner bought apart may still be cooling down from its last Mega
  const partner = [...player.board.values()].find(
    (other) => other.name === partnerName && other.megaCooldown === 0
  )
  for (const preMega of partner ? [pokemon, partner] : [pokemon]) {
    const mega = player.transformPokemon(preMega, preMega.evolution)
    player.activeMegas.push({ id: mega.id, preMega: preMega.name })
  }
}

// runs after every fight: cooldowns tick first, so the Mega that just fought
// sits out its full cooldown
export function revertMegaEvolution(player: Player) {
  player.board.forEach((pokemon) => {
    if (pokemon.megaCooldown > 0) pokemon.megaCooldown--
  })
  if (player.activeMegas.length === 0) return
  player.items.push(Item.KEY_STONE)
  for (const { id, preMega } of player.activeMegas) {
    const mega = player.board.get(id)
    if (!mega) continue
    const reverted = player.transformPokemon(mega, preMega)
    reverted.megaCooldown = getKeyStoneCooldown(mega.name)
  }
  player.activeMegas = []
}
