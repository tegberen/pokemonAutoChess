import { useEffect, useState } from "react"
import { getTournamentRules } from "../../../../../core/tournament-logic"
import {
  SWISS_ROUNDS,
  TOURNAMENT_RULES
} from "../../../../../core/tournament-swiss"
import { Role } from "../../../../../types"
import type {
  ITournament,
  TournamentStage
} from "../../../../../types/interfaces/Tournament"
import { shuffleArray } from "../../../../../utils/random"
import { schemaEntries } from "../../../../../utils/schemas"
import { useAppSelector } from "../../../hooks"
import {
  addTournamentTestPlayers,
  kickTournamentParticipant,
  registerTournamentTeams,
  startTournament
} from "../../../network"
import { cc } from "../../utils/jsx"

type Participant = { id: string; name: string }
type ReadyCheck = { tone: "ok" | "warn" | "block"; text: string }

const DUO_TEAMS_PER_LOBBY = TOURNAMENT_RULES.duo.teamsPerLobby
// stand-in players and simulated rounds are only for an admin testing locally
export function useTournamentTestTools(): boolean {
  const role = useAppSelector((state) => state.network.profile?.role)
  return process.env.MODE === "dev" && role === Role.ADMIN
}

const STEPS: { label: string; stages: TournamentStage[] }[] = [
  { label: "Registration", stages: ["registration"] },
  { label: "Qualification", stages: ["qualification"] },
  { label: "Finals", stages: ["semifinals", "final"] },
  { label: "Results", stages: ["finished"] }
]

export function TournamentSteps(props: { tournament: ITournament }) {
  const stage = props.tournament.finished ? "finished" : props.tournament.stage
  const currentStep = STEPS.findIndex((step) => step.stages.includes(stage))
  return (
    <ol className="tournament-steps">
      {STEPS.map((step, index) => (
        <li
          key={step.label}
          className={cc({
            done: index < currentStep,
            current: index === currentStep
          })}
        >
          <span className="tournament-step-dot" />
          {step.label}
        </li>
      ))}
    </ol>
  )
}

function participantsOf(tournament: ITournament): Participant[] {
  return schemaEntries(tournament.players).map(([id, player]) => ({
    id,
    name: player.name
  }))
}

function teamsKey(teams: string[][]): string {
  return teams
    .map((team) => [...team].sort().join("+"))
    .sort()
    .join("|")
}

function lobbySizeCheck(
  teamCount: number,
  teamsPerLobby: number,
  noun: string
): ReadyCheck {
  const leftOver = teamCount % teamsPerLobby
  if (teamCount === 0) {
    return { tone: "block", text: `No ${noun} yet.` }
  }
  if (leftOver !== 0) {
    return {
      tone: "block",
      text: `Lobbies hold ${teamsPerLobby} ${noun}: add ${
        teamsPerLobby - leftOver
      } more or remove ${leftOver}.`
    }
  }
  const lobbies = teamCount / teamsPerLobby
  return {
    tone: "ok",
    text: `${teamCount} ${noun} fill ${lobbies} ${
      lobbies === 1 ? "lobby" : "lobbies"
    } exactly: eligible to Start the tournament.`
  }
}

export function TournamentTeamsAdmin(props: { tournament: ITournament }) {
  const { tournament } = props
  // not memoised: the MapSchema mutates in place and never changes identity
  const participants = participantsOf(tournament)
  const registeredTeams = schemaEntries(tournament.teams).map(([, team]) => [
    ...team.playersId
  ])
  const registeredKey = teamsKey(registeredTeams)
  const [draftTeams, setDraftTeams] = useState<string[][] | null>(null)

  // dropped only once the teams come back synced, so a rejected save keeps
  // the edits
  useEffect(() => setDraftTeams(null), [registeredKey])

  // a player removed meanwhile cannot stay in an unsaved team
  const teams = (draftTeams ?? registeredTeams).filter((team) =>
    team.every((id) => tournament.players.has(id))
  )
  const hasUnsavedChanges =
    draftTeams !== null && teamsKey(teams) !== registeredKey
  const nameOf = (id: string) =>
    participants.find((p) => p.id === id)?.name ?? id

  const inTeam = new Set(teams.flat())
  const agreedPairs: string[][] = []
  schemaEntries(tournament.players).forEach(([id, player]) => {
    const partnerId = player.partnerId
    if (!partnerId || inTeam.has(id) || inTeam.has(partnerId)) return
    if (agreedPairs.some((pair) => pair.includes(id))) return
    agreedPairs.push([id, partnerId])
  })
  const inAgreedPair = new Set(agreedPairs.flat())
  const notInTeam = participants.filter((p) => !inTeam.has(p.id))
  // agreed pairs stay together, so random and hand pairing skip them
  const withoutTeam = notInTeam.filter((p) => !inAgreedPair.has(p.id))

  function editTeams(next: string[][]) {
    setDraftTeams(next)
  }

  function pairTheRestRandomly() {
    const shuffled = shuffleArray([...withoutTeam])
    const next: string[][] = []
    for (let i = 0; i + 1 < shuffled.length; i += 2) {
      next.push([shuffled[i].id, shuffled[i + 1].id])
    }
    editTeams([...teams, ...next])
  }

  const checks: ReadyCheck[] = [
    lobbySizeCheck(teams.length, DUO_TEAMS_PER_LOBBY, "teams")
  ]
  if (agreedPairs.length > 0) {
    checks.push({
      tone: "warn",
      text: `${agreedPairs.length} ${
        agreedPairs.length === 1 ? "pair" : "pairs"
      } agreed by the players ${
        agreedPairs.length === 1 ? "is" : "are"
      } not in a team yet.`
    })
  }
  if (withoutTeam.length > 0) {
    checks.push({
      tone: "warn",
      text: `${withoutTeam.length} ${
        withoutTeam.length === 1 ? "player has" : "players have"
      } no team. They wait on the bench as substitutes.`
    })
  }
  if (hasUnsavedChanges) {
    checks.push({ tone: "block", text: "Save the teams to start." })
  }
  const canStart = !checks.some((check) => check.tone === "block")
  // the server only accepts whole lobbies, an empty list clears the teams
  const canSave =
    hasUnsavedChanges && teams.length % DUO_TEAMS_PER_LOBBY === 0
  const registeredLobbies = registeredTeams.length / DUO_TEAMS_PER_LOBBY

  return (
    <div className="tournament-registration">
      <RegistrationOverview
        metrics={[
          { value: participants.length, label: "players signed up" },
          { value: teams.length, label: "teams" },
          {
            value: Math.floor(teams.length / DUO_TEAMS_PER_LOBBY),
            label: `lobbies of ${DUO_TEAMS_PER_LOBBY} teams`
          }
        ]}
        checks={checks}
      />

      <section>
        <header className="tournament-section-header">
          <h3>Teams ({teams.length})</h3>
          <div className="actions">
            {agreedPairs.length > 0 && (
              <button
                className="bubbly blue"
                onClick={() => editTeams([...teams, ...agreedPairs])}
              >
                Add {agreedPairs.length} agreed{" "}
                {agreedPairs.length === 1 ? "pair" : "pairs"}
              </button>
            )}
            <button
              className="bubbly blue"
              disabled={withoutTeam.length < 2}
              onClick={pairTheRestRandomly}
            >
              Pair the rest at random
            </button>
          </div>
        </header>
        <PairPicker
          participants={withoutTeam}
          onPair={(a, b) => editTeams([...teams, [a, b]])}
        />

        {teams.length > 0 ? (
          <ol className="tournament-team-list">
            {teams.map((team, index) => (
              <li key={team.join()}>
                <span className="tournament-team-number">{index + 1}</span>
                <span className="tournament-team-players">
                  <span>{nameOf(team[0])}</span>
                  <span>{nameOf(team[1])}</span>
                </span>
                <RemoveButton
                  title="Split this team"
                  onClick={() =>
                    editTeams(teams.filter((_, i) => i !== index))
                  }
                />
              </li>
            ))}
          </ol>
        ) : (
          <p className="help">
            No teams yet. Add the pairs players agreed on, pair players at
            random, or pick two players above.
          </p>
        )}

        {hasUnsavedChanges && (
          <div className="tournament-save-bar">
            <span>You have unsaved changes.</span>
            <button
              className="bubbly dark"
              onClick={() => setDraftTeams(null)}
            >
              Undo
            </button>
            <button
              className="bubbly green"
              disabled={!canSave}
              onClick={() =>
                registerTournamentTeams({
                  tournamentId: tournament.id,
                  pairs: teams
                })
              }
            >
              Save teams
            </button>
          </div>
        )}
      </section>

      {notInTeam.length > 0 && (
        <BenchList
          tournamentId={tournament.id}
          players={notInTeam}
          title="Not in a team"
        />
      )}

      <StartTournamentPanel
        tournament={tournament}
        canStart={canStart}
        description={
          `Opens the ${registeredLobbies} ${
            registeredLobbies === 1 ? "lobby" : "lobbies"
          } of qualification round 1 of ${SWISS_ROUNDS} for the ` +
          `${registeredTeams.length} saved teams. Registration closes, and ` +
          "players on the bench can still come in as substitutes."
        }
        confirmText={`Start the tournament with ${
          registeredTeams.length
        } teams?`}
        participantCount={participants.length}
      />
    </div>
  )
}

// Solo needs no pairing: every participant is a team of one, built on start
export function TournamentSoloAdmin(props: { tournament: ITournament }) {
  const { tournament } = props
  const participants = participantsOf(tournament)
  const { teamsPerLobby } = getTournamentRules(tournament)
  const check = lobbySizeCheck(participants.length, teamsPerLobby, "players")
  const lobbies = participants.length / teamsPerLobby

  return (
    <div className="tournament-registration">
      <RegistrationOverview
        metrics={[
          { value: participants.length, label: "players signed up" },
          {
            value: Math.floor(lobbies),
            label: `lobbies of ${teamsPerLobby} players`
          }
        ]}
        checks={[check]}
      />

      {participants.length > 0 && (
        <BenchList
          tournamentId={tournament.id}
          players={participants}
          title="Players"
        />
      )}

      <StartTournamentPanel
        tournament={tournament}
        canStart={check.tone === "ok"}
        description={`Opens the ${lobbies} ${
          lobbies === 1 ? "lobby" : "lobbies"
        } of qualification round 1 of ${SWISS_ROUNDS}. Registration closes.`}
        confirmText={`Start the tournament with ${
          participants.length
        } players?`}
        participantCount={participants.length}
      />
    </div>
  )
}

function RegistrationOverview(props: {
  metrics: { value: number; label: string }[]
  checks: ReadyCheck[]
}) {
  return (
    <section className="tournament-overview">
      <div className="tournament-metrics">
        {props.metrics.map((metric) => (
          <div key={metric.label} className="tournament-metric">
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </div>
      <ul className="tournament-checks">
        {props.checks.map((check) => (
          <li key={check.text} className={check.tone}>
            {check.text}
          </li>
        ))}
      </ul>
    </section>
  )
}

function BenchList(props: {
  tournamentId: string
  players: Participant[]
  title: string
}) {
  return (
    <section>
      <h3>
        {props.title} ({props.players.length})
      </h3>
      <ul className="tournament-team-list">
        {props.players.map((p) => (
          <li key={p.id}>
            <span>{p.name}</span>
            <RemoveButton
              title="Remove from the tournament"
              onClick={() => {
                if (confirm(`Remove ${p.name} from the tournament?`)) {
                  kickTournamentParticipant({
                    tournamentId: props.tournamentId,
                    playerId: p.id
                  })
                }
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function RemoveButton(props: { title: string; onClick: () => void }) {
  return (
    <button
      className="tournament-remove"
      title={props.title}
      aria-label={props.title}
      onClick={props.onClick}
    >
      🗙
    </button>
  )
}

function StartTournamentPanel(props: {
  tournament: ITournament
  canStart: boolean
  description: string
  confirmText: string
  participantCount: number
}) {
  const showTestTools = useTournamentTestTools()
  return (
    <footer className="tournament-start">
      <div>
        <button
          className="bubbly green"
          disabled={!props.canStart}
          onClick={() => {
            if (confirm(props.confirmText)) {
              startTournament({ tournamentId: props.tournament.id })
            }
          }}
        >
          Start the tournament
        </button>
        <p className="help">
          {props.canStart
            ? props.description
            : "Fix the red points above to start."}
        </p>
      </div>
      {showTestTools && (
        <div className="actions">
          {[16, 32].map((target) => (
            <button
              key={target}
              className="bubbly"
              title="Test tool: adds stand-in participants"
              disabled={props.participantCount >= target}
              onClick={() =>
                addTournamentTestPlayers({
                  tournamentId: props.tournament.id,
                  count: target - props.participantCount
                })
              }
            >
              Fill to {target}
            </button>
          ))}
        </div>
      )}
    </footer>
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
