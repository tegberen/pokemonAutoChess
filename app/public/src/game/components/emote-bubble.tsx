import { GameObjects } from "phaser"
import { getAvatarSrc } from "../../../../utils/avatar"

export class EmoteBubble extends GameObjects.DOMElement {
  dom: HTMLDivElement

  constructor(scene: Phaser.Scene, emoteAvatar: string, isOpponent: boolean) {
    super(scene, 0, 0)

    this.dom = document.createElement("div")
    this.dom.className =
      "game-emote-bubble " + (isOpponent ? "opponent" : "current")

    const emoteImg = document.createElement("img")
    if (emoteAvatar.startsWith("item/")) {
      emoteImg.src = `assets/${emoteAvatar}.png`
      this.dom.appendChild(emoteImg)
    } else if (emoteAvatar.startsWith("text/")) {
      const text = emoteAvatar.replace("text/", "")
      const span = document.createElement("span")
      span.textContent = text
      span.style.fontSize = "3em"
      span.style.fontWeight = "bold"
      span.style.padding = "4px 8px"
      span.style.cursor = "white"
      span.style.textShadow = "1px 1px 2px black"
      this.dom.appendChild(span)
    } else {
      emoteImg.src = getAvatarSrc(emoteAvatar)
      this.dom.appendChild(emoteImg)
    }
    this.setElement(this.dom)
  }
}
