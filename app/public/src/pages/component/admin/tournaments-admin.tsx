import type { RoomAvailable } from "@colyseus/sdk"
import { useState } from "react"
import {
  getTeamFinalRanking,
  getTeamTournamentStage
} from "../../../../../core/tournament-logic"
import type { ITournament } from "../../../../../types/interfaces/Tournament"
import { schemaEntries } from "../../../../../utils/schemas"
import { useAppSelector } from "../../../hooks"
import {
  createTournament,
  deleteTournament,
  remakeTournamentLobby,
  renameTournament,
  replaceTournamentPlayer,
  setTournamentWishes,
  simulateTournamentRound,
  startTournamentLobby
} from "../../../network"
import { cc } from "../../utils/jsx"
import { TournamentTeamsAdmin } from "./tournament-teams-admin"
import "./tournament-admin.css"

export function TournamentsAdmin() {
  const [tournamentName, setTournamentName] = useState<string>("")
  const tournaments = useAppSelector((state) => state.lobby.tournaments)

  function createNewTournament(event) {
    event.preventDefault()
    createTournament({
      name: tournamentName,
      // the admin starts it by hand, so this is only a creation timestamp
      startDate: new Date().toISOString()
    })
    setTournamentName("")
  }

  return (
    <div className="tournaments-admin">
      <form className="tournament-form my-box" onSubmit={createNewTournament}>
        <input
          type="text"
          required
          placeholder="Tournament name"
          value={tournamentName}
          onChange={(event) => setTournamentName(event.target.value)}
        />
        <button type="submit" className="bubbly blue">
          Create tournament
        </button>
      </form>
      {tournaments.length === 0 && <p>No tournament yet.</p>}
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
  const stage =
    tournament.stage === "registration"
      ? "Registration"
      : getTeamTournamentStage(tournament)

  return (
    <div className="my-box tournament-admin-item">
      <header>
        <h2>{tournament.name}</h2>
        <span className="tournament-admin-stage">{stage}</span>
        <div className="spacer" />
        <button
          className={cc("bubbly", tournament.wishesEnabled ? "green" : "")}
          title="Applies to the lobbies opened from now on"
          onClick={() =>
            setTournamentWishes({
              tournamentId: tournament.id,
              enabled: !tournament.wishesEnabled
            })
          }
        >
          Wishes {tournament.wishesEnabled ? "on" : "off"}
        </button>
        <button
          className="bubbly blue"
          onClick={() => {
            const name = prompt("Tournament name", tournament.name)
            if (name && name.trim() && name !== tournament.name) {
              renameTournament({ tournamentId: tournament.id, name })
            }
          }}
        >
          Rename
        </button>
        <button
          className="bubbly red"
          onClick={() => {
            if (confirm(`Delete "${tournament.name}" and all registrations ?`)) {
              deleteTournament({ id: tournament.id })
            }
          }}
        >
          Delete
        </button>
      </header>
      {tournament.stage === "registration" && (
        <TournamentTeamsAdmin tournament={tournament} />
      )}
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
          Titles are yours to hand out.
        </p>
      )}
    </div>
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
        <button
          className="bubbly"
          title="Test tool: ends every open lobby with random placements"
          onClick={() =>
            simulateTournamentRound({ tournamentId: props.tournament.id })
          }
        >
          Simulate round
        </button>
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
