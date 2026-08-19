import { GameObjects } from "phaser"
import ReactDOM from "react-dom/client"
import { useTranslation } from "react-i18next"
import { getAvailableEmotions } from "../../../../models/precomputed/precomputed-emotions"
import { AvatarEmotions, type Emotion } from "../../../../types/enum/Emotion"
import PokemonPortrait from "../../pages/component/pokemon-portrait"
import { cc } from "../../pages/utils/jsx"
import store from "../../stores"
import type GameScene from "../scenes/game-scene"
import "./emote-menu.css"
import { Item, ItemComponents } from "../../../../types/enum/Item"

export function EmoteMenuComponent(props: {
  index: string
  shiny: boolean
  sendEmote: (emotion: Emotion) => void
  sendItemEmote: (item: Item) => void
  sendTextEmote: (text: string) => void
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
            const unlocked = store
              .getState()
              .game.emotesUnlocked.includes(emotion)
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
          <li
            key={Item.PRISON_BOTTLE}
            onClick={() => props.sendItemEmote(Item.PRISON_BOTTLE)}
          >
            <img
              src={`assets/item/${Item.PRISON_BOTTLE}.png`}
              title={Item.PRISON_BOTTLE}
            />
          </li>
        </ul>
      )}
      <ul className="item-emotes">
        {ItemComponents.filter((item) => item !== Item.SILK_SCARF).map(
          (item) => (
            <li key={item} onClick={() => props.sendItemEmote(item)}>
              <img src={`assets/item/${item}.png`} title={item} />
            </li>
          )
        )}
      </ul>
      <ul className="text-emotes">
        {["ME", "YOU", "FREE ⛶", "⇌ ?", "✗", "OK"].map((text) => (
          <li key={text} onClick={() => props.sendTextEmote(text)}>
            <span
              style={{
                fontSize: "1.5em",
                fontWeight: "bold",
                padding: "4px 8px",
                cursor: "pointer"
              }}
            >
              {text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default class EmoteMenu extends GameObjects.DOMElement {
  dom: HTMLDivElement
  private root: ReactDOM.Root
  constructor(
    scene: GameScene,
    avatarIndex: string,
    shiny: boolean,
    sendEmote: (emotion: Emotion) => void,
    sendItemEmote: (item: Item) => void,
    sendTextEmote: (text: string) => void
  ) {
    super(scene, -350, -150)
    this.dom = document.createElement("div")
    this.dom.className = "my-container emote-menu"
    this.setElement(this.dom)
    this.root = ReactDOM.createRoot(this.dom)
    this.root.render(
      <EmoteMenuComponent
        index={avatarIndex}
        shiny={shiny}
        sendEmote={sendEmote}
        sendItemEmote={sendItemEmote}
        sendTextEmote={sendTextEmote}
      />
    )
  }

  destroy(fromScene?: boolean) {
    this.root.unmount()
    super.destroy(fromScene)
  }
}
