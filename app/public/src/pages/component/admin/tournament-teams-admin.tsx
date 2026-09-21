import { useEffect, useRef, useState } from "react"
import { TEAMS_PER_LOBBY } from "../../../../../core/tournament-swiss"
import type { ITournament } from "../../../../../types/interfaces/Tournament"
import { schemaEntries } from "../../../../../utils/schemas"
import {
  addTournamentTestPlayers,
  kickTournamentParticipant,
  registerTournamentTeams,
  startTournament
} from "../../../network"

type Participant = { id: string; name: string }

export function TournamentTeamsAdmin(props: { tournament: ITournament }) {
  // not memoised: the MapSchema mutates in place and never changes identity
  const participants: Participant[] = schemaEntries(
    props.tournament.players
  ).map(([id, player]) => ({ id, name: player.name }))
  const registered = schemaEntries(props.tournament.teams)
  const [pairs, setPairs] = useState<string[][]>([])
  const [justRegistered, setJustRegistered] = useState(false)
  const registeredCount = registered.length
  const previousCount = useRef(registeredCount)

  // cleared only once the teams come back synced, so a rejected registration
  // keeps the pairing intact
  useEffect(() => {
    if (registeredCount > 0 && registeredCount !== previousCount.current) {
      setPairs([])
      setJustRegistered(true)
      const timer = setTimeout(() => setJustRegistered(false), 4000)
      previousCount.current = registeredCount
      return () => clearTimeout(timer)
    }
    previousCount.current = registeredCount
  }, [registeredCount])

  const assignedIds = new Set([
    ...pairs.flat(),
    ...registered.flatMap(([, team]) => [...team.playersId]),
    ...schemaEntries(props.tournament.players)
      .filter(([, player]) => player.partnerId)
      .map(([id]) => id)
  ])
  const unpaired = participants.filter((p) => !assignedIds.has(p.id))
  const nameOf = (id: string) =>
    participants.find((p) => p.id === id)?.name ?? id

  // registering replaces the whole set, so edits start from the registered teams
  const workingPairs = () =>
    pairs.length > 0 ? pairs : registered.map(([, team]) => [...team.playersId])

  function addPair(a: string, b: string) {
    if (!a || !b || a === b) return
    setPairs([...workingPairs(), [a, b]])
  }

  function useConfirmedPairs() {
    const seen = new Set<string>()
    const confirmed: string[][] = []
    schemaEntries(props.tournament.players).forEach(([id, player]) => {
      if (!player.partnerId || seen.has(id)) return
      seen.add(id)
      seen.add(player.partnerId)
      confirmed.push([id, player.partnerId])
    })
    const base = workingPairs()
    const alreadyPaired = new Set(base.flat())
    setPairs([
      ...base,
      ...confirmed.filter((pair) => !pair.some((id) => alreadyPaired.has(id)))
    ])
  }

  const confirmedPairCount =
    schemaEntries(props.tournament.players).filter(
      ([, player]) => player.partnerId
    ).length / 2

  function autoPair() {
    const next: string[][] = []
    for (let i = 0; i + 1 < unpaired.length; i += 2) {
      next.push([unpaired[i].id, unpaired[i + 1].id])
    }
    setPairs([...workingPairs(), ...next])
  }

  const fillsLobbies = pairs.length > 0 && pairs.length % TEAMS_PER_LOBBY === 0
  const canStart =
    registered.length > 0 && registered.length % TEAMS_PER_LOBBY === 0

  return (
    <div className="tournament-teams-admin">
      <p className="tournament-teams-summary">
        {participants.length} participants · {registered.length} teams
        registered ({registered.length * 2} players) · {confirmedPairCount}{" "}
        pairs agreed by players
        {pairs.length > 0 && ` · ${pairs.length} pending, not registered yet`}
        {justRegistered && (
          <span className="tournament-registered-flash">
            {" "}
            · {registered.length} teams registered
          </span>
        )}
      </p>

      {registered.length > 0 && (
        <section>
          <h3>Registered teams</h3>
          <ol className="tournament-team-list">
            {registered.map(([teamId, team]) => (
              <li key={teamId}>{team.name}</li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <h3>{registered.length > 0 ? "Edit teams" : "Build teams"}</h3>
        <PairPicker participants={unpaired} onPair={addPair} />
        <div className="actions">
          <button
            className="bubbly blue"
            disabled={confirmedPairCount === 0}
            title="Take the teams players agreed between themselves"
            onClick={useConfirmedPairs}
          >
            Use {confirmedPairCount} agreed pairs
          </button>
          <button
            className="bubbly blue"
            disabled={unpaired.length < 2}
            onClick={autoPair}
          >
            Pair the rest randomly
          </button>
        </div>

        {pairs.length > 0 && (
          <>
            <ol className="tournament-team-list pending">
              {pairs.map((pair, index) => (
                <li key={pair.join()}>
                  <button
                    className="remove-btn bubbly red"
                    title="Remove this team"
                    onClick={() =>
                      setPairs(pairs.filter((_, i) => i !== index))
                    }
                  >
                    x
                  </button>
                  {nameOf(pair[0])} &amp; {nameOf(pair[1])}
                </li>
              ))}
            </ol>
            <div className="actions">
              <button
                className="bubbly green"
                disabled={!fillsLobbies}
                title={
                  fillsLobbies
                    ? unpaired.length > 0
                      ? `${unpaired.length} participants stay on the bench`
                      : ""
                    : `Lobbies hold ${TEAMS_PER_LOBBY} teams: add ${
                        TEAMS_PER_LOBBY - (pairs.length % TEAMS_PER_LOBBY)
                      } more or remove ${pairs.length % TEAMS_PER_LOBBY}`
                }
                onClick={() =>
                  registerTournamentTeams({
                    tournamentId: props.tournament.id,
                    pairs
                  })
                }
              >
                {registered.length > 0 ? "Replace with" : "Register"}{" "}
                {pairs.length} teams ({pairs.length * 2} players)
              </button>
              <button className="bubbly red" onClick={() => setPairs([])}>
                Discard changes
              </button>
              {!fillsLobbies && (
                <span className="tournament-teams-warning">
                  Needs a multiple of {TEAMS_PER_LOBBY} teams
                </span>
              )}
            </div>
          </>
        )}

        {pairs.length === 0 && registered.length > 0 && (
          <div className="actions">
            <button
              className="bubbly red"
              title="Clear the registered teams and pair again"
              onClick={() => {
                if (confirm(`Unregister all ${registered.length} teams ?`)) {
                  registerTournamentTeams({
                    tournamentId: props.tournament.id,
                    pairs: []
                  })
                }
              }}
            >
              Unregister all teams
            </button>
          </div>
        )}
      </section>

      {unpaired.length > 0 && (
        <details className="tournament-unassigned">
          <summary>
            {unpaired.length} without a team: they sit on the bench as
            substitutes
          </summary>
          <ul>
            {unpaired.map((p) => (
              <li key={p.id}>
                {p.name}
                <button
                  className="remove-btn bubbly red"
                  title="Remove from the tournament"
                  onClick={() =>
                    kickTournamentParticipant({
                      tournamentId: props.tournament.id,
                      playerId: p.id
                    })
                  }
                >
                  x
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <footer className="actions">
        <button
          className="bubbly green"
          disabled={!canStart}
          title={
            canStart
              ? "Open the lobbies of the first round now"
              : `Register a multiple of ${TEAMS_PER_LOBBY} teams first`
          }
          onClick={() => {
            if (
              confirm(`Start the tournament with ${registered.length} teams ?`)
            ) {
              startTournament({ tournamentId: props.tournament.id })
            }
          }}
        >
          Start tournament
        </button>
        {!canStart && (
          <span className="tournament-teams-warning">
            {pairs.length > 0
              ? `Register the ${pairs.length} teams above first`
              : `Register a multiple of ${TEAMS_PER_LOBBY} teams first`}
          </span>
        )}
        <div className="spacer" />
        {[16, 32].map((target) => (
          <button
            key={target}
            className="bubbly"
            title="Test tool: adds stand-in participants"
            disabled={participants.length >= target}
            onClick={() =>
              addTournamentTestPlayers({
                tournamentId: props.tournament.id,
                count: target - participants.length
              })
            }
          >
            Fill to {target}
          </button>
        ))}
      </footer>
    </div>
  )
}

function PairPicker(props: {
  participants: Participant[]
  onPair: (a: string, b: string) => void
}) {
  const [first, setFirst] = useState("")
  const [second, setSecond] = useState("")

  return (
    <div className="tournament-pair-picker">
      <select value={first} onChange={(e) => setFirst(e.target.value)}>
        <option value="">Player 1</option>
        {props.participants.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select value={second} onChange={(e) => setSecond(e.target.value)}>
        <option value="">Player 2</option>
        {props.participants
          .filter((p) => p.id !== first)
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
      </select>
      <button
        className="bubbly blue"
        disabled={!first || !second}
        onClick={() => {
          props.onPair(first, second)
          setFirst("")
          setSecond("")
        }}
      >
        Add team
      </button>
    </div>
  )
}
