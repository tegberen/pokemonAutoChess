import type React from "react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Tooltip } from "react-tooltip"
import { Blessings } from "../../../../../config/game/blessings"
import {
  SynergyTiers,
  SynergyTiersThresholds
} from "../../../../../config/game/synergies"
import { Blessing } from "../../../../../types/enum/Blessing"
import { Synergy, SynergyArray } from "../../../../../types/enum/Synergy"
import type { ITierList } from "../../../../../types/interfaces/TierList"
import {
  addIconsToDescription,
  getGhostSpiritCoinSentence
} from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import SynergyIcon from "../icons/synergy-icon"
import {
  BlessingStages,
  BlessingTooltipCard,
  blessingTierClass
} from "../synergy/blessing-tooltip-card"
import { SynergyTierDescription } from "../synergy/synergy-tier-description"
import {
  BLESSING_TIER_ORDER,
  compareBlessingsBySynergy,
  getBlessingShortLabel
} from "./blessing-short-label"
import { BlessingSynergyBadges } from "./blessing-synergy-badges"
import "./tier-list-rapid-sorter.css"

const TIER_FILTERS = [null, ...BLESSING_TIER_ORDER] as const

const TOOLTIP_ID = "tier-list-rapid-sorter-tooltip"

type TierFilter = (typeof TIER_FILTERS)[number]

export type RapidSorterMode = "blessing" | "synergy"

type SorterEntry = Blessing | Synergy

type SorterStep = { entry: SorterEntry; queueIndex: number }

function SynergySorterCard(props: { synergy: Synergy }) {
  const { t } = useTranslation()
  const { synergy } = props
  const synergyTiers = SynergyTiers[synergy]
  return (
    <div className="tier-list-rapid-sorter-synergy-card">
      <h3>
        <SynergyIcon type={synergy} size="2.5rem" /> {t(`synergy.${synergy}`)}
      </h3>
      <p>
        {addIconsToDescription(
          t(`synergy_description.${synergy}`, {
            additionalInfo:
              synergy === Synergy.GHOST ? getGhostSpiritCoinSentence() : ""
          })
        )}
      </p>
      {synergyTiers.map((tier: (typeof synergyTiers)[number], i) => (
        <div key={tier} className="tier-list-rapid-sorter-synergy-tier">
          <span>
            ({SynergyTiersThresholds[synergy][i]}) {t(`effect.${tier}`)}
            :&nbsp;
          </span>
          <SynergyTierDescription tier={tier} />
        </div>
      ))}
    </div>
  )
}

export default function TierListRapidSorter(props: {
  mode: RapidSorterMode
  tierList: ITierList
  onUpdate: (tierList: ITierList) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [tierFilter, setTierFilter] = useState<TierFilter>(null)
  const [index, setIndex] = useState(0)
  const [history, setHistory] = useState<SorterStep[]>([])
  const [dragging, setDragging] = useState(false)
  const isSynergyMode = props.mode === "synergy"

  // which row each entry currently sits in, read back from the list itself so
  // re-filing an entry never leaves a duplicate behind
  const placement = useMemo(() => {
    const map = new Map<string, number>()
    props.tierList.rows.forEach((row, rowIndex) => {
      row.items.forEach((item) => {
        if (typeof item === "string") map.set(item, rowIndex)
      })
    })
    return map
  }, [props.tierList])

  // the whole category stays in the queue, sorted entries included, so the strip
  // below always shows what is done and what is still coming. tier leads the sort
  // so walking the queue follows the strip: all silver, then gold, then prismatic
  const queue: SorterEntry[] = useMemo(
    () =>
      isSynergyMode
        ? [...SynergyArray]
        : (Object.values(Blessing) as Blessing[])
            .filter(
              (blessing) =>
                !tierFilter || Blessings[blessing].tier === tierFilter
            )
            .sort(
              (a, b) =>
                BLESSING_TIER_ORDER.indexOf(Blessings[a].tier) -
                  BLESSING_TIER_ORDER.indexOf(Blessings[b].tier) ||
                compareBlessingsBySynergy(a, b)
            ),
    [tierFilter, isSynergyMode]
  )

  const current: SorterEntry | undefined = queue[index]
  const sortedCount = queue.filter((entry) => placement.has(entry)).length

  function nextUnsortedFrom(from: number) {
    const at = queue.findIndex(
      (entry, i) => i >= from && !placement.has(entry)
    )
    return at === -1 ? queue.length : at
  }

  function withoutEntry(rows: ITierList["rows"], entry: SorterEntry) {
    const rowIndex = placement.get(entry)
    if (rowIndex === undefined) return rows
    return rows.map((row, i) =>
      i === rowIndex
        ? { ...row, items: row.items.filter((item) => item !== entry) }
        : row
    )
  }

  function assign(rowIndex: number) {
    if (!current || !props.tierList.rows[rowIndex]) return
    const rows = withoutEntry(props.tierList.rows, current).map((row, i) =>
      i === rowIndex ? { ...row, items: [...row.items, current] } : row
    )
    props.onUpdate({ ...props.tierList, rows })
    setHistory((steps) => [...steps, { entry: current, queueIndex: index }])
    setIndex(nextUnsortedFrom(index + 1))
  }

  function skip() {
    if (!current) return
    setIndex(nextUnsortedFrom(index + 1))
  }

  function dragEntry(e: React.DragEvent, entry: SorterEntry) {
    e.stopPropagation()
    e.dataTransfer.setData("text/plain", `${props.mode},${entry}`)
    setDragging(true)
  }

  function undo() {
    const last = history.at(-1)
    if (!last) return
    props.onUpdate({
      ...props.tierList,
      rows: withoutEntry(props.tierList.rows, last.entry)
    })
    setHistory((steps) => steps.slice(0, -1))
    setIndex(last.queueIndex)
  }

  function blessingCardIcon(blessing: Blessing) {
    const shortLabel = getBlessingShortLabel(blessing)
    return (
      <>
        <img
          src={`/assets/blessings/${Blessings[blessing].icon}.svg`}
          alt={t(`blessing.${blessing}.name`)}
        />
        <BlessingSynergyBadges blessing={blessing} />
        {shortLabel && <span>{shortLabel}</span>}
      </>
    )
  }

  function queueChoice(entry: SorterEntry, queueIndex: number) {
    const rowIndex = placement.get(entry)
    return (
      <div
        key={entry}
        className={cc(
          isSynergyMode
            ? "tier-list-blessing-choice tier-list-synergy-choice"
            : `tier-list-blessing-choice ${blessingTierClass(entry as Blessing)}`,
          {
            sorted: rowIndex !== undefined,
            current: queueIndex === index
          }
        )}
        // a sorted card wears its row colour instead of a caption,
        // since the corner already holds the short label
        style={
          rowIndex === undefined
            ? undefined
            : {
                boxShadow: `inset 0 0 0 3px ${props.tierList.rows[rowIndex].color}`
              }
        }
        draggable
        onDragStart={(e) => dragEntry(e, entry)}
        onDragEnd={() => setDragging(false)}
        data-tooltip-id={isSynergyMode ? undefined : TOOLTIP_ID}
        data-tooltip-content={entry}
        onClick={() => setIndex(queueIndex)}
      >
        {isSynergyMode ? (
          <SynergyIcon type={entry as Synergy} size="100%" />
        ) : (
          blessingCardIcon(entry as Blessing)
        )}
      </div>
    )
  }

  return (
    <section className="tier-list-rapid-sorter my-box">
      <header>
        <h2>
          <img
            src={
              isSynergyMode
                ? "assets/icons/synergy_stats.svg"
                : "assets/icons/blessing_stats.svg"
            }
            alt=""
          />
          {t(
            isSynergyMode ? "tier_list.rank_synergies" : "tier_list.rank_wishes"
          )}
        </h2>
        {!isSynergyMode && (
          <div className="tier-list-rapid-sorter-filters">
            {TIER_FILTERS.map((filter) => (
              <button
                key={filter ?? "all"}
                type="button"
                className={cc(
                  "bubbly",
                  filter
                    ? `tier-filter blessing-tier-${filter.toLowerCase()}`
                    : "dark",
                  { selected: tierFilter === filter }
                )}
                onClick={() => {
                  setTierFilter(filter)
                  setIndex(0)
                  setHistory([])
                }}
              >
                {filter ?? t("tier_list.all_tiers")}
              </button>
            ))}
          </div>
        )}
        <span className="tier-list-rapid-sorter-progress">
          {sortedCount} / {queue.length}
        </span>
        <button type="button" className="bubbly red" onClick={props.onClose}>
          {t("close")}
        </button>
      </header>

      <div className="tier-list-rapid-sorter-rows">
        {props.tierList.rows.map((row, rowIndex) => (
          <button
            key={rowIndex}
            type="button"
            className="bubbly tier-list-rapid-sorter-row-button"
            style={{ backgroundColor: row.color }}
            disabled={!current}
            onClick={() => assign(rowIndex)}
          >
            {row.name}
          </button>
        ))}
        <span className="tier-list-rapid-sorter-divider" />
        <button
          type="button"
          className="bubbly dark"
          disabled={!current}
          onClick={skip}
        >
          {t("tier_list.skip")}
        </button>
        <button
          type="button"
          className="bubbly dark"
          disabled={history.length === 0}
          onClick={undo}
        >
          {t("tier_list.undo")}
        </button>
      </div>

      {current ? (
        <div
          className={cc(
            "tier-list-rapid-sorter-card",
            isSynergyMode ? "" : blessingTierClass(current as Blessing)
          )}
          draggable
          onDragStart={(e) => dragEntry(e, current)}
          onDragEnd={() => setDragging(false)}
        >
          {isSynergyMode ? (
            <SynergySorterCard synergy={current as Synergy} />
          ) : (
            <BlessingTooltipCard blessing={current as Blessing}>
              <BlessingStages blessing={current as Blessing} />
            </BlessingTooltipCard>
          )}
        </div>
      ) : (
        <p className="tier-list-rapid-sorter-done">
          {t("tier_list.all_sorted")}
        </p>
      )}

      <div className="tier-list-blessings tier-list-rapid-sorter-queue">
        {isSynergyMode ? (
          <section className="tier-list-blessing-tier">
            <div>{queue.map(queueChoice)}</div>
          </section>
        ) : (
          BLESSING_TIER_ORDER.filter(
            (tier) => !tierFilter || tier === tierFilter
          ).map((tier) => (
            <section key={tier} className="tier-list-blessing-tier">
              <h3>{tier}</h3>
              <div>
                {queue.map((entry, queueIndex) =>
                  Blessings[entry as Blessing].tier === tier
                    ? queueChoice(entry, queueIndex)
                    : null
                )}
              </div>
            </section>
          ))
        )}
      </div>

      <Tooltip
        id={TOOLTIP_ID}
        className="custom-theme-tooltip blessing-panel-tooltip"
        globalCloseEvents={{ scroll: true }}
        render={({ content }) =>
          content ? (
            <BlessingTooltipCard blessing={content as Blessing}>
              <BlessingStages blessing={content as Blessing} />
            </BlessingTooltipCard>
          ) : null
        }
        {...(dragging ? { isOpen: false as const } : {})}
      />
    </section>
  )
}
