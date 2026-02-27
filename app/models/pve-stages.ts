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
import { chance, pickNRandomIn, pickRandomIn } from "../utils/random"
import { values } from "../utils/schemas"
import Player from "./colyseus-models/player"

export type PVEStage = {
  name: string
  avatar: Pkm
  emotion?: Emotion
  shinyChance?: number
  rewards?: Item[]
  getRewards?: (player: Player) => Item[]
  getRewardsPropositions?: (player: Player) => Item[]
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
        ]
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
          [Stat.SPE_DEF]: -4
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
    name: "pkm.SPEAROW",
    avatar: Pkm.SPEAROW,
    board: [
      [Pkm.SPEAROW, 3, 1],
      [Pkm.SPEAROW, 5, 1],
      [Pkm.SPEAROW, 4, 2]
    ],
    variants: [
      {
        name: "pkm.STARLY",
        avatar: Pkm.STARLY,
        board: [
          [Pkm.STARLY, 3, 1],
          [Pkm.STARLY, 5, 1],
          [Pkm.STARLY, 4, 2]
        ]
      },
      {
        name: "pkm.PIDGEY",
        avatar: Pkm.PIDGEY,
        board: [
          [Pkm.PIDGEY, 3, 1],
          [Pkm.PIDGEY, 5, 1],
          [Pkm.PIDGEY, 4, 2]
        ]
      },
      {
        name: "pkm.PIDOVE",
        avatar: Pkm.PIDOVE,
        board: [
          [Pkm.PIDOVE, 3, 1],
          [Pkm.PIDOVE, 5, 1],
          [Pkm.PIDOVE, 4, 2]
        ]
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
      }
    ],
    marowakItems: [[Item.KINGS_ROCK]],
    shinyChance: 1 / 100,
    rewards: ItemComponentsNoFossilOrScarf,
    getRewards(player: Player) {
      const randomComponents = pickNRandomIn(ItemComponentsNoFossilOrScarf, 1)
      return randomComponents
    }
  },

  14: {
    name: "pkm.MEWTWO",
    avatar: Pkm.MEWTWO,
    emotion: Emotion.DETERMINED,
    board: [
      [Pkm.MEWTWO, 0, 1],
      [Pkm.MEW, 7, 1]
    ],
    variants: [
      {
        name: "pkm.SOLROCK",
        avatar: Pkm.SOLROCK,
        board: [
          [Pkm.SOLROCK, 0, 1],
          [Pkm.LUNATONE, 7, 1]
        ]
      },
      {
        name: "pkm.ARMAROUGE",
        avatar: Pkm.ARMAROUGE,
        board: [
          [Pkm.ARMAROUGE, 0, 1],
          [Pkm.CERULEDGE, 7, 1]
        ]
      },
      {
        name: "pkm.LATIOS",
        avatar: Pkm.LATIOS,
        board: [
          [Pkm.LATIAS, 0, 1],
          [Pkm.LATIOS, 7, 1]
        ]
      },
      {
        name: "pkm.MANAPHY",
        avatar: Pkm.MANAPHY,
        board: [
          [Pkm.MANAPHY, 0, 1],
          [Pkm.PHIONE, 7, 1]
        ]
      },
    ],
    marowakItems: [[Item.METAL_COAT], [Item.DEEP_SEA_TOOTH]],
    shinyChance: 1 / 100,
    rewards: ItemComponentsNoFossilOrScarf,
    getRewards(player: Player) {
      const rewards: Item[] = []
      if (values(player.board).some((p) => p.name === Pkm.CHARCADET)) {
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
    getRewardsPropositions(_player: Player) {
      return pickNRandomIn(
        [...ItemComponentsNoFossilOrScarf, Item.FOSSIL_STONE],
        3
      )
    }
  },

  19: {
    name: "tower_duo",
    avatar: Pkm.LUGIA,
    emotion: Emotion.DETERMINED,
    board: [
      [Pkm.LUGIA, 3, 1],
      [Pkm.HO_OH, 5, 1]
    ],
    variants: [
      {
        name: "pkm.SOLGALEO",
        avatar: Pkm.SOLGALEO,
        board: [
          [Pkm.SOLGALEO, 3, 1],
          [Pkm.LUNALA, 5, 1]
        ]
      },
      {
        name: "pkm.XERNEAS",
        avatar: Pkm.XERNEAS,
        board: [
          [Pkm.XERNEAS, 3, 1],
          [Pkm.YVELTAL, 5, 1]
        ],
        statBoosts: {
          [Stat.HP]: 50
        }
      },
    ],
    statBoosts: {
      [Stat.HP]: 50,
      [Stat.DEF]: 5,
      [Stat.SPE_DEF]: 5
    },
    marowakItems: [[Item.COMET_SHARD], [Item.SACRED_ASH]],
    rewards: CraftableNoStonesOrScarves,
    getRewards(player: Player) {
      return [pickRandomIn(CraftableNoStonesOrScarves)]
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
          [Stat.HP]: 50,
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
          [Stat.HP]: 50
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
          [Stat.HP]: 50,
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
          [Stat.HP]: 50,
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
          [Stat.HP]: 50
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
          [Stat.HP]: 50,
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
          [Stat.HP]: 50,
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
          [Stat.HP]: -50,
          [Stat.ATK]: -10
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
      for (const p of values(player.board)) {
        if (p.name === Pkm.ZACIAN) {
          return [Item.RUSTED_SWORD]
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
          [Stat.HP]: 50
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
          [Stat.HP]: 100
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
      [Pkm.ARCEUS, 4, 1]
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
    rewards: ShinyItems,
    getRewardsPropositions(player: Player) {
      return pickNRandomIn(ShinyItems, 3)
    }
  }
}
