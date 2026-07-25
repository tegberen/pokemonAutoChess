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
export const DOUBLE_UP_PVE_MIN_SCALE = 1.25 // never weaker than this × solo encounter
export const DOUBLE_UP_PVE_MAX_SCALE = 10

// scaled bosses gain more bulk than damage: hp × scale^1.2, atk × scale^0.8
export const DOUBLE_UP_PVE_HP_BIAS = 1.4

// below parity early game, parity at stage 10, then well beyond it since
// items and synergies make boards much stronger than their raw stats
export function getDoubleUpPvePowerFactor(stageLevel: number): number {
  const factor =
    stageLevel < 10 ? 0.4 + 0.06 * stageLevel : 1 + 0.15 * (stageLevel - 10)
  return DOUBLE_UP_PVE_POWER_FACTOR * factor
}

// per-stage tuning multiplier applied to the final stat scale
export const DOUBLE_UP_PVE_STAGE_TUNING: { [stageLevel: number]: number } = {
  1: 0.6,
  2: 0.6,
  3: 0.6,
  9: 0.6,
  14: 0.6,
  19: 0.6,
  24: 0.6,
  28: 0.6,
  32: 0.6,
  36: 0.6,
  40: 0.6
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
  variants?: Pick<PVEStage, "name" | "avatar" | "board" | "emotion" | "marowakItems" | "statBoosts">[]
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
      const randomComponent = pickRandomIn(ItemComponentsNoFossilOrScarf)
      player.randomComponentsGiven.push(randomComponent)
      return [randomComponent]
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
      return pickNRandomIn(
        ItemComponentsNoFossilOrScarf.filter(
          (i) => player.randomComponentsGiven.includes(i) === false
        ),
        3
      )
    }
  },

  3: {
    // one random mini-boss, normalized to 150 HP / 10 ATK / 0 DEF / 0 SPE_DEF,
    // with an AP malus increasing with rarity (stronger abilities)
    name: "pkm.RAPIDASH",
    avatar: Pkm.RAPIDASH,
    board: [[Pkm.RAPIDASH, 4, 2]],
    statBoosts: {
      [Stat.HP]: 10,
      [Stat.ATK]: -4,
      [Stat.DEF]: -5,
      [Stat.SPE_DEF]: -7,
      [Stat.AP]: -10
    },
    variants: [
      {
        name: "pkm.LARVITAR",
        avatar: Pkm.LARVITAR,
        board: [[Pkm.LARVITAR, 4, 2]],
        statBoosts: { [Stat.HP]: 75, [Stat.ATK]: 3, [Stat.DEF]: -5, [Stat.SPE_DEF]: -4 }
      },
      {
        name: "pkm.SANDSHREW",
        avatar: Pkm.SANDSHREW,
        board: [[Pkm.SANDSHREW, 4, 2]],
        statBoosts: { [Stat.HP]: 60, [Stat.ATK]: 5, [Stat.DEF]: -6, [Stat.SPE_DEF]: -3 }
      },
      {
        name: "pkm.PYUKUMUKU",
        avatar: Pkm.PYUKUMUKU,
        board: [[Pkm.PYUKUMUKU, 4, 2]],
        statBoosts: { [Stat.DEF]: -25, [Stat.SPE_DEF]: -25, [Stat.AP]: -40 }
      },
      {
        name: "pkm.GASTRODON_EAST_SEA",
        avatar: Pkm.GASTRODON_EAST_SEA,
        board: [[Pkm.GASTRODON_EAST_SEA, 4, 2]],
        statBoosts: { [Stat.HP]: -120, [Stat.ATK]: -9, [Stat.DEF]: -10, [Stat.SPE_DEF]: -12, [Stat.AP]: -30 }
      },
      {
        name: "pkm.FENNEKIN",
        avatar: Pkm.FENNEKIN,
        board: [[Pkm.FENNEKIN, 4, 2]],
        statBoosts: { [Stat.HP]: 70, [Stat.ATK]: 5, [Stat.DEF]: -4, [Stat.SPE_DEF]: -4 }
      },
      {
        name: "pkm.SHINX",
        avatar: Pkm.SHINX,
        board: [[Pkm.SHINX, 4, 2]],
        statBoosts: { [Stat.HP]: 30, [Stat.ATK]: -3, [Stat.DEF]: -10, [Stat.SPE_DEF]: -10, [Stat.AP]: -30 }
      },
      {
        name: "pkm.MEGA_MAWILE",
        avatar: Pkm.MEGA_MAWILE,
        board: [[Pkm.MEGA_MAWILE, 4, 2]],
        statBoosts: { [Stat.HP]: -70, [Stat.ATK]: -13, [Stat.DEF]: -20, [Stat.SPE_DEF]: -6, [Stat.AP]: -50 }
      },
      {
        name: "pkm.GLACEON",
        avatar: Pkm.GLACEON,
        board: [[Pkm.GLACEON, 4, 2]],
        statBoosts: { [Stat.HP]: 30, [Stat.ATK]: -2, [Stat.DEF]: -6, [Stat.SPE_DEF]: -4, [Stat.AP]: -10 }
      },
      {
        name: "pkm.KECLEON",
        avatar: Pkm.KECLEON,
        board: [[Pkm.KECLEON, 4, 2]],
        statBoosts: { [Stat.HP]: -50, [Stat.ATK]: -12, [Stat.DEF]: -6, [Stat.SPE_DEF]: -6, [Stat.AP]: -40 }
      },
      {
        name: "pkm.SLITHER_WING",
        avatar: Pkm.SLITHER_WING,
        board: [[Pkm.SLITHER_WING, 4, 2]],
        statBoosts: { [Stat.HP]: -30, [Stat.ATK]: -10, [Stat.DEF]: -6, [Stat.SPE_DEF]: -8, [Stat.AP]: -40 }
      },
      {
        name: "pkm.MUDSDALE",
        avatar: Pkm.MUDSDALE,
        board: [[Pkm.MUDSDALE, 4, 2]],
        statBoosts: { [Stat.HP]: -100, [Stat.ATK]: -16, [Stat.DEF]: -12, [Stat.SPE_DEF]: -8, [Stat.AP]: -30 }
      },
      {
        name: "pkm.HISUI_ARCANINE",
        avatar: Pkm.HISUI_ARCANINE,
        board: [[Pkm.HISUI_ARCANINE, 4, 2]],
        statBoosts: { [Stat.HP]: -150, [Stat.ATK]: -12, [Stat.DEF]: -12, [Stat.SPE_DEF]: -10, [Stat.AP]: -30 }
      },
      {
        name: "pkm.CRAMORANT",
        avatar: Pkm.CRAMORANT,
        board: [[Pkm.CRAMORANT, 4, 2]],
        statBoosts: { [Stat.HP]: -50, [Stat.ATK]: -9, [Stat.DEF]: -6, [Stat.SPE_DEF]: -6, [Stat.AP]: -40 }
      },
      {
        name: "pkm.GALARIAN_ZIGZAGOON",
        avatar: Pkm.GALARIAN_ZIGZAGOON,
        board: [[Pkm.GALARIAN_ZIGZAGOON, 4, 2]],
        statBoosts: { [Stat.HP]: 70, [Stat.ATK]: 4, [Stat.DEF]: -10, [Stat.SPE_DEF]: -4 }
      },
      {
        name: "pkm.MAGCARGO",
        avatar: Pkm.MAGCARGO,
        board: [[Pkm.MAGCARGO, 4, 2]],
        statBoosts: { [Stat.HP]: -30, [Stat.ATK]: -6, [Stat.DEF]: -16, [Stat.SPE_DEF]: -10, [Stat.AP]: -20 }
      },
      {
        name: "pkm.BRELOOM",
        avatar: Pkm.BRELOOM,
        board: [[Pkm.BRELOOM, 4, 2]],
        statBoosts: { [Stat.HP]: -20, [Stat.ATK]: -8, [Stat.DEF]: -6, [Stat.SPE_DEF]: -6, [Stat.AP]: -10 }
      },
      {
        name: "pkm.RABOOT",
        avatar: Pkm.RABOOT,
        board: [[Pkm.RABOOT, 4, 2]],
        statBoosts: { [Stat.HP]: 70, [Stat.ATK]: 3, [Stat.DEF]: -4, [Stat.SPE_DEF]: -4, [Stat.AP]: -10 }
      },
      {
        name: "pkm.DUCKLETT",
        avatar: Pkm.DUCKLETT,
        board: [[Pkm.DUCKLETT, 4, 2]],
        statBoosts: { [Stat.HP]: 45, [Stat.ATK]: -1, [Stat.DEF]: -6, [Stat.SPE_DEF]: -6, [Stat.AP]: -10 }
      },
      {
        name: "pkm.TOTODILE",
        avatar: Pkm.TOTODILE,
        board: [[Pkm.TOTODILE, 4, 2]],
        statBoosts: { [Stat.HP]: 75, [Stat.ATK]: 3, [Stat.DEF]: -4, [Stat.SPE_DEF]: -4 }
      },
      {
        name: "pkm.LUCARIO",
        avatar: Pkm.LUCARIO,
        board: [[Pkm.LUCARIO, 4, 2]],
        statBoosts: { [Stat.HP]: -20, [Stat.ATK]: -8, [Stat.DEF]: -8, [Stat.SPE_DEF]: -8, [Stat.AP]: -20 }
      },
      {
        name: "pkm.CLEFFA",
        avatar: Pkm.CLEFFA,
        board: [[Pkm.CLEFFA, 4, 2]],
        statBoosts: { [Stat.HP]: 80, [Stat.ATK]: 5, [Stat.DEF]: -2, [Stat.SPE_DEF]: -2 }
      },
      {
        name: "pkm.MACHOP",
        avatar: Pkm.MACHOP,
        board: [[Pkm.MACHOP, 4, 2]],
        statBoosts: { [Stat.HP]: 80, [Stat.ATK]: 4, [Stat.DEF]: -6, [Stat.SPE_DEF]: -6 }
      },
      {
        name: "pkm.ARBOLIVA",
        avatar: Pkm.ARBOLIVA,
        board: [[Pkm.ARBOLIVA, 4, 2]],
        statBoosts: { [Stat.HP]: -50, [Stat.ATK]: -6, [Stat.DEF]: -6, [Stat.SPE_DEF]: -8, [Stat.AP]: -10 }
      },
      {
        name: "pkm.UNOWN_A",
        avatar: Pkm.UNOWN_A,
        board: [[Pkm.UNOWN_A, 4, 2]],
        statBoosts: { [Stat.HP]: 50, [Stat.ATK]: 9, [Stat.DEF]: -2, [Stat.SPE_DEF]: -2 }
      },
      {
        name: "pkm.PIKACHU_SURFER",
        avatar: Pkm.PIKACHU_SURFER,
        board: [[Pkm.PIKACHU_SURFER, 4, 2]],
        statBoosts: { [Stat.HP]: 30, [Stat.ATK]: 2, [Stat.DEF]: -4, [Stat.SPE_DEF]: -6, [Stat.AP]: -10 }
      }
    ],
    rewards: ItemComponentsNoFossilOrScarf,
    getRewards(player) {
      const randomComponent = pickRandomIn(
        ItemComponentsNoFossilOrScarf.filter(
          (i) => player.randomComponentsGiven.includes(i) === false
        )
      )
      player.randomComponentsGiven.push(randomComponent)
      return [randomComponent]
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
      else return pickNRandomIn(ItemComponentsNoFossilOrScarf, 1)
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
    ],
    marowakItems: [[Item.METAL_COAT], [Item.DEEP_SEA_TOOTH]],
    shinyChance: 1 / 100,
    rewards: ItemComponentsNoFossilOrScarf,
    getRewards(player: Player) {
      const rewards: Item[] = []
      if (
        schemaValues(player.board).some((p) => p.name === Pkm.CHARCADET) ||
        player.pokemonsTrainingInDojo.some(
          (p) => p.pokemon.name === Pkm.CHARCADET
        )
      ) {
        const psyLevel = player.synergies.get(Synergy.PSYCHIC) || 0
        const ghostLevel = player.synergies.get(Synergy.GHOST) || 0
        const armorReceived =
          psyLevel > ghostLevel
            ? Item.AUSPICIOUS_ARMOR
            : psyLevel < ghostLevel
              ? Item.MALICIOUS_ARMOR
              : chance(1 / 2)
                ? Item.AUSPICIOUS_ARMOR
                : Item.MALICIOUS_ARMOR
        rewards.push(armorReceived)
      }
      return rewards
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
      const componentsWeights = ItemComponentsNoFossilOrScarf.reduce((o, i) => {
        return { ...o, [i]: player.randomComponentsGiven.includes(i) ? 1 : 2 } // twice the weight if the player doesn't have it yet
      }, {})
      const randomComponentsGiven: Item[] = []
      for (let i = 0; i < 2; i++) {
        randomComponentsGiven.push(randomWeighted(componentsWeights)!)
      }

      player.randomComponentsGiven.push(...randomComponentsGiven)
      return randomComponentsGiven
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
      for (const p of schemaValues(player.board)) {
        if (p.name === Pkm.ZACIAN) {
          return [Item.RUSTED_SWORD]
        }
        if (p.name === Pkm.ZAMAZENTA) {
          return [Item.RUSTED_SHIELD]
        }
        if (p.name === Pkm.KYUREM) {
          return [Item.DNA_SPLICER]
        }
      }
      return []
    },
    getRewardsPropositions(player: Player) {
      const rewards = pickNRandomIn(CraftableNoStonesOrScarves, 2)
      rewards.push(
        pickRandomIn(
          CraftableItemsNoScarves.filter((o) => !rewards.includes(o))
        )
      )
      return rewards
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
          [Pkm.OGERPON_CORNERSTONE_MASK, 3, 2],
          [Pkm.OGERPON_HEARTHFLAME_MASK, 4, 2],
          [Pkm.OGERPON_WELLSPRING_MASK, 5, 2],
          [Pkm.OGERPON_TEAL_MASK, 6, 2]
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
    getRewardsPropositions(player: Player) {
      const rewards = pickNRandomIn(CraftableNoStonesOrScarves, 2)
      rewards.push(
        pickRandomIn(
          CraftableItemsNoScarves.filter((o) => !rewards.includes(o))
        )
      )
      return rewards
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
    getRewardsPropositions(player: Player) {
      const rewards = pickNRandomIn(CraftableNoStonesOrScarves, 2)
      rewards.push(
        pickRandomIn(
          CraftableItemsNoScarves.filter((o) => !rewards.includes(o))
        )
      )
      return rewards
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
    getRewardsPropositions(player: Player) {
      const rewards = pickNRandomIn(CraftableNoStonesOrScarves, 2)
      rewards.push(
        pickRandomIn(
          CraftableItemsNoScarves.filter((o) => !rewards.includes(o))
        )
      )
      return rewards
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
    rewards: [Item.RARE_CANDY, Item.SACRED_ASH, Item.GOLD_BOW],
    getRewards(player: Player) {
      return [Item.RARE_CANDY, Item.SACRED_ASH, Item.GOLD_BOW]
    }
  }
}
