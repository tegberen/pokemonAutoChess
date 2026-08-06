import { useEffect, useState } from "react"
import { useAppSelector } from "../../../hooks"
import { setEventNpc } from "../../../network"
import { Checkbox } from "../checkbox/checkbox"

export function TournamentCardAdmin() {
  const eventNpc = useAppSelector((state) => state.lobby.eventNpc)
  const [enabled, setEnabled] = useState(eventNpc.tournamentEnabled)
  const [title, setTitle] = useState(eventNpc.tournamentTitle)
  const [message, setMessage] = useState(eventNpc.tournamentMessage)
  const [date, setDate] = useState(eventNpc.tournamentDate.slice(0, 10))
  const [doubleUpEnabled, setDoubleUpEnabled] = useState(eventNpc.doubleUpEnabled)
  const [doubleUpTitle, setDoubleUpTitle] = useState(eventNpc.doubleUpTitle)
  const [doubleUpMessage, setDoubleUpMessage] = useState(eventNpc.doubleUpMessage)
  const [doubleUpDate, setDoubleUpDate] = useState(eventNpc.doubleUpDate.slice(0, 10))

  useEffect(() => {
    setEnabled(eventNpc.tournamentEnabled)
    setTitle(eventNpc.tournamentTitle)
    setMessage(eventNpc.tournamentMessage)
    setDate(eventNpc.tournamentDate.slice(0, 10))
    setDoubleUpEnabled(eventNpc.doubleUpEnabled)
    setDoubleUpTitle(eventNpc.doubleUpTitle)
    setDoubleUpMessage(eventNpc.doubleUpMessage)
    setDoubleUpDate(eventNpc.doubleUpDate.slice(0, 10))
  }, [eventNpc])

  return (
    <div className="content tournament-card-admin">
      <h2>Smeargle Pack Tournament Card</h2>
      <div className="calendar-visibility-toggle">
        <div>
          <strong>Calendar visibility</strong>
          <small>Display this card in the Events calendar.</small>
        </div>
        <Checkbox checked={enabled} onToggle={setEnabled} label={enabled ? "Visible" : "Hidden"} isDark />
      </div>
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" />
      <textarea value={message} rows={4} onChange={(event) => setMessage(event.target.value)} placeholder="Description" />
      <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />

      <h2>Double Up Tournament Card</h2>
      <div className="calendar-visibility-toggle">
        <div>
          <strong>Calendar visibility</strong>
          <small>Display this card in the Events calendar.</small>
        </div>
        <Checkbox checked={doubleUpEnabled} onToggle={setDoubleUpEnabled} label={doubleUpEnabled ? "Visible" : "Hidden"} isDark />
      </div>
      <input value={doubleUpTitle} onChange={(event) => setDoubleUpTitle(event.target.value)} placeholder="Title" />
      <textarea value={doubleUpMessage} rows={4} onChange={(event) => setDoubleUpMessage(event.target.value)} placeholder="Description" />
      <input type="date" value={doubleUpDate} onChange={(event) => setDoubleUpDate(event.target.value)} />

      <button className="bubbly blue" onClick={() => setEventNpc({ enabled: eventNpc.enabled, pokemon: eventNpc.pokemon, title: eventNpc.title, message: eventNpc.message, orientation: eventNpc.orientation, animation: eventNpc.animation, emotion: eventNpc.emotion, tournamentEnabled: enabled, tournamentTitle: title, tournamentMessage: message, tournamentDate: date, doubleUpEnabled, doubleUpTitle, doubleUpMessage, doubleUpDate })}>Apply</button>
    </div>
  )
}
