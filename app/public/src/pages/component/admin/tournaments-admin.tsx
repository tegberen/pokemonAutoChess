import type { RoomAvailable } from "@colyseus/sdk"
import { useRef, useState } from "react"
import {
  getTeamFinalRanking,
  getTeamTournamentStage,
  getTournamentRules,
  isSoloTournament
} from "../../../../../core/tournament-logic"
import { TOURNAMENT_RULES } from "../../../../../core/tournament-swiss"
import type {
  ITournament,
  TournamentFormat
} from "../../../../../types/interfaces/Tournament"
import { schemaEntries } from "../../../../../utils/schemas"
import { useAppSelector } from "../../../hooks"
import {
  createTournament,
  deleteTournament,
  remakeTournamentLobby,
  renameTournament,
  replaceTournamentPlayer,
  simulateTournamentRound,
  startTournamentLobby
} from "../../../network"
import {
  TournamentSoloAdmin,
  TournamentSteps,
  TournamentTeamsAdmin,
  useTournamentTestTools
} from "./tournament-teams-admin"
import "./tournament-admin.css"

export function TournamentsAdmin() {
  const [tournamentName, setTournamentName] = useState<string>("")
  const [format, setFormat] = useState<TournamentFormat>("duo")
  const tournaments = useAppSelector((state) => state.lobby.tournaments)
  const suggestedName = `${TOURNAMENT_RULES[format].suggestedName} Nr. X`

  function createNewTournament(event) {
    event.preventDefault()
    createTournament({
      name: tournamentName,
      // the admin starts it by hand, so this is only a creation timestamp
      startDate: new Date().toISOString(),
      format
    })
    setTournamentName("")
  }

  return (
    <div className="tournaments-admin">
      <form className="tournament-form my-box" onSubmit={createNewTournament}>
        <h2>New tournament</h2>
        <div className="tournament-form-fields">
          <label>
            Name
            <input
              type="text"
              required
              placeholder={`e.g. ${suggestedName}`}
              value={tournamentName}
              onChange={(event) => setTournamentName(event.target.value)}
            />
          </label>
          <label>
            Format
            <select
              value={format}
              onChange={(event) =>
                setFormat(event.target.value as TournamentFormat)
              }
            >
              {(Object.keys(TOURNAMENT_RULES) as TournamentFormat[]).map(
                (option) => (
                  <option key={option} value={option}>
                    {TOURNAMENT_RULES[option].label} ·{" "}
                    {TOURNAMENT_RULES[option].gameMode}
                  </option>
                )
              )}
            </select>
          </label>
          <button type="submit" className="bubbly blue">
            Create
          </button>
        </div>
        <p className="help">
          Players sign up from the tournament page. Nothing starts until you
          press Start the tournament.
        </p>
      </form>
      {tournaments.length === 0 && (
        <p className="help">No tournament yet. Create one above.</p>
      )}
      <ul>
        {tournaments.map((tournament) => (
          <li key={tournament.id}>
            <TournamentAdminItem tournament={tournament} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function TournamentAdminItem(props: { tournament: ITournament }) {
  const { tournament } = props
  const isSolo = isSoloTournament(tournament)
  const rules = getTournamentRules(tournament)
  // the step bar already says Registration, later stages add the round
  const stageDetail =
    tournament.stage === "registration"
      ? ""
      : getTeamTournamentStage(tournament)

  return (
    <div className="my-box tournament-admin-item">
      <header>
        <TournamentNameEditor tournament={tournament} />
        <span className="tournament-admin-format">
          <small>{rules.label}</small>
          <b>{rules.gameMode}</b>
        </span>
        {stageDetail && (
          <span className="tournament-admin-stage">{stageDetail}</span>
        )}
      </header>
      <TournamentSteps tournament={tournament} />
      {tournament.stage === "registration" &&
        (isSolo ? (
          <TournamentSoloAdmin tournament={tournament} />
        ) : (
          <TournamentTeamsAdmin tournament={tournament} />
        ))}
      {tournament.stage !== "registration" && !tournament.finished && (
        <>
          <TournamentLobbiesAdmin tournament={tournament} />
          <TournamentSubstituteAdmin tournament={tournament} />
        </>
      )}
      {tournament.finished && (
        <p>
          Won by{" "}
          <strong>{getTeamFinalRanking(tournament)[0]?.name ?? "-"}</strong>.
        </p>
      )}
      <footer className="tournament-admin-danger">
        <button
          className="bubbly dark"
          onClick={() => {
            if (
              confirm(
                `Delete "${tournament.name}" and all its registrations? ` +
                  "This cannot be undone."
              )
            ) {
              deleteTournament({ id: tournament.id })
            }
          }}
        >
          Delete tournament
        </button>
      </footer>
    </div>
  )
}

function TournamentNameEditor(props: { tournament: ITournament }) {
  const { tournament } = props
  const [draftName, setDraftName] = useState<string | null>(null)
  // the input can blur while it unmounts, after Enter or Escape already ended
  // the edit
  const editEnded = useRef(false)

  function startEditing() {
    editEnded.current = false
    setDraftName(tournament.name)
  }

  function endEditing(save: boolean) {
    if (editEnded.current) return
    editEnded.current = true
    const name = draftName?.trim()
    if (save && name && name !== tournament.name) {
      renameTournament({ tournamentId: tournament.id, name })
    }
    setDraftName(null)
  }

  if (draftName === null) {
    return (
      <button
        className="tournament-admin-name"
        title="Rename"
        onClick={startEditing}
      >
        {tournament.name}
        <span className="tournament-admin-name-pencil" aria-hidden="true">
          ✎
        </span>
      </button>
    )
  }

  return (
    <input
      className="tournament-admin-name-input"
      autoFocus
      value={draftName}
      aria-label="Tournament name"
      onChange={(e) => setDraftName(e.target.value)}
      onBlur={() => endEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") endEditing(true)
        if (e.key === "Escape") {
          // only cancels the edit, the modal stays open
          e.preventDefault()
          e.stopPropagation()
          endEditing(false)
        }
      }}
    />
  )
}

function lobbyStatus(
  bracketId: string,
  finished: boolean,
  preparationRooms: RoomAvailable[],
  gameRooms: RoomAvailable[]
): { label: string; waiting: boolean } {
  if (finished) return { label: "Finished", waiting: false }
  const game = gameRooms.find((r) => r.metadata?.bracketId === bracketId)
  if (game) {
    return { label: `Playing, stage ${game.metadata?.stageLevel ?? 0}`, waiting: false }
  }
  const lobby = preparationRooms.find((r) => r.metadata?.bracketId === bracketId)
  if (lobby) {
    const joined = lobby.metadata?.playersInfo?.length ?? 0
    const expected = lobby.metadata?.whitelist?.length ?? 0
    return { label: `Waiting, ${joined}/${expected} joined`, waiting: true }
  }
  return { label: "Lobby lost, remake it", waiting: false }
}

function TournamentLobbiesAdmin(props: { tournament: ITournament }) {
  const preparationRooms = useAppSelector(
    (state) => state.lobby.preparationRooms
  )
  const gameRooms = useAppSelector((state) => state.lobby.gameRooms)
  const brackets = schemaEntries(props.tournament.brackets)
  const showTestTools = useTournamentTestTools()

  return (
    <section>
      <h3>Lobbies</h3>
      <table className="tournament-lobbies">
        <thead>
          <tr>
            <th>Lobby</th>
            <th>Teams</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {brackets.map(([bracketId, bracket]) => {
            const status = lobbyStatus(
              bracketId,
              bracket.finished,
              preparationRooms,
              gameRooms
            )
            return (
              <tr key={bracketId}>
                <td>{bracket.name}</td>
                <td>
                  {[...bracket.teamsId]
                    .map((id) => props.tournament.teams.get(id)?.name ?? id)
                    .join(", ")}
                </td>
                <td>{status.label}</td>
                <td className="tournament-lobby-actions">
                  <button
                    className="bubbly green"
                    disabled={!status.waiting}
                    title="Start with the teams here in full; the others forfeit with 0 points"
                    onClick={() => {
                      if (confirm(`Start ${bracket.name} now ?`)) {
                        startTournamentLobby({ bracketId })
                      }
                    }}
                  >
                    Start now
                  </button>
                  <button
                    className="bubbly orange"
                    disabled={bracket.finished}
                    title="Close this lobby or game and open a fresh lobby for the same teams"
                    onClick={() => {
                      if (confirm(`Remake ${bracket.name} ? A game in progress is lost.`)) {
                        remakeTournamentLobby({
                          tournamentId: props.tournament.id,
                          bracketId
                        })
                      }
                    }}
                  >
                    Remake
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="actions">
        <button
          className="bubbly orange"
          title="After a server restart: reopens every unfinished lobby of this round"
          onClick={() => {
            if (
              confirm(
                "Remake every unfinished lobby of this round ? Games in progress are lost."
              )
            ) {
              remakeTournamentLobby({
                tournamentId: props.tournament.id,
                bracketId: "all"
              })
            }
          }}
        >
          Remake all lobbies
        </button>
        {showTestTools && (
          <button
            className="bubbly"
            title="Test tool: ends every open lobby with random placements"
            onClick={() =>
              simulateTournamentRound({ tournamentId: props.tournament.id })
            }
          >
            Simulate round
          </button>
        )}
      </div>
    </section>
  )
}

function TournamentSubstituteAdmin(props: { tournament: ITournament }) {
  const [teamId, setTeamId] = useState("")
  const [outgoingId, setOutgoingId] = useState("")
  const [incomingId, setIncomingId] = useState("")
  const teams = schemaEntries(props.tournament.teams).filter(
    ([, team]) => !team.eliminated
  )
  const inTeams = new Set(
    schemaEntries(props.tournament.teams).flatMap(([, team]) => [
      ...team.playersId
    ])
  )
  const bench = schemaEntries(props.tournament.players).filter(
    ([id]) => !inTeams.has(id)
  )
  const team = props.tournament.teams.get(teamId)
  const nameOf = (id: string) => props.tournament.players.get(id)?.name ?? id

  return (
    <section>
      <h3>Substitute a player</h3>
      {bench.length === 0 ? (
        <p className="help">
          Nobody is on the bench. Players can join the tournament as a
          substitute from its page.
        </p>
      ) : (
        <div className="tournament-pair-picker">
          <select
            value={teamId}
            onChange={(e) => {
              setTeamId(e.target.value)
              setOutgoingId("")
            }}
          >
            <option value="">Team</option>
            {teams.map(([id, t]) => (
              <option key={id} value={id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            value={outgoingId}
            disabled={!team}
            onChange={(e) => setOutgoingId(e.target.value)}
          >
            <option value="">Player out</option>
            {[...(team?.playersId ?? [])].map((id) => (
              <option key={id} value={id}>
                {nameOf(id)}
              </option>
            ))}
          </select>
          <select
            value={incomingId}
            onChange={(e) => setIncomingId(e.target.value)}
          >
            <option value="">Player in</option>
            {bench.map(([id, player]) => (
              <option key={id} value={id}>
                {player.name}
              </option>
            ))}
          </select>
          <button
            className="bubbly blue"
            disabled={!teamId || !outgoingId || !incomingId}
            onClick={() => {
              replaceTournamentPlayer({
                tournamentId: props.tournament.id,
                teamId,
                outgoingId,
                incomingId
              })
              setTeamId("")
              setOutgoingId("")
              setIncomingId("")
            }}
          >
            Substitute
          </button>
        </div>
      )}
    </section>
  )
}
