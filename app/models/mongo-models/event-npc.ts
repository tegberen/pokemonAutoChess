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
  tournamentEnabled: boolean
  tournamentTitle: string
  tournamentMessage: string
  tournamentDate: string
  doubleUpEnabled: boolean
  doubleUpTitle: string
  doubleUpMessage: string
  doubleUpDate: string
}

const eventNpcSchema = new Schema<IEventNpc>({
  enabled: { type: Boolean, default: false },
  pokemon: { type: String, default: "" },
  title: { type: String, default: "" },
  message: { type: String, default: "" },
  orientation: { type: String, default: "" },
  animation: { type: String, default: "" },
  emotion: { type: String, default: "" },
  tournamentEnabled: { type: Boolean, default: false },
  tournamentTitle: { type: String, default: "Smeargle Pack Tournament" },
  tournamentMessage: { type: String, default: "" },
  tournamentDate: { type: String, default: "" },
  doubleUpEnabled: { type: Boolean, default: false },
  doubleUpTitle: { type: String, default: "Double Up Tournament" },
  doubleUpMessage: { type: String, default: "" },
  doubleUpDate: { type: String, default: "" }
})

export const EventNpc = model<IEventNpc>("EventNpc", eventNpcSchema)

export default EventNpc
