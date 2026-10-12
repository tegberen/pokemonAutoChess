import { useTranslation } from "react-i18next"
import { Blessings } from "../../../../../config/game/blessings"
import {
  Blessing,
  HERO_BLESSING_GIFT,
  HERO_BLESSING_POKEMON
} from "../../../../../types/enum/Blessing"
import { addIconsToDescription } from "../../utils/descriptions"
import "./blessing-description.css"

const TRAILING_POKEMON_GRANT = /^([\s\S]*?\S)\s+((?:Gain|Unlock) [^.\n]*\.)$/
const GYM_TRAINER_GRANT = /^([\s\S]*?\S)\s+(Gain [\s\S]*)$/

function hasPokemonGrant(blessing: Blessing) {
  return (
    blessing in HERO_BLESSING_GIFT ||
    blessing in HERO_BLESSING_POKEMON ||
    blessing === Blessing.WEATHER_INSTITUTE
  )
}

export function BlessingDescription({ blessing }: { blessing: Blessing }) {
  const { t } = useTranslation()
  const description = t(`blessing.${blessing}.description`)
  const { synergy, family } = Blessings[blessing]
  const parts =
    family === "GYM_TRAINER"
      ? description.match(GYM_TRAINER_GRANT)
      : synergy !== undefined || hasPokemonGrant(blessing)
        ? description.match(TRAILING_POKEMON_GRANT)
        : null

  if (!parts) return <p>{addIconsToDescription(description)}</p>
  return (
    <>
      <p>{addIconsToDescription(parts[1])}</p>
      <div className="blessing-grant-block">
        <hr className="blessing-grant-divider" />
        <p className="blessing-grant">{addIconsToDescription(parts[2])}</p>
      </div>
    </>
  )
}
