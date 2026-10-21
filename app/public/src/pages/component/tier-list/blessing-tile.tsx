import { Blessings } from "../../../../../config/game/blessings"
import type { Blessing } from "../../../../../types/enum/Blessing"
import { blessingTierClass } from "../synergy/blessing-tooltip-card"
import { getBlessingShortLabel } from "./blessing-short-label"
import { BlessingSynergyBadges } from "./blessing-synergy-badges"

export function BlessingTile({ blessing }: { blessing: Blessing }) {
  const shortLabel = getBlessingShortLabel(blessing)
  return (
    <div className={`tier-list-blessing-icon ${blessingTierClass(blessing)}`}>
      <img
        src={`/assets/blessings/${Blessings[blessing].icon}.svg`}
        alt={blessing}
      />
      <BlessingSynergyBadges blessing={blessing} />
      {shortLabel && <span>{shortLabel}</span>}
    </div>
  )
}
