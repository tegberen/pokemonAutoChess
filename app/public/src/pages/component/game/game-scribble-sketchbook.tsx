import { type CSSProperties, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { Tooltip } from "react-tooltip"
import { BOARD_SIDE_HEIGHT, BOARD_WIDTH } from "../../../../../config"
import {
  SCRIBBLE_PAINTING_EVENT,
  ScribbleShapeOffsets,
  ScribbleShapeTint,
  ScribbleShapeType
} from "../../../../../config/game/scribble-shapes"
import { Title, Transfer } from "../../../../../types"
import { SpecialGameRule } from "../../../../../types/enum/SpecialGameRule"
import {
  selectConnectedPlayer,
  selectSpectatedPlayer,
  useAppSelector
} from "../../../hooks"
import { rooms } from "../../../network"
import { addIconsToDescription } from "../../utils/descriptions"
import { DEPTH } from "../../../game/depths"
import { getGameScene } from "../../game"
import DraggableWindow from "../modal/draggable-window"
import "./game-fossil-unlocks.css"
import "./game-scribble-sketchbook.css"

const ALL_SHAPES = Object.values(ScribbleShapeType)
const CANVAS_CELLS = BOARD_WIDTH * (BOARD_SIDE_HEIGHT - 1)

function tintToCss(tint: number): string {
  return `#${tint.toString(16).padStart(6, "0")}`
}

export function ScribbleShapeGlyph(props: {
  shapeType: ScribbleShapeType
  collected: boolean
  cellSize?: number
}) {
  const cellSize = props.cellSize ?? 8
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
      style={{
        gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
        gridAutoRows: `${cellSize}px`
      }}
    >
      {cells.map((filled, i) => (
        <span
          key={i}
          style={
            filled
              ? {
                  backgroundColor: props.collected
                    ? tintToCss(ScribbleShapeTint[props.shapeType])
                    : "color-mix(in srgb, var(--color-fg-secondary) 40%, transparent)"
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
      <p className="help">{t("light_show_subtitle")}</p>
      <div className="scribble-sketchbook-progress">
        <div
          className="scribble-sketchbook-progress-fill"
          style={{ width: `${(collected.length / ALL_SHAPES.length) * 100}%` }}
        ></div>
      </div>
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

export function GameLightShowTab() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const specialGameRule = useAppSelector((state) => state.game.specialGameRule)
  const connectedPlayer = useAppSelector(selectConnectedPlayer)

  if (specialGameRule !== SpecialGameRule.LIGHT_SHOW || !connectedPlayer) {
    return null
  }

  return (
    <div className="game-light-show-anchor my-container information">
      <button
        className="fossil-unlocks-button light-show-button"
        aria-pressed={open}
        onClick={() => setOpen(!open)}
      >
        <span className="fossil-unlocks-button-label">
          {t("scribble.LIGHT_SHOW")}{" "}
          {connectedPlayer.scribbleShapesCollected.length}/{ALL_SHAPES.length}
        </span>
      </button>
      {open && <LightShowDrawer />}
    </div>
  )
}

function LightShowDrawer() {
  const { t } = useTranslation()
  const connectedPlayer = useAppSelector(selectConnectedPlayer)
  const collected = connectedPlayer
    ? [...connectedPlayer.scribbleShapesCollected]
    : []
  const paintedShapes = connectedPlayer
    ? [...connectedPlayer.scribbleShapes].map((shape) => shape.shapeType)
    : []
  const [paintingShape, setPaintingShape] = useState<ScribbleShapeType | null>(
    null
  )

  useEffect(() => {
    const gameElement = document.getElementById("game")
    const onPainting = (event: Event) =>
      setPaintingShape((event as CustomEvent<ScribbleShapeType | null>).detail)
    gameElement?.addEventListener(SCRIBBLE_PAINTING_EVENT, onPainting)
    return () => {
      gameElement?.removeEventListener(SCRIBBLE_PAINTING_EVENT, onPainting)
      getGameScene()?.board?.stopScribblePainting()
    }
  }, [])

  // shapes never overlap, so their sizes add up to the painted cells
  const isCanvasFull =
    paintedShapes.reduce(
      (cells, shapeType) => cells + ScribbleShapeOffsets[shapeType].length,
      0
    ) === CANVAS_CELLS

  // the profile predates the game, so it lacks the title only on the first fill
  const alreadyArtist = useAppSelector(
    (state) => state.network.profile?.titles.includes(Title.ARTIST) ?? false
  )

  const eraseShape = (shapeType: ScribbleShapeType) =>
    rooms.game?.send(Transfer.SET_SCRIBBLE_PAINTING, { shapeType })

  const gameWrapper = document.getElementById("game-wrapper")
  if (!gameWrapper) return null

  return createPortal(
    <DraggableWindow
      title={t("scribble_sketchbook")}
      className="my-container light-show-drawer"
      style={{ zIndex: DEPTH.SYNERGIES_CONTAINER }}
    >
      <div className="light-show-progress">
        <progress
          className="my-progress"
          value={collected.length}
          max={ALL_SHAPES.length}
        ></progress>
        <span>
          {collected.length}/{ALL_SHAPES.length}
        </span>
      </div>
      <ul className="light-show-shapes">
        {ALL_SHAPES.map((shapeType) => {
          const isCollected = collected.includes(shapeType)
          const isActive = paintedShapes.includes(shapeType)
          const isPainting = paintingShape === shapeType
          return (
            <li
              key={shapeType}
              className={`my-box ${isCollected ? "clickable is-collected" : ""} ${isActive ? "is-active" : ""} ${isPainting ? "is-painting" : ""}`}
              style={
                {
                  "--shape-color": tintToCss(ScribbleShapeTint[shapeType])
                } as CSSProperties
              }
              onClick={() => {
                if (!isCollected) return
                if (isPainting) getGameScene()?.board?.stopScribblePainting()
                else getGameScene()?.board?.startScribblePainting(shapeType)
              }}
              onContextMenu={(event) => {
                event.preventDefault()
                if (isActive) eraseShape(shapeType)
              }}
            >
              {isActive && (
                <button
                  type="button"
                  className="light-show-erase"
                  title={t("light_show_erase")}
                  onClick={(event) => {
                    event.stopPropagation()
                    eraseShape(shapeType)
                  }}
                >
                  🗙
                </button>
              )}
              <div className="light-show-shape-glyph">
                <ScribbleShapeGlyph
                  shapeType={shapeType}
                  collected={isCollected}
                  cellSize={12}
                />
              </div>
              <h3>{t(`scribble_shape.${shapeType}`)}</h3>
              <p>
                {addIconsToDescription(t(`scribble_shape_effect.${shapeType}`))}
              </p>
            </li>
          )
        })}
      </ul>
      {isCanvasFull && (
        <p className="light-show-complete">
          {t(
            alreadyArtist
              ? "light_show_canvas_complete"
              : "light_show_artist_unlocked"
          )}
        </p>
      )}
      <footer className="light-show-footer">
        <p>{t("light_show_paint_hint")}</p>
        <button
          type="button"
          className="bubbly red"
          disabled={paintedShapes.length === 0}
          onClick={() => paintedShapes.forEach(eraseShape)}
        >
          {t("light_show_clear")}
        </button>
      </footer>
    </DraggableWindow>,
    gameWrapper
  )
}
