import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import { CalendarAdmin } from "./tournament-card-admin"
import { TournamentsAdmin } from "./tournaments-admin"
import "./admin-panel.css"

export default function TournamentsPanel() {
  return (
    <div className="admin-panel">
      <Tabs>
        <TabList>
          <Tab>Tournaments</Tab>
          <Tab>Calendar</Tab>
        </TabList>

        <TabPanel>
          <TournamentsAdmin />
        </TabPanel>
        <TabPanel>
          <CalendarAdmin />
        </TabPanel>
      </Tabs>
    </div>
  )
}
