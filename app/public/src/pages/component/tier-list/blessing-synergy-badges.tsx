import { Blessings, getBlessingSynergy } from "../../../../../config/game/blessings"
import type { Blessing } from "../../../../../types/enum/Blessing"
import SynergyIcon from "../icons/synergy-icon"

/* a combo blessing shows both of its synergies in one capsule, neither in front
   of the other, since the pair is symmetric */
export function BlessingSynergyBadges(props: { blessing: Blessing }) {
  const { synergies } = Blessings[props.blessing]
  if (synergies) {
    return (
      <span className="blessing-synergy-pair">
        <SynergyIcon type={synergies[0]} size="12px" />
        <SynergyIcon type={synergies[1]} size="12px" />
      </span>
    )
  }

  const synergy = getBlessingSynergy(props.blessing)
  if (!synergy) return null
  return (
    <SynergyIcon type={synergy} size="20px" className="blessing-synergy-badge" />
  )
}
