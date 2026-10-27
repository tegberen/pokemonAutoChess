import { Blessing, HATCHERY_EGG_CHANCE_PER_KO } from "../types/enum/Blessing"
import { distanceE } from "../utils/distance"
import { chance } from "../utils/random"
import { giveRandomEgg } from "./eggs"
import { getHatchTime } from "./evolution-logic/hatch-time"
import type { PokemonEntity } from "./pokemon-entity"

// entities live for one fight, so marking the caster caps it at one egg a fight
const castersThatGaveAnEgg = new WeakSet<PokemonEntity>()

export function grantHatcheryEggOnLeafStormKO(fallen: PokemonEntity) {
  // the release marks a storm finished before its strike lands, so the
  // struck targets are matched by name rather than by radius
  const storm = fallen.simulation.leafStorms.find(
    (leafStorm) =>
      leafStorm.team !== fallen.team &&
      leafStorm.caster.heroBlessings.has(Blessing.HATCHERY) &&
      (leafStorm.targets.includes(fallen) ||
        (!leafStorm.finished &&
          distanceE(
            fallen.positionX,
            fallen.positionY,
            leafStorm.x,
            leafStorm.y
          ) <= leafStorm.radius))
  )
  const owner = storm?.caster.player
  if (!storm || !owner || storm.caster.isGhostOpponent) return
  if (castersThatGaveAnEgg.has(storm.caster)) return
  if (!chance(HATCHERY_EGG_CHANCE_PER_KO, storm.caster)) return
  const egg = giveRandomEgg(owner, false, fallen.simulation.room.state)
  if (!egg) return
  castersThatGaveAnEgg.add(storm.caster)
  egg.stacks = getHatchTime(egg, owner) - 1
}
