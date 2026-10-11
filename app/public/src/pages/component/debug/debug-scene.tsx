import Phaser from "phaser"
import MoveToPlugin from "phaser4-rex-plugins/plugins/moveto-plugin"
import { useCallback, useEffect, useRef, useState } from "react"
import { Orientation } from "../../../../../types/enum/Game"
import type { Item } from "../../../../../types/enum/Item"
import { Pkm } from "../../../../../types/enum/Pokemon"
import type { Status } from "../../../../../types/enum/Status"
import { DebugScene } from "../../../game/scenes/debug-scene"
import { preference } from "../../../preferences"
import "./debug-scene.css"

export default function DebugSceneContainer({
  pkm = Pkm.RATTATA,
  orientation = Orientation.DOWNLEFT,
  animationType = "Idle",
  shiny,
  status,
  awakening = "",
  height = 100,
  width = 100
}: {
  pkm?: Pkm
  orientation?: Orientation
  animationType?: string
  shiny: boolean
  status: Status | ""
  awakening?: Item | ""
  height?: number
  width?: number
}) {
  const gameRef = useRef<Phaser.Game>(null)
  const debugScene = useRef<DebugScene>(null)

  const initialized = useRef<boolean>(false)
  const [loaded, setLoaded] = useState<boolean>(false)

  const [statusMessage, setStatusMessage] = useState<string>("")

  const onProgress = () =>
    setStatusMessage(debugScene?.current?.loadingManager?.statusMessage ?? "")

  const onComplete = useCallback(() => {
    setLoaded(true)
    debugScene.current?.updateSprite(
      pkm,
      orientation,
      animationType,
      status,
      shiny,
      awakening
    )
  }, [animationType, orientation, pkm, status, shiny, awakening])

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      debugScene.current = new DebugScene(height, width, onProgress, onComplete)

      gameRef.current = new Phaser.Game({
        type: +(preference("renderer") ?? Phaser.AUTO),
        parent: "debug-scene",
        pixelArt: true,
        width,
        height,
        scene: [debugScene.current],
        backgroundColor: "#61738a",
        plugins: {
          global: [
            {
              key: "rexMoveTo",
              plugin: MoveToPlugin,
              start: true
            }
          ]
        }
      })
    }
  }, [height, initialized, onComplete, width])

  useEffect(() => {
    if (initialized.current === true && loaded === true) {
      debugScene.current?.updateSprite(
        pkm,
        orientation,
        animationType,
        status,
        shiny,
        awakening
      )
    }
  }, [pkm, orientation, animationType, status, loaded, shiny, awakening])

  return (
    <div id="debug-scene">
      {!loaded && <p id="status-message">{statusMessage}</p>}
    </div>
  )
}
