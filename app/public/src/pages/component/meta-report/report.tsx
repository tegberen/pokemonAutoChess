import { useTranslation } from "react-i18next"
import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import { ActivityReport } from "./activity-report"
import { ItemPlacementReport } from "./item-placement-report"
import { PokemonLineReport } from "./pokemon-line-report"
import { WishReport } from "./wish-report"
import "./report.css"

export function Report() {
  const { t } = useTranslation()
  return (
    <div id="report">
      <Tabs>
        <TabList>
          <Tab>{t("report_wishes")}</Tab>
          <Tab>{t("report_pokemon")}</Tab>
          <Tab>{t("report_items")}</Tab>
          <Tab>Activity</Tab>
        </TabList>
        <TabPanel>
          <WishReport />
        </TabPanel>
        <TabPanel>
          <PokemonLineReport />
        </TabPanel>
        <TabPanel>
          <ItemPlacementReport />
        </TabPanel>
        <TabPanel>
          <ActivityReport />
        </TabPanel>
      </Tabs>
    </div>
  )
}
