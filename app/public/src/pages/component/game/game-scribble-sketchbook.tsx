import { useTranslation } from "react-i18next"
import { Tooltip } from "react-tooltip"
import {
  ScribbleShapeOffsets,
  ScribbleShapeTint,
  ScribbleShapeType,
  ScribbleSketchbookMilestones
} from "../../../../../config/game/scribble-shapes"
import { SpecialGameRule } from "../../../../../types/enum/SpecialGameRule"
import { selectSpectatedPlayer, useAppSelector } from "../../../hooks"
import "./game-scribble-sketchbook.css"

const ALL_SHAPES = Object.values(ScribbleShapeType)

function tintToCss(tint: number): string {
  return `#${tint.toString(16).padStart(6, "0")}`
}

export function ScribbleShapeGlyph(props: {
  shapeType: ScribbleShapeType
  collected: boolean
}) {
  const offsets = ScribbleShapeOffsets[props.shapeType]
  const width = Math.max(...offsets.map(([dx]) => dx)) + 1
  const height = Math.max(...offsets.map(([, dy]) => dy)) + 1
  const cells: boolean[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      cells.push(offsets.some(([dx, dy]) => dx === x && dy === y))
    }
  }
  return (
    <div
      className="scribble-shape-glyph"
      style={{ gridTemplateColumns: `repeat(${width}, 8px)` }}
    >
      {cells.map((filled, i) => (
        <span
          key={i}
          style={
            filled
              ? {
                  backgroundColor: props.collected
                    ? tintToCss(ScribbleShapeTint[props.shapeType])
                    : "var(--color-bg-secondary)"
                }
              : undefined
          }
        />
      ))}
    </div>
  )
}

export function GameScribbleSketchbook() {
  const { t } = useTranslation()
  const spectatedPlayer = useAppSelector(selectSpectatedPlayer)
  const collected = spectatedPlayer
    ? [...spectatedPlayer.scribbleShapesCollected]
    : []

  return (
    <div className="game-scribble-sketchbook">
      <h2>{t("scribble_sketchbook")}</h2>
      <p className="help">{t("scribble_sketchbook_hint")}</p>
      <div className="scribble-sketchbook-progress">
        <div
          className="scribble-sketchbook-progress-fill"
          style={{ width: `${(collected.length / ALL_SHAPES.length) * 100}%` }}
        ></div>
      </div>
      <ul className="scribble-sketchbook-milestones">
        {(
          [
            "scribble_sketchbook_milestone_0",
            "scribble_sketchbook_milestone_1",
            "scribble_sketchbook_milestone_2",
            "scribble_sketchbook_milestone_3",
            "scribble_sketchbook_milestone_4",
            "scribble_sketchbook_milestone_5"
          ] as const
        ).map((milestoneLabel, i) => (
          <li
            key={milestoneLabel}
            className={
              collected.length >= ScribbleSketchbookMilestones[i]
                ? "reached"
                : ""
            }
          >
            {ScribbleSketchbookMilestones[i]}: {t(milestoneLabel)}
          </li>
        ))}
      </ul>
      <div className="scribble-sketchbook-grid">
        {ALL_SHAPES.map((shapeType) => {
          const isCollected = collected.includes(shapeType)
          return (
            <div
              key={shapeType}
              className={`scribble-sketchbook-entry ${isCollected ? "collected" : ""}`}
              title={t(`scribble_shape_effect.${shapeType}`)}
            >
              <ScribbleShapeGlyph
                shapeType={shapeType}
                collected={isCollected}
              />
              <span>{t(`scribble_shape.${shapeType}`)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function GameScribbleSketchbookIcon() {
  const specialGameRule = useAppSelector((state) => state.game.specialGameRule)
  const spectatedPlayer = useAppSelector(selectSpectatedPlayer)

  if (specialGameRule !== SpecialGameRule.LIGHT_SHOW || !spectatedPlayer) {
    return null
  }

  return (
    <div
      className="my-box scribble-sketchbook-icon"
      data-tooltip-id="game-scribble-sketchbook"
    >
      <img src="assets/ui/scribble.png" draggable="false" />
      <span>
        {spectatedPlayer.scribbleShapesCollected.length}/{ALL_SHAPES.length}
      </span>
      <Tooltip
        id="game-scribble-sketchbook"
        float
        place="top"
        className="custom-theme-tooltip"
      >
        <GameScribbleSketchbook />
      </Tooltip>
    </div>
  )
}
