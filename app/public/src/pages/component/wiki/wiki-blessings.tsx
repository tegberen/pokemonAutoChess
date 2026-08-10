import { useEffect, useMemo, useRef, useState } from "react"
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

/* "/" is the web convention, "f" the one asked for. F is also the Buy XP
   keybinding, so the handler stops the event rather than letting both run */
const SEARCH_SHORTCUT_KEYS = ["/", "f"]
const SEARCH_SHORTCUT_LABEL = "F"

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
  /* exclusive narrows the stage to blessings offered at that stage only, rather
     than every blessing the stage can roll */
  const [stageFilter, setStageFilter] = useState<{
    stage: number
    exclusive: boolean
  } | null>(null)
  const [query, setQuery] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  /* the key alone, no modifier: it must not fire while the user is typing into
     this or any other field, and must leave browser shortcuts like ctrl+f alone */
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (
        !SEARCH_SHORTCUT_KEYS.includes(event.key.toLowerCase()) ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return
      const active = document.activeElement
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      )
        return
      event.preventDefault()
      // or F would buy experience in the game running behind the wiki
      event.stopPropagation()
      searchRef.current?.focus()
    }
    /* capture phase on window: the sidebar and the phaser scene both listen for
       keydown and would otherwise consume it first */
    window.addEventListener("keydown", focusSearch, true)
    return () => window.removeEventListener("keydown", focusSearch, true)
  }, [])
  const setStageFilterAtTop = (filter: typeof stageFilter) => {
    const scrollPanel = document.querySelector<HTMLElement>(
      "#wiki-page > .react-tabs > .react-tabs__tab-panel--selected"
    )
    if (scrollPanel) scrollPanel.scrollTop = 0
    setStageFilter(filter)
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
      if (stageFilter !== null) {
        const stages = definition.availableAtStages
        const matchesStage = stageFilter.exclusive
          ? stages.length === 1 && stages[0] === stageFilter.stage
          : stages.includes(stageFilter.stage)
        if (!matchesStage) return
      }
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
              className={cc(
                "bubbly",
                stageFilter?.stage === stage ? "blue" : ""
              )}
              onClick={() => setStageFilterAtTop({ stage, exclusive: false })}
            >
              {t("stage")} {stage}
            </button>
          ))}
        </div>

        {/* scope belongs to the chosen stage, so it only exists once one is
            chosen and is indented under the row that opened it */}
        {stageFilter !== null && (
          <div className="wiki-blessings-stage-scope">
            <button
              className={cc("bubbly", stageFilter.exclusive ? "" : "blue")}
              onClick={() =>
                setStageFilter({ stage: stageFilter.stage, exclusive: false })
              }
            >
              {t("wiki.blessings.stage_scope_all", { stage: stageFilter.stage })}
            </button>
            <button
              className={cc("bubbly", stageFilter.exclusive ? "blue" : "")}
              title={t("wiki.blessings.stage_exclusive_hint")}
              onClick={() =>
                setStageFilter({ stage: stageFilter.stage, exclusive: true })
              }
            >
              {t("wiki.blessings.stage_scope_exclusive", {
                stage: stageFilter.stage
              })}
            </button>
          </div>
        )}
        <div className="wiki-blessings-search">
          <input
            ref={searchRef}
            type="search"
            value={query}
            placeholder={t("search")}
            title={t("wiki.blessings.search_shortcut_hint")}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query === "" && (
            <kbd aria-hidden="true">{SEARCH_SHORTCUT_LABEL}</kbd>
          )}
        </div>
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
