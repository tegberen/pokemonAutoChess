import {
  Blessing,
  BLESSING_SELECTION_STAGES,
  BlessingTier
} from "../../types/enum/Blessing"
import { randomWeighted } from "../../utils/random"

export interface BlessingDefinition {
  tier: BlessingTier
  availableAtStages: number[]
  icon: string
  grantsPokemonImmediately: boolean
}

export const Blessings: { [blessing in Blessing]: BlessingDefinition } = {
  [Blessing.PEARL]: {
    tier: BlessingTier.SILVER,
    availableAtStages: BLESSING_SELECTION_STAGES,
    icon: "PEARL",
    grantsPokemonImmediately: false
  }
}

export const BlessingTierChanceByStage: {
  [stage: number]: { [tier in BlessingTier]: number }
} = {
  4: {
    [BlessingTier.SILVER]: 0.6,
    [BlessingTier.GOLD]: 0.3,
    [BlessingTier.PRISMATIC]: 0.1
  },
  12: {
    [BlessingTier.SILVER]: 0.35,
    [BlessingTier.GOLD]: 0.45,
    [BlessingTier.PRISMATIC]: 0.2
  }
}

export function rollBlessingTierForStage(stage: number): BlessingTier {
  return (
    randomWeighted(BlessingTierChanceByStage[stage]) ?? BlessingTier.SILVER
  )
}

export function getBlessingsAvailable(
  tier: BlessingTier,
  stage: number
): Blessing[] {
  return (Object.keys(Blessings) as Blessing[]).filter((blessing) => {
    const definition = Blessings[blessing]
    return (
      definition.tier === tier && definition.availableAtStages.includes(stage)
    )
  })
}
