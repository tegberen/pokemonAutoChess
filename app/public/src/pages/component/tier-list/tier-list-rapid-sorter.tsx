import type React from "react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Tooltip } from "react-tooltip"
import { Blessings } from "../../../../../config/game/blessings"
import { Blessing } from "../../../../../types/enum/Blessing"
import type { ITierList } from "../../../../../types/interfaces/TierList"
import { cc } from "../../utils/jsx"
import {
  BlessingStages,
  BlessingTooltipCard,
  blessingTierClass
} from "../synergy/blessing-tooltip-card"
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

type SorterStep = { blessing: Blessing; queueIndex: number }

export default function TierListRapidSorter(props: {
  tierList: ITierList
  onUpdate: (tierList: ITierList) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [tierFilter, setTierFilter] = useState<TierFilter>(null)
  const [index, setIndex] = useState(0)
  const [history, setHistory] = useState<SorterStep[]>([])
  const [dragging, setDragging] = useState(false)

  // which row each blessing currently sits in, read back from the list itself so
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
  const queue = useMemo(
    () =>
      (Object.values(Blessing) as Blessing[])
        .filter(
          (blessing) => !tierFilter || Blessings[blessing].tier === tierFilter
        )
        .sort(
          (a, b) =>
            BLESSING_TIER_ORDER.indexOf(Blessings[a].tier) -
              BLESSING_TIER_ORDER.indexOf(Blessings[b].tier) ||
            compareBlessingsBySynergy(a, b)
        ),
    [tierFilter]
  )

  const current: Blessing | undefined = queue[index]
  const sortedCount = queue.filter((blessing) =>
    placement.has(blessing)
  ).length

  function nextUnsortedFrom(from: number) {
    const at = queue.findIndex(
      (blessing, i) => i >= from && !placement.has(blessing)
    )
    return at === -1 ? queue.length : at
  }

  function withoutBlessing(rows: ITierList["rows"], blessing: Blessing) {
    const rowIndex = placement.get(blessing)
    if (rowIndex === undefined) return rows
    return rows.map((row, i) =>
      i === rowIndex
        ? { ...row, items: row.items.filter((item) => item !== blessing) }
        : row
    )
  }

  function assign(rowIndex: number) {
    if (!current || !props.tierList.rows[rowIndex]) return
    const rows = withoutBlessing(props.tierList.rows, current).map((row, i) =>
      i === rowIndex ? { ...row, items: [...row.items, current] } : row
    )
    props.onUpdate({ ...props.tierList, rows })
    setHistory((steps) => [...steps, { blessing: current, queueIndex: index }])
    setIndex(nextUnsortedFrom(index + 1))
  }

  function skip() {
    if (!current) return
    setIndex(nextUnsortedFrom(index + 1))
  }

  function dragBlessing(e: React.DragEvent, blessing: Blessing) {
    e.stopPropagation()
    e.dataTransfer.setData("text/plain", `blessing,${blessing}`)
    setDragging(true)
  }

  function undo() {
    const last = history.at(-1)
    if (!last) return
    props.onUpdate({
      ...props.tierList,
      rows: withoutBlessing(props.tierList.rows, last.blessing)
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

  return (
    <section className="tier-list-rapid-sorter my-box">
      <header>
        <h2>
          <img src="assets/icons/blessing_stats.svg" alt="" />
          {t("tier_list.rank_wishes")}
        </h2>
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
            blessingTierClass(current)
          )}
          draggable
          onDragStart={(e) => dragBlessing(e, current)}
          onDragEnd={() => setDragging(false)}
        >
          <BlessingTooltipCard blessing={current}>
            <BlessingStages blessing={current} />
          </BlessingTooltipCard>
        </div>
      ) : (
        <p className="tier-list-rapid-sorter-done">
          {t("tier_list.all_sorted")}
        </p>
      )}

      <div className="tier-list-blessings tier-list-rapid-sorter-queue">
        {BLESSING_TIER_ORDER.filter(
          (tier) => !tierFilter || tier === tierFilter
        ).map((tier) => (
          <section key={tier} className="tier-list-blessing-tier">
            <h3>{tier}</h3>
            <div>
              {queue.map((blessing, queueIndex) => {
                if (Blessings[blessing].tier !== tier) return null
                const rowIndex = placement.get(blessing)
                return (
                  <div
                    key={blessing}
                    className={cc(
                      "tier-list-blessing-choice",
                      blessingTierClass(blessing),
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
                    onDragStart={(e) => dragBlessing(e, blessing)}
                    onDragEnd={() => setDragging(false)}
                    data-tooltip-id={TOOLTIP_ID}
                    data-tooltip-content={blessing}
                    onClick={() => setIndex(queueIndex)}
                  >
                    {blessingCardIcon(blessing)}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
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
