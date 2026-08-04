import { Schema, type } from "@colyseus/schema"
import { ExpTable } from "../../config"
import { CLIMBING_THE_LADDER_DISCOUNT_FROM_LEVEL } from "../../types/enum/Blessing"
import type { IExperienceManager } from "../../types"
import type { SpecialGameRule } from "../../types/enum/SpecialGameRule"

export default class ExperienceManager
  extends Schema
  implements IExperienceManager
{
  @type("uint8") level: number
  @type("uint8") experience: number
  @type("uint8") expNeeded: number
  @type("uint8") maxLevel: number
  @type("uint8") expDiscount = 0

  constructor() {
    super()
    this.level = 2
    this.experience = 0
    this.expNeeded = ExpTable[2]
    this.maxLevel = 9
  }

  expNeededAtLevel(level: number) {
    const base = ExpTable[level] ?? 255
    return level >= CLIMBING_THE_LADDER_DISCOUNT_FROM_LEVEL
      ? Math.max(1, base - this.expDiscount)
      : base
  }

  canLevelUp() {
    return this.level < this.maxLevel
  }

  addExperience(quantity: number) {
    let expToAdd = quantity
    while (this.checkForLevelUp(expToAdd)) {
      expToAdd -= this.expNeededAtLevel(this.level)
      this.level += 1
      this.expNeeded = this.expNeededAtLevel(this.level)
    }
  }

  checkForLevelUp(quantity: number) {
    if (
      this.experience + quantity >= this.expNeededAtLevel(this.level) &&
      this.level < this.maxLevel
    ) {
      return true
    } else {
      this.experience += quantity
      return false
    }
  }
}

export function getLevelUpCost(specialGameRule?: SpecialGameRule | null) {
  const cost = 4
  return cost
}
