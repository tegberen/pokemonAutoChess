import type { PokemonEntity } from "./pokemon-entity"

export function stealGoldOnKO(
  pirate: PokemonEntity,
  knockedOut: PokemonEntity,
  gold: number
) {
  const opponent = knockedOut.player
  if (!pirate.player || !opponent) return
  const goldStolen = Math.min(opponent.money, gold)
  if (goldStolen <= 0) return
  opponent.addMoney(-goldStolen, false, knockedOut)
  pirate.player.addMoney(goldStolen, true, pirate)
  pirate.count.moneyCount += goldStolen
}
