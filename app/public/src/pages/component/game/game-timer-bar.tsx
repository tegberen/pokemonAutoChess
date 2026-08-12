import { useAppSelector } from "../../../hooks"
import {
  Blessing,
  UNISON_FINISHED_PROGRESS,
  UNISON_METER_DAMAGE,
  UNISON_TRIGGERED_PROGRESS_OFFSET
} from "../../../../../types/enum/Blessing"
import { GamePhaseState } from "../../../../../types/enum/Game"
import "./game-timer-bar.css"

export default function TimerBar() {
  const totalTime = useAppSelector((state) => state.game.phaseDuration)
  const time = useAppSelector((state) => state.game.roundTime)
  const pc = Math.min(Math.max((100 * time) / totalTime, 0), 100)

  return (
    <div className="timer-bar">
      <div className="timer-bar-inner" style={{ width: `${pc}%` }}></div>
    </div>
  )
}

export function UnisonMeter() {
  const phase = useAppSelector((state) => state.game.phase)
  const playerId = useAppSelector((state) => state.game.playerIdSpectated)
  const hasUnison = useAppSelector(
    (state) =>
      state.game.blessingsByPlayerId[playerId]?.includes(Blessing.UNISON) ??
      false
  )
  const damage = useAppSelector(
    (state) =>
      state.game.blessingQuestProgressByPlayerId[playerId]?.[
        Blessing.UNISON
      ] ?? 0
  )
  if (phase !== GamePhaseState.FIGHT || !hasUnison) return null

  if (damage === UNISON_FINISHED_PROGRESS) return null
  const triggered = damage >= UNISON_TRIGGERED_PROGRESS_OFFSET
  const storedDamage = Math.min(
    UNISON_METER_DAMAGE,
    Math.floor(
      triggered ? damage - UNISON_TRIGGERED_PROGRESS_OFFSET : damage
    )
  )
  return (
    <div className={`unison-meter${triggered ? " is-triggered" : ""}`}>
      <img src="/assets/icons/ATK.png" alt="ATK" />
      <strong>{storedDamage}</strong>
    </div>
  )
}
