import type Phaser from "phaser"
import { GameObjects, Geom } from "phaser"
import PokemonFactory from "../../../../models/pokemon-factory"
import { getPokemonData } from "../../../../models/precomputed/precomputed-pokemon-data"
import { Rarity } from "../../../../types/enum/Game"
import type { Item } from "../../../../types/enum/Item"
import { Pkm } from "../../../../types/enum/Pokemon"
import { preference } from "../../preferences"
import { DEPTH } from "../depths"
import type GameScene from "../scenes/game-scene"
import ItemDetail from "./item-detail"
import type MinigameManager from "./minigame-manager"
import PokemonSprite from "./pokemon"

const ITEM_DISC_SIZE = 40

/* A carried item hangs off the Pokemon's shoulder the way Mystery Dungeon draws
   one, so the Pokemon keeps the container origin and the disc is pushed clear of
   its silhouette. The origin is also where the server puts the collision body,
   which makes the Pokemon itself the thing you walk into to grab the pair. */
const CARRIED_ITEM_OFFSET_X = 28
const CARRIED_ITEM_OFFSET_Y = -34

/* canvas copy of the --color-rarity-* variables in style/colors.css, which the
   ring under a carried Pokemon is tinted with so its rarity reads at a glance */
const RarityRingColor: { [rarity in Rarity]?: number } = {
  [Rarity.COMMON]: 0xa0a0a0,
  [Rarity.UNCOMMON]: 0x3bc95e,
  [Rarity.RARE]: 0x41bfcc,
  [Rarity.EPIC]: 0x927fff,
  [Rarity.ULTRA]: 0xe53b3b,
  [Rarity.SPECIAL]: 0xe58ee5
}

export class FloatingItemContainer extends GameObjects.Container {
  scene: GameScene
  manager: MinigameManager
  name: Item
  circle: GameObjects.Ellipse
  sprite: GameObjects.Image
  pokemonPad: GameObjects.Ellipse | undefined
  pokemonSprite: PokemonSprite | undefined
  rarityColor: number = 0xffffff
  id: string
  detail: ItemDetail | undefined
  mouseoutTimeout: NodeJS.Timeout | null = null

  constructor(
    manager: MinigameManager,
    id: string,
    x: number,
    y: number,
    item: Item,
    pkm: Pkm = Pkm.DEFAULT
  ) {
    super(manager.scene, x, y)
    this.scene = manager.scene
    this.manager = manager
    this.name = item
    this.id = id

    const itemX = pkm === Pkm.DEFAULT ? 0 : CARRIED_ITEM_OFFSET_X
    const itemY = pkm === Pkm.DEFAULT ? 0 : CARRIED_ITEM_OFFSET_Y

    if (pkm !== Pkm.DEFAULT) {
      this.rarityColor =
        RarityRingColor[getPokemonData(pkm).rarity] ?? this.rarityColor
      // town ground is the same sand tone as most sprites, so give them a pad
      this.pokemonPad = new GameObjects.Ellipse(
        manager.scene,
        0,
        20,
        52,
        18,
        0x000000,
        0.25
      )
      this.pokemonPad.setStrokeStyle(1, this.rarityColor, 0.5)
      this.add(this.pokemonPad)

      this.pokemonSprite = new PokemonSprite(
        this.scene,
        0,
        0,
        PokemonFactory.createPokemonFromName(pkm),
        "carousel",
        false,
        false
      )
      this.add(this.pokemonSprite)
    }

    this.circle = new GameObjects.Ellipse(
      manager.scene,
      itemX,
      itemY,
      ITEM_DISC_SIZE,
      ITEM_DISC_SIZE,
      0x61738a,
      1
    )
    this.circle.setStrokeStyle(1, 0xffffff, 0.7)
    this.add(this.circle)
    this.sprite = new GameObjects.Image(
      manager.scene,
      itemX,
      itemY,
      "item",
      this.name + ".png"
    )
    this.sprite.setScale(0.32)
    this.add(this.sprite)
    this.setDepth(DEPTH.INANIMATE_OBJECTS)

    // the item tooltip is opened by hovering the disc, wherever the disc landed
    this.setSize(ITEM_DISC_SIZE, ITEM_DISC_SIZE)
    this.setInteractive(
      new Geom.Rectangle(
        itemX - ITEM_DISC_SIZE / 2,
        itemY - ITEM_DISC_SIZE / 2,
        ITEM_DISC_SIZE,
        ITEM_DISC_SIZE
      ),
      Geom.Rectangle.Contains
    )
      .on("pointerover", (pointer: Phaser.Input.Pointer) => {
        this.onPointerOver(pointer)
      })
      .on("pointerout", () => this.onPointerOut())
      .on(
        "pointerdown",
        (
          pointer: Phaser.Input.Pointer,
          _x: number,
          _y: number,
          event: Phaser.Types.Input.EventData
        ) => {
          this.onPointerDown(pointer, event)
        }
      )

    this.scene.add.existing(this)
  }

  onGrab(playerId) {
    const currentPlayerId: string = (this.scene as GameScene).uid!
    const takenByMe = playerId === currentPlayerId
    const free = playerId === ""

    if (takenByMe) {
      this.circle.setStrokeStyle(2, 0x4cff00, 1)
      this.circle.setFillStyle(0x61738a, 1)
    } else if (free) {
      this.circle.setStrokeStyle(1, 0xffffff, 0.7)
      this.circle.setFillStyle(0x61738a, 1)
    } else {
      this.circle.setStrokeStyle(2, 0xcf0000, 0.7)
      this.circle.setFillStyle(0x61738a, 0.7)
    }

    /* the Pokemon is what you walk into, so its ring has to carry the same
       claimed/free colours as the item disc or the feedback lands nowhere near
       the thing that was touched. Unclaimed it falls back to showing rarity */
    if (this.pokemonPad) {
      if (takenByMe) {
        this.pokemonPad.setStrokeStyle(2, 0x4cff00, 1)
      } else if (free) {
        this.pokemonPad.setStrokeStyle(1, this.rarityColor, 0.5)
      } else {
        this.pokemonPad.setStrokeStyle(2, 0xcf0000, 0.7)
      }
      this.pokemonPad.setFillStyle(0x000000, free || takenByMe ? 0.25 : 0.15)
    }
    this.pokemonSprite?.setAlpha(free || takenByMe ? 1 : 0.7)
  }

  openDetail() {
    this.scene.closeTooltips() // close other open item tooltips

    if (this.detail === undefined) {
      this.detail = new ItemDetail(this.scene, 0, 0, this.name)
      this.detail.setDepth(DEPTH.TOOLTIP)
      this.detail.setPosition(
        this.circle.x + this.detail.width * 0.5 + 40,
        this.circle.y + this.detail.height * 0.5
      )
      this.detail.setVisible(false)
      this.detail.dom.addEventListener("mouseenter", () => {
        this.mouseoutTimeout && clearTimeout(this.mouseoutTimeout)
      })
      this.detail.dom.addEventListener("mouseleave", () => {
        if (preference("showDetailsOnHover")) {
          this.mouseoutTimeout = setTimeout(() => {
            if (this.detail?.visible) {
              this.closeDetail()
            }
          }, 0)
        }
      })

      this.add(this.detail)
    }

    this.detail.setVisible(true)
  }

  closeDetail() {
    this.detail?.setVisible(false)
  }

  onPointerOver(pointer) {
    if (preference("showDetailsOnHover") && !this.detail?.visible) {
      this.mouseoutTimeout && clearTimeout(this.mouseoutTimeout)
      this.openDetail()
    }
  }

  onPointerOut() {
    if (preference("showDetailsOnHover")) {
      this.mouseoutTimeout = setTimeout(() => {
        if (this.detail?.visible) {
          this.closeDetail()
        }
      }, 0)
    }
  }

  onPointerDown(
    pointer: Phaser.Input.Pointer,
    event: Phaser.Types.Input.EventData
  ) {
    if (pointer.rightButtonDown() && !preference("showDetailsOnHover")) {
      if (!this.detail?.visible) {
        this.openDetail()
      } else {
        this.closeDetail()
      }
    }
  }
}
