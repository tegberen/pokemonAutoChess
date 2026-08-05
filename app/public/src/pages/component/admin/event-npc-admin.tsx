import { useEffect, useMemo, useState } from "react"
import { getAvailableEmotions } from "../../../../../models/precomputed/precomputed-emotions"
import { Emotion } from "../../../../../types"
import { Orientation, PokemonActionState } from "../../../../../types/enum/Game"
import { Pkm, PkmIndex } from "../../../../../types/enum/Pokemon"
import { useAppSelector } from "../../../hooks"
import { setEventNpc } from "../../../network"
import { Checkbox } from "../checkbox/checkbox"
import { PokemonTypeahead } from "../typeahead/pokemon-typeahead"

const POKEMON_NAMES = Object.values(Pkm)
const ORIENTATIONS = Object.entries(Orientation) as [string, Orientation][]
const ANIMATIONS = Object.values(PokemonActionState)

export function EventNpcAdmin() {
  const eventNpc = useAppSelector((state) => state.lobby.eventNpc)

  const [enabled, setEnabled] = useState(eventNpc.enabled)
  const [pokemon, setPokemon] = useState(eventNpc.pokemon)
  const [title, setTitle] = useState(eventNpc.title)
  const [message, setMessage] = useState(eventNpc.message)
  const [orientation, setOrientation] = useState(
    eventNpc.orientation || Orientation.DOWN
  )
  const [animation, setAnimation] = useState(
    eventNpc.animation || PokemonActionState.IDLE
  )
  const [emotion, setEmotion] = useState(eventNpc.emotion || Emotion.NORMAL)
  const [tournamentEnabled, setTournamentEnabled] = useState(eventNpc.tournamentEnabled)
  const [tournamentTitle, setTournamentTitle] = useState(eventNpc.tournamentTitle)
  const [tournamentMessage, setTournamentMessage] = useState(eventNpc.tournamentMessage)
  const [tournamentDate, setTournamentDate] = useState(eventNpc.tournamentDate)
  const [applied, setApplied] = useState(false)

  // sync the form with the live server value (first load / other admin edits)
  useEffect(() => {
    setEnabled(eventNpc.enabled)
    setPokemon(eventNpc.pokemon)
    setTitle(eventNpc.title)
    setMessage(eventNpc.message)
    setOrientation(eventNpc.orientation || Orientation.DOWN)
    setAnimation(eventNpc.animation || PokemonActionState.IDLE)
    setEmotion(eventNpc.emotion || Emotion.NORMAL)
    setTournamentEnabled(eventNpc.tournamentEnabled)
    setTournamentTitle(eventNpc.tournamentTitle)
    setTournamentMessage(eventNpc.tournamentMessage)
    setTournamentDate(eventNpc.tournamentDate)
  }, [
    eventNpc.enabled,
    eventNpc.pokemon,
    eventNpc.title,
    eventNpc.message,
    eventNpc.orientation,
    eventNpc.animation,
    eventNpc.emotion
    , eventNpc.tournamentEnabled, eventNpc.tournamentTitle, eventNpc.tournamentMessage, eventNpc.tournamentDate
  ])

  const isValidPokemon = POKEMON_NAMES.includes(pokemon as Pkm)

  // Title and message are both optional; only a Pokémon is required to enable.
  const problem =
    enabled && !isValidPokemon ? "Choose a Pokémon to stand in town." : null

  // is the live server value the same as the form?
  const inSync =
    eventNpc.enabled === enabled &&
    eventNpc.pokemon === pokemon &&
    eventNpc.title === title &&
    eventNpc.message === message &&
    (eventNpc.orientation || Orientation.DOWN) === orientation &&
    (eventNpc.animation || PokemonActionState.IDLE) === animation &&
    (eventNpc.emotion || Emotion.NORMAL) === emotion

  // Emotions available for the chosen Pokémon (falls back to NORMAL).
  const availableEmotions = useMemo(() => {
    const emotions = POKEMON_NAMES.includes(pokemon as Pkm)
      ? getAvailableEmotions(PkmIndex[pokemon as Pkm], false)
      : []
    return emotions.length > 0 ? emotions : [Emotion.NORMAL]
  }, [pokemon])

  function apply() {
    if (problem) return
    setEventNpc({
      enabled,
      pokemon,
      title,
      message,
      orientation,
      animation,
      emotion,
      tournamentEnabled,
      tournamentTitle,
      tournamentMessage,
      tournamentDate,
      doubleUpEnabled: eventNpc.doubleUpEnabled,
      doubleUpTitle: eventNpc.doubleUpTitle,
      doubleUpMessage: eventNpc.doubleUpMessage,
      doubleUpDate: eventNpc.doubleUpDate
    })
    setApplied(true)
  }

  // The Pokémon selector builds a ~1000-entry <select> (with per-entry data and
  // translation lookups). Memoize it on `pokemon` so typing in the text fields
  // doesn't re-render/re-sort the whole list on every keystroke.
  const pokemonSelector = useMemo(
    () => (
      <PokemonTypeahead
        value={pokemon}
        onChange={(pkm) => {
          setPokemon(pkm)
          setApplied(false)
        }}
      />
    ),
    [pokemon]
  )

  return (
    <div id="event-npc-admin" className="content">
      <h2>Announcement NPC</h2>
      <p>
        A Pokémon that stands in the town / podium screen. Players click it to
        read what it says. Turn it on and choose who stands there; the title and
        message are both optional. Then <strong>Apply</strong>.
      </p>

      <div
        className="my-box"
        style={{ padding: "0.5em 0.75em", marginBottom: "1em" }}
      >
        <strong>Live status:</strong>{" "}
        {eventNpc.enabled ? (
          <span style={{ color: "var(--color-fg-gold, gold)" }}>
            ON — {eventNpc.pokemon || "(no Pokémon)"}
            {eventNpc.title ? ` — ${eventNpc.title}` : ""}
            {eventNpc.message ? ` — “${eventNpc.message}”` : ""}
          </span>
        ) : (
          <span>OFF (no NPC shown)</span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
        <div className="my-box" style={{ padding: "0.5em 0.75em" }}>
          <Checkbox
            checked={enabled}
            onToggle={(value) => {
              setEnabled(value)
              setApplied(false)
            }}
            label="Show the announcement NPC in town"
          />
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: "0.25em" }}>
          <strong>1. Pokémon standing there</strong>
          {pokemonSelector}
        </label>

        <div style={{ display: "flex", gap: "1.5em", flexWrap: "wrap" }}>
          <label
            style={{ display: "flex", flexDirection: "column", gap: "0.25em" }}
          >
            <strong>2. Direction it faces</strong>
            <select
              value={orientation}
              onChange={(event) => {
                setOrientation(event.target.value as Orientation)
                setApplied(false)
              }}
            >
              {ORIENTATIONS.map(([name, value]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label
            style={{ display: "flex", flexDirection: "column", gap: "0.25em" }}
          >
            <strong>3. Action / animation</strong>
            <select
              value={animation}
              onChange={(event) => {
                setAnimation(event.target.value as PokemonActionState)
                setApplied(false)
              }}
            >
              {ANIMATIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label
            style={{ display: "flex", flexDirection: "column", gap: "0.25em" }}
          >
            <strong>4. Emotion</strong>
            <select
              value={emotion}
              onChange={(event) => {
                setEmotion(event.target.value as Emotion)
                setApplied(false)
              }}
            >
              {availableEmotions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: "0.25em" }}>
          <strong>5. Title (optional) — e.g. a name</strong>
          <input
            type="text"
            value={title}
            style={{ width: "50ch", maxWidth: "100%" }}
            placeholder="e.g. Tournament, or a character name"
            onChange={(event) => {
              setTitle(event.target.value)
              setApplied(false)
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "0.25em" }}>
          <strong>6. Message (optional) — shown when clicked</strong>
          <textarea
            value={message}
            rows={3}
            style={{ width: "50ch", maxWidth: "100%" }}
            placeholder="e.g. A tournament is coming on the 25th!"
            onChange={(event) => {
              setMessage(event.target.value)
              setApplied(false)
            }}
          />
        </label>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1em",
            flexWrap: "wrap"
          }}
        >
          <button
            type="button"
            className="bubbly blue"
            onClick={apply}
            title={problem ?? "Apply these settings for all players"}
          >
            Apply
          </button>

          {problem && <span style={{ color: "salmon" }}>{problem}</span>}
          {!problem && applied && inSync && (
            <span style={{ color: "var(--color-fg-gold, gold)" }}>
              Applied — live for all players
            </span>
          )}
          {!problem && applied && !inSync && <span>Applying…</span>}
        </div>
      </div>
    </div>
  )
}
