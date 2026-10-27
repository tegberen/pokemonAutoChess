export enum Synergy {
  NORMAL = "NORMAL",
  FLYING = "FLYING",
  FIELD = "FIELD",
  DARK = "DARK",
  GROUND = "GROUND",
  PSYCHIC = "PSYCHIC",
  GRASS = "GRASS",
  BUG = "BUG",
  WATER = "WATER",
  AQUATIC = "AQUATIC",
  POISON = "POISON",
  FAIRY = "FAIRY",
  FIGHTING = "FIGHTING",
  FIRE = "FIRE",
  GHOST = "GHOST",
  ROCK = "ROCK",
  MONSTER = "MONSTER",
  AMORPHOUS = "AMORPHOUS",
  WILD = "WILD",
  SOUND = "SOUND",
  FLORA = "FLORA",
  STEEL = "STEEL",
  ELECTRIC = "ELECTRIC",
  ICE = "ICE",
  BABY = "BABY",
  HUMAN = "HUMAN",
  DRAGON = "DRAGON",
  LIGHT = "LIGHT",
  GOURMET = "GOURMET",
  FOSSIL = "FOSSIL",
  ARTIFICIAL = "ARTIFICIAL",
  PRODIGY = "PRODIGY"
}

export const SynergyArray = Object.values(Synergy)

// only reachable through a Wish, so never rolled for random synergy pickers
export const WishOnlySynergies: readonly Synergy[] = [Synergy.PRODIGY]

export function isWishOnlySynergy(synergy: Synergy) {
  return WishOnlySynergies.includes(synergy)
}
