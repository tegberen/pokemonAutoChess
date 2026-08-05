import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import { EventNpcAdmin } from "./event-npc-admin"
import Maintenance from "./maintenance"
import { TournamentsAdmin } from "./tournaments-admin"
import { TournamentCardAdmin } from "./tournament-card-admin"
import "./admin-panel.css"

export default function AdminPanel() {
  return (
    <div className="admin-panel">
      <Tabs>
        <TabList>
          <Tab>Tournaments</Tab>
          <Tab>Event NPC</Tab>
          <Tab>Tournament Card</Tab>
          <Tab>Maintenance</Tab>
        </TabList>

        <TabPanel>
          <TournamentsAdmin />
        </TabPanel>
        <TabPanel>
          <EventNpcAdmin />
        </TabPanel>
        <TabPanel>
          <TournamentCardAdmin />
        </TabPanel>
        <TabPanel>
          <Maintenance />
        </TabPanel>
      </Tabs>
    </div>
  )
}
