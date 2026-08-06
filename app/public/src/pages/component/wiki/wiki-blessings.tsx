import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  type BlessingFamily,
  Blessings
} from "../../../../../config/game/blessings"
import {
  BLESSING_SELECTION_STAGES,
  type Blessing,
  BlessingTier
} from "../../../../../types/enum/Blessing"
import { addIconsToDescription } from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import "./wiki-blessings.css"

const TIER_ORDER = [
  BlessingTier.SILVER,
  BlessingTier.GOLD,
  BlessingTier.PRISMATIC
]

function BlessingCard(props: { blessing: Blessing }) {
  const { t } = useTranslation()
  const definition = Blessings[props.blessing]
  return (
    <li className="my-box">
      <div className="wiki-blessing-body">
        <img src={`/assets/blessings/${definition.icon}.svg`} alt="" />
        <div>
          <h3>{t(`blessing.${props.blessing}.name`)}</h3>
          <p>
            {addIconsToDescription(t(`blessing.${props.blessing}.description`))}
          </p>
          <p className="wiki-blessings-stages-label">
            {definition.availableAtStages
              .map((stage) => `${t("stage")} ${stage}`)
              .join(" · ")}
          </p>
        </div>
      </div>
    </li>
  )
}

export default function WikiBlessings() {
  const { t } = useTranslation()
  const [stageFilter, setStageFilter] = useState<number | null>(null)
  const [query, setQuery] = useState("")
  const setStageFilterAtTop = (stage: number | null) => {
    const scrollPanel = document.querySelector<HTMLElement>(
      "#wiki-page > .react-tabs > .react-tabs__tab-panel--selected"
    )
    if (scrollPanel) scrollPanel.scrollTop = 0
    setStageFilter(stage)
  }

  const scrollToTier = (tier: BlessingTier) => {
    document
      .getElementById(`wiki-blessing-tier-${tier.toLowerCase()}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const blessingsByTier = useMemo(() => {
    const search = query.trim().toLowerCase()
    const grouped = new Map<BlessingTier, Blessing[]>(
      TIER_ORDER.map((tier) => [tier, []])
    )
    ;(Object.keys(Blessings) as Blessing[]).forEach((blessing) => {
      const definition = Blessings[blessing]
      if (
        stageFilter !== null &&
        !definition.availableAtStages.includes(stageFilter)
      )
        return
      if (
        search &&
        !t(`blessing.${blessing}.name`).toLowerCase().includes(search) &&
        !t(`blessing.${blessing}.description`).toLowerCase().includes(search)
      )
        return
      grouped.get(definition.tier)?.push(blessing)
    })
    return grouped
  }, [stageFilter, query, t])

  return (
    <div className="wiki-blessings">
      <p className="wiki-blessings-intro">{t("wiki.blessings.intro")}</p>

      <div className="wiki-blessings-filters">
        <p className="wiki-blessings-wish-quote">
          <img src="assets/ui/blessing_event_icon.jpg" alt="" />
          <span>{t("wiki.blessings.wish_quote")}</span>
        </p>
        <div className="wiki-blessings-stages">
          <button
            className={cc("bubbly", stageFilter === null ? "blue" : "")}
            onClick={() => setStageFilterAtTop(null)}
          >
            {t("wiki.blessings.all_stages")}
          </button>
          {BLESSING_SELECTION_STAGES.map((stage) => (
            <button
              key={stage}
              className={cc("bubbly", stageFilter === stage ? "blue" : "")}
              onClick={() => setStageFilterAtTop(stage)}
            >
              {t("stage")} {stage}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          placeholder={t("search")}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="wiki-blessings-tier-shortcuts">
          {[BlessingTier.SILVER, BlessingTier.GOLD, BlessingTier.PRISMATIC].map((tier) => (
            <button
              key={tier}
              className={cc(
                "bubbly wiki-blessings-tier-shortcut",
                tier.toLowerCase()
              )}
              onClick={() => scrollToTier(tier)}
            >
              {t(`blessing_tier.${tier}`)}
            </button>
          ))}
        </div>
      </div>

      {TIER_ORDER.map((tier) => {
        const blessings = blessingsByTier.get(tier) ?? []
        if (blessings.length === 0) return null
        const families = [
          ...new Set(
            blessings
              .map((blessing) => Blessings[blessing].family)
              .filter(
                (family): family is BlessingFamily => family !== undefined
              )
          )
        ]
        return (
          <section
            key={tier}
            id={`wiki-blessing-tier-${tier.toLowerCase()}`}
            className={`blessing-tier-${tier.toLowerCase()}`}
          >
            <h2>
              {t(`blessing_tier.${tier}`)}
              <span className="wiki-blessings-count">{blessings.length}</span>
            </h2>

            <ul className="wiki-blessings-list">
              {families.map((family) => {
                const members = blessings.filter(
                  (blessing) => Blessings[blessing].family === family
                )
                return (
                  <li key={family} className="my-box wiki-blessings-family">
                    <details>
                      <summary>
                        <div className="wiki-blessing-body">
                          <img
                            src={`/assets/blessings/${Blessings[members[0]].icon}.svg`}
                            alt=""
                          />
                          <div>
                            <h3>
                              {t(`wiki.blessings.family_${family}_name`)}
                              <span className="wiki-blessings-chevron" />
                            </h3>
                            <p>
                              {addIconsToDescription(
                                t(`wiki.blessings.family_${family}_hint`)
                              )}
                            </p>
                          </div>
                        </div>
                      </summary>
                      <ul className="wiki-blessings-list wiki-blessings-family-list">
                        {members.map((blessing) => (
                          <BlessingCard key={blessing} blessing={blessing} />
                        ))}
                      </ul>
                    </details>
                  </li>
                )
              })}

              {blessings
                .filter((blessing) => Blessings[blessing].family === undefined)
                .map((blessing) => (
                  <BlessingCard key={blessing} blessing={blessing} />
                ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
