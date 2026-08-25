import { useState } from "react"
import ReactDOM from "react-dom"
import { Tooltip } from "react-tooltip"
import { sortSynergiesForDisplay } from "../../../../../models/colyseus-models/synergies"
import type { Synergy } from "../../../../../types/enum/Synergy"
import BlessingsPanel from "./blessings-panel"
import SynergyComponent from "./synergy-component"
import SynergyDetailComponent from "./synergy-detail-component"
import "./synergies.css"

export default function Synergies(props: {
  synergies: [string, number][]
  tooltipPortal: boolean
  blessingsEnabled?: boolean
}) {
  const [hoveredSynergy, setHoveredSynergy] = useState<Synergy | null>(null)
  const synergies = sortSynergiesForDisplay(props.synergies)

  const tooltip = (
    <Tooltip
      id="detail-synergy"
      hidden={hoveredSynergy === null}
      className="custom-theme-tooltip"
      place="right-start"
      delayShow={100}
      delayHide={0}
    >
      {hoveredSynergy && (
        <SynergyDetailComponent
          type={hoveredSynergy}
          value={props.synergies.find((e) => e[0] == hoveredSynergy)![1]}
        />
      )}
    </Tooltip>
  )

  return (
    <div className="synergies-list">
      {props.blessingsEnabled && <BlessingsPanel recentOnly />}
      {synergies.map(([type, value], index) => (
        <SynergyComponent
          key={type}
          type={type}
          value={value}
          index={index}
          onMouseEnter={() => setHoveredSynergy(type)}
          onMouseLeave={() => setHoveredSynergy(null)}
        />
      ))}
      {props.tooltipPortal
        ? ReactDOM.createPortal(tooltip, document.body)
        : tooltip}
    </div>
  )
}
