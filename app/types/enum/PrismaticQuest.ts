import { Item } from "./Item"

export enum PrismaticQuest {
  CRIT = "CRIT",
  GROW = "GROW",
  SHINE = "SHINE",
  EPIC = "EPIC",
  EXPAND = "EXPAND",
  ASCEND = "ASCEND",
  INDECISION = "INDECISION",
  ABSORB = "ABSORB",
  REVIVE = "REVIVE",
  MATURE = "MATURE",
  PILLAGE = "PILLAGE",
  REROLL = "REROLL"
}

export interface PrismaticQuestDefinition {
  target: number
  reward: Item
  icon: string
  tracksBest?: boolean
}

export const PrismaticQuestDefinitions: {
  [quest in PrismaticQuest]: PrismaticQuestDefinition
} = {
  [PrismaticQuest.CRIT]: {
    target: 100,
    reward: Item.GOLD_BOTTLE_CAP,
    icon: "crit_quest",
    tracksBest: true
  },
  [PrismaticQuest.GROW]: {
    target: 1000,
    reward: Item.DYNAMAX_BAND,
    icon: "grow_quest",
    tracksBest: true
  },
  [PrismaticQuest.SHINE]: {
    target: 6,
    reward: Item.SHINY_STONE,
    icon: "shine_quest",
    tracksBest: true
  },
  [PrismaticQuest.EPIC]: {
    target: 6,
    reward: Item.EVIOLITE,
    icon: "epic_ultra_quest",
    tracksBest: true
  },
  [PrismaticQuest.EXPAND]: {
    target: 9,
    reward: Item.GOLD_BOW,
    icon: "expand_quest"
  },
  [PrismaticQuest.ASCEND]: {
    target: 1,
    reward: Item.STAR_PIECE,
    icon: "ascend_quest"
  },
  [PrismaticQuest.INDECISION]: {
    target: 2,
    reward: Item.GOLD_MASK,
    icon: "indecision_quest"
  },
  [PrismaticQuest.ABSORB]: {
    target: 777,
    reward: Item.ABSORB_BULB,
    icon: "absorb_quest",
    tracksBest: true
  },
  [PrismaticQuest.REVIVE]: {
    target: 10,
    reward: Item.SACRED_ASH,
    icon: "revive_quest"
  },
  [PrismaticQuest.MATURE]: {
    target: 10,
    reward: Item.RARE_CANDY,
    icon: "evolve_two_quest"
  },
  [PrismaticQuest.PILLAGE]: {
    target: 30,
    reward: Item.BOOSTER_ENERGY,
    icon: "pillage_quest"
  },
  [PrismaticQuest.REROLL]: {
    target: 50,
    reward: Item.REPEAT_BALL,
    icon: "reroll_quest"
  }
}

// progress and the claim ride on the synced questProgress map, which is keyed
// by string, so each quest gets its own prefixed key
export function getPrismaticQuestProgressKey(quest: PrismaticQuest) {
  return `PRISMATIC_QUEST_${quest}`
}

export function getPrismaticQuestClaimedKey(quest: PrismaticQuest) {
  return `PRISMATIC_QUEST_CLAIMED_${quest}`
}

export const PrismaticQuestsInOrder = Object.values(PrismaticQuest)
