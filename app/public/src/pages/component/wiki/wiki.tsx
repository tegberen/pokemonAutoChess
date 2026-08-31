import { type ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import { Synergy } from "../../../../../types/enum/Synergy"
import { cc } from "../../utils/jsx"
import WikiAbility from "./wiki-ability"
import WikiBlessings from "./wiki-blessings"
import WikiData from "./wiki-data"
import WikiDoubleUp from "./wiki-double-up"
import WikiFaq from "./wiki-faq"
import WikiGlossary from "./wiki-glossary"
import WikiItems from "./wiki-items"
import WikiPokemons from "./wiki-pokemons"
import WikiRegions from "./wiki-regions"
import WikiStages from "./wiki-stages"
import WikiStatistic from "./wiki-statistic"
import WikiStatus from "./wiki-status"
import WikiTown from "./wiki-town"
import WikiTutorials from "./wiki-tutorials"
import WikiTypes from "./wiki-types"
import WikiWeather from "./wiki-weather"
import "./wiki.css"

export default function Wiki({
  inGame = false,
  initialTab,
  initialSynergy
}: {
  inGame: boolean
  initialTab?: string
  initialSynergy?: Synergy
}) {
  const { t } = useTranslation()
  const groups: Array<{
    key: string
    label: string
    tabs: Array<{ key: string; label: ReactNode }>
  }> = [
    {
      key: "gameplay",
      label: t("wiki.nav.gameplay_label", { defaultValue: "Gameplay" }),
      tabs: [
        { key: "types", label: t("wiki.nav.synergies_label") },
        { key: "items", label: t("wiki.nav.items_label") },
        { key: "pokemon", label: t("wiki.nav.pokemons_label") },
        { key: "ability", label: t("wiki.nav.abilities_label") },
        { key: "status", label: t("status_label") },
        { key: "weather", label: t("wiki.nav.weather_label") }
      ]
    },
    {
      key: "modes",
      label: t("wiki.nav.modes_label", { defaultValue: "Modes" }),
      tabs: [
        {
          key: "blessings",
          label: (
            <>
              <img src="assets/icons/blessing_stats.svg" alt="" />
              {t("wiki.nav.blessings_label")}
            </>
          )
        },
        { key: "double-up", label: "Double Up" }
      ]
    },
    {
      key: "world",
      label: t("wiki.nav.world_label", { defaultValue: "World" }),
      tabs: [
        { key: "town", label: t("wiki.nav.town_label") },
        { key: "dungeon", label: t("wiki.nav.dungeon_label") }
      ]
    },
    {
      key: "reference",
      label: t("wiki.nav.reference_label", { defaultValue: "Reference" }),
      tabs: [
        { key: "stages", label: t("stages") },
        { key: "statistic", label: t("wiki.nav.statistics_label") },
        { key: "glossary", label: t("wiki.nav.glossary_label") },
        { key: "data", label: t("wiki.nav.data_label") }
      ]
    },
    ...(!inGame
      ? [
          {
            key: "learn",
            label: t("wiki.nav.learn_label", { defaultValue: "Learn" }),
            tabs: [
              { key: "faq", label: t("wiki.faq.faq") },
              { key: "tutorials", label: t("wiki.nav.how_to_play") }
            ]
          }
        ]
      : [])
  ]
  const tabs = groups.flatMap((group) =>
    group.tabs.map((tab) => ({ ...tab, groupKey: group.key }))
  )
  const tabKeys = tabs.map(({ key }) => key)
  // the awakening tab was folded into the ROCK synergy page
  const linksToAwakening = initialTab === "awakening"
  const [selectedIndex, setSelectedIndex] = useState(() =>
    Math.max(0, tabKeys.indexOf((linksToAwakening ? "types" : initialTab) ?? ""))
  )
  const [selectedSynergy, setSelectedSynergy] = useState(
    initialSynergy ?? (linksToAwakening ? Synergy.ROCK : undefined)
  )
  // the synergy is a one-shot navigation target, so every other tab change drops it
  const selectTab = (index: number, synergy?: Synergy) => {
    setSelectedSynergy(synergy)
    setSelectedIndex(index)
  }
  const goToTab = (key: string, synergy?: Synergy) => {
    const index = tabKeys.indexOf(key)
    if (index >= 0) selectTab(index, synergy)
  }
  const activeGroupKey = (tabs[selectedIndex] ?? tabs[0]).groupKey
  const activeGroup =
    groups.find(({ key }) => key === activeGroupKey) ?? groups[0]

  return (
    <div id="wiki-page">
      <Tabs selectedIndex={selectedIndex} onSelect={(index) => selectTab(index)}>
        <nav className="wiki-navigation" aria-label={t("wiki.title", "Wiki")}>
          <div className="wiki-index-heading">
            {t("wiki.nav.index_label", { defaultValue: "Index" })}
          </div>
          <div className="wiki-section-list">
            {groups.map((group) => (
              <button
                type="button"
                key={group.key}
                className={cc("wiki-section", {
                  "is-active": group.key === activeGroup.key
                })}
                aria-current={
                  group.key === activeGroup.key ? "location" : undefined
                }
                onClick={() => goToTab(group.tabs[0].key)}
              >
                <span>{group.label}</span>
              </button>
            ))}
          </div>
        </nav>
        <TabList className="wiki-topic-list">
          {tabs.map((tab) => {
            const isActiveGroup = tab.groupKey === activeGroup.key
            return (
              <Tab
                key={`title-${tab.key}`}
                className={cc("react-tabs__tab wiki-topic-tab", {
                  "wiki-topic-tab--hidden": !isActiveGroup
                })}
                disabled={!isActiveGroup}
              >
                {tab.label}
              </Tab>
            )
          })}
        </TabList>

        <TabPanel key="types">
          <WikiTypes
            initialSynergy={selectedSynergy}
            onGoToWeather={() => goToTab("weather")}
          />
        </TabPanel>
        <TabPanel key="items">
          <WikiItems />
        </TabPanel>
        <TabPanel key="pokemon">
          <WikiPokemons />
        </TabPanel>
        <TabPanel key="ability">
          <WikiAbility />
        </TabPanel>
        <TabPanel key="status">
          <WikiStatus />
        </TabPanel>
        <TabPanel key="weather">
          <WikiWeather onGoToAwakening={() => goToTab("types", Synergy.ROCK)} />
        </TabPanel>
        <TabPanel key="blessings">
          <WikiBlessings />
        </TabPanel>
        <TabPanel key="double-up">
          <WikiDoubleUp />
        </TabPanel>
        <TabPanel key="town">
          <WikiTown />
        </TabPanel>
        <TabPanel key="dungeon">
          <WikiRegions />
        </TabPanel>
        <TabPanel key="stages">
          <WikiStages />
        </TabPanel>
        <TabPanel key="statistic">
          <WikiStatistic />
        </TabPanel>
        <TabPanel key="glossary">
          <WikiGlossary />
        </TabPanel>
        <TabPanel key="data">
          <WikiData />
        </TabPanel>
        {!inGame && (
          <>
            <TabPanel key="faq">
              <WikiFaq />
            </TabPanel>
            <TabPanel key="tutorials">
              <WikiTutorials />
            </TabPanel>
          </>
        )}
      </Tabs>
    </div>
  )
}
