import { t as translate } from "i18next"
import { useTranslation } from "react-i18next"
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react"
import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import {
  SynergyTiers,
  type SynergyTier,
  SYNERGY_COLORS
} from "../../../../../config/game/synergies"
import { Rarity } from "../../../../../types/enum/Game"
import { RarityColor } from "../../../../../config/game/shop"
import { SynergyTiersThresholds } from "../../../../../config"
import { Blessings } from "../../../../../config/game/blessings"
import { Ability } from "../../../../../types/enum/Ability"
import { Blessing, BlessingTier } from "../../../../../types/enum/Blessing"
import { Item } from "../../../../../types/enum/Item"
import { Weather } from "../../../../../types/enum/Weather"
import { Synergy } from "../../../../../types/enum/Synergy"
import { SpecialGameRule } from "../../../../../types/enum/SpecialGameRule"
import { addIconsToHtml } from "../../utils/descriptions"
import { GamePokemonDetailTooltip } from "../game/game-pokemon-detail"
import { ItemDetailTooltip } from "../../../game/components/item-detail"
import { Modal } from "../modal/modal"
import Wiki from "../wiki/wiki"
import "../icons/synergy-icon.css"
import {
  chapters,
  chapterMarkdown,
  addPokemonPortraits,
  sectionId,
  formatGuideArticle,
  formatPatchLog,
  type PatchLogWish,
  guideParser,
  guidePages,
  type GuideChapterId,
  type GuidePageId
} from "./server-guide-content"
import "./server-guide.css"

const GUIDE_URL = "/changelog/patch-altmeta.md"

// the window remounts on every open: keeping the fetched guide and each built
// page lets it reopen without downloading and rebuilding the Patch Log again
let loadedGuideMarkdown = ""
const builtGuidePages = new Map<GuidePageId, { source: string; html: string }>()

function resolveGuideTokens(markdown: string) {
  const t = translate
  return markdown
    .replace(/\{\{item:([A-Z_]+)\}\}/g, (token, name) => {
      const item = Object.values(Item).find((value) => value === name)
      return item
        ? t(`item_description.${item}`)
            .replace(/\r?\n/g, "<br>")
            .replace(/\|/g, "&#124;")
        : token
    })
    .replace(/\{\{ability:([A-Z_]+)\}\}/g, (token, name) => {
      // Ability.DEFAULT is the only one with no description to look up
      const ability = Object.values(Ability).find(
        (value): value is Exclude<Ability, Ability.DEFAULT> =>
          value === name && value !== Ability.DEFAULT
      )
      return ability
        ? t(`ability_description.${ability}`)
            .replace(/\r?\n/g, "<br>")
            .replace(/\|/g, "&#124;")
        : token
    })
    .replace(/\{\{weather:([A-Z_]+)\}\}/g, (token, name) => {
      const weather = Object.values(Weather).find((value) => value === name)
      return weather
        ? t(`weather_description.${weather}`)
            .replace(/\r?\n/g, "<br>")
            .replace(/\|/g, "&#124;")
        : token
    })
    .replace(/\{\{synergy:([A-Z_]+)\}\}/g, (token, name) => {
      const synergy = Object.values(Synergy).find((value) => value === name)
      if (!synergy) return token
      const description = t(`synergy_description.${synergy}`, {
        additionalInfo: ""
      })
      const tiers = SynergyTiers[synergy].map(
        (tier: SynergyTier, index: number) =>
          `- **(${SynergyTiersThresholds[synergy][index]}) ${t(`effect.${tier}`)}:** ${t(`effect_description.${tier}`)}`
      )
      return [description, "", ...tiers].join("\n")
    })
    .replace(/\{\{new\}\}/g, '<span class="guide-new-tag">NEW</span>')
    .replace(
      /\{\{meeple\}\}/g,
      '<img class="guide-inline-icon" src="assets/ui/planned.png" alt="Meeple">'
    )
    .replace(/\{\{scribble:([A-Z_]+)\}\}/g, (token, name) => {
      const rule = Object.values(SpecialGameRule).find(
        (value) => value === name
      )
      return rule
        ? t(`scribble_description.${rule}`, {
            type: "the selected synergy",
            gold: "12, 18 or 24"
          })
        : token
    })
}

function listPatchLogWishes(): PatchLogWish[] {
  return [
    ...(Object.keys(Blessings) as Blessing[]).map((blessing) => ({
      name: translate(`blessing.${blessing}.name`),
      icon: Blessings[blessing].icon,
      tier: Blessings[blessing].tier
    })),
    // the synergy-paired names never appear on their own in the log
    ...[
      { name: "Gym Trainer", blessing: Blessing.NORMAL_FAIRY_GYM_TRAINER },
      { name: "Legendary songs", blessing: Blessing.HEATRANS_SONG },
      { name: "Badges", blessing: Blessing.FIGHTING_BADGE_BLESSING },
      { name: "Crests", blessing: Blessing.FIGHTING_CREST_BLESSING },
      { name: "Missions", blessing: Blessing.QUEST_EVOLVE }
    ].map(({ name, blessing }) => ({
      name,
      icon: Blessings[blessing].icon,
      tier: Blessings[blessing].tier
    })),
    // removed or renamed Wishes keep their icon in older Patch Log rows
    { name: "Park Bench", icon: "park_bench" },
    { name: "Golden Ticket", icon: "ticket" },
    { name: "Mortar Shells", icon: "mortar_shells" },
    { name: "Big Pecks", icon: "big_peck_letter" },
    { name: "Abnormality", icon: "spread_shield" },
    { name: "Curse of Two", icon: "ghost_spectre" },
    { name: "Hex Maniac", icon: "hex_maniac" },
    { name: "Pearl", icon: "pearl" },
    { name: "Gold Bar", icon: "gold_bar" },
    { name: "Nugget", icon: "gold_bar" },
    { name: "Starter Pack", icon: "gift_box" },
    ...[
      { name: "Quest: Crit", icon: "crit_quest" },
      { name: "Quest: Grow", icon: "grow_quest" },
      { name: "Quest: Shine", icon: "shine_quest" },
      { name: "Quest: Epic", icon: "epic_ultra_quest" },
      { name: "Quest: Expand", icon: "expand_quest" },
      { name: "Quest: Ascend", icon: "ascend_quest" },
      { name: "Quest: Indecision", icon: "indecision_quest" },
      { name: "Quest: Absorb", icon: "absorb_quest" },
      { name: "Quest: Revive", icon: "revive_quest" },
      { name: "Quest: Evolve II", icon: "evolve_two_quest" },
      { name: "Quest: Mature", icon: "evolve_two_quest" },
      { name: "Quest: Pillage", icon: "pillage_quest" },
      { name: "Quest: Reroll", icon: "reroll_quest" }
    ].map((quest) => ({ ...quest, tier: BlessingTier.PRISMATIC }))
  ]
}

function buildGuidePage(
  markdown: string,
  page: GuidePageId,
  wishes: PatchLogWish[]
) {
  const parsed = guideParser.parse(markdown, { async: false })
  const withIcons = addIconsToHtml(parsed)
  if (page === "pokemon") return addPokemonPortraits(withIcons)
  if (page === "synergies") return formatGuideArticle(withIcons, "synergy")
  if (page === "items") return formatGuideArticle(withIcons, "item")
  if (page === "weather") return formatGuideArticle(withIcons, "weather")
  if (page === "patchlog") return formatPatchLog(withIcons, wishes)
  return withIcons
}

function getGuidePage(
  markdown: string,
  page: GuidePageId,
  wishes: PatchLogWish[]
) {
  // Wish names change with the language, and the Patch Log matches on them
  const wishNames = wishes.map(({ name }) => name).join("|")
  const source = `${markdown}\n${wishNames}`
  const built = builtGuidePages.get(page)
  if (built?.source === source) return built.html
  const html = buildGuidePage(markdown, page, wishes)
  builtGuidePages.set(page, { source, html })
  return html
}

// called from the lobby: downloads the guide and builds the Patch Log while
// the browser is idle, so even the first open of the window is instant
export function prepareServerGuide() {
  if (loadedGuideMarkdown) return
  fetch(GUIDE_URL)
    .then((response) => (response.ok ? response.text() : ""))
    .then((text) => {
      if (!text || loadedGuideMarkdown) return
      loadedGuideMarkdown = text
      const patchLog = chapters.find((entry) => entry.id === "patchlog")
      if (!patchLog) return
      const build = () =>
        getGuidePage(
          resolveGuideTokens(chapterMarkdown(text, patchLog.heading)),
          "patchlog",
          listPatchLogWishes()
        )
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(build, { timeout: 10000 })
      } else {
        setTimeout(build, 2000)
      }
    })
    .catch(() => {})
}

export default function ServerGuide({
  onArchive,
  onOpenInterface,
  onOpenBookmarks
}: {
  onArchive: () => void
  onOpenInterface: () => void
  onOpenBookmarks: (tab: string) => void
}) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<GuidePageId>("patchlog")
  const [markdown, setMarkdown] = useState(loadedGuideMarkdown)
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    loadedGuideMarkdown ? "ready" : "loading"
  )
  const [attempt, setAttempt] = useState(0)
  const [wikiTarget, setWikiTarget] = useState<{
    tab: string
    synergy?: Synergy
  }>()
  const contentRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState("")
  const [pendingSection, setPendingSection] = useState("")
  const chapterIndex = chapters.findIndex((entry) => entry.id === selected)
  const chapter = chapters[chapterIndex]
  const nextChapter = chapterIndex >= 0 ? chapters[chapterIndex + 1] : undefined
  // t is a dependency so a language change rebuilds the pages
  const sections = useMemo(
    () =>
      chapters.map((entry) => ({
        ...entry,
        markdown: resolveGuideTokens(chapterMarkdown(markdown, entry.heading))
      })),
    [markdown, t]
  )
  const active = sections.find((entry) => entry.id === selected)
  const patchLogWishes = useMemo(() => listPatchLogWishes(), [t])
  const html = useMemo(
    () => getGuidePage(active?.markdown ?? "", selected, patchLogWishes),
    [active?.markdown, selected, patchLogWishes]
  )
  // memoised because the scroll spy re-renders on every section it passes
  const subsections = useMemo(
    () =>
      [...(active?.markdown ?? "").matchAll(/^### (.+)$/gm)].map((match) => ({
        title: match[1],
        id: sectionId(match[1])
      })),
    [active?.markdown]
  )
  const patchLogMonths = useMemo(() => {
    const months: {
      title: string
      days: { title: string; id: string; day: string }[]
    }[] = []
    if (selected !== "patchlog") return months
    for (const section of subsections) {
      const [day, ...monthAndYear] = section.title.split(" ")
      const monthTitle = monthAndYear.join(" ")
      let month = months.at(-1)
      if (month?.title !== monthTitle) {
        month = { title: monthTitle, days: [] }
        months.push(month)
      }
      month.days.push({ ...section, day })
    }
    return months
  }, [selected, subsections])
  const indexGroups = useMemo(
    () =>
      sections.map((chapter) => {
        const entries: {
          title: string
          target: string
        }[] = []
        for (const line of chapter.markdown.split("\n")) {
          const title = line.match(/^#{3,4} (.+)$/)
          if (title) {
            const heading = title[1]
            // repeated headings share one anchor in the page
            if (entries.some((entry) => entry.target === sectionId(heading))) {
              continue
            }
            entries.push({
              title: Object.values(Item).includes(heading as Item)
                ? t(`item.${heading as Item}`)
                : heading.replaceAll("_", " "),
              target: sectionId(heading)
            })
          } else if (line.startsWith("| ")) {
            const token = line.split("|")[1].trim()
            const item = Object.values(Item).find((value) => value === token)
            const weather = Object.values(Weather).find(
              (value) => value === token
            )
            if (item || weather) {
              const label = item ? t(`item.${item}`) : t(`weather.${weather!}`)
              entries.push({
                title: label,
                target: sectionId("entry-" + label)
              })
            }
          }
        }
        return {
          ...chapter,
          entries:
            chapter.id === "patchlog"
              ? entries
              : entries.sort((a, b) => a.title.localeCompare(b.title))
        }
      }),
    [sections, t]
  )

  useEffect(() => {
    if (!pendingSection) return
    const target = contentRef.current?.querySelector<HTMLElement>(
      `[id="${pendingSection}"]`
    )
    target?.scrollIntoView({ block: "start" })
    if (target) {
      target.tabIndex = -1
      target.focus({ preventScroll: true })
    }
    setPendingSection("")
  }, [selected, pendingSection, html])

  function jumpToChapter(chapterId: GuideChapterId, target: string) {
    openChapter(chapterId)
    setActiveSection(target)
    setPendingSection(target)
  }

  useEffect(() => {
    if (attempt === 0 && loadedGuideMarkdown) return
    const controller = new AbortController()
    setStatus("loading")
    fetch(GUIDE_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Guide unavailable")
        return response.text()
      })
      .then((text) => {
        if (controller.signal.aborted) return
        loadedGuideMarkdown = text
        setMarkdown(text)
        setStatus("ready")
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error")
      })
    return () => controller.abort()
  }, [attempt])

  function openChapter(id: GuidePageId) {
    setSelected(id)
    setActiveSection("")
    setPendingSection("")
    contentRef.current?.scrollTo({ top: 0 })
  }

  return (
    <div className="server-guide">
      <header className="guide-toolbar">
        <h1>
          <img src="assets/icons/SERVER_GUIDE.svg" alt="" /> Server Changes
        </h1>
        <nav className="guide-toolbar-links" aria-label="Server information">
          <button className="bubbly" onClick={onArchive}>
            <img src="assets/ui/newspaper.svg" alt="" />
            Patch notes
          </button>
          <a
            className="bubbly"
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="assets/ui/meta.svg" alt="" />
            {t("policy")}
          </a>
          <a
            className="bubbly"
            href="/terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="assets/ui/meta.svg" alt="" />
            {t("terms_of_service")}
          </a>
        </nav>
      </header>
      <Tabs
        className="guide-tabs"
        selectedIndex={guidePages.findIndex((page) => page.id === selected)}
        onSelect={(index) => {
          const page = guidePages[index]
          if (page) openChapter(page.id)
        }}
      >
        <TabList>
          {guidePages.map((page) => (
            <Tab
              key={page.id}
              className={
                page.id === "patchlog"
                  ? "react-tabs__tab guide-tab-patchlog"
                  : "react-tabs__tab"
              }
            >
              {page.title}
            </Tab>
          ))}
        </TabList>
        {guidePages.map((page) => (
          <TabPanel key={page.id}>
            {page.id === selected && (
              <div className="guide-content" ref={contentRef}>
                {status === "loading" ? (
                  <p role="status" className="my-box">
                    Loading guide…
                  </p>
                ) : status === "error" ? (
                  <div role="alert" className="my-box guide-notice">
                    <p>The guide could not be loaded.</p>
                    <button
                      className="bubbly blue"
                      onClick={() => setAttempt((value) => value + 1)}
                    >
                      Try again
                    </button>
                  </div>
                ) : selected === "home" ? (
                  <>
                    <section className="my-box guide-welcome">
                      <p>
                        Explains the differences from the main server and assumes you know the basics of Pokémon Auto Chess. New players are encouraged to start on the main server.
                      </p>
                    </section>
                    <div className="guide-index-heading">
                      <h3>Index</h3>
                    </div>
                    <div className="guide-index">
                      {indexGroups.map((group) => (
                        <section
                          className="my-box guide-index-group"
                          key={group.id}
                        >
                          <button
                            className="bubbly guide-index-category"
                            onClick={() => openChapter(group.id)}
                          >
                            {group.title}
                            <span aria-hidden="true"> →</span>
                          </button>
                          <ul>
                            {group.entries.map((entry) => (
                              <li key={entry.target}>
                                <button
                                  onClick={() =>
                                    jumpToChapter(group.id, entry.target)
                                  }
                                  className="guide-index-entry"
                                >
                                  <span>{entry.title}</span>
                                  <span
                                    className="guide-index-leader"
                                    aria-hidden="true"
                                  />
                                  <span aria-hidden="true">›</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {selected === "patchlog" ? (
                      <nav
                        className="guide-section-nav guide-patchlog-nav"
                        aria-label={`${chapter?.title} dates`}
                      >
                        {patchLogMonths.map((month) => (
                          <div
                            className="guide-patchlog-month"
                            key={month.title}
                          >
                            <span className="guide-patchlog-month-label">
                              {month.title}
                            </span>
                            {month.days.map((section) => (
                              <button
                                className="guide-patchlog-day"
                                key={section.id}
                                aria-label={section.title}
                                aria-pressed={activeSection === section.id}
                                onClick={() =>
                                  jumpToChapter(selected, section.id)
                                }
                              >
                                {section.day}
                              </button>
                            ))}
                          </div>
                        ))}
                      </nav>
                    ) : subsections.length > 1 && (
                      <nav
                        className="guide-section-nav"
                        aria-label={`${chapter?.title} sections`}
                      >
                        {subsections.map((section) => {
                          const rarity =
                            selected === "pokemon"
                              ? Object.values(Rarity).find(
                                  (value) =>
                                    value === section.title.toUpperCase()
                                )
                              : undefined
                          const synergy =
                            selected === "synergies"
                              ? Object.values(Synergy).find(
                                  (value) =>
                                    value === section.title.toUpperCase()
                                )
                              : undefined
                          const color = rarity
                            ? RarityColor[rarity]
                            : synergy
                              ? SYNERGY_COLORS[synergy]
                              : "var(--color-fg-primary)"
                          return (
                            <button
                              className="bubbly guide-section-button"
                              key={section.id}
                              style={
                                {
                                  "--guide-section-color": color
                                } as CSSProperties
                              }
                              aria-pressed={activeSection === section.id}
                              onClick={() =>
                                jumpToChapter(selected, section.id)
                              }
                            >
                              {synergy && (
                                <img
                                  src={`assets/types/${synergy}.svg`}
                                  alt=""
                                />
                              )}
                              {rarity && (
                                <span
                                  className="guide-rarity-mark"
                                  aria-hidden="true"
                                />
                              )}
                              <span>
                                {section.title.replaceAll("_", " ")}
                              </span>
                            </button>
                          )
                        })}
                      </nav>
                    )}
                    <article
                      className={`my-box guide-article guide-article-${selected}`}
                      onClick={(event) => {
                        if (!(event.target instanceof Element)) return
                        const href = event.target
                          .closest("a")
                          ?.getAttribute("href")
                        if (href === "#options/interface") {
                          event.preventDefault()
                          onOpenInterface()
                          return
                        }
                        if (href?.startsWith("#meta/")) {
                          event.preventDefault()
                          onOpenBookmarks(href.split("/")[1])
                          return
                        }
                        if (href?.startsWith("#guide/")) {
                          event.preventDefault()
                          const [, chapterId, section] = href.split("/")
                          const chapter = guidePages.find(
                            (page) =>
                              page.id === chapterId && page.id !== "home"
                          )
                          if (chapter && section) {
                            jumpToChapter(
                              chapter.id as GuideChapterId,
                              sectionId(section)
                            )
                          }
                          return
                        }
                        if (!href?.startsWith("#wiki/")) return
                        event.preventDefault()
                        const [, tab, type] = href.split("/")
                        if (!tab) return
                        setWikiTarget({
                          tab,
                          synergy: Object.values(Synergy).find(
                            (value) => value === type
                          )
                        })
                      }}
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                    <footer className="guide-chapter-footer">
                      <button
                        className="bubbly"
                        onClick={() => openChapter("home")}
                      >
                        Overview
                      </button>
                      {nextChapter && (
                        <button
                          className="bubbly blue"
                          onClick={() => openChapter(nextChapter.id)}
                        >
                          Next: {nextChapter.title}
                        </button>
                      )}
                    </footer>
                  </>
                )}
                <p className="guide-footnote">
                  In-game tooltips and the Wiki carry the exact details.
                </p>
              </div>
            )}
          </TabPanel>
        ))}
      </Tabs>
      <GamePokemonDetailTooltip origin="patchnotes" />
      <ItemDetailTooltip />
      <Modal
        show={wikiTarget !== undefined}
        onClose={() => setWikiTarget(undefined)}
        className="wiki-modal"
        header="Wiki · Close to return to the guide"
      >
        <Wiki
          key={`${wikiTarget?.tab}/${wikiTarget?.synergy}`}
          inGame={false}
          initialTab={wikiTarget?.tab}
          initialSynergy={wikiTarget?.synergy}
        />
      </Modal>
    </div>
  )
}
