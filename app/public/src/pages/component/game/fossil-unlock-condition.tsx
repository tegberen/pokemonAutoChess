import { useTranslation } from "react-i18next"
import type { FossilUnlockDefinition } from "../../../../../types/enum/FossilUnlock"
import { addIconsToDescription } from "../../utils/descriptions"
import "./fossil-unlock-condition.css"

/* Shared by the in-game unlock menu and the wiki. The locales lead a gated
   condition with "Level N + "; it is split off into a chip so the sentence
   starts with the actual objective. Tinted by --rarity-color, which the card
   around it sets. */
export function FossilUnlockCondition(props: {
  conditionKey: FossilUnlockDefinition["conditionKey"]
}) {
  const { t } = useTranslation()
  const condition = t(`fossil_unlocks.conditions.${props.conditionKey}`)
  const [, gate, objective] =
    condition.match(/^Level (\d+)\s*\+\s*([\s\S]*)$/) ?? []

  return (
    <>
      {gate && <b className="fossil-unlock-gate">{t("level")} {gate}+</b>}
      {addIconsToDescription(objective ?? condition)}
    </>
  )
}
