import type { TFunction } from "i18next"
import React, { type ReactNode } from "react"
import { Pkm, PkmIndex } from "../../../../../types/enum/Pokemon"
import { getPortraitSrc } from "../../../../../utils/avatar"
import { addIconsToDescription } from "../../utils/descriptions"

/* Pokemon names are not part of the global description regex, and adding ~1200
   alternatives to a pattern every tooltip in the game runs would be a bad trade.
   The guide tokenises them itself instead: longest first, so SLOWKING never
   matches inside a longer name. */
const pkmTokenRegExp = new RegExp(
  `(?<=\\W|^)(?:${Object.keys(Pkm)
    .sort((a, b) => b.length - a.length)
    .join("|")})(?=\\W|$)`,
  "g"
)

/* Shared by the lesson card and the lesson notes so a name written in CAPS
   renders the same portrait in both, and an author only has to learn the one
   convention. */
export function renderGuideText(text: string, t: TFunction): ReactNode[] {
  const tokens = text.match(pkmTokenRegExp)
  if (!tokens) return [addIconsToDescription(text)]
  const parts = text.split(pkmTokenRegExp)
  return parts.flatMap((part, i) => {
    const token = tokens[i - 1] as Pkm | undefined
    return [
      token ? (
        <span className="guide-pkm-token" key={`pkm-${i}`}>
          <img
            src={getPortraitSrc(PkmIndex[token])}
            alt=""
            width={24}
            height={24}
          />
          {t(`pkm.${token}`)}
        </span>
      ) : null,
      <React.Fragment key={`txt-${i}`}>
        {addIconsToDescription(part)}
      </React.Fragment>
    ]
  })
}
