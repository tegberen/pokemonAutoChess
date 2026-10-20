import type { RoomAvailable } from "@colyseus/sdk"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  getTeamFinalRanking,
  getTeamStandings,
  getTeamTournamentStage,
  getTournamentRules,
  isSoloTournament
} from "../../../../../core/tournament-logic"
import {
  TOURNAMENT_LOBBY_START_DELAY_IN_SECONDS,
  TOURNAMENT_RULES
} from "../../../../../core/tournament-swiss"
import { Title } from "../../../../../types"
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
import { cc } from "../../utils/jsx"
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
          <TournamentStandingsAdmin tournament={tournament} />
          <TournamentSubstituteAdmin tournament={tournament} />
        </>
      )}
      {tournament.finished && (
        <TournamentResultsAdmin tournament={tournament} />
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

type LobbyStatus = {
  tone: "waiting" | "playing" | "finished" | "lost"
  label: string
  autoStartAt?: string | null
}

function useSecondsTicker(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [active])
  return now
}

function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, "0")
  return `${minutes}:${seconds}`
}

function lobbyStatus(
  bracketId: string,
  finished: boolean,
  preparationRooms: RoomAvailable[],
  gameRooms: RoomAvailable[]
): LobbyStatus {
  if (finished) return { tone: "finished", label: "Finished, points counted" }
  const game = gameRooms.find((r) => r.metadata?.bracketId === bracketId)
  if (game) {
    return {
      tone: "playing",
      label: `Playing, stage ${game.metadata?.stageLevel ?? 0}`
    }
  }
  const lobby = preparationRooms.find(
    (r) => r.metadata?.bracketId === bracketId
  )
  if (lobby) {
    const joined = lobby.metadata?.playersInfo?.length ?? 0
    const expected = lobby.metadata?.whitelist?.length ?? 0
    return {
      tone: "waiting",
      label: `${joined} of ${expected} players in`,
      autoStartAt: lobby.metadata?.autoStartAt
    }
  }
  return { tone: "lost", label: "Lobby closed, reopen it" }
}

function TournamentLobbiesAdmin(props: { tournament: ITournament }) {
  const { tournament } = props
  const preparationRooms = useAppSelector(
    (state) => state.lobby.preparationRooms
  )
  const gameRooms = useAppSelector((state) => state.lobby.gameRooms)
  const brackets = schemaEntries(tournament.brackets)
  const showTestTools = useTournamentTestTools()
  const finishedCount = brackets.filter(([, b]) => b.finished).length
  const startDelayMinutes = TOURNAMENT_LOBBY_START_DELAY_IN_SECONDS / 60
  const anyWaiting = brackets.some(
    ([bracketId, bracket]) =>
      !bracket.finished &&
      preparationRooms.some((r) => r.metadata?.bracketId === bracketId)
  )
  const now = useSecondsTicker(anyWaiting)

  return (
    <section>
      <h3>
        Lobbies: {finishedCount} of {brackets.length} finished
      </h3>
      <p className="help">
        Nothing to do here: each lobby starts by itself {startDelayMinutes}{" "}
        minutes after it opens, and the next round opens once every lobby is
        finished. Step in only if something goes wrong.
      </p>

      <ul className="tournament-lobby-cards">
        {brackets.map(([bracketId, bracket]) => {
          const status = lobbyStatus(
            bracketId,
            bracket.finished,
            preparationRooms,
            gameRooms
          )
          return (
            <li key={bracketId} className="tournament-lobby-card">
              <header>
                <strong>{bracket.name}</strong>
                {status.tone === "waiting" ? (
                  <>
                    <span className="tournament-lobby-status waiting">
                      {status.autoStartAt
                        ? `Starts by itself in ${formatCountdown(
                            new Date(status.autoStartAt).getTime() - now
                          )}`
                        : "Starts by itself soon"}
                    </span>
                    <small>{status.label}</small>
                  </>
                ) : (
                  <span className={`tournament-lobby-status ${status.tone}`}>
                    {status.label}
                  </span>
                )}
              </header>
              <ul className="tournament-lobby-teams">
                {[...bracket.teamsId].map((id) => (
                  <li key={id}>{tournament.teams.get(id)?.name ?? id}</li>
                ))}
              </ul>
              {status.tone === "waiting" && (
                <button
                  className="bubbly dark"
                  title="Optional: start before the countdown ends"
                  onClick={() => {
                    if (
                      confirm(
                        `Start ${bracket.name} now? Anyone not in the ` +
                          "lobby yet scores 0 points this round."
                      )
                    ) {
                      startTournamentLobby({ bracketId })
                    }
                  }}
                >
                  Start early
                </button>
              )}
              {(status.tone === "playing" || status.tone === "lost") && (
                <button
                  className={cc(
                    "bubbly",
                    status.tone === "lost" ? "orange" : "dark"
                  )}
                  onClick={() => {
                    const lostGame =
                      status.tone === "playing"
                        ? " The game in progress is lost."
                        : ""
                    if (
                      confirm(
                        `Reopen ${bracket.name} with a fresh lobby for the ` +
                          `same teams?${lostGame}`
                      )
                    ) {
                      remakeTournamentLobby({
                        tournamentId: tournament.id,
                        bracketId
                      })
                    }
                  }}
                >
                  {status.tone === "lost" ? "Reopen lobby" : "Restart lobby"}
                </button>
              )}
            </li>
          )
        })}
      </ul>

      <details className="tournament-troubleshooting">
        <summary>Something went wrong?</summary>
        <p className="help">
          After a server restart, the lobbies of this round can disappear.
          Reopen every unfinished lobby at once: games still in progress are
          lost.
        </p>
        <div className="actions">
          <button
            className="bubbly orange"
            onClick={() => {
              if (
                confirm(
                  "Reopen every unfinished lobby of this round? Games in " +
                    "progress are lost."
                )
              ) {
                remakeTournamentLobby({
                  tournamentId: tournament.id,
                  bracketId: "all"
                })
              }
            }}
          >
            Reopen all unfinished lobbies
          </button>
          {showTestTools && (
            <button
              className="bubbly"
              title="Test tool: ends every open lobby with random placements"
              onClick={() =>
                simulateTournamentRound({ tournamentId: tournament.id })
              }
            >
              Simulate round
            </button>
          )}
        </div>
      </details>
    </section>
  )
}

const WINNER_TITLE_BY_FORMAT: Record<TournamentFormat, Title> = {
  duo: Title.CHAMPION,
  solo: Title.THE_SCRIBBLER,
  misfits: Title.THE_MISFIT
}

const PODIUM_PLACES = ["1st", "2nd", "3rd"]

function TournamentResultsAdmin(props: { tournament: ITournament }) {
  const { t } = useTranslation()
  const { tournament } = props
  const ranking = getTeamFinalRanking(tournament)
  const winnerTitle =
    WINNER_TITLE_BY_FORMAT[tournament.format] ?? Title.CHAMPION
  const winners = ranking[0]
    ? [...(tournament.teams.get(ranking[0].id)?.playersId ?? [])].map(
        (id) => tournament.players.get(id)?.name ?? id
      )
    : []

  return (
    <section>
      <h3>Results</h3>
      <ol className="tournament-podium">
        {ranking.slice(0, 3).map((team, index) => (
          <li key={team.id} className={`place-${index + 1}`}>
            <span className="tournament-podium-place">
              {PODIUM_PLACES[index]}
            </span>
            <strong className="tournament-podium-name" title={team.name}>
              {team.name}
            </strong>
          </li>
        ))}
      </ol>
      {winners.length > 0 && (
        <p className="help">
          Last step: give {winners.join(" and ")} the{" "}
          <strong>{t(`title.${winnerTitle}`)}</strong> title from{" "}
          {winners.length > 1 ? "their profiles" : "their profile"}, in the
          Title row.
        </p>
      )}
      <h3>Final ranking</h3>
      <RankingList teams={ranking} showPoints={false} />
    </section>
  )
}

function RankingList(props: {
  teams: ReturnType<typeof getTeamStandings>
  showPoints: boolean
}) {
  return (
    <ol
      className={cc("tournament-standings", {
        "no-points": !props.showPoints
      })}
    >
      {props.teams.map((team, index) => {
        const eliminated = props.showPoints && team.eliminated
        return (
          <li
            key={team.id}
            className={cc({ eliminated })}
            title={eliminated ? `${team.name}, eliminated` : team.name}
          >
            <span className="tournament-standings-rank">{index + 1}.</span>
            {props.showPoints && (
              <span className="tournament-standings-points">
                {team.points} pts
              </span>
            )}
            <span className="tournament-standings-name">{team.name}</span>
          </li>
        )
      })}
    </ol>
  )
}

function TournamentStandingsAdmin(props: { tournament: ITournament }) {
  const standings = getTeamStandings(props.tournament)
  if (standings.length === 0) return null

  return (
    <section>
      <h3>Standings</h3>
      <RankingList teams={standings} showPoints />
    </section>
  )
}

function TournamentSubstituteAdmin(props: { tournament: ITournament }) {
  const { tournament } = props
  const isSolo = isSoloTournament(tournament)
  const [teamId, setTeamId] = useState("")
  const [outgoingId, setOutgoingId] = useState("")
  const [incomingId, setIncomingId] = useState("")
  const teams = schemaEntries(tournament.teams).filter(
    ([, team]) => !team.eliminated
  )
  const inTeams = new Set(
    schemaEntries(tournament.teams).flatMap(([, team]) => [...team.playersId])
  )
  const bench = schemaEntries(tournament.players).filter(
    ([id]) => !inTeams.has(id)
  )
  const team = tournament.teams.get(teamId)
  const nameOf = (id: string) => tournament.players.get(id)?.name ?? id

  function reset() {
    setTeamId("")
    setOutgoingId("")
    setIncomingId("")
  }

  return (
    <section>
      <h3>Replace a player</h3>
      <p className="help">
        {isSolo ? "The spot keeps its" : "The team keeps its"} points and
        history. If their lobby is still waiting, the substitute takes the free
        place.
      </p>
      {bench.length === 0 ? (
        <p className="help">
          Nobody is on the bench. Players can sign up as a substitute from the
          tournament page.
        </p>
      ) : (
        <div className="tournament-substitute-form">
          <label>
            {isSolo ? "Player leaving" : "Team"}
            <select
              value={teamId}
              onChange={(e) => {
                setTeamId(e.target.value)
                const picked = tournament.teams.get(e.target.value)
                const [onlyPlayer] = [...(picked?.playersId ?? [])]
                setOutgoingId(isSolo ? (onlyPlayer ?? "") : "")
              }}
            >
              <option value="">Choose…</option>
              {teams.map(([id, t]) => (
                <option key={id} value={id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          {!isSolo && (
            <label>
              Player leaving
              <select
                value={outgoingId}
                disabled={!team}
                onChange={(e) => setOutgoingId(e.target.value)}
              >
                <option value="">Choose…</option>
                {[...(team?.playersId ?? [])].map((id) => (
                  <option key={id} value={id}>
                    {nameOf(id)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Substitute joining
            <select
              value={incomingId}
              onChange={(e) => setIncomingId(e.target.value)}
            >
              <option value="">Choose…</option>
              {bench.map(([id, player]) => (
                <option key={id} value={id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="bubbly blue"
            disabled={!teamId || !outgoingId || !incomingId}
            onClick={() => {
              if (
                confirm(
                  `Replace ${nameOf(outgoingId)} with ${nameOf(incomingId)}?`
                )
              ) {
                replaceTournamentPlayer({
                  tournamentId: tournament.id,
                  teamId,
                  outgoingId,
                  incomingId
                })
                reset()
              }
            }}
          >
            Replace
          </button>
        </div>
      )}
    </section>
  )
}
