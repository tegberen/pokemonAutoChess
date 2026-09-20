import { Emotion } from "../types"
import { Stat } from "../types/enum/Game"
import {
  CraftableItemsNoScarves,
  CraftableNoStonesOrScarves,
  Item,
  ItemComponentsNoFossilOrScarf,
  ShinyItems
} from "../types/enum/Item"
import { Pkm } from "../types/enum/Pokemon"
import { Synergy } from "../types/enum/Synergy"
import {
  chance,
  pickNRandomIn,
  pickRandomIn,
  randomWeighted
} from "../utils/random"
import { schemaValues } from "../utils/schemas"
import type Player from "./colyseus-models/player"
import type { Pokemon } from "./colyseus-models/pokemon"

export type PVEStagesNames =
  | `pkm.${Pkm}`
  | "tower_duo"
  | "legendary_birds"
  | "legendary_beasts"
  | "super_ancients"
  | "legendary_giants"

// Double Up: the team fights one shared PVE encounter, scaled dynamically
// to the combined power of both boards
export const DOUBLE_UP_PVE_POWER_FACTOR = 1.0 // target power relative to the duo's boards
export const DOUBLE_UP_PVE_MIN_SCALE = 1.25
export const DOUBLE_UP_PVE_MAX_SCALE = 10
// applied after the min/max clamp, so encounters can end up below solo strength
export const DOUBLE_UP_PVE_TUNING = 0.4
// halves the ability damage of every encounter unit: AP -> (100 + AP) / 2 - 100
export const DOUBLE_UP_PVE_ABILITY_POWER_RATIO = 0.5

// scaled bosses gain more bulk than damage: hp × scale^1.4, atk × scale^0.6
export const DOUBLE_UP_PVE_HP_BIAS = 1.4

// below parity early game, parity at stage 10, then well beyond it since
// items and synergies make boards much stronger than their raw stats
export function getDoubleUpPvePowerFactor(stageLevel: number): number {
  const factor =
    stageLevel < 10 ? 0.4 + 0.06 * stageLevel : 1 + 0.15 * (stageLevel - 10)
  return DOUBLE_UP_PVE_POWER_FACTOR * factor
}

export type PVEStage = {
  name: PVEStagesNames
  avatar: Pkm
  emotion?: Emotion
  shinyChance?: number
  rewards?: Item[]
  getRewards?: (player: Player, shinyEncounter: boolean) => Item[]
  getRewardsPropositions?: (player: Player, shinyEncounter: boolean) => Item[]
  board: [pkm: Pkm, x: number, y: number][]
  marowakItems?: Item[][]
  statBoosts?: { [stat in Stat]?: number }
  // absolute values every unit of the encounter is normalized to, applied
  // after statBoosts so a stage can flatten wildly different species
  stats?: { [stat in Stat]?: number }
  variants?: PVEStageVariant[]
}

// an alternative encounter for the same stage, rolled once per game
export type PVEStageVariant = Pick<
  PVEStage,
  | "name"
  | "avatar"
  | "board"
  | "emotion"
  | "marowakItems"
  | "statBoosts"
  | "stats"
>

// emotion belongs to the avatar, so a variant that brings its own Pokemon must
// not inherit a portrait emotion only the base one has art for
export function resolvePveStage(
  base: PVEStage,
  variantIndex: number
): PVEStage {
  const options = base.variants ? [base, ...base.variants] : [base]
  const variant = options[variantIndex] ?? base
  const { variants, ...merged } = {
    ...base,
    ...variant,
    emotion: variant.emotion
  }
  return merged
}

const FINAL_STAGE_REWARDS = [Item.RARE_CANDY, Item.SACRED_ASH, Item.GOLD_BOW]

const SIGNATURE_ITEMS: Partial<Record<Pkm, Item>> = {
  [Pkm.ZACIAN]: Item.RUSTED_SWORD,
  [Pkm.ZAMAZENTA]: Item.RUSTED_SHIELD,
  [Pkm.KYUREM]: Item.DNA_SPLICER
}

const PVE_STAT_READERS: { [stat in Stat]?: (pokemon: Pokemon) => number } = {
  [Stat.HP]: (pokemon) => pokemon.hp,
  [Stat.ATK]: (pokemon) => pokemon.atk,
  [Stat.DEF]: (pokemon) => pokemon.def,
  [Stat.SPE_DEF]: (pokemon) => pokemon.speDef,
  [Stat.AP]: (pokemon) => pokemon.ap,
  [Stat.SPEED]: (pokemon) => pokemon.speed,
  [Stat.PP]: (pokemon) => pokemon.pp,
  [Stat.SHIELD]: (pokemon) => pokemon.shield,
  [Stat.CRIT_CHANCE]: (pokemon) => pokemon.critChance,
  [Stat.CRIT_POWER]: (pokemon) => pokemon.critPower,
  [Stat.LUCK]: (pokemon) => pokemon.luck
}

export function applyPveStageStats(pokemon: Pokemon, stage: PVEStage) {
  for (const [stat, boost] of Object.entries(stage.statBoosts ?? {})) {
    if (boost !== undefined) pokemon.applyStat(stat as Stat, boost)
  }
  for (const [stat, target] of Object.entries(stage.stats ?? {})) {
    const read = PVE_STAT_READERS[stat as Stat]
    if (!read || target === undefined) continue
    pokemon.applyStat(stat as Stat, target - read(pokemon))
  }
}

// a Pokemon training in the dojo still counts as owned for reward purposes
function ownedPokemons(player: Player) {
  return [
    ...schemaValues(player.board),
    ...player.pokemonsTrainingInDojo.map(({ pokemon }) => pokemon)
  ]
}

// components the player has not been handed yet, so early rewards spread over
// the recipe tree instead of piling duplicates
function unseenComponents(player: Player): Item[] {
  const unseen = ItemComponentsNoFossilOrScarf.filter(
    (item) => player.randomComponentsGiven.includes(item) === false
  )
  return unseen.length > 0 ? unseen : ItemComponentsNoFossilOrScarf
}

function giveRandomComponent(player: Player): Item[] {
  const component = pickRandomIn(unseenComponents(player))
  player.randomComponentsGiven.push(component)
  return [component]
}

function proposeRandomComponents(player: Player, count = 3): Item[] {
  return pickNRandomIn(unseenComponents(player), count)
}

// twice the weight for a component the player has not been given yet
function giveWeightedComponents(player: Player, count: number): Item[] {
  const weights = Object.fromEntries(
    ItemComponentsNoFossilOrScarf.map((item) => [
      item,
      player.randomComponentsGiven.includes(item) ? 1 : 2
    ])
  ) as { [item in Item]?: number }
  const given = Array.from({ length: count }, () => randomWeighted(weights)!)
  player.randomComponentsGiven.push(...given)
  return given
}

// two items that cannot be crafted into a stone, plus a third from the full set
function proposeCraftableItems(): Item[] {
  const rewards = pickNRandomIn(CraftableNoStonesOrScarves, 2)
  rewards.push(
    pickRandomIn(CraftableItemsNoScarves.filter((o) => !rewards.includes(o)))
  )
  return rewards
}

export const PVEStages: { [turn: number]: PVEStage } = {
  1: {
    name: "pkm.MAGIKARP",
    avatar: Pkm.MAGIKARP,
    board: [
      [Pkm.MAGIKARP, 3, 1],
      [Pkm.MAGIKARP, 5, 1]
    ],
    variants: [
      {
        name: "pkm.FEEBAS",
        avatar: Pkm.FEEBAS,
        board: [
          [Pkm.FEEBAS, 3, 1],
          [Pkm.FEEBAS, 5, 1]
        ],
        statBoosts: {
          [Stat.ATK]: -4,
          [Stat.DEF]: -4,
          [Stat.SPE_DEF]: -8
        }
      },
      {
        name: "pkm.REMORAID",
        avatar: Pkm.REMORAID,
        board: [
          [Pkm.REMORAID, 3, 1],
          [Pkm.REMORAID, 5, 1]
        ],
        statBoosts: {
          [Stat.ATK]: -12,
          [Stat.DEF]: -4,
          [Stat.SPE_DEF]: -2
        }
      },
      {
        name: "pkm.WISHIWASHI",
        avatar: Pkm.WISHIWASHI,
        board: [
          [Pkm.WISHIWASHI, 3, 1],
          [Pkm.WISHIWASHI, 5, 1]
        ],
        statBoosts: {
          [Stat.ATK]: -10,
          [Stat.DEF]: -4,
          [Stat.SPE_DEF]: -4,
        }
      }
    ],
    shinyChance: 1 / 40,
    rewards: ItemComponentsNoFossilOrScarf,
    getRewards(player: Player) {
      return giveRandomComponent(player)
    }
  },

  2: {
    name: "pkm.RATTATA",
    avatar: Pkm.RATTATA,
    board: [
      [Pkm.RATTATA, 3, 1],
      [Pkm.RATTATA, 5, 1]
    ],
    variants: [
      {
        name: "pkm.SENTRET",
        avatar: Pkm.SENTRET,
        board: [
          [Pkm.SENTRET, 3, 1],
          [Pkm.SENTRET, 5, 1]
        ],
        statBoosts: {
          [Stat.ATK]: -2,
          [Stat.DEF]: -6,
          [Stat.SPE_DEF]: -6
        }
      },
      {
        name: "pkm.PATRAT",
        avatar: Pkm.PATRAT,
        board: [
          [Pkm.PATRAT, 3, 1],
          [Pkm.PATRAT, 5, 1]
        ],
        statBoosts: {
          [Stat.ATK]: -6,
          [Stat.DEF]: -3,
          [Stat.SPE_DEF]: -3
        }
      },
      {
        name: "pkm.BIDOOF",
        avatar: Pkm.BIDOOF,
        board: [
          [Pkm.BIDOOF, 3, 1],
          [Pkm.BIDOOF, 5, 1]
        ],
        statBoosts: {
          [Stat.ATK]: -4,
          [Stat.DEF]: -4,
          [Stat.SPE_DEF]: -4
        }
      },
      {
        name: "pkm.BUNNELBY",
        avatar: Pkm.BUNNELBY,
        board: [
          [Pkm.BUNNELBY, 3, 1],
          [Pkm.BUNNELBY, 5, 1]
        ],
        statBoosts: {
          [Stat.ATK]: -4,
          [Stat.DEF]: -4,
          [Stat.SPE_DEF]: -4
        }
      },
      {
        name: "pkm.ZIGZAGOON",
        avatar: Pkm.ZIGZAGOON,
        board: [
          [Pkm.ZIGZAGOON, 3, 1],
          [Pkm.ZIGZAGOON, 5, 1]
        ],
        statBoosts: {
          [Stat.ATK]: -4,
          [Stat.DEF]: -8,
          [Stat.SPE_DEF]: -4,
          [Stat.HP]: -10
        }
      }
    ],
    rewards: ItemComponentsNoFossilOrScarf,
    getRewardsPropositions(player: Player) {
      return proposeRandomComponents(player)
    }
  },

  3: {
    // one random mini-boss, all normalized to the same statline so the roll
    // does not change the difficulty
    name: "pkm.RAPIDASH",
    avatar: Pkm.RAPIDASH,
    board: [[Pkm.RAPIDASH, 4, 2]],
    stats: {
      [Stat.HP]: 150,
      [Stat.ATK]: 10,
      [Stat.DEF]: 0,
      [Stat.SPE_DEF]: 0,
      [Stat.AP]: -50
    },
    variants: [
      {
        name: "pkm.SANDSHREW",
        avatar: Pkm.SANDSHREW,
        board: [[Pkm.SANDSHREW, 4, 2]]
      },
      {
        name: "pkm.PYUKUMUKU",
        avatar: Pkm.PYUKUMUKU,
        board: [[Pkm.PYUKUMUKU, 4, 2]]
      },
      {
        name: "pkm.GASTRODON_EAST_SEA",
        avatar: Pkm.GASTRODON_EAST_SEA,
        board: [[Pkm.GASTRODON_EAST_SEA, 4, 2]]
      },
      {
        name: "pkm.FENNEKIN",
        avatar: Pkm.FENNEKIN,
        board: [[Pkm.FENNEKIN, 4, 2]]
      },
      {
        name: "pkm.SHINX",
        avatar: Pkm.SHINX,
        board: [[Pkm.SHINX, 4, 2]]
      },
      {
        name: "pkm.GLACEON",
        avatar: Pkm.GLACEON,
        board: [[Pkm.GLACEON, 4, 2]]
      },
      {
        name: "pkm.KECLEON",
        avatar: Pkm.KECLEON,
        board: [[Pkm.KECLEON, 4, 2]]
      },
      {
        name: "pkm.SLITHER_WING",
        avatar: Pkm.SLITHER_WING,
        board: [[Pkm.SLITHER_WING, 4, 2]]
      },
      {
        name: "pkm.MUDSDALE",
        avatar: Pkm.MUDSDALE,
        board: [[Pkm.MUDSDALE, 4, 2]]
      },
      {
        name: "pkm.HISUI_ARCANINE",
        avatar: Pkm.HISUI_ARCANINE,
        board: [[Pkm.HISUI_ARCANINE, 4, 2]]
      },
      {
        name: "pkm.CRAMORANT",
        avatar: Pkm.CRAMORANT,
        board: [[Pkm.CRAMORANT, 4, 2]]
      },
      {
        name: "pkm.GALARIAN_ZIGZAGOON",
        avatar: Pkm.GALARIAN_ZIGZAGOON,
        board: [[Pkm.GALARIAN_ZIGZAGOON, 4, 2]]
      },
      {
        name: "pkm.MAGCARGO",
        avatar: Pkm.MAGCARGO,
        board: [[Pkm.MAGCARGO, 4, 2]]
      },
      {
        name: "pkm.BRELOOM",
        avatar: Pkm.BRELOOM,
        board: [[Pkm.BRELOOM, 4, 2]]
      },
      {
        name: "pkm.RABOOT",
        avatar: Pkm.RABOOT,
        board: [[Pkm.RABOOT, 4, 2]]
      },
      {
        name: "pkm.DUCKLETT",
        avatar: Pkm.DUCKLETT,
        board: [[Pkm.DUCKLETT, 4, 2]]
      },
      {
        name: "pkm.CLEFFA",
        avatar: Pkm.CLEFFA,
        board: [[Pkm.CLEFFA, 4, 2]]
      },
      {
        name: "pkm.PIKACHU_SURFER",
        avatar: Pkm.PIKACHU_SURFER,
        board: [[Pkm.PIKACHU_SURFER, 4, 2]]
      },
      {
        name: "pkm.HIPPOPOTAS",
        avatar: Pkm.HIPPOPOTAS,
        board: [[Pkm.HIPPOPOTAS, 4, 2]]
      },
      {
        name: "pkm.AZUMARILL",
        avatar: Pkm.AZUMARILL,
        board: [[Pkm.AZUMARILL, 4, 2]],
        
      },
      {
        name: "pkm.VESPIQUEN",
        avatar: Pkm.VESPIQUEN,
        board: [[Pkm.VESPIQUEN, 4, 2]]
      },
      {
        name: "pkm.LITWICK",
        avatar: Pkm.LITWICK,
        board: [[Pkm.LITWICK, 4, 2]]
      },
      {
        name: "pkm.AXEW",
        avatar: Pkm.AXEW,
        board: [[Pkm.AXEW, 4, 2]]
      },
      {
        name: "pkm.STARAPTOR",
        avatar: Pkm.STARAPTOR,
        board: [[Pkm.STARAPTOR, 4, 2]]
      },
      {
         name: "pkm.ROWLET",
        avatar: Pkm.ROWLET,
        board: [[Pkm.ROWLET, 4, 2]]
      },
      {
        name: "pkm.OSHAWOTT",
        avatar: Pkm.OSHAWOTT,
        board: [[Pkm.OSHAWOTT, 4, 2]]
      },
      {
        name: "pkm.SWAMPERT",
        avatar: Pkm.SWAMPERT,
        board: [[Pkm.SWAMPERT, 4, 2]]
      },
      {
        name: "pkm.ALOLAN_VULPIX",
        avatar: Pkm.ALOLAN_VULPIX,
        board: [[Pkm.ALOLAN_VULPIX, 4, 2]]
      },
      {
        name: "pkm.TANGELA",
        avatar: Pkm.TANGELA,
        board: [[Pkm.TANGELA, 4, 2]]
      },
      {
        name: "pkm.MAREANIE",
        avatar: Pkm.MAREANIE,
        board: [[Pkm.MAREANIE, 4, 2]]
      },
      {
        name: "pkm.KROOKODILE",
        avatar: Pkm.KROOKODILE,
        board: [[Pkm.KROOKODILE, 4, 2]]
      },
      {
        name: "pkm.TINKATON",
        avatar: Pkm.TINKATON,
        board: [[Pkm.TINKATON, 4, 2]]
      },
      {
        name: "pkm.MINIOR",
        avatar: Pkm.MINIOR,
        board: [[Pkm.MINIOR, 4, 2]]
      },
      {
        name: "pkm.TOXTRICITY_LOW_KEY",
        avatar: Pkm.TOXTRICITY_LOW_KEY,
        board: [[Pkm.TOXTRICITY_LOW_KEY, 4, 2]]
      },
      {
        name: "pkm.CASTFORM",
        avatar: Pkm.CASTFORM,
        board: [[Pkm.CASTFORM, 4, 2]]
      },
      {
        name: "pkm.HYDRAPPLE",
        avatar: Pkm.HYDRAPPLE,
        board: [[Pkm.HYDRAPPLE, 4, 2]]
      },
      {
        name: "pkm.SHEDINJA",
        avatar: Pkm.SHEDINJA,
        board: [[Pkm.SHEDINJA, 4, 2]]
      },
      {
        name: "pkm.PIKACHU_LIBRE",
        avatar: Pkm.PIKACHU_LIBRE,
        board: [[Pkm.PIKACHU_LIBRE, 4, 2]]
      },
      {
        name: "pkm.MEW",
        avatar: Pkm.MEW,
        board: [[Pkm.MEW, 4, 2]]
      },
      {
        name: "pkm.PELIPPER",
        avatar: Pkm.PELIPPER,
        board: [[Pkm.PELIPPER, 4, 2]]
      },
      {
        name: "pkm.DRIZZILE",
        avatar: Pkm.DRIZZILE,
        board: [[Pkm.DRIZZILE, 4, 2]]
      },
      {
        name: "pkm.TOGEKISS",
        avatar: Pkm.TOGEKISS,
        board: [[Pkm.TOGEKISS, 4, 2]]
      },
      {
        name: "pkm.BLAZIKEN",
        avatar: Pkm.BLAZIKEN,
        board: [[Pkm.BLAZIKEN, 4, 2]]
      }
    ],
    rewards: ItemComponentsNoFossilOrScarf,
    getRewards(player: Player) {
      return giveRandomComponent(player)
    }
  },

  9: {
    name: "pkm.GYARADOS",
    avatar: Pkm.GYARADOS,
    board: [[Pkm.GYARADOS, 4, 2]],
    variants: [
      {
        name: "pkm.MILOTIC",
        avatar: Pkm.MILOTIC,
        board: [
          [Pkm.MILOTIC, 4, 2]
        ]
      },
      {
        name: "pkm.WISHIWASHI_SCHOOL",
        avatar: Pkm.WISHIWASHI_SCHOOL,
        board: [
          [Pkm.WISHIWASHI_SCHOOL, 4, 2]
        ]
      },
      {
        name: "pkm.WHISCASH",
        avatar: Pkm.WHISCASH,
        board: [[Pkm.WHISCASH, 4, 2]],
        statBoosts: {
          [Stat.HP]: 50,
          [Stat.ATK]: 4
        }
      },
      {
        name: "pkm.DONDOZO",
        avatar: Pkm.DONDOZO,
        board: [[Pkm.DONDOZO, 4, 2]],
        statBoosts: {
          [Stat.HP]: 50,
          [Stat.ATK]: 8
        }
      },
      {
        name: "pkm.WAILORD",
        avatar: Pkm.WAILORD,
        board: [[Pkm.WAILORD, 4, 2]],
        statBoosts: {
          [Stat.ATK]: 10
        }
      }
    ],
    marowakItems: [[Item.KINGS_ROCK]],
    shinyChance: 1 / 40,
    rewards: [...ItemComponentsNoFossilOrScarf, Item.RED_SCALE],
    getRewards(_player: Player, shinyEncounter: boolean) {
      if (shinyEncounter) return [Item.RED_SCALE]
      return [pickRandomIn(ItemComponentsNoFossilOrScarf)]
    }
  },

  14: {
    name: "pkm.MEWTWO",
    avatar: Pkm.MEWTWO,
    emotion: Emotion.DETERMINED,
    board: [
      [Pkm.MEWTWO, 0, 2],
      [Pkm.MEW, 7, 2]
    ],
    variants: [
      {
        name: "pkm.SOLROCK",
        avatar: Pkm.SOLROCK,
        board: [
          [Pkm.SOLROCK, 0, 2],
          [Pkm.LUNATONE, 7, 2]
        ]
      },
      {
        name: "pkm.ARMAROUGE",
        avatar: Pkm.ARMAROUGE,
        board: [
          [Pkm.ARMAROUGE, 0, 2],
          [Pkm.CERULEDGE, 7, 2]
        ]
      },
      {
        name: "pkm.LATIOS",
        avatar: Pkm.LATIOS,
        board: [
          [Pkm.LATIAS, 0, 2],
          [Pkm.LATIOS, 7, 2]
        ]
      },
      {
        name: "pkm.MANAPHY",
        avatar: Pkm.MANAPHY,
        board: [
          [Pkm.MANAPHY, 0, 2],
          [Pkm.PHIONE, 7, 2]
        ]
      },
      {
        name: "pkm.HITMONCHAN",
        avatar: Pkm.HITMONCHAN,
        board: [
          [Pkm.HITMONCHAN, 0, 2],
          [Pkm.HITMONLEE, 7, 2]
        ],
        statBoosts: {
          [Stat.HP]: 30
        }
      },
      {
        name: "pkm.GARDEVOIR",
        avatar: Pkm.GARDEVOIR,
        board: [
          [Pkm.GARDEVOIR, 0, 2],
          [Pkm.GALLADE, 7, 2]
        ],
        statBoosts: {
          [Stat.HP]: 50,
          [Stat.ATK]: 4
        }
      },
      {
        name: "pkm.PLUSLE",
        avatar: Pkm.PLUSLE,
        board: [
          [Pkm.PLUSLE, 0, 2],
          [Pkm.MINUN, 7, 2]
        ],
        statBoosts: {
          [Stat.HP]: 100,
          [Stat.ATK]: 6,
          [Stat.PP]: +20
        }
      },
      {
        name: "pkm.PINSIR",
        avatar: Pkm.PINSIR,
        board: [
          [Pkm.PINSIR, 0, 2],
          [Pkm.HERACROSS, 7, 2]
        ],
        statBoosts: {
          [Stat.HP]: 40
        }
      },
      {
        name: "pkm.NIDOKING",
        avatar: Pkm.NIDOKING,
        board: [
          [Pkm.NIDOKING, 0, 2],
          [Pkm.NIDOQUEEN, 7, 2]
        ]
      }
    ],
    marowakItems: [[Item.METAL_COAT], [Item.DEEP_SEA_TOOTH]],
    shinyChance: 1 / 100,
    rewards: ItemComponentsNoFossilOrScarf,
    getRewards(player: Player) {
      const ownsCharcadet = ownedPokemons(player).some(
        (pokemon) => pokemon.name === Pkm.CHARCADET
      )
      if (!ownsCharcadet) return []
      const psyLevel = player.synergies.get(Synergy.PSYCHIC) || 0
      const ghostLevel = player.synergies.get(Synergy.GHOST) || 0
      const psychicWins =
        psyLevel === ghostLevel ? chance(1 / 2) : psyLevel > ghostLevel
      return [psychicWins ? Item.AUSPICIOUS_ARMOR : Item.MALICIOUS_ARMOR]
    },
    getRewardsPropositions(_player: Player, shinyEncounter: boolean) {
      if (shinyEncounter) {
        return pickNRandomIn(
          ShinyItems.filter((o) => o !== Item.RED_SCALE),
          3
        )
      } else {
        return pickNRandomIn(
          [...ItemComponentsNoFossilOrScarf, Item.FOSSIL_STONE],
          3
        )
      }
    }
  },

  19: {
    name: "tower_duo",
    avatar: Pkm.LUGIA,
    emotion: Emotion.DETERMINED,
    board: [
      [Pkm.LUGIA, 3, 2],
      [Pkm.HO_OH, 5, 2]
    ],
    variants: [
      {
        name: "pkm.SOLGALEO",
        avatar: Pkm.SOLGALEO,
        board: [
          [Pkm.SOLGALEO, 3, 2],
          [Pkm.LUNALA, 5, 2]
        ]
      },
      {
        name: "pkm.XERNEAS",
        avatar: Pkm.XERNEAS,
        board: [
          [Pkm.XERNEAS, 3, 2],
          [Pkm.YVELTAL, 5, 2]
        ],
        statBoosts: {
          [Stat.HP]: 100,
          [Stat.PP]: +40
        }
      },
      {
        name: "pkm.DARKRAI",
        avatar: Pkm.DARKRAI,
        board: [
          [Pkm.CRESSELIA, 3, 2],
          [Pkm.DARKRAI, 5, 2]
        ],
        statBoosts: {
          [Stat.HP]: 100,
          [Stat.ATK]: 5,
          [Stat.DEF]: 5,
          [Stat.SPE_DEF]: 5,
          [Stat.AP]: -50
        }
      },
      {
        name: "pkm.ORIGIN_DIALGA",
        avatar: Pkm.ORIGIN_DIALGA,
        board: [
          [Pkm.ORIGIN_DIALGA, 3, 2],
          [Pkm.ORIGIN_PALKIA, 5, 2]
        ],
        statBoosts: {
          [Stat.HP]: 50,
          [Stat.DEF]: 5,
          [Stat.SPE_DEF]: 5,
          [Stat.PP]: +40
        }
      },
      {
        name: "pkm.ZEKROM",
        avatar: Pkm.ZEKROM,
        board: [
          [Pkm.ZEKROM, 3, 2],
          [Pkm.RESHIRAM, 5, 2]
        ],
        statBoosts: {
          [Stat.HP]: 150,
          [Stat.DEF]: 5,
          [Stat.SPE_DEF]: 5
        }
      },
      {
        name: "pkm.ZACIAN_CROWNED",
        avatar: Pkm.ZACIAN_CROWNED,
        board: [
          [Pkm.ZACIAN_CROWNED, 3, 2],
          [Pkm.ZAMAZENTA_CROWNED, 5, 2]
        ],
        statBoosts: {
          [Stat.HP]: 100,
          [Stat.DEF]: 5,
          [Stat.SPE_DEF]: 5
        }
      },
      {
        name: "pkm.MARSHADOW",
        avatar: Pkm.MARSHADOW,
        board: [[Pkm.MARSHADOW, 4, 2]],
        marowakItems: [[Item.STAR_PIECE, Item.SACRED_ASH]],
        statBoosts: {
          [Stat.HP]: 450,
          [Stat.ATK]: 20,
          [Stat.DEF]: 10,
          [Stat.SPE_DEF]: 10,
          [Stat.SPEED]: 10,
          [Stat.PP]: +50
        }
      },
    ],
    statBoosts: {
      [Stat.HP]: 50,
      [Stat.DEF]: 5,
      [Stat.SPE_DEF]: 5
    },
    marowakItems: [[Item.STAR_PIECE], [Item.SACRED_ASH]],
    rewards: ItemComponentsNoFossilOrScarf,
    getRewards(player: Player) {
      return giveWeightedComponents(player, 2)
    }
  },

  24: {
    name: "legendary_birds",
    avatar: Pkm.ZAPDOS,
    board: [
      [Pkm.ZAPDOS, 2, 2],
      [Pkm.MOLTRES, 4, 2],
      [Pkm.ARTICUNO, 6, 2]
    ],
    variants: [
      {
        name: "pkm.GALARIAN_ZAPDOS",
        avatar: Pkm.GALARIAN_ZAPDOS,
        board: [
          [Pkm.GALARIAN_ZAPDOS, 2, 2],
          [Pkm.GALARIAN_MOLTRES, 4, 2],
          [Pkm.GALARIAN_ARTICUNO, 6, 2]
        ]
      },
      {
        name: "pkm.VENUSAUR",
        avatar: Pkm.VENUSAUR,
        board: [
          [Pkm.VENUSAUR, 2, 2],
          [Pkm.CHARIZARD, 4, 2],
          [Pkm.BLASTOISE, 6, 2]
        ],
        statBoosts: {
          [Stat.HP]: 100,
          [Stat.ATK]: +10
        }
      },
      {
        name: "pkm.MEGANIUM",
        avatar: Pkm.MEGANIUM,
        board: [
          [Pkm.MEGANIUM, 2, 2],
          [Pkm.TYPHLOSION, 4, 2],
          [Pkm.FERALIGATR, 6, 2]
        ],
        statBoosts: {
          [Stat.HP]: 100,
          [Stat.ATK]: +10
        }
      },
      {
        name: "pkm.SCEPTILE",
        avatar: Pkm.SCEPTILE,
        board: [
          [Pkm.SCEPTILE, 2, 2],
          [Pkm.BLAZIKEN, 4, 2],
          [Pkm.SWAMPERT, 6, 2]
        ],
        statBoosts: {
          [Stat.HP]: 100,
          [Stat.ATK]: +10
        }
      },
      {
        name: "pkm.TORTERRA",
        avatar: Pkm.TORTERRA,
        board: [
          [Pkm.TORTERRA, 2, 2],
          [Pkm.INFERNAPE, 4, 2],
          [Pkm.EMPOLEON, 6, 2]
        ],
        statBoosts: {
          [Stat.HP]: 100,
          [Stat.ATK]: +10
        }
      },
      {
        name: "pkm.SERPERIOR",
        avatar: Pkm.SERPERIOR,
        board: [
          [Pkm.SERPERIOR, 2, 2],
          [Pkm.EMBOAR, 4, 2],
          [Pkm.SAMUROTT, 6, 2]
        ],
        statBoosts: {
          [Stat.HP]: 100,
          [Stat.ATK]: +10
        }
      },
      {
        name: "pkm.CHESNAUGHT",
        avatar: Pkm.CHESNAUGHT,
        board: [
          [Pkm.CHESNAUGHT, 2, 2],
          [Pkm.DELPHOX, 4, 2],
          [Pkm.GRENINJA, 6, 2]
        ],
        statBoosts: {
          [Stat.HP]: 100,
          [Stat.ATK]: +10
        }
      },
      {
        name: "pkm.DECIDUEYE",
        avatar: Pkm.DECIDUEYE,
        board: [
          [Pkm.DECIDUEYE, 2, 2],
          [Pkm.INCINEROAR, 4, 2],
          [Pkm.PRIMARINA, 6, 2]
        ],
        statBoosts: {
          [Stat.HP]: 100,
          [Stat.ATK]: +10
        }
      },
      {
        name: "pkm.RILLABOOM",
        avatar: Pkm.RILLABOOM,
        board: [
          [Pkm.RILLABOOM, 2, 2],
          [Pkm.CINDERACE, 4, 2],
          [Pkm.INTELEON, 6, 2]
        ],
        statBoosts: {
          [Stat.ATK]: +10
        }
      },

    ],
    statBoosts: {
      [Stat.HP]: 100,
      [Stat.DEF]: 10,
      [Stat.SPE_DEF]: 10,
      [Stat.AP]: 50
    },
    marowakItems: [
      [Item.XRAY_VISION, Item.BLUE_ORB],
      [Item.SOUL_DEW, Item.POKEMONOMICON],
      [Item.AQUA_EGG, Item.STAR_DUST]
    ],
    rewards: CraftableItemsNoScarves,
    getRewards(player: Player) {
      for (const pokemon of ownedPokemons(player)) {
        const signature = SIGNATURE_ITEMS[pokemon.name]
        if (signature) return [signature]
      }
      return []
    },
    getRewardsPropositions() {
      return proposeCraftableItems()
    }
  },

  28: {
    name: "legendary_beasts",
    avatar: Pkm.SUICUNE,
    emotion: Emotion.DETERMINED,
    board: [
      [Pkm.ENTEI, 2, 2],
      [Pkm.RAIKOU, 4, 2],
      [Pkm.SUICUNE, 6, 2]
    ],
    variants: [
      {
        name: "pkm.OKIDOGI",
        avatar: Pkm.OKIDOGI,
        board: [
          [Pkm.OKIDOGI, 2, 2],
          [Pkm.MUNKIDORI, 4, 2],
          [Pkm.FEZANDIPITI, 6, 2]
        ],
        statBoosts: {
          [Stat.HP]: 100
        }
      },
      {
        name: "pkm.OGERPON_CORNERSTONE",
        avatar: Pkm.OGERPON_CORNERSTONE,
        board: [
          [Pkm.OGERPON_CORNERSTONE_MASK, 2, 2],
          [Pkm.OGERPON_HEARTHFLAME_MASK, 3, 2],
          [Pkm.OGERPON_WELLSPRING_MASK, 4, 2],
          [Pkm.OGERPON_TEAL_MASK, 5, 2]
        ],
        statBoosts: {
          [Stat.HP]: 150
        }
      },
      {
        name: "pkm.DEOXYS",
        avatar: Pkm.DEOXYS,
        board: [
          [Pkm.DEOXYS, 2, 2],
          [Pkm.DEOXYS_ATTACK, 3, 2],
          [Pkm.DEOXYS_DEFENSE, 4, 2],
          [Pkm.DEOXYS_SPEED, 5, 2]
        ],
        statBoosts: {
          [Stat.HP]: 150
        }
      }
    ],
    statBoosts: {
      [Stat.HP]: 100,
      [Stat.DEF]: 10,
      [Stat.SPE_DEF]: 10,
      [Stat.ATK]: 10,
      [Stat.SPEED]: 10,
      [Stat.PP]: 80,
      [Stat.AP]: 50
    },
    marowakItems: [
      [Item.ASSAULT_VEST, Item.ROCKY_HELMET],
      [Item.XRAY_VISION, Item.PUNCHING_GLOVE],
      [Item.DEEP_SEA_TOOTH, Item.CHOICE_SPECS]
    ],
    rewards: CraftableItemsNoScarves,
    getRewardsPropositions() {
      return proposeCraftableItems()
    }
  },

  32: {
    name: "super_ancients",
    avatar: Pkm.RAYQUAZA,
    emotion: Emotion.DETERMINED,
    board: [
      [Pkm.PRIMAL_KYOGRE, 2, 2],
      [Pkm.MEGA_RAYQUAZA, 4, 2],
      [Pkm.PRIMAL_GROUDON, 6, 2]
    ],
    statBoosts: {
      [Stat.HP]: 200,
      [Stat.DEF]: 15,
      [Stat.SPE_DEF]: 15,
      [Stat.ATK]: 10
    },
    marowakItems: [
      [Item.BLUE_ORB, Item.AQUA_EGG, Item.SOUL_DEW],
      [Item.GREEN_ORB, Item.STAR_DUST, Item.POWER_LENS],
      [Item.RED_ORB, Item.FLAME_ORB, Item.PROTECTIVE_PADS]
    ],
    rewards: CraftableItemsNoScarves,
    getRewardsPropositions() {
      return proposeCraftableItems()
    }
  },

  36: {
    name: "legendary_giants",
    avatar: Pkm.REGICE,
    emotion: Emotion.DETERMINED,
    board: [
      [Pkm.REGIELEKI, 1, 3],
      [Pkm.REGICE, 2, 3],
      [Pkm.REGIGIGAS, 3, 3],
      [Pkm.REGIROCK, 4, 3],
      [Pkm.REGISTEEL, 5, 3],
      [Pkm.REGIDRAGO, 6, 3]
    ],
    statBoosts: {
      [Stat.HP]: 50
    },
    marowakItems: [
      [],
      [Item.ABILITY_SHIELD, Item.GRACIDEA_FLOWER, Item.GREEN_ORB],
      [Item.DYNAMAX_BAND],
      [Item.ABILITY_SHIELD, Item.GRACIDEA_FLOWER, Item.GREEN_ORB],
      [Item.ABILITY_SHIELD, Item.GRACIDEA_FLOWER, Item.GREEN_ORB],
      []
    ],
    rewards: CraftableItemsNoScarves,
    getRewardsPropositions() {
      return proposeCraftableItems()
    }
  },

  40: {
    name: "pkm.ARCEUS",
    avatar: Pkm.ARCEUS,
    emotion: Emotion.INSPIRED,
    board: [
      [Pkm.DIALGA, 2, 3],
      [Pkm.GIRATINA, 4, 3],
      [Pkm.PALKIA, 6, 3],
      [Pkm.ARCEUS, 4, 2]
    ],
    statBoosts: {
      [Stat.HP]: 200,
      [Stat.DEF]: 15,
      [Stat.SPE_DEF]: 15,
      [Stat.ATK]: 10,
      [Stat.AP]: 50
    },
    marowakItems: [
      [Item.DYNAMAX_BAND],
      [Item.DYNAMAX_BAND],
      [Item.DYNAMAX_BAND],
      [Item.DYNAMAX_BAND]
    ],
    rewards: FINAL_STAGE_REWARDS,
    getRewards() {
      return [...FINAL_STAGE_REWARDS]
    }
  }
}
