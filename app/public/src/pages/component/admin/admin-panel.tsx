import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import { EventNpcAdmin } from "./event-npc-admin"
import Maintenance from "./maintenance"
import "./admin-panel.css"

export default function AdminPanel() {
  return (
    <div className="admin-panel">
      <Tabs>
        <TabList>
          <Tab>Event NPC</Tab>
          <Tab>Maintenance</Tab>
        </TabList>

        <TabPanel>
          <EventNpcAdmin />
        </TabPanel>
        <TabPanel>
          <Maintenance />
        </TabPanel>
      </Tabs>
    </div>
  )
}
