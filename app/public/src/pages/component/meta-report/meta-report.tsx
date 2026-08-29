import { useTranslation } from "react-i18next"
import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import { ActivityReport } from "./activity-report"
import { ItemizationTheory } from "./itemization-theory"
import { TempoGuide } from "./tempo-guide"
import "./meta-report.css"

export default function MetaReport() {
  const { t } = useTranslation()

  return (
    <div id="meta-report">
      <Tabs>
        <TabList>
          <Tab key="itemization-theory">Itemization</Tab>
          <Tab key="tempo-guide">Tempo Guide</Tab>
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
          <ActivityReport />
        </TabPanel>
      </Tabs>
    </div>
  )
}
