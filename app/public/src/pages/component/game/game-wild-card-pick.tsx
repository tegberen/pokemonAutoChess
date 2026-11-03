import { useCallback, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import type {
  PlayerChoice
} from "../../../../../models/colyseus-models/player-choice"
import type { Pkm } from "../../../../../types/enum/Pokemon"
import { DEPTH } from "../../../game/depths"
import { pickChoice, rerollChoice } from "../../../network"
import SeasonWonderPick, {
  type WonderPickResult
} from "../season/season-wonder-pick"
import "../season/season.css"
import "./game-smeargle-pack.css"

// the season Wonder Pick, played in game: the server draws the leader, so the
// clicked card only decides where the result is shown
export default function GameWildCardPick(props: { choice: PlayerChoice }) {
  const { t } = useTranslation()
  const { choice } = props
  const resolveReroll = useRef<(() => void) | null>(null)
  const resolvePick = useRef<((result: WonderPickResult) => void) | null>(
    null
  )

  useEffect(() => {
    resolveReroll.current?.()
    resolveReroll.current = null
  }, [choice.id])

  const resultIndex = choice.wonderPickResultIndex
  useEffect(() => {
    if (resultIndex === -1 || !resolvePick.current) return
    resolvePick.current({
      pokemon: choice.pokemons[resultIndex] as Pkm,
      holo: false,
      emotions: []
    })
    resolvePick.current = null
  }, [resultIndex, choice.pokemons])

  const onDraw = useCallback(async () => {}, [])
  const onReroll = () =>
    new Promise<void>((resolve) => {
      resolveReroll.current = resolve
      rerollChoice(choice.id)
    })
  const onPick = () =>
    new Promise<WonderPickResult>((resolve) => {
      resolvePick.current = resolve
      pickChoice(choice.id, 0)
    })

  return (
    <div className="smeargle-pack-backdrop" style={{ zIndex: DEPTH.MODAL }}>
      <div className="smeargle-pack-page wild-card-pick">
        <p className="help">{t("player_choices.wild_card_hint")}</p>
        <SeasonWonderPick
          variant="casual"
          candidates={choice.pokemons.map((pokemon) => ({
            pokemon: pokemon as Pkm,
            holo: false
          }))}
          rerollsLeft={choice.canReroll ? 1 : 0}
          picks={1}
          inGame
          onDraw={onDraw}
          onReroll={onReroll}
          onPick={onPick}
        />
      </div>
    </div>
  )
}
