import { Schema, type } from "@colyseus/schema"
import type { IFloatingItem } from "../../types"
import type { Item } from "../../types/enum/Item"
import { Pkm } from "../../types/enum/Pokemon"

export class FloatingItem extends Schema implements IFloatingItem {
  @type("string") id: string
  @type("string") name: Item
  @type("number") x: number
  @type("number") y: number
  @type("string") avatarId: string = ""
  // Bidoof carousels: the Pokemon riding this item, granted along with it
  @type("string") pkm: Pkm = Pkm.DEFAULT
  index: number

  constructor(name: Item, x: number, y: number, index: number) {
    super()
    this.id = crypto.randomUUID()
    this.name = name
    this.x = x
    this.y = y
    this.index = index
  }
}
