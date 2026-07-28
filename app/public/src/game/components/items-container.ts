import type { ArraySchema, SetSchema } from "@colyseus/schema"
import { GameObjects } from "phaser"
import type Player from "../../../../models/colyseus-models/player"
import {
  Berries,
  Dishes,
  type Item,
  Seeds,
  ShinyItems,
  SpecialItems,
  TMs,
  Tools,
  Wands,
  WeatherRocks
} from "../../../../types/enum/Item"
import { SpecialGameRule } from "../../../../types/enum/SpecialGameRule"
import { isIn } from "../../../../utils/array"
import { schemaValues } from "../../../../utils/schemas"
import { DEPTH } from "../depths"
import type GameScene from "../scenes/game-scene"
import ItemContainer from "./item-container"

export default class ItemsContainer extends GameObjects.Container {
  scene: GameScene
  pokemonId: string | null
  playerId: string
  items: Item[] = []

  constructor(
    scene: GameScene,
    inventory: SetSchema<Item> | ArraySchema<Item>,
    x: number,
    y: number,
    pokemonId: string | null,
    playerId: string
  ) {
    super(scene, x, y)
    this.scene = scene
    this.pokemonId = pokemonId
    this.playerId = playerId
    this.setDepth(DEPTH.POKEMON_ITEM)
    scene.add.existing(this)
    this.render(inventory)
  }

  render(inventory: SetSchema<Item> | ArraySchema<Item>) {
    this.removeAll(true)

    // SIX_PACK: up to 6 items laid out in columns of 3 (items 4-6 beside 1-3),
    // shrunk to 90% while keeping the original spacing so they stay readable.
    const isSixPack =
      this.pokemonId !== null &&
      this.scene.room?.state?.specialGameRule === SpecialGameRule.SIX_PACK

    const step = this.pokemonId === null ? 70 : 25 // spacing between item slots
    const scale = isSixPack ? 0.9 : 1
    // nudge the columns left a touch so they sit over the sprite's edge
    const xOffset = isSixPack ? -8 : 0
    const ITEMS_PER_COLUMN = isSixPack ? 3 : 6
    let items = schemaValues(inventory)

    if (this.pokemonId === null) {
      const activeSeed = items.find((it) => isIn(Seeds, it))
      items = items.filter((it) => !isIn(Seeds, it) || it === activeSeed)
    }

    this.items = []
    items
      .sort((a, b) => this.getOrderPriority(b) - this.getOrderPriority(a))
      .forEach((item, i) => {
        this.items.push(item)
        // extra columns extend right (away from the sprite) in six-pack, else left
        const columnDir = isSixPack ? 1 : -1
        const x = xOffset + columnDir * step * Math.floor(i / ITEMS_PER_COLUMN)
        const y = (i % ITEMS_PER_COLUMN) * step
        const itemContainer = new ItemContainer(
          this.scene,
          x,
          y,
          item,
          this.pokemonId,
          this.playerId
        )
        if (scale !== 1) itemContainer.setScale(scale)
        this.add(itemContainer)
      })
  }

  getOrderPriority(item: Item): number {
    if (isIn(Seeds, item)) return 20
    if (isIn(SpecialItems, item)) return 10
    if (isIn(WeatherRocks, item)) return 3
    if (isIn(TMs, item)) return 5
    if (isIn(Wands, item)) return 4
    if (isIn(ShinyItems, item)) return 2
    if (isIn(Tools, item)) return 1
    if (isIn(Dishes, item)) return -1
    if (isIn(Berries, item)) return -2
    return 0
  }

  closeTooltips() {
    for (let i = 0; i < this.list.length; i++) {
      const it = <ItemContainer>this.list[i]
      it.closeDetail()
    }
  }

  setPlayer(player: Player) {
    this.playerId = player.id
    this.render(player.items)
  }

  updateCount(item: Item, count: number) {
    for (let i = 0; i < this.list.length; i++) {
      const it = <ItemContainer>this.list[i]
      if (it.name === item) {
        it.updateCount(count)
      }
    }
  }
}
