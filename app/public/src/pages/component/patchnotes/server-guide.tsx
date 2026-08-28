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
  guideParser,
  guidePages,
  type GuideChapterId,
  type GuidePageId
} from "./server-guide-content"
import "./server-guide.css"

export default function ServerGuide({
  onArchive,
  onOpenInterface
}: {
  onArchive: () => void
  onOpenInterface: () => void
}) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<GuidePageId>("home")
  const [markdown, setMarkdown] = useState("")
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
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
  const sections = useMemo(
    () =>
      chapters.map((entry) => ({
        ...entry,
        markdown: chapterMarkdown(markdown, entry.heading)
          .replace(/\{\{item:([A-Z_]+)\}\}/g, (token, name) => {
            const item = Object.values(Item).find((value) => value === name)
            return item
              ? t(`item_description.${item}`)
                  .replace(/\r?\n/g, "<br>")
                  .replace(/\|/g, "&#124;")
              : token
          })
          .replace(/\{\{weather:([A-Z_]+)\}\}/g, (token, name) => {
            const weather = Object.values(Weather).find(
              (value) => value === name
            )
            return weather
              ? t(`weather_description.${weather}`)
                  .replace(/\r?\n/g, "<br>")
                  .replace(/\|/g, "&#124;")
              : token
          })
          .replace(/\{\{synergy:([A-Z_]+)\}\}/g, (token, name) => {
            const synergy = Object.values(Synergy).find(
              (value) => value === name
            )
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
          .replace(/\{\{scribble:([A-Z_]+)\}\}/g, (token, name) => {
            const rule = Object.values(SpecialGameRule).find(
              (value) => value === name
            )
            return rule
              ? t(`scribble_description.${rule}`, {
                  type: "the selected synergy"
                })
              : token
          })
      })),
    [markdown, t]
  )
  const active = sections.find((entry) => entry.id === selected)
  const html = useMemo(() => {
    const parsed = guideParser.parse(active?.markdown ?? "", { async: false })
    const withIcons = addIconsToHtml(parsed)
    if (selected === "pokemon") return addPokemonPortraits(withIcons)
    if (selected === "items") return formatGuideArticle(withIcons, "item")
    if (selected === "weather") return formatGuideArticle(withIcons, "weather")
    return withIcons
  }, [active?.markdown, selected])
  const subsections = [
    ...(active?.markdown ?? "").matchAll(/^### (.+)$/gm)
  ].map((match) => ({ title: match[1], id: sectionId(match[1]) }))
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
          entries: entries.sort((a, b) => a.title.localeCompare(b.title))
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
    const controller = new AbortController()
    setStatus("loading")
    fetch("/changelog/patch-altmeta.md", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Guide unavailable")
        return response.text()
      })
      .then((text) => {
        if (controller.signal.aborted) return
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
          <img src="assets/icons/SERVER_GUIDE.svg" alt="" /> Server Guide
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
            <Tab key={page.id}>{page.title}</Tab>
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
                        This guide explains the differences from the main server and assumes you know the basics of Pokémon Auto Chess. New players are encouraged to start on the main server.
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
                    {subsections.length > 1 && (
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
                          const isMega =
                            selected === "pokemon" &&
                            section.title === "Mega Evolution"
                          const color = rarity
                            ? RarityColor[rarity]
                            : synergy
                              ? SYNERGY_COLORS[synergy]
                              : "var(--color-fg-primary)"
                          return (
                            <button
                              className={`bubbly guide-section-button${isMega ? " guide-mega-button" : ""}`}
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
                              {(rarity || isMega) && (
                                <span
                                  className="guide-rarity-mark"
                                  aria-hidden="true"
                                />
                              )}
                              <span
                                className={
                                  isMega ? "guide-mega-label" : undefined
                                }
                              >
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
