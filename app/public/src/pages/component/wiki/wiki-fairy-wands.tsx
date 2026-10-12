import { Fragment } from "react"
import { useTranslation } from "react-i18next"
import { SynergyTiersThresholds } from "../../../../../config"
import {
  FAIRY_WANDS_BY_SYNERGY_LEVEL,
  SynergyTiers,
  WAND_PROC_COOLDOWN_MS_BY_WAND
} from "../../../../../config/game/synergies"
import type { Item } from "../../../../../types/enum/Item"
import { Synergy } from "../../../../../types/enum/Synergy"
import { addIconsToDescription } from "../../utils/descriptions"
import "./wiki-fairy-wands.css"

function formatWandCooldown(wand: Item) {
  const cooldownMs = WAND_PROC_COOLDOWN_MS_BY_WAND[wand]
  return cooldownMs === undefined ? "-" : `${cooldownMs / 1000}s`
}

export function WikiFairyWands() {
  const { t: tBase } = useTranslation()
  const t = tBase as any
  const fairyTiers = SynergyTiers[Synergy.FAIRY]
  const fairyThresholds = SynergyTiersThresholds[Synergy.FAIRY]

  return (
    <section className="my-box wiki-fairy-wands">
      <h2>{t("wiki.fairy.title")}</h2>
      <p>{addIconsToDescription(t("wiki.fairy.intro"))}</p>
      <table>
        <thead>
          <tr>
            <th>{t("wiki.fairy.wand")}</th>
            <th>{t("wiki.fairy.effect")}</th>
            <th>{t("wiki.fairy.cooldown")}</th>
          </tr>
        </thead>
        <tbody>
          {FAIRY_WANDS_BY_SYNERGY_LEVEL.map((wands, tierIndex) => (
            <Fragment key={tierIndex}>
              <tr className="wiki-fairy-wands-tier">
                <th scope="rowgroup" colSpan={3}>
                  ({fairyThresholds[tierIndex]}){" "}
                  {t(`effect.${fairyTiers[tierIndex]}`)}
                </th>
              </tr>
              {wands.map((wand) => (
                <tr key={wand}>
                  <th scope="row">{addIconsToDescription(wand)}</th>
                  <td>
                    {addIconsToDescription(t(`wiki.fairy.effects.${wand}`))}
                  </td>
                  <td className="wiki-fairy-wands-cooldown">
                    {formatWandCooldown(wand)}
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </section>
  )
}
