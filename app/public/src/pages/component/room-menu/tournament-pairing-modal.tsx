import type { TournamentSchema } from "../../../../../models/colyseus-models/tournament"
import { schemaEntries } from "../../../../../utils/schemas"
import { useAppSelector } from "../../../hooks"
import { tournamentPartner } from "../../../network"
import { cc } from "../../utils/jsx"
import { Modal } from "../modal/modal"
import PokemonPortrait from "../pokemon-portrait"
import "./tournament-pairing-modal.css"

type PartnerAction = "invite" | "accept" | "decline" | "cancel" | "leave"

export function TournamentPairingModal(props: {
  tournament: TournamentSchema
  show: boolean
  onClose: () => void
}) {
  const uid: string = useAppSelector((state) => state.network.uid)
  const me = props.tournament.players.get(uid)
  const entries = schemaEntries(props.tournament.players)

  const send = (targetId: string, action: PartnerAction) =>
    tournamentPartner({
      tournamentId: props.tournament.id,
      targetId,
      action
    })

  const registeredTeams = schemaEntries(props.tournament.teams)
  const registeredIds = new Set(
    registeredTeams.flatMap(([, team]) => [...team.playersId])
  )
  const myRegisteredTeam = registeredTeams.find(([, team]) =>
    [...team.playersId].includes(uid)
  )

  const partner = me?.partnerId
    ? props.tournament.players.get(me.partnerId)
    : undefined
  const invitations = entries.filter(
    ([, player]) => player.invitedPartnerId === uid && !player.partnerId
  )
  const teamed = entries.filter(([, player]) => player.partnerId)
  const looking = entries.filter(
    ([id, player]) =>
      !player.partnerId && !registeredIds.has(id) && id !== uid
  )

  return (
    <Modal onClose={props.onClose} show={props.show} header="Find a partner">
      <div className="tournament-pairing">
        {!me && <p>Join the tournament first to pick a partner.</p>}

        {me && myRegisteredTeam && (
          <div className="tournament-pairing-status paired">
            <span>
              Your team is registered: <strong>{myRegisteredTeam[1].name}</strong>
            </span>
          </div>
        )}

        {me && !myRegisteredTeam && partner && (
          <div className="tournament-pairing-status paired">
            <span>
              You are teamed with <strong>{partner.name}</strong>
            </span>
            <button className="bubbly red" onClick={() => send("", "leave")}>
              Leave team
            </button>
          </div>
        )}

        {me && !myRegisteredTeam && !partner && me.invitedPartnerId && (
          <div className="tournament-pairing-status waiting">
            <span>
              Waiting for{" "}
              <strong>
                {props.tournament.players.get(me.invitedPartnerId)?.name}
              </strong>{" "}
              to answer
            </span>
            <button
              className="bubbly red"
              onClick={() => send(me.invitedPartnerId, "cancel")}
            >
              Cancel
            </button>
          </div>
        )}

        {me && !myRegisteredTeam && !partner && invitations.length > 0 && (
          <section className="tournament-pairing-invites">
            <h4>Invitations</h4>
            <ul>
              {invitations.map(([id, player]) => (
                <li key={id}>
                  <PokemonPortrait avatar={player.avatar} />
                  <span className="name">{player.name}</span>
                  <button
                    className="bubbly green"
                    onClick={() => send(id, "accept")}
                  >
                    Accept
                  </button>
                  <button
                    className="bubbly red"
                    onClick={() => send(id, "decline")}
                  >
                    Decline
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {me && !myRegisteredTeam && !partner && (
          <section className="tournament-pairing-looking">
            <h4>Looking for a partner ({looking.length})</h4>
            {looking.length === 0 && <p>Everyone else already has a team.</p>}
            <ul>
              {looking.map(([id, player]) => (
                <li
                  key={id}
                  className={cc({ asked: me.invitedPartnerId === id })}
                >
                  <PokemonPortrait avatar={player.avatar} />
                  <span className="name">{player.name}</span>
                  <button
                    className="bubbly orange"
                    disabled={me.invitedPartnerId === id}
                    onClick={() => send(id, "invite")}
                  >
                    {me.invitedPartnerId === id ? "Asked" : "Ask"}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="tournament-pairing-teams">
          <h4>
            Teams formed (
            {registeredTeams.length > 0
              ? registeredTeams.length
              : teamed.length / 2}
            )
          </h4>
          {registeredTeams.length === 0 && teamed.length === 0 && (
            <p>No team yet.</p>
          )}
          {registeredTeams.length > 0 && (
            <ul>
              {registeredTeams.map(([teamId, team]) => (
                <li key={teamId}>
                  {[...team.playersId].map((id) => (
                    <PokemonPortrait
                      key={id}
                      avatar={props.tournament.players.get(id)?.avatar ?? ""}
                    />
                  ))}
                  <span className="name">{team.name}</span>
                </li>
              ))}
            </ul>
          )}
          <ul>
            {teamed
              .filter(
                ([id, player]) =>
                  id < player.partnerId && !registeredIds.has(id)
              )
              .map(([id, player]) => (
                <li key={id}>
                  <PokemonPortrait avatar={player.avatar} />
                  <PokemonPortrait
                    avatar={
                      props.tournament.players.get(player.partnerId)?.avatar ??
                      ""
                    }
                  />
                  <span className="name">
                    {player.name} &amp;{" "}
                    {props.tournament.players.get(player.partnerId)?.name}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      </div>
    </Modal>
  )
}
