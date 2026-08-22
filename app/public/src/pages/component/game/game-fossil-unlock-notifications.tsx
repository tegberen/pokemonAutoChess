import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { getPokemonData } from "../../../../../models/precomputed/precomputed-pokemon-data"
import { FossilUnlockDefinitionByPokemon } from "../../../../../types/enum/FossilUnlock"
import type { Pkm } from "../../../../../types/enum/Pokemon"
import {
  selectConnectedPlayer,
  selectFossilUnlocks,
  useAppSelector
} from "../../../hooks"
import { getCachedPortrait } from "./game-pokemon-portrait"
import "./game-fossil-unlock-notifications.css"

const PROGRESS_TOAST_DURATION = 3500
const UNLOCKED_VISUAL_DURATION = 2200
const MAX_STACKED_PROGRESS_TOASTS = 3

interface FossilUnlockNotificationProps {
  pokemon: Pkm
}

interface ProgressToast {
  pokemon: Pkm
  progress: number
  target: number
  expiresAt: number
}

/* Drives both notifications off the synced unlock state: a progress toast for
   every counter that moved, and the just-unlocked visual for every Pokemon that
   just appeared in `unlocked`. One toast per unlock at a time: an unlock that
   ticks again refreshes the toast it already has, while different unlocks stack
   as separate toasts. */
export function GameFossilUnlockNotifications() {
  const unlockState = useAppSelector(selectFossilUnlocks)
  const [progressToasts, setProgressToasts] = useState<ProgressToast[]>([])
  const [unlockedQueue, setUnlockedQueue] = useState<Pkm[]>([])
  /* undefined until the first state arrives: a reconnect resyncs the whole map
     at once and must not replay every unlock the player already saw */
  const previousProgress = useRef<{ [pokemon: string]: number } | undefined>(
    undefined
  )
  const previousUnlocked = useRef<Pkm[] | undefined>(undefined)

  useEffect(() => {
    const seenProgress = previousProgress.current
    const seenUnlocked = previousUnlocked.current
    previousProgress.current = unlockState.progress
    previousUnlocked.current = unlockState.unlocked
    if (!seenProgress || !seenUnlocked) return

    const justUnlocked = unlockState.unlocked.filter(
      (pokemon) => !seenUnlocked.includes(pokemon)
    )
    if (justUnlocked.length > 0) {
      setUnlockedQueue((queue) => [...queue, ...justUnlocked])
    }

    const advanced = Object.entries(unlockState.progress).filter(
      ([pokemon, progress]) =>
        progress > (seenProgress[pokemon] ?? 0) &&
        !justUnlocked.includes(pokemon as Pkm)
    )
    if (advanced.length === 0) return

    setProgressToasts((toasts) => {
      const next = [...toasts]
      const expiresAt = Date.now() + PROGRESS_TOAST_DURATION
      advanced.forEach(([name, progress]) => {
        const pokemon = name as Pkm
        const shown = next.findIndex((toast) => toast.pokemon === pokemon)
        if (shown >= 0) {
          // already on screen: move its bar and give it its full time again,
          // keeping its slot in the stack so it does not jump around
          next[shown] = { ...next[shown], progress, expiresAt }
        } else {
          next.push({
            pokemon,
            progress,
            target: FossilUnlockDefinitionByPokemon.get(pokemon)?.target ?? 1,
            expiresAt
          })
        }
      })
      return next.slice(-MAX_STACKED_PROGRESS_TOASTS)
    })
  }, [unlockState])

  const nextExpiry = progressToasts.length
    ? Math.min(...progressToasts.map((toast) => toast.expiresAt))
    : undefined
  useEffect(() => {
    if (nextExpiry === undefined) return
    const timer = setTimeout(
      () =>
        setProgressToasts((toasts) =>
          toasts.filter((toast) => toast.expiresAt > Date.now())
        ),
      Math.max(0, nextExpiry - Date.now())
    )
    return () => clearTimeout(timer)
  }, [nextExpiry])

  const shownUnlock = unlockedQueue[0]
  useEffect(() => {
    if (shownUnlock === undefined) return
    const timer = setTimeout(
      () => setUnlockedQueue((queue) => queue.slice(1)),
      UNLOCKED_VISUAL_DURATION
    )
    return () => clearTimeout(timer)
  }, [shownUnlock])

  if (!unlockState.revealed) return null

  return (
    <>
      <div className="fossil-unlock-progress-toasts">
        {progressToasts.map((toast) => (
          <GameFossilUnlockProgressToast
            key={toast.pokemon}
            pokemon={toast.pokemon}
            progress={toast.progress}
            target={toast.target}
          />
        ))}
      </div>
      {shownUnlock !== undefined && (
        <GameFossilUnlockedVisual key={shownUnlock} pokemon={shownUnlock} />
      )}
    </>
  )
}

function GameFossilUnlockedVisual(props: FossilUnlockNotificationProps) {
  const { t } = useTranslation()
  const player = useAppSelector(selectConnectedPlayer)
  const pokemon = getPokemonData(props.pokemon)

  return (
    <div className="fossil-unlocked-overlay" role="status">
      <div className="fossil-unlocked-visual">
        <img
          className="fossil-unlocked-portrait"
          src={getCachedPortrait(pokemon.index, player?.pokemonCustoms)}
          alt={t(`pkm.${props.pokemon}`)}
        />
        <div className="fossil-unlocked-label">
          <img src="/assets/icons/FOSSIL_OPEN_ICON.svg" alt="" />
          <strong>{t(`pkm.${props.pokemon}`)}</strong>
          <span>{t("fossil_unlocks.unlocked")}</span>
        </div>
      </div>
    </div>
  )
}

function GameFossilUnlockProgressToast(
  props: FossilUnlockNotificationProps & { progress: number; target: number }
) {
  const { t } = useTranslation()
  const player = useAppSelector(selectConnectedPlayer)
  const pokemon = getPokemonData(props.pokemon)
  const percent = Math.min(100, (props.progress / props.target) * 100)

  return (
    <div className="fossil-unlock-progress-toast" role="status">
      <img
        src={getCachedPortrait(pokemon.index, player?.pokemonCustoms)}
        alt=""
      />
      <div>
        <strong>{t(`pkm.${props.pokemon}`)}</strong>
        <span>
          {t("fossil_unlocks.progress")} {props.progress}/{props.target}
        </span>
        <div className="fossil-toast-progress">
          <i style={{ width: `${percent}%` }} />
        </div>
      </div>
      <img
        className="fossil-toast-lock"
        src="/assets/icons/FOSSIL_CLOSE_ICON.svg"
        alt=""
      />
    </div>
  )
}
