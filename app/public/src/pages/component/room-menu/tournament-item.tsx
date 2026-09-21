import { type ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import { GADGETS } from "../../../../../config/game/gadgets"
import {
  getTeamFinalRanking,
  getTeamStandings,
  getTeamTournamentStage
} from "../../../../../core/tournament-logic"
import type {
  TournamentPlayerSchema,
  TournamentSchema,
  TournamentTeamSchema
} from "../../../../../models/colyseus-models/tournament"
import {
  buchholz,
  FINAL_BRACKET_NAME,
  SEMIFINALISTS,
  skipsSemifinals,
  SWISS_ROUNDS,
  TEAM_PLACEMENT_POINTS,
  TEAMS_PER_LOBBY
} from "../../../../../core/tournament-swiss"
import { average } from "../../../../../utils/number"
import { schemaEntries, schemaValues } from "../../../../../utils/schemas"
import { useAppSelector } from "../../../hooks"
import { participateInTournament } from "../../../network"
import { cc } from "../../utils/jsx"
import PokemonPortrait from "../pokemon-portrait"
import { EloBadge } from "../profile/elo-badge"
import { TournamentPairingModal } from "./tournament-pairing-modal"
import "./tournament-item.css"

type TournamentTabId = "teams" | "brackets" | "ranking" | "info" | "participants"

// what people look for first: who joined, then their lobby, then the result
const TAB_ORDER: { [stage: string]: TournamentTabId[] } = {
  registration: ["participants", "teams"],
  running: ["brackets", "ranking", "teams", "participants", "info"],
  finished: ["ranking", "info", "teams"]
}

export default function TournamentItem(props: {
  tournament: TournamentSchema
}) {
  const { t } = useTranslation()
  const user = useAppSelector((state) => state.network.profile)
  const uid: string = useAppSelector((state) => state.network.uid)
  const participating = props.tournament.players.has(uid)
  const tournamentFinished = props.tournament.finished
  const registrationsOpen = props.tournament.stage === "registration"
  const tournamentStarted = !registrationsOpen && !tournamentFinished
  const players = schemaValues(props.tournament.players)
  const [showPairing, setShowPairing] = useState(false)
  const teams = schemaValues(props.tournament.teams)
  const teamPlayerIds = new Set(teams.flatMap((team) => [...team.playersId]))
  const inATeam = teamPlayerIds.has(uid)
  const levelLocked =
    user != null && user.level < GADGETS.certificate.levelRequired
  // before the admin registers them, teams only exist as agreed partnerships
  const confirmedPairs = schemaEntries(props.tournament.players).filter(
    ([id, player]) => player.partnerId && id < player.partnerId
  )
  const remainingTeams = teams.filter((team) => !team.eliminated)
  // from the semifinals on, how far a team got ranks it, not its points
  const knockout =
    props.tournament.stage === "semifinals" ||
    props.tournament.stage === "final" ||
    props.tournament.stage === "finished"
  const swissStandings = getTeamStandings(props.tournament)
  const rankedTeams = knockout
    ? getTeamFinalRanking(props.tournament)
    : swissStandings
  // your own lobby first
  const brackets = schemaValues(props.tournament.brackets).sort(
    (a, b) =>
      Number(b.playersId.includes(uid)) - Number(a.playersId.includes(uid))
  )

  const tabContent: {
    [id in TournamentTabId]: {
      shown: boolean
      label: ReactNode
      className: string
      panel: ReactNode
    }
  } = {
    teams: {
      shown: teams.length > 0 || confirmedPairs.length > 0,
      label: `Teams (${teams.length > 0 ? teams.length : confirmedPairs.length})`,
      className: "ranking",
      panel: (
        <>
          <ul>
            {teams.length > 0
              ? schemaEntries(props.tournament.teams).map(([teamId, team]) => (
                  <TournamentTeam
                    key={teamId}
                    tournament={props.tournament}
                    team={team}
                    showScore={false}
                  />
                ))
              : confirmedPairs.map(([id, player]) => (
                  <li key={id} className="player-box team-box">
                    <span className="team-portraits">
                      <PokemonPortrait avatar={player.avatar} />
                      <PokemonPortrait
                        avatar={
                          props.tournament.players.get(player.partnerId)
                            ?.avatar ?? ""
                        }
                      />
                    </span>
                    <p>
                      <span className="player-name">
                        {player.name} &amp;{" "}
                        {props.tournament.players.get(player.partnerId)?.name}
                      </span>
                    </p>
                  </li>
                ))}
          </ul>
          {teams.length === 0 && (
            <p className="help">
              {confirmedPairs.length} teams formed, waiting for the admin to
              register them
            </p>
          )}
        </>
      )
    },
    brackets: {
      shown: tournamentStarted,
      label: t("tournament.brackets"),
      className: "brackets",
      panel: brackets.map((bracket) => (
        <div className="bracket" key={bracket.name}>
          <p className="bracket-name">
            {bracket.name === FINAL_BRACKET_NAME && (
              <img
                alt=""
                aria-hidden="true"
                src="/assets/icons/fire_week_streak.svg"
              />
            )}
            {bracket.name}
          </p>
          <ul>
            {schemaValues(bracket.teamsId).map((teamId) => (
              <TournamentTeam
                key={teamId}
                tournament={props.tournament}
                team={props.tournament.teams.get(teamId)!}
                showScore={false}
              />
            ))}
          </ul>
        </div>
      ))
    },
    ranking: {
      shown: tournamentStarted || tournamentFinished,
      label: t("tournament.ranking"),
      className: "ranking",
      panel: (
        <ul>
          {rankedTeams.map((ranked, i) => (
            <TournamentTeam
              key={ranked.id}
              tournament={props.tournament}
              team={props.tournament.teams.get(ranked.id)!}
              rank={i + 1}
              showScore={true}
              showPoints={!knockout}
              podium={tournamentFinished && i < 3}
            />
          ))}
        </ul>
      )
    },
    info: {
      shown: tournamentStarted || tournamentFinished,
      label: "Info",
      className: "tournament-info",
      panel: (
        <>
          <p className="help">
            Qualification is {SWISS_ROUNDS} rounds of 4 teams, scored{" "}
            {Object.values(TEAM_PLACEMENT_POINTS).join("/")} by placement.{" "}
            {skipsSemifinals(teams.length)
              ? `The top ${TEAMS_PER_LOBBY} reach the final.`
              : `The top ${SEMIFINALISTS} reach the semi-finals, and the top 2 of each semi-final reach the final.`}
          </p>
          <p className="help">
            Buchholz is the total points of every team you have faced: it
            separates teams on equal points by how hard their lobbies were.
          </p>
          <h4 className="tournament-info-heading">
            Qualification table
            <span className="help">
              {" "}
              — ordered by points, then Buchholz. Not the tournament ranking.
            </span>
          </h4>
          <table className="tournament-info-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Team</th>
                <th>Pts</th>
                <th>Buchholz</th>
                <th>Avg</th>
              </tr>
            </thead>
            <tbody>
              {swissStandings.map((team, i) => (
                <tr key={team.id} className={cc({ eliminated: team.eliminated })}>
                  <td className="tournament-info-rank">{i + 1}</td>
                  <td>{team.name}</td>
                  <td>{team.points}</td>
                  <td>{buchholz(team, swissStandings)}</td>
                  <td>
                    {team.placements.length > 0
                      ? average(...team.placements).toFixed(2)
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )
    },
    participants: {
      shown: registrationsOpen || tournamentStarted,
      label: `${t("tournament.participants")} (${players.length})`,
      className: "participants",
      panel: (
        <ul>
          {schemaEntries(props.tournament.players)
            .sort(
              ([a], [b]) =>
                Number(teamPlayerIds.has(b)) - Number(teamPlayerIds.has(a))
            )
            .map(([id, player]) => (
              <TournamentPlayer
                key={id}
                playerId={id}
                player={player}
                // until teams are registered nobody is a substitute yet
                role={
                  teams.length === 0
                    ? undefined
                    : teamPlayerIds.has(id)
                      ? "in-team"
                      : "sub"
                }
              />
            ))}
        </ul>
      )
    }
  }

  // also keys the tabs, so a new stage opens on its own first tab
  const stageGroup = tournamentFinished
    ? "finished"
    : registrationsOpen
      ? "registration"
      : "running"
  const tabs = TAB_ORDER[stageGroup]
    .filter((id) => tabContent[id].shown)
    .map((id) => ({ id, ...tabContent[id] }))

  return (
    <div className="tournament-item my-box">
      <span className="tournament-name">
        <img
          width="32"
          height="32"
          src="assets/ui/tournament.svg"
          style={{ marginRight: "0.5em", verticalAlign: "text-bottom" }}
        />
        {props.tournament.name}
      </span>
      {tournamentFinished ? (
        <p>
          Congratulations to <strong>{rankedTeams[0]?.name}</strong> for the
          win!
        </p>
      ) : tournamentStarted ? (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{getTeamTournamentStage(props.tournament)}</span>
          <span>
            {t("tournament.teams_remaining")}: {remainingTeams.length}
          </span>
        </div>
      ) : (
        <p>{t("tournament.registrations_open")}</p>
      )}
      {!tournamentFinished && (
        <>
          {levelLocked && (
            <p>
              {t("tournament.tournament_mode_locked", {
                requiredLevel: GADGETS.certificate.levelRequired
              })}
            </p>
          )}
          <div className="actions">
            {participating && (registrationsOpen || !inATeam) && (
              <button
                className="participate-btn bubbly red"
                title={t("tournament.cancel_tournament_participation")}
                onClick={() => {
                  participateInTournament({
                    tournamentId: props.tournament.id,
                    participate: false
                  })
                }}
              >
                {t("tournament.leave_tournament")}
              </button>
            )}
            {!participating && (
              <button
                className="participate-btn bubbly blue"
                title={
                  registrationsOpen
                    ? t("tournament.register_tournament_participation")
                    : t("tournament.register_as_substitute")
                }
                disabled={levelLocked}
                onClick={() => {
                  participateInTournament({
                    tournamentId: props.tournament.id,
                    participate: true
                  })
                }}
              >
                {registrationsOpen
                  ? t("tournament.participate")
                  : t("tournament.join_as_substitute")}
              </button>
            )}
            {participating && registrationsOpen && (
              <button
                className="bubbly blue"
                onClick={() => setShowPairing(true)}
              >
                Find a partner
              </button>
            )}
          </div>
        </>
      )}
      <TournamentPairingModal
        tournament={props.tournament}
        show={showPairing}
        onClose={() => setShowPairing(false)}
      />
      <Tabs key={stageGroup}>
        <TabList>
          {tabs.map((tab) => (
            <Tab key={tab.id}>{tab.label}</Tab>
          ))}
        </TabList>
        {tabs.map((tab) => (
          <TabPanel key={tab.id} className={tab.className}>
            {tab.panel}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  )
}

function TournamentPlayer(props: {
  playerId: string
  player: TournamentPlayerSchema
  role?: "in-team" | "sub"
}) {
  const uid: string = useAppSelector((state) => state.network.uid)
  return (
    <li className={cc("player-box", { myself: props.playerId === uid })}>
      <PokemonPortrait avatar={props.player.avatar} />
      <p>
        <span className="player-name">{props.player.name}</span>
      </p>
      {props.role && (
        <span className={cc("tournament-role", props.role)}>
          {props.role === "sub" ? "Sub" : "In team"}
        </span>
      )}
      <EloBadge elo={props.player.elo} />
    </li>
  )
}

function TournamentTeam(props: {
  tournament: TournamentSchema
  team: TournamentTeamSchema
  rank?: number
  showScore: boolean
  showPoints?: boolean
  podium?: boolean
}) {
  const uid: string = useAppSelector((state) => state.network.uid)
  const members = schemaValues(props.team.playersId).map((id) => ({
    id,
    player: props.tournament.players.get(id)
  }))
  return (
    <li
      className={cc("player-box", "team-box", {
        myself: members.some((m) => m.id === uid),
        eliminated: props.showScore && props.team.eliminated,
        podium: props.podium === true,
        [`podium-${props.rank}`]: props.podium === true
      })}
    >
      {props.rank !== undefined && (
        <span className="player-rank">{props.rank}</span>
      )}
      <span className="team-portraits">
        {members.map(({ id, player }) => (
          <PokemonPortrait key={id} avatar={player?.avatar ?? ""} />
        ))}
      </span>
      <p>
        <span className="player-name">{props.team.name}</span>
      </p>
      {props.showScore ? (
        <span className="player-ranks">
          {props.showPoints !== false && (
            <strong>{props.team.points}</strong>
          )}
          {props.team.placements.length > 0 && (
            <span> ({schemaValues(props.team.placements).join(", ")})</span>
          )}
        </span>
      ) : null}
    </li>
  )
}
