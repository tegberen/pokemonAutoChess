import { useTranslation } from "react-i18next"
import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import { ActivityReport } from "./activity-report"
import { ItemizationTheory } from "./itemization-theory"
import { SynergyGuide } from "./synergy-guide"
import { TempoGuide } from "./tempo-guide"
import "./meta-report.css"

export default function MetaReport() {
  const { t } = useTranslation()

  return (
    <div id="meta-report">
      <Tabs>
        <TabList>
          <Tab key="itemization-theory">
            <img
              src="assets/icons/ITEM_GUIDE.svg"
              alt=""
              className="tab-icon"
            />
            Itemization
          </Tab>
          <Tab key="tempo-guide">Tempo Guide</Tab>
          <Tab key="synergy-guide">
            <img
              src="assets/icons/BOOKMARKLET_ICON.svg"
              alt=""
              className="tab-icon"
            />
            {t("guide.bookmarks_title")}
          </Tab>
          <Tab key="activity-report">
            {t("game_activity", { defaultValue: "Game Activity" })}
          </Tab>
        </TabList>

        <TabPanel>
          <ItemizationTheory />
        </TabPanel>
        <TabPanel>
          <TempoGuide />
        </TabPanel>
        <TabPanel>
          <SynergyGuide />
        </TabPanel>
        <TabPanel>
          <ActivityReport />
        </TabPanel>
      </Tabs>
    </div>
  )
}
