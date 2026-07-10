import { model, Schema } from "mongoose"

// Single global document holding the admin-configured announcement NPC shown in town.
export interface IEventNpc {
  enabled: boolean
  pokemon: string
  title: string
  message: string
  orientation: string
  animation: string
  emotion: string
}

const eventNpcSchema = new Schema<IEventNpc>({
  enabled: { type: Boolean, default: false },
  pokemon: { type: String, default: "" },
  title: { type: String, default: "" },
  message: { type: String, default: "" },
  orientation: { type: String, default: "" },
  animation: { type: String, default: "" },
  emotion: { type: String, default: "" }
})

export const EventNpc = model<IEventNpc>("EventNpc", eventNpcSchema)

export default EventNpc
