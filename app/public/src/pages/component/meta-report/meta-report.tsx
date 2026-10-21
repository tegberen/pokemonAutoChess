import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import { BindingBandGuide } from "./binding-band-guide"
import { ItemizationTheory } from "./itemization-theory"
import { TempoGuide } from "./tempo-guide"
import "./meta-report.css"

const tabKeys = [
  "itemization-theory",
  "tempo-guide",
  "binding-band-guide"
]

export default function MetaReport({ initialTab }: { initialTab?: string }) {
  return (
    <div id="meta-report">
      <Tabs defaultIndex={Math.max(0, tabKeys.indexOf(initialTab ?? ""))}>
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
          <Tab key="binding-band-guide">
            <img
              src="assets/item/BINDING_BAND.png"
              alt=""
              className="tab-icon tab-icon-item"
            />
            Binding Band Guide
          </Tab>
        </TabList>

        <TabPanel>
          <ItemizationTheory />
        </TabPanel>
        <TabPanel>
          <TempoGuide />
        </TabPanel>
        <TabPanel>
          <BindingBandGuide />
        </TabPanel>
      </Tabs>
    </div>
  )
}
