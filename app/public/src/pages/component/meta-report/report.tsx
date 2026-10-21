import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import { ActivityReport } from "./activity-report"
import { WishReport } from "./wish-report"
import "./report.css"

export function Report() {
  return (
    <div id="report">
      <Tabs>
        <TabList>
          <Tab>Wish Data</Tab>
          <Tab>Activity</Tab>
        </TabList>
        <TabPanel>
          <WishReport />
        </TabPanel>
        <TabPanel>
          <ActivityReport />
        </TabPanel>
      </Tabs>
    </div>
  )
}
