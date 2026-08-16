import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  type BlessingFamily,
  Blessings,
  getBlessingSynergy
} from "../../../../../config/game/blessings"
import {
  BLESSING_SELECTION_STAGES,
  Blessing,
  BlessingTier,
  HERO_BLESSING_FAMILY
} from "../../../../../types/enum/Blessing"
import { addIconsToDescription } from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import SynergyIcon from "../icons/synergy-icon"
import { compareBlessingsBySynergy } from "../tier-list/blessing-short-label"
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
  const synergy = getBlessingSynergy(props.blessing)
  return (
    <li className="my-box">
      <div className="wiki-blessing-body">
        <div className="wiki-blessing-icon-wrap">
          <img src={`/assets/blessings/${definition.icon}.svg`} alt="" />
          {synergy && (
            <SynergyIcon
              type={synergy}
              size="20px"
              className="wiki-blessing-synergy"
            />
          )}
        </div>
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

type BlessingCategory = "synergy" | "hero" | "planning" | "combat"

const HATCH_BLESSINGS = new Set<Blessing>([
  Blessing.POCKET_DAYCARE,
  Blessing.BABYLESS,
  Blessing.BABY_OPENER,
  Blessing.SELECTIVE_GENETICS,
  Blessing.ADOPTION,
  Blessing.COLONY
])

const ECONOMY_BLESSINGS = new Set<Blessing>([
  Blessing.PEARL,
  Blessing.CROAGUNKS_AID,
  Blessing.WOBBUFFETS_SILVER_PRIZE,
  Blessing.WOBBUFFETS_GOLD_PRIZE,
  Blessing.TREASURE_HUNT_I,
  Blessing.TREASURE_HUNT_II,
  Blessing.NUGGET,
  Blessing.GOLDEN_TICKET,
  Blessing.GIMMIGHOULS_TREASURE,
  Blessing.INSTANT_HYPER_ROLL,
  Blessing.DEEP_INVESTMENTS,
  Blessing.TAXES,
  Blessing.RAINBOW_HOUR,
  Blessing.WAITING_GAME,
  Blessing.PRISMATIC_REROLL,
  Blessing.LUNCH_MONEY,
  Blessing.CALCULATED_LOSS,
  Blessing.GREEDY_WISH,
  Blessing.CALLED_SHOT,
  Blessing.WISE_SPENDING,
  Blessing.MORE_EQUAL_THAN_OTHERS,
  Blessing.FREE_COUPON,
  Blessing.HYPER_HYPER_ROLL,
  Blessing.BABY_OPENER,
  Blessing.SAFARI_ENCOUNTER,
  Blessing.POCKET_DAYCARE,
  Blessing.TRANSFORM,
  Blessing.STARTER_PACK
])

const TEAM_BUILDING_BLESSINGS = new Set<Blessing>([
  Blessing.ADDITIONAL_RETHINK_I,
  Blessing.ADDITIONAL_RETHINK_II,
  Blessing.CHOSEN_ONES,
  Blessing.SAFARI_ENCOUNTER,
  Blessing.SCHOOL_BUS,
  Blessing.A_NEW_FRIEND,
  Blessing.REPLICATOR,
  Blessing.TRANSFORM,
  Blessing.REGIONAL_TREASURES,
  Blessing.REGIONAL_TREASURES_II
])

const ITEM_BLESSINGS = new Set<Blessing>([
  Blessing.STARTER_PACK,
  Blessing.CINCCINOS_GIFTS_I,
  Blessing.CINCCINOS_GIFTS_II,
  Blessing.CINCCINOS_GIFTS_III,
  Blessing.ITEMFINDER_I,
  Blessing.ITEMFINDER_II,
  Blessing.ITEMFINDER_III,
  Blessing.RELIC_FRAGMENT,
  Blessing.BERRY_POUCH,
  Blessing.BAG_OF_SWEETS,
  Blessing.BANANA_BUSINESS,
  Blessing.SWEET_SUBSCRIPTION,
  Blessing.MUNCHLAX_DELIVERY,
  Blessing.FIND_A_LOST_WAND,
  Blessing.EMERALD_ORB,
  Blessing.SINGULARITY_I,
  Blessing.SINGULARITY_II,
  Blessing.TRASH_TO_TREASURE,
  Blessing.SWEET_TREATS,
  Blessing.BIRTHDAY_PRESENT,
  Blessing.DROP_RATES
])

const PREPARATION_BLESSINGS = new Set<Blessing>([
  Blessing.RAINBOW_KEY,
  Blessing.TREASURE_TRAIL,
  Blessing.COLOUR_CHANGE,
  Blessing.AZURE_FLUTE,
  Blessing.POTION,
  Blessing.QUICK_CLAW,
  Blessing.MANIFESTATION_AP,
  Blessing.MANIFESTATION_AD,
  Blessing.BP_REWARDS,
  Blessing.SYNARCH,
  Blessing.THINK_FAST,
  Blessing.ROBIN_GEMS,
  Blessing.TRAINING_MONTAGE,
  Blessing.QUEST_EVOLVE,
  Blessing.QUEST_DESTROY,
  Blessing.QUEST_LEVEL_UP,
  Blessing.QUEST_DIVERSIFY,
  Blessing.QUEST_PROSPER,
  Blessing.QUEST_INDECISION,
  Blessing.QUEST_CRIT,
  Blessing.QUEST_ABSORB,
  Blessing.QUEST_REVIVE,
  Blessing.QUEST_PILLAGE,
  Blessing.QUEST_EVOLVE_II,
  Blessing.QUEST_REROLL,
  Blessing.QUEST_GROW,
  Blessing.QUEST_SHINE,
  Blessing.QUEST_EPIC,
  Blessing.QUEST_EXPAND,
  Blessing.QUEST_ASCEND,
  Blessing.BEING_OF_KNOWLEDGE,
  Blessing.CLIMBING_THE_LADDER,
  Blessing.UP_IS_UP,
  Blessing.HARD_COMMIT
])

const ADDITIONAL_HERO_BLESSINGS = new Set<Blessing>([
  Blessing.ALL_FOR_ONE,
  Blessing.ALL_FOURS,
  Blessing.BABY_OPENER,
  Blessing.SAFARI_ENCOUNTER,
  Blessing.POCKET_DAYCARE,
  Blessing.TRANSFORM,
  Blessing.STARTER_PACK,
  Blessing.SINNOHS_COOLEST,
  Blessing.SCHOOL_BUS,
  Blessing.TRASH_TO_TREASURE,
  Blessing.STAR_CROSSED_SEAS,
  Blessing.HEATRANS_SONG,
  Blessing.RAYQUAZAS_SONG,
  Blessing.MEWS_SONG,
  Blessing.GROUDONS_SONG,
  Blessing.ARTICUNOS_SONG,
  Blessing.GIRATINAS_SONG,
  Blessing.KYOGRES_SONG,
  Blessing.BEAUTY_CONTEST,
  Blessing.CURSE_OF_CORAL,
  Blessing.TEMPLE_OF_LANGUAGE,
  Blessing.GYARODOS_TRES_QUATRO,
  Blessing.NOT_THE_BEES,
  Blessing.WEATHER_INSTITUTE,
  Blessing.BEEKEEPING,
  Blessing.SUPPORTIVE_SOUL,
  Blessing.YOU_FORGOT_SOMETHING,
  Blessing.MANIFESTATION_AP,
  Blessing.MANIFESTATION_AD,
  Blessing.MIX_AND_MATCH_I,
  Blessing.MIX_AND_MATCH_II,
  Blessing.STARTER_CHOICE,
  Blessing.A_NEW_FRIEND,
  Blessing.CHOSEN_ONES,
  Blessing.INSTANT_HYPER_ROLL,
  Blessing.BEING_OF_KNOWLEDGE,
  Blessing.HYPER_HYPER_ROLL,
  Blessing.BIRTHDAY_PRESENT,
  Blessing.LEGENDARY_GAMBIT,
  Blessing.BABYLESS
])

const DEFENSIVE_COMBAT_BLESSINGS = new Set<Blessing>([
  Blessing.GEAR_SHIELD_I,
  Blessing.GEAR_SHIELD_II,
  Blessing.MAGIC_SHIELD_I,
  Blessing.MAGIC_SHIELD_II,
  Blessing.BRUTE_SHIELD_I,
  Blessing.BRUTE_SHIELD_II,
  Blessing.STAR_GUARD,
  Blessing.VAMPIRIC,
  Blessing.PROTECT_THE_WEAK,
  Blessing.STURDY,
  Blessing.PANIC_BUTTON,
  Blessing.GUARD_FORMATION,
  Blessing.TOUGH_FORMATION,
  Blessing.PULSE_SHIELD_I,
  Blessing.PULSE_SHIELD_II,
  Blessing.LONE_WOLF,
  Blessing.PARTING_GIFT,
  Blessing.REQUIEM
])

const OFFENSIVE_COMBAT_BLESSINGS = new Set<Blessing>([
  Blessing.BURNING_FORCE,
  Blessing.DRILL_I,
  Blessing.DRILL_II,
  Blessing.SHATTER_I,
  Blessing.SHATTER_II,
  Blessing.SURGE_I,
  Blessing.SURGE_II,
  Blessing.CALCULATED_OFFENCE,
  Blessing.NEUROFORCE,
  Blessing.IMPENDING_DOOM,
  Blessing.BRAVE_FORMATION,
  Blessing.EXPLOIT,
  Blessing.RIPPLING_EFFECTS,
  Blessing.LASTING_EFFECTS,
  Blessing.MINIMALIST_I,
  Blessing.MINIMALIST_II,
  Blessing.CRITICAL_RUSH_I,
  Blessing.CRITICAL_RUSH_II,
  Blessing.CRITICAL_PATH_I,
  Blessing.CRITICAL_PATH_II
])

function compareCombatBlessings(a: Blessing, b: Blessing): number {
  const group = (blessing: Blessing) =>
    OFFENSIVE_COMBAT_BLESSINGS.has(blessing)
      ? 0
      : DEFENSIVE_COMBAT_BLESSINGS.has(blessing)
        ? 1
        : 2
  return group(a) - group(b)
}

const CATEGORY_ORDER: BlessingCategory[] = [
  "synergy",
  "hero",
  "planning",
  "combat"
]

function getBlessingCategory(blessing: Blessing): BlessingCategory {
  if (getBlessingSynergy(blessing)) return "synergy"
  if (HERO_BLESSING_FAMILY[blessing] || ADDITIONAL_HERO_BLESSINGS.has(blessing))
    return "hero"
  if (
    HATCH_BLESSINGS.has(blessing) ||
    ECONOMY_BLESSINGS.has(blessing) ||
    TEAM_BUILDING_BLESSINGS.has(blessing) ||
    ITEM_BLESSINGS.has(blessing) ||
    PREPARATION_BLESSINGS.has(blessing)
  )
    return "planning"
  return "combat"
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

      <p className="wiki-blessings-wish-quote">
        <img src="assets/ui/blessing_event_icon.jpg" alt="" />
        <span>{t("wiki.blessings.wish_quote")}</span>
      </p>

      <div className="wiki-blessings-filters">
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
              {t("wiki.blessings.stage_scope_all", {
                stage: stageFilter.stage
              })}
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
          {[BlessingTier.SILVER, BlessingTier.GOLD, BlessingTier.PRISMATIC].map(
            (tier) => (
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
            )
          )}
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

            {CATEGORY_ORDER.map((category) => {
              const members = blessings
                .filter(
                  (blessing) =>
                    Blessings[blessing].family === undefined &&
                    getBlessingCategory(blessing) === category
                )
                .sort(
                  category === "combat"
                    ? compareCombatBlessings
                    : compareBlessingsBySynergy
                )
              if (members.length === 0 && category !== "synergy") return null
              return (
                <section key={category} className="wiki-blessings-category">
                  <h3>
                    {category === "planning"
                      ? "Planning & Resources"
                      : category === "hero"
                        ? "Heroes & Pokémon"
                        : category}
                  </h3>
                  <ul className="wiki-blessings-list">
                    {category === "synergy" &&
                      families.map((family) => {
                        const familyMembers = blessings.filter(
                          (blessing) => Blessings[blessing].family === family
                        )
                        return (
                          <li
                            key={family}
                            className="my-box wiki-blessings-family"
                          >
                            <details>
                              <summary>
                                <div className="wiki-blessing-body">
                                  <img
                                    src={`/assets/blessings/${Blessings[familyMembers[0]].icon}.svg`}
                                    alt=""
                                  />
                                  <div>
                                    <h3>
                                      {t(
                                        `wiki.blessings.family_${family}_name`
                                      )}
                                      <span className="wiki-blessings-chevron" />
                                    </h3>
                                    <p>
                                      {addIconsToDescription(
                                        t(
                                          `wiki.blessings.family_${family}_hint`
                                        )
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </summary>
                              <ul className="wiki-blessings-list wiki-blessings-family-list">
                                {familyMembers.map((blessing) => (
                                  <BlessingCard
                                    key={blessing}
                                    blessing={blessing}
                                  />
                                ))}
                              </ul>
                            </details>
                          </li>
                        )
                      })}
                    {members.map((blessing) => (
                      <BlessingCard key={blessing} blessing={blessing} />
                    ))}
                  </ul>
                </section>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
