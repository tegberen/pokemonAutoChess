import { GameObjects } from "phaser"
import ReactDOM from "react-dom/client"
import { useTranslation } from "react-i18next"
import { getAvailableEmotions } from "../../../../models/precomputed/precomputed-emotions"
import type { IPlayer } from "../../../../types"
import { AvatarEmotions, type Emotion } from "../../../../types/enum/Emotion"
import { logger } from "../../../../utils/logger"
import PokemonPortrait from "../../pages/component/pokemon-portrait"
import { cc } from "../../pages/utils/jsx"
import store from "../../stores"
import type GameScene from "../scenes/game-scene"
import "./emote-menu.css"
import { Item, ItemComponents } from "../../../../types/enum/Item"

export function EmoteMenuComponent(props: {
  player: IPlayer
  index: string
  shiny: boolean
  sendEmote: (emotion: Emotion) => void
  sendItemEmote: (item: Item) => void
}) {
  const { t } = useTranslation()
  const availableEmotions = getAvailableEmotions(props.index, props.shiny)
  const emotions: Emotion[] = AvatarEmotions.filter((emotion) =>
    availableEmotions.includes(emotion)
  )
  return (
    <div>
      {emotions.length === 0 ? (
        <div>{t("no_emotions_available")}</div>
      ) : (
        <ul>
          {emotions.map((emotion, i) => {
            const unlocked = store.getState().game.emotesUnlocked.includes(emotion)
            return (
              <li key={emotion}>
                <PokemonPortrait
                  portrait={{ index: props.index, shiny: props.shiny, emotion }}
                  title={emotion + (!unlocked ? " (locked)" : "")}
                  className={cc({ locked: !unlocked })}
                  onClick={() => unlocked && props.sendEmote(emotion)}
                />
                <span className="counter">{i + 1}</span>
              </li>
            )
          })}
        </ul>
      )}
      <ul className="item-emotes">
        { ItemComponents.filter((item) => item !== Item.SILK_SCARF).map((item) => (
          <li key={item} onClick={() => props.sendItemEmote(item)}>
            <img src={`assets/item/${item}.png`} title={item} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default class EmoteMenu extends GameObjects.DOMElement {
  dom: HTMLDivElement
  constructor(
    scene: GameScene,
    avatarIndex: string,
    shiny: boolean,
    sendEmote: (emotion: Emotion) => void,
    sendItemEmote: (item: Item) => void
  ) {
    super(scene, -350, -150)
    const state = store.getState()
    const player = state.game.players.find((p) => p.id === scene.uid)
    this.dom = document.createElement("div")
    this.dom.className = "my-container emote-menu"
    this.setElement(this.dom)
    const root = ReactDOM.createRoot(this.dom)
    if (player) {
      root.render(
        <EmoteMenuComponent
          player={player}
          index={avatarIndex}
          shiny={shiny}
          sendEmote={sendEmote}
          sendItemEmote={sendItemEmote}
        />
      )
    } else {
      logger.error(`Cant' find player bound to EmoteMenu`)
    }
  }
}
