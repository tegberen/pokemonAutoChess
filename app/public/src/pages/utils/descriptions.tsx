import { t } from "i18next"
import React, { type ReactElement } from "react"
import {
  IncantationKind,
  type SpiritCoinReward
} from "../../../../config/game/ghost-incantations"
import { DocumentedBoardEffects } from "../../../../types/enum/Effect"
import { Damage, Stat } from "../../../../types/enum/Game"
import { Item } from "../../../../types/enum/Item"
import {
  DocumentedStatuses,
  PositiveStatuses,
  type Status
} from "../../../../types/enum/Status"
import { Synergy } from "../../../../types/enum/Synergy"
import { Weather } from "../../../../types/enum/Weather"
import {
  TechnicalTerm,
  TechnicalTerms
} from "../../../../types/strings/TechnicalTerm"
import { isIn } from "../../../../utils/array"
import { max, roundToNDigits } from "../../../../utils/number"
import { keys } from "../../../../utils/object"
import {
  getIncantationIcon,
  INCANTATION_UPGRADE_ICON
} from "../component/game/ghost-incantation-text"
import SynergyIcon from "../component/icons/synergy-icon"
import { cc } from "./jsx"

const DamageTypes = keys(Damage)
const Stats = keys(Stat)
const Weathers = keys(Weather)
const Synergies = keys(Synergy)
const Items = keys(Item)
// colored words that tell a GHOST hexing debuff apart from a ritual buff
const DebuffWords = ["DEBUFF", "LOSE", "LOSES", "INCREASED"] as const
const BuffWords = ["BUFF", "GAIN", "GAINS", "GRANTS"] as const

const IncantationKindByTechnicalTerm: { [term: string]: IncantationKind } = {
  [TechnicalTerm.HEXING_INCANTATION]: IncantationKind.HEXING,
  [TechnicalTerm.RITUAL_INCANTATION]: IncantationKind.RITUAL,
  [TechnicalTerm.FATED_INCANTATION]: IncantationKind.FATED
}

const getTechnicalTermIcon = (term: string) =>
  term === TechnicalTerm.SEED_BAG
    ? "/assets/icons/SEED_BAG.svg"
    : term === TechnicalTerm.STRONGER
      ? INCANTATION_UPGRADE_ICON
      : term in IncantationKindByTechnicalTerm
        ? getIncantationIcon(IncantationKindByTechnicalTerm[term])
        : `/assets/ui/${term.toLowerCase()}.svg`

export const IconOnlyTechnicalTerms: string[] = [TechnicalTerm.SPIRIT_COIN]

let spiritCoinRewardThisGame: SpiritCoinReward | null = null
export function setSpiritCoinRewardThisGame(reward: SpiritCoinReward | null) {
  spiritCoinRewardThisGame = reward
}

const getTechnicalTermDefinition = (term: TechnicalTerm) =>
  term === TechnicalTerm.SPIRIT_COIN && spiritCoinRewardThisGame
    ? t(`spirit_coin_reward_this_game.${spiritCoinRewardThisGame}`)
    : t(`technical_terms_definitions.${term}`)

export const getGhostSpiritCoinSentence = () =>
  t(
    spiritCoinRewardThisGame
      ? `synergy_description.GHOST_SPIRIT_COIN_${spiritCoinRewardThisGame}`
      : "synergy_description.GHOST_SPIRIT_COIN"
  )

// board-effect tiles plus the AQUATIC tidal wave and the two weather damage
// sources — all rendered with an icon from assets/icons/<TOKEN>.svg and
// documented in the wiki glossary
export const DocumentedEffects = [
  ...DocumentedBoardEffects,
  "TIDAL_WAVE",
  "SANDSTORM_DAMAGE",
  "THUNDER_STRUCK_DAMAGE",
  "METEOR_DAMAGE",
  "CURSE_STATS"
] as const

export const iconRegExp = new RegExp(
  `(?<=\\W|^)(?:${[
    ...DamageTypes,
    ...Stats,
    ...DocumentedStatuses,
    ...DocumentedEffects,
    ...Weathers,
    ...Synergies,
    ...Items,
    ...TechnicalTerms,
    ...DebuffWords,
    ...BuffWords,
    "GOLD",
    "XP",
    "STAR",
    "NEGATIVE_STATUS"
  ].join("|")}|\\[[^\\]]+\\])(?=\\W|$)`,
  "g"
)

export function addIconsToDescription(
  description: string,
  params?: {
    ap: number
    luck: number
    stars: number
    stages?: number
    showAbilityTiers?: boolean
  }
) {
  // every token is CAPS or a [..] value list; this check is far cheaper than
  // the full token regex on the many texts that hold neither
  if (!/[A-Z]{2}|\[/.test(description)) return description
  const matchIcon = description.match(iconRegExp)
  if (matchIcon === null) return description
  const descriptionParts = description.split(iconRegExp)

  // a star icon is an atomic inline box, so the browser may wrap between the
  // number and the star. Move the number inside the icon element to prevent it
  const numberBeforeStar: (string | undefined)[] = []
  descriptionParts.forEach((_, index) => {
    if (index > 0 && matchIcon[index - 1] === "STAR") {
      const trailingNumber = descriptionParts[index - 1].match(
        /(\d+)[\s ]*$/
      )
      if (trailingNumber) {
        numberBeforeStar[index] = trailingNumber[1]
        descriptionParts[index - 1] = descriptionParts[index - 1].slice(
          0,
          trailingNumber.index
        )
      }
    }
  })

  return descriptionParts.map((part, i) => {
    const token = matchIcon![i - 1]
    let icon: ReactElement | null = null
    const isAtStartOfSentence =
      i === 0 || descriptionParts[i - 1].trim().endsWith(".")
    const capitalize = (s: string) =>
      isAtStartOfSentence ? s.charAt(0).toUpperCase() + s.slice(1) : s

    if (token) {
      if (token === "GOLD") {
        icon = (
          <img
            className="description-icon icon-money"
            src="/assets/icons/money.svg"
            alt="$"
          />
        )
      } else if (token === "XP") {
        icon = (
          <span className="description-icon stat">
            <img src="assets/icons/EXP.svg" alt="" />
            <span className="stat-label">XP</span>
          </span>
        )
      } else if (token === "NEGATIVE_STATUS") {
        const isFirstWord = descriptionParts[i - 1].trim() === ""
        const label = t("negative_status")
        icon = (
          <span className="status-label">
            {isFirstWord || isAtStartOfSentence
              ? label.charAt(0).toUpperCase() + label.slice(1)
              : label}
          </span>
        )
      } else if (token === "STAR") {
        icon = (
          <span className="description-star-group">
            {numberBeforeStar[i]}
            <img
              className="description-icon icon-star"
              src="/assets/ui/star.svg"
              alt="⭐"
            />
          </span>
        )
      } else if (isIn(DamageTypes, token)) {
        icon = (
          <span
            className={
              token === Damage.PHYSICAL
                ? "damage-physical"
                : token === Damage.SPECIAL
                  ? "damage-special"
                  : "damage-true"
            }
          >
            {t(`damage.${token}`)}
          </span>
        )
      } else if (isIn(Stats, token)) {
        icon = (
          <span className="description-icon stat">
            <img src={`assets/icons/${token}.png`} />
            <span className="stat-label">{t(`stat.${token}`)}</span>
          </span>
        )
      } else if (isIn(DocumentedStatuses, token)) {
        icon = (
          <span
            className="description-icon status"
            title={t(`status_description.${token}`)}
          >
            <img src={`assets/icons/${token}.svg`} />
            <span
              className={cc("status-label", {
                positive: PositiveStatuses.includes(token as Status)
              })}
            >
              {t(`status.${token}`)}
            </span>
          </span>
        )
      } else if (isIn(DocumentedEffects, token)) {
        icon = (
          <span
            className="description-icon board-effect"
            title={t(`board_effect_description.${token}`)}
          >
            <img src={`assets/icons/${token}.svg`} />
            <span className="board-effect-label">
              {t(`board_effect.${token}`)}
            </span>
          </span>
        )
      } else if (isIn(Weathers, token)) {
        icon = (
          <span
            className="description-icon weather"
            title={t(`weather_description.${token}`)}
          >
            <img src={`assets/icons/weather/${token.toLowerCase()}.svg`} />
            <span className="weather-label">{t(`weather.${token}`)}</span>
          </span>
        )
      } else if (isIn(Items, token)) {
        icon = (
          <span
            className="description-icon item"
            title={t(`item_description.${token}`)}
          >
            <img src={`assets/item/${token}.png`} />
            <span className="item-label">{t(`item.${token}`)}</span>
          </span>
        )
      } else if (isIn(Synergies, token)) {
        icon = (
          <span className="description-icon synergy">
            <SynergyIcon type={token as Synergy} />
            <span className="synergy-label">{t(`synergy.${token}`)}</span>
          </span>
        )
      } else if (isIn(DebuffWords, token) || isIn(BuffWords, token)) {
        const word = token.toLowerCase()
        // the text between two tokens is empty, so look back to the last
        // real text: "highest AP GAINS" must not read as a new sentence
        const textBefore = descriptionParts.slice(0, i).join("").trim()
        const isFirstWordOrStartOfSentence =
          textBefore === "" || textBefore.endsWith(".")
        icon = (
          <span
            className={cc("status-label", {
              positive: isIn(BuffWords, token)
            })}
          >
            {isFirstWordOrStartOfSentence
              ? word.charAt(0).toUpperCase() + word.slice(1)
              : word}
          </span>
        )
      } else if (isIn(TechnicalTerms, token)) {
        icon = (
          <span
            className="description-icon technical-term"
            title={getTechnicalTermDefinition(token)}
          >
            <img src={getTechnicalTermIcon(token)} />
            {!IconOnlyTechnicalTerms.includes(token) && (
              <i className="technical-term-label">
                {capitalize(t(`technical_terms.${token}`))}
              </i>
            )}
          </span>
        )
      } else if (/\[[^\]]+\]/.test(token)) {
        const array = token.slice(1, -1).split(",")
        let scaleType: "AP" | "LUCK" | null = null
        let scaleFactor = 1
        let nbDigits = 0
        const isReplacedValue = array.at(-1) === "OLD"
        if (isReplacedValue) array.pop()
        if (array.at(-1)?.includes("ND")) {
          nbDigits = Number(array.pop()?.replace("ND=", "")) || 0
        }
        if (array.at(-1)?.includes("SP")) {
          scaleType = "AP"
          scaleFactor = Number(array.pop()?.replace("SP=", "")) || 1
        } else if (array.at(-1)?.includes("LK")) {
          scaleType = "LUCK"
          scaleFactor = Number(array.pop()?.replace("LK=", "")) || 1
        }

        const tier = params?.stars
        const maxTier = params?.stages ? params.stages + 1 : 5
        const tierValues =
          params?.stars && !params?.showAbilityTiers
            ? [array[Math.min(params.stars, array.length) - 1]] // only show relevant tier (clamp to last value when the ability has fewer tiers than stars)
            : array.slice(0, maxTier) // show tier scaling

        icon = (
          <span
            className={cc("description-icon", {
              "scales-ap": scaleType === "AP",
              "scales-luck": scaleType === "LUCK",
              "replaced-value": isReplacedValue
            })}
          >
            {scaleType === "AP" && (
              <img
                src="assets/icons/AP.png"
                alt="Ability Power"
                title="Scales with Ability Power"
              ></img>
            )}
            {scaleType === "LUCK" && (
              <img
                src="assets/icons/LUCK.png"
                alt="Luck"
                title="Scales with Luck"
              ></img>
            )}
            {tierValues.map((v, j) => {
              const separator = j < tierValues.length - 1 ? "/" : ""
              let value: number | string = roundToNDigits(Number(v), nbDigits)
              if (Number.isNaN(value)) {
                // In case of non-numeric value, just return as is
                value = v
              } else if (scaleType === "AP") {
                value = roundToNDigits(
                  Number(v) * (1 + ((params?.ap ?? 0) * scaleFactor) / 100),
                  nbDigits
                )
              } else if (scaleType === "LUCK") {
                value = roundToNDigits(
                  max(100)(
                    Math.pow(Number(v) / 100, 1 - (params?.luck ?? 0) / 100) *
                      100
                  ),
                  nbDigits
                )
              }

              const active =
                tier === undefined ||
                array.length === 1 ||
                j === tier - 1 ||
                (tier > tierValues.length && j === tierValues.length - 1)
              return (
                <span key={j} className="ability-value">
                  <span className={cc({ active })}>{value}</span>
                  {separator}
                </span>
              )
            })}
          </span>
        )
      }
    }

    const boldParts = part.split(/\*\*(.+?)\*\*/g)
    const content =
      boldParts.length > 1
        ? boldParts.map((part, j) =>
            j % 2 === 1 ? (
              <strong key={j} className="description-important">
                {part}
              </strong>
            ) : (
              part
            )
          )
        : part

    return (
      <React.Fragment key={i}>
        {icon}
        {content}
      </React.Fragment>
    )
  })
}

// Function to process HTML strings and add icons
export function addIconsToHtml(
  htmlString: string,
  stats?: { ap: number; luck: number; stars: number; stages?: number }
): string {
  // Create a temporary DOM element to work with the HTML
  const tempDiv = document.createElement("div")
  tempDiv.innerHTML = htmlString

  // Function to process text nodes and add icon markup
  const processTextNode = (textNode: Text) => {
    const text = textNode.textContent || ""
    // every token is CAPS or a [..] value list; this check is far cheaper than
    // the full token regex on the many text nodes that hold neither
    if (!/[A-Z]{2}|\[/.test(text)) return
    const matchIcon = text.match(iconRegExp)

    if (!matchIcon) return

    const descriptionParts = text.split(iconRegExp)
    let newHTML = ""

    descriptionParts.forEach((part, i) => {
      const token = matchIcon[i - 1]
      let iconHTML = ""

      if (token) {
        if (token === "GOLD") {
          iconHTML =
            '<img class="description-icon icon-money" src="/assets/icons/money.svg" alt="$" />'
        } else if (token === "NEGATIVE_STATUS") {
          iconHTML = `<span class="status-label">${t("negative_status")}</span>`
        } else if (token === "STAR") {
          iconHTML =
            '<img class="description-icon icon-star" src="/assets/ui/star.svg" alt="⭐" />'
        } else if (token === "XP") {
          iconHTML = `<span class="description-icon stat">
            <img src="assets/icons/EXP.svg" alt="" />
            <span class="stat-label">XP</span>
          </span>`
        } else if (isIn(DamageTypes, token)) {
          const className =
            token === Damage.PHYSICAL
              ? "damage-physical"
              : token === Damage.SPECIAL
                ? "damage-special"
                : "damage-true"
          iconHTML = `<span class="${className}">${t(`damage.${token}`)}</span>`
        } else if (isIn(Stats, token)) {
          iconHTML = `<span class="description-icon stat">
            <img src="assets/icons/${token}.png" />
            <span class="stat-label">${t(`stat.${token}`)}</span>
          </span>`
        } else if (isIn(DocumentedStatuses, token)) {
          const isPositive = PositiveStatuses.includes(token as Status)
          iconHTML = `<span class="description-icon status" title="${t(`status_description.${token}`)}">
            <img src="assets/icons/${token}.svg" />
            <span class="status-label${isPositive ? " positive" : ""}">${t(`status.${token}`)}</span>
          </span>`
        } else if (isIn(DocumentedEffects, token)) {
          iconHTML = `<span class="description-icon board-effect" title="${t(`board_effect_description.${token}`)}">
            <img src="assets/icons/${token}.svg" />
            <span class="board-effect-label">${t(`board_effect.${token}`)}</span>
          </span>`
        } else if (isIn(Weathers, token)) {
          iconHTML = `<span class="description-icon weather" title="${t(`weather_description.${token}`)}">
            <img src="assets/icons/weather/${token.toLowerCase()}.svg" />
            <span class="weather-label">${t(`weather.${token}`)}</span>
          </span>`
        } else if (isIn(Items, token)) {
          iconHTML = `<span class="description-icon item" title="${t(`item_description.${token}`)}" data-tooltip-id="item-detail-tooltip" data-tooltip-content="${token}">
            <img src="assets/item/${token}.png" />
            <span class="item-label">${t(`item.${token}`)}</span>
          </span>`
        } else if (isIn(Synergies, token)) {
          iconHTML = `<span class="description-icon synergy">
            <img src="assets/types/${token}.svg" style="width: 1.5em; height: 1.5em;" />
            <span class="synergy-label">${t(`synergy.${token}`)}</span>
          </span>`
        } else if (isIn(DebuffWords, token) || isIn(BuffWords, token)) {
          const isBuff = isIn(BuffWords, token)
          iconHTML = `<span class="status-label${isBuff ? " positive" : ""}">${token.toLowerCase()}</span>`
        } else if (isIn(TechnicalTerms, token)) {
          const labelHTML = IconOnlyTechnicalTerms.includes(token)
            ? ""
            : `<i class="technical-term-label">${t(`technical_terms.${token}`)}</i>`
          iconHTML = `<span class="description-icon technical-term" title="${getTechnicalTermDefinition(token)}">
            <img src="${getTechnicalTermIcon(token)}" />
            ${labelHTML}
          </span>`
        } else if (/\[[^\]]+\]/.test(token)) {
          const array = token.slice(1, -1).split(",")
          let scaleType: "AP" | "LUCK" | null = null
          let scaleFactor = 1
          let nbDigits = 0

          if (array.at(-1)?.includes("ND")) {
            nbDigits = Number(array.pop()?.replace("ND=", "")) || 0
          } else if (array.at(-1)?.includes("SP")) {
            scaleType = "AP"
            scaleFactor = Number(array.pop()?.replace("SP=", "")) || 1
          } else if (array.at(-1)?.includes("LK")) {
            scaleType = "LUCK"
            scaleFactor = Number(array.pop()?.replace("LK=", "")) || 1
          }

          const scaleClass =
            scaleType === "AP"
              ? " scales-ap"
              : scaleType === "LUCK"
                ? " scales-luck"
                : ""
          let scaleIcon = ""
          if (scaleType === "AP") {
            scaleIcon =
              '<img src="assets/icons/AP.png" alt="Ability Power" title="Scales with Ability Power" />'
          } else if (scaleType === "LUCK") {
            scaleIcon =
              '<img src="assets/icons/LUCK.png" alt="Luck" title="Scales with Luck" />'
          }

          let valuesHTML = ""
          array.slice(0, stats?.stages).forEach((v, j) => {
            const separator =
              j < Math.min(stats?.stages ?? 4, array.length) - 1 ? "/" : ""
            let value: number | string = roundToNDigits(Number(v), nbDigits)

            if (Number.isNaN(value)) {
              value = v
            } else if (scaleType === "AP") {
              value = roundToNDigits(
                Number(v) * (1 + ((stats?.ap ?? 0) * scaleFactor) / 100),
                nbDigits
              )
            } else if (scaleType === "LUCK") {
              value = roundToNDigits(
                max(100)(
                  Math.pow(Number(v) / 100, 1 - (stats?.luck ?? 0) / 100) * 100
                ),
                nbDigits
              )
            }

            const tier = stats?.stars
            const active =
              tier === undefined ||
              array.length === 1 ||
              j === tier - 1 ||
              (tier > array.length && j === array.length - 1)

            valuesHTML += `<span class="ability-value">
              <span class="${active ? "active" : ""}">${value}</span>
              ${separator}
            </span>`
          })

          iconHTML = `<span class="description-icon${scaleClass}">
            ${scaleIcon}
            ${valuesHTML}
          </span>`
        }
      }

      newHTML += iconHTML + part
    })

    // Replace the text node with the new HTML
    const newElement = document.createElement("span")
    newElement.innerHTML = newHTML
    textNode.parentNode?.replaceChild(newElement, textNode)
  }

  // Walk through all text nodes in the DOM
  const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT)

  const textNodes: Text[] = []
  let node: Text | null
  while ((node = walker.nextNode() as Text)) {
    textNodes.push(node)
  }

  // Process text nodes in reverse order to avoid issues with DOM manipulation
  textNodes.reverse().forEach(processTextNode)

  return tempDiv.innerHTML
}
