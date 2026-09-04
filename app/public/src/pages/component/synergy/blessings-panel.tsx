import { useEffect, useMemo, useRef, useState } from "react"
import ReactDOM from "react-dom"
import { useTranslation } from "react-i18next"
import { type PlacesType, Tooltip } from "react-tooltip"
import { SynergyTiersThresholds } from "../../../../../config"
import { Blessings } from "../../../../../config/game/blessings"
import { DEPTH } from "../../../game/depths"
import { getGameScene } from "../../../pages/game"
import { selectSpectatedPlayer, useAppSelector } from "../../../hooks"
import { countWildsThreeStarsOrMore } from "../../../../../models/shop"
import {
  AURORA_BOREALIS_DAMAGE_REDUCTION,
  AURORA_BOREALIS_DAMAGE_REDUCTION_IN_SNOW_OR_NIGHT,
  AURORA_BOREALIS_REDUCTION_PER_ACTIVE_SYNERGY,
  BP_REWARDS_ROUND_INTERVAL,
  MIX_AND_MATCH_I_FIELD_CAP,
  MIX_AND_MATCH_II_FIELD_CAP,
  BLESSING_QUEST_TARGETS,
  Blessing,
  RAINBOW_DROPLET_SYNERGIES_REQUIRED,
  GRUDGE_CURSE_DURATION_REDUCTION_PER_SUBSTITUTE,
  GEM_HARVEST_ABILITY_POWER_PER_GEM,
  DRAGON_FANG_ABILITY_POWER_PER_STAR,
  STAR_GUARD_DEFENSE_PER_STAR,
  STEAM_ENGINE_SPEED_ON_ATTACK,
  VALOR_ATTACK_PER_STAR,
  VALOR_SHIELD_PER_STAR
} from "../../../../../types/enum/Blessing"
import { GamePhaseState, Rarity } from "../../../../../types/enum/Game"
import {
  type Item,
  SynergyGems,
  SynergyGivenByGem
} from "../../../../../types/enum/Item"
import { Synergy } from "../../../../../types/enum/Synergy"
import { isIn } from "../../../../../utils/array"
import type { SetSchema } from "@colyseus/schema"
import { cc } from "../../utils/jsx"
import { addIconsToDescription } from "../../utils/descriptions"
import { BlessingTooltipCard } from "./blessing-tooltip-card"
import "./blessings-panel.css"

// shared so the selector below returns a stable reference for a player with no
// blessings: a fresh [] would re-render this panel on every dispatch in the game
const NO_BLESSINGS: Blessing[] = []

export default function BlessingsPanel(props: { recentOnly?: boolean }) {
  const { t } = useTranslation()
  const [tooltipPlace, setTooltipPlace] = useState<PlacesType>("left")
  const playerIdSpectated = useAppSelector(
    (state) => state.game.playerIdSpectated
  )
  const blessings = useAppSelector(
    (state) => state.game.blessingsByPlayerId[playerIdSpectated] ?? NO_BLESSINGS
  )
  // defaulted outside the selector: returning a fresh {} would change identity
  // on every call and re-render forever
  const questProgressByPlayer = useAppSelector(
    (state) => state.game.blessingQuestProgressByPlayerId[playerIdSpectated]
  )
  const questProgress = questProgressByPlayer ?? {}
  /* the newest blessing sweeps once when it arrives; keyed on the count so it
     replays per pickup and does not fire again on unrelated re-renders */
  const previousBlessingCount = useRef(blessings.length)
  const [justAcquired, setJustAcquired] = useState(false)
  useEffect(() => {
    if (blessings.length > previousBlessingCount.current) {
      setJustAcquired(true)
      // cleared after the 1s pass has finished, so the ambient loop does not
      // cut in mid-sweep and restart the band from its hold position
      const timer = setTimeout(() => setJustAcquired(false), 1200)
      previousBlessingCount.current = blessings.length
      return () => clearTimeout(timer)
    }
    previousBlessingCount.current = blessings.length
  }, [blessings.length])
  const bpRewardsRoundsLeft =
    questProgress[Blessing.BP_REWARDS] ?? BP_REWARDS_ROUND_INTERVAL
  const supportiveSoulRoundsLeft =
    questProgress[Blessing.SUPPORTIVE_SOUL] ?? 0
  const mystoganWands = useAppSelector(
    (state) => state.game.mystoganWandsByPlayerId[playerIdSpectated]
  )
  const reveilleSecondsLeft = questProgress[Blessing.REVEILLE] ?? 0
  const grudgeSubstitutesPlanted = questProgress[Blessing.GRUDGE] ?? 0
  const grudgeCurseSecondsSaved =
    (grudgeSubstitutesPlanted * GRUDGE_CURSE_DURATION_REDUCTION_PER_SUBSTITUTE) /
    1000
  const spectatedPlayer = useAppSelector(selectSpectatedPlayer)
  const phase = useAppSelector((state) => state.game.phase)
  const synergies = useAppSelector((state) => state.game.synergiesSpectated)
  const boardPokemons: Array<{
    positionX: number
    positionY: number
    atk: number
    def: number
    speDef: number
    critPower: number
    rarity: Rarity
    stars: number
    types: SetSchema<Synergy>
  }> =
    typeof (spectatedPlayer?.board as any)?.values === "function"
      ? [...(spectatedPlayer!.board as any).values()]
      : Object.values((spectatedPlayer?.board as any) ?? {})
  /* Only the fighting entity carries the stats used for the actual bonus. The
     board copy keeps its preparation-phase values. */
  const midnightSunRecipient = useMemo(() => {
    if (phase !== GamePhaseState.FIGHT) return undefined
    const simulation = getGameScene()?.battle?.simulation
    if (!simulation) return undefined
    /* entity.player resolves through simulation.bluePlayer, which is not synced,
       so the side is found from the player ids the client does receive */
    const team =
      simulation.bluePlayerId === playerIdSpectated ||
      simulation.bluePartnerPlayerId === playerIdSpectated
        ? simulation.blueTeam
        : simulation.redTeam
    return [...team.values()].find((entity) => entity.status.light)
  }, [phase, playerIdSpectated])

  const tierOf = (synergy: Synergy) =>
    SynergyTiersThresholds[synergy].filter(
      (threshold) =>
        (synergies.find(([active]) => active === synergy)?.[1] ?? 0) >= threshold
    ).length
  const fireTier = tierOf(Synergy.FIRE)
  const electricTier = tierOf(Synergy.ELECTRIC)
  const steamEngineSpeed =
    STEAM_ENGINE_SPEED_ON_ATTACK + fireTier + electricTier

  const lightTier = tierOf(Synergy.LIGHT)
  const midnightSunBaseStats = midnightSunRecipient
    ? boardPokemons.find(
        (pokemon) =>
          pokemon.positionX === midnightSunRecipient.positionX &&
          (pokemon.positionY - 1 === midnightSunRecipient.positionY ||
            6 - pokemon.positionY === midnightSunRecipient.positionY)
      )
    : undefined
  const midnightSunBonuses = (() => {
    if (!midnightSunRecipient || !midnightSunBaseStats) return []
    const critPowerMultiplier = midnightSunRecipient.critPower
    if (
      !Number.isFinite(critPowerMultiplier) ||
      critPowerMultiplier <= 0 ||
      !Number.isFinite(midnightSunBaseStats.atk) ||
      !Number.isFinite(midnightSunBaseStats.def) ||
      !Number.isFinite(midnightSunBaseStats.speDef)
    ) {
      return []
    }
    const bonuses = [
      `+${Math.ceil(midnightSunBaseStats.atk * 0.2 * critPowerMultiplier)} ATK`,
      `+${Math.round(20 * critPowerMultiplier)} AP`
    ]
    // ETERNAL_LIGHT and above add the defensive half of the spot
    if (lightTier >= 3) {
      bonuses.push(
        `+${Math.round(0.5 * midnightSunBaseStats.def * critPowerMultiplier)} DEF`,
        `+${Math.round(0.5 * midnightSunBaseStats.speDef * critPowerMultiplier)} SPE_DEF`
      )
    }
    if (lightTier >= 4) {
      bonuses.push(`+${Math.round(100 * critPowerMultiplier)} SHIELD`)
    }
    return bonuses
  })()

  /* GEM_HARVEST: gems held, grouped so duplicates do not each take a line, with
     how many fielded Pokémon each one buffs */
  const gemHarvestCopies = (
    (spectatedPlayer?.items as Item[] | undefined) ?? []
  )
    .filter((item) => isIn(SynergyGems, item))
    .reduce(
      (counts, gem) => counts.set(gem, (counts.get(gem) ?? 0) + 1),
      new Map<Item, number>()
    )
  const gemHarvestGems: [Item, number, number][] = [
    ...gemHarvestCopies.entries()
  ]
    .map(([gem, copies]): [Item, number, number] => [
      gem,
      copies,
      boardPokemons.filter(
        (pokemon) =>
          pokemon.positionY !== 0 && pokemon.types?.has(SynergyGivenByGem[gem])
      ).length
    ])
    // the gems actually doing something first, dead ones last
    .sort(([, , holdersA], [, , holdersB]) => holdersB - holdersA)
  const valorWildStarsOnBench = boardPokemons
    .filter(
      (pokemon) => pokemon.positionY === 0 && pokemon.types?.has(Synergy.WILD)
    )
    .reduce((total, pokemon) => total + pokemon.stars, 0)
  const fieldedStars = boardPokemons
    .filter((pokemon) => pokemon.positionY !== 0)
    .reduce((total, pokemon) => total + pokemon.stars, 0)
  const nbThreeStarWilds = spectatedPlayer
    ? countWildsThreeStarsOrMore(spectatedPlayer.board)
    : 0
  const nbFieldedUniques = boardPokemons.filter(
    (pokemon) => pokemon.positionY !== 0 && pokemon.rarity === Rarity.UNIQUE
  ).length
  const uniqueFieldCap = blessings.includes(Blessing.MIX_AND_MATCH_II)
    ? MIX_AND_MATCH_II_FIELD_CAP
    : blessings.includes(Blessing.MIX_AND_MATCH_I)
      ? MIX_AND_MATCH_I_FIELD_CAP
      : null
  const nbActiveSynergies = synergies.filter(
    ([synergy, value]) => value >= SynergyTiersThresholds[synergy][0]
  ).length
  const steelCount =
    synergies.find(([synergy]) => synergy === Synergy.STEEL)?.[1] ?? 0
  // matches the server: one tile of reach per STEEL tier, never less than one
  const magnetosphereReach = Math.max(1, tierOf(Synergy.STEEL))
  const amorphousCount =
    synergies.find(([synergy]) => synergy === Synergy.AMORPHOUS)?.[1] ?? 0
  const amorphousRequired =
    SynergyTiersThresholds[Synergy.AMORPHOUS].at(-1) ?? 7
  const rainbowDropletActivated =
    (questProgress[Blessing.RAINBOW_DROPLET] ?? 0) > 0
  const axeBlastStarCounts = questProgress[Blessing.AXE_BLAST] ?? 0
  const axeBlastAlliedStars = Math.floor(axeBlastStarCounts / 100)
  const axeBlastOpposingStars = axeBlastStarCounts % 100
  const axeBlastExecuteChance =
    axeBlastAlliedStars > axeBlastOpposingStars
      ? 30 + 5 * (axeBlastAlliedStars - axeBlastOpposingStars)
      : 0
  const auroraBorealisReduction = Math.round(
    (AURORA_BOREALIS_DAMAGE_REDUCTION +
      nbActiveSynergies * AURORA_BOREALIS_REDUCTION_PER_ACTIVE_SYNERGY) *
      100
  )
  const auroraBorealisReductionInSnowOrNight = Math.round(
    (AURORA_BOREALIS_DAMAGE_REDUCTION_IN_SNOW_OR_NIGHT +
      nbActiveSynergies * AURORA_BOREALIS_REDUCTION_PER_ACTIVE_SYNERGY) *
      100
  )

  if (blessings.length === 0 && !props.recentOnly) {
    return <p className="blessings-panel-empty">{t("no_blessing_yet")}</p>
  }

  const displayedBlessings = props.recentOnly
    ? blessings.slice(-2).reverse()
    : blessings

  return (
    <div className={cc("blessings-panel", { "blessings-panel-recent": !!props.recentOnly })}>
      {displayedBlessings.map((blessing, index) => (
        <div
          key={`${blessing}-${index}`}
          className={cc("blessing-panel-slot", {
            // recentOnly reverses the list, so the newest sits first there
            "blessing-panel-acquired":
              justAcquired &&
              index === (props.recentOnly ? 0 : displayedBlessings.length - 1)
          })}
        >
          <img
            src={`/assets/blessings/${Blessings[blessing].icon}.svg`}
            alt={t(`blessing.${blessing}.name`)}
            className={`blessing-panel-icon blessing-tier-${Blessings[
              blessing
            ].tier.toLowerCase()}`}
            data-tooltip-id={`${props.recentOnly ? "recent-" : ""}blessing-${blessing}-${index}`}
            onMouseEnter={(event) => {
              const { left, width } = event.currentTarget.getBoundingClientRect()
              setTooltipPlace(
                left + width / 2 < window.innerWidth / 2 ? "right" : "left"
              )
            }}
          />
          {uniqueFieldCap !== null &&
            (blessing === Blessing.MIX_AND_MATCH_I ||
              blessing === Blessing.MIX_AND_MATCH_II) && (
              <span
                className={cc("blessing-panel-counter", {
                  full: nbFieldedUniques >= uniqueFieldCap
                })}
              >
                {nbFieldedUniques}/{uniqueFieldCap}
              </span>
            )}
          {BLESSING_QUEST_TARGETS[blessing] && (
            <span
              className={cc("blessing-panel-counter", {
                full:
                  (questProgress[blessing] ?? 0) >=
                  BLESSING_QUEST_TARGETS[blessing]!.target
              })}
            >
              {(questProgress[blessing] ?? 0).toFixed(
                BLESSING_QUEST_TARGETS[blessing]!.decimals ?? 0
              )}
              /{BLESSING_QUEST_TARGETS[blessing]!.target}
            </span>
          )}
          {blessing === Blessing.BP_REWARDS && (
            <span className="blessing-panel-counter">
              {bpRewardsRoundsLeft}
            </span>
          )}
          {blessing === Blessing.VALOR && (
            <span className="blessing-panel-counter">
              {valorWildStarsOnBench}
            </span>
          )}
          {blessing === Blessing.SUPPORTIVE_SOUL &&
            supportiveSoulRoundsLeft > 0 && (
              <span className="blessing-panel-counter">
                {supportiveSoulRoundsLeft}
              </span>
            )}
          {/* portalled out of the panel, or the Effects window clips it */}
          {ReactDOM.createPortal(
            <Tooltip
              id={`${props.recentOnly ? "recent-" : ""}blessing-${blessing}-${index}`}
              className="custom-theme-tooltip blessing-panel-tooltip"
              place={tooltipPlace}
              style={{ zIndex: DEPTH.TOOLTIP }}
            >
              <BlessingTooltipCard blessing={blessing}>
                {blessing === Blessing.BP_REWARDS && <p className="blessing-panel-live-value">Next component in {bpRewardsRoundsLeft} round{bpRewardsRoundsLeft === 1 ? "" : "s"}</p>}
                {blessing === Blessing.SUPPORTIVE_SOUL && supportiveSoulRoundsLeft > 0 && <p className="blessing-panel-live-value">Next support item in {supportiveSoulRoundsLeft} round{supportiveSoulRoundsLeft === 1 ? "" : "s"}</p>}
                {blessing === Blessing.AURORA_BOREALIS && <p className="blessing-panel-live-value">{addIconsToDescription(`${nbActiveSynergies} active synergies: −${auroraBorealisReduction}% damage taken, −${auroraBorealisReductionInSnowOrNight}% in SNOW or NIGHT`)}</p>}
                {blessing === Blessing.BERSERKER_HORDES && <p className="blessing-panel-live-value">{addIconsToDescription(`${nbThreeStarWilds} WILD at 3 STAR or more: −${nbThreeStarWilds} GOLD`)}</p>}
                {blessing === Blessing.RAINBOW_DROPLET && <p className="blessing-panel-live-value">{addIconsToDescription(rainbowDropletActivated ? `[Activated] +1 to every synergy except AMORPHOUS` : `AMORPHOUS ${amorphousCount}/${amorphousRequired}, ${nbActiveSynergies}/${RAINBOW_DROPLET_SYNERGIES_REQUIRED} synergies active`)}</p>}
                {blessing === Blessing.VALOR && <p className="blessing-panel-live-value">{addIconsToDescription(`${valorWildStarsOnBench} WILD STAR on bench: +${valorWildStarsOnBench * VALOR_ATTACK_PER_STAR} ATK, +${valorWildStarsOnBench * VALOR_SHIELD_PER_STAR} SHIELD`)}</p>}
                {blessing === Blessing.REVEILLE && reveilleSecondsLeft > 0 && <p className="blessing-panel-live-value">Marching in {reveilleSecondsLeft}s</p>}
                {blessing === Blessing.GRUDGE && <p className="blessing-panel-live-value">{addIconsToDescription(`${grudgeSubstitutesPlanted} Substitute${grudgeSubstitutesPlanted === 1 ? "" : "s"} on the opponent bench: every CURSE you inflict is ${grudgeCurseSecondsSaved} seconds shorter`)}</p>}
                {blessing === Blessing.MYSTOGAN && <p className="blessing-panel-live-value">{mystoganWands && mystoganWands.length > 0 ? addIconsToDescription(mystoganWands.map((wand) => wand as string).join(", ")) : "No FAIRY tier reached yet"}</p>}
                {blessing === Blessing.MAGNETOSPHERE && <p className="blessing-panel-live-value">{addIconsToDescription(`STEEL ${steelCount}: ${magnetosphereReach} RANGE of attraction and repulsion around each STEEL Pokémon`)}</p>}
                {blessing === Blessing.DRAGON_FANG && <p className="blessing-panel-live-value">{addIconsToDescription(`${fieldedStars} STAR on your board: +${fieldedStars * DRAGON_FANG_ABILITY_POWER_PER_STAR} AP`)}</p>}
                {blessing === Blessing.STAR_GUARD && <p className="blessing-panel-live-value">{addIconsToDescription(`${fieldedStars} STAR on your board: +${fieldedStars * STAR_GUARD_DEFENSE_PER_STAR} DEF and SPE_DEF`)}</p>}
                {blessing === Blessing.STEAM_ENGINE && <p className="blessing-panel-live-value">{addIconsToDescription(`FIRE ${fireTier} and ELECTRIC ${electricTier}: +${steamEngineSpeed} SPEED ON_ATTACK`)}</p>}
                {blessing === Blessing.MIDNIGHT_SUN && midnightSunBonuses.length > 0 && (
                  <div className="blessing-panel-live-value blessing-panel-stat-summary">
                    <div className="blessing-panel-stat-grid">
                      {midnightSunBonuses.map((bonus) => (
                        <span key={bonus}>{addIconsToDescription(bonus)}</span>
                      ))}
                    </div>
                  </div>
                )}
                {blessing === Blessing.AXE_BLAST && axeBlastStarCounts > 0 && <p className="blessing-panel-live-value">{addIconsToDescription(`Team STAR: ${axeBlastAlliedStars} vs ${axeBlastOpposingStars}\nExecute chance: ${axeBlastExecuteChance}% before Luck`)}</p>}
                {blessing === Blessing.GEM_HARVEST && gemHarvestGems.length === 0 && <p className="blessing-panel-live-value">No gem harvested yet</p>}
                {blessing === Blessing.GEM_HARVEST && gemHarvestGems.map(([gem, copies, holders]) => <p key={gem} className="blessing-panel-live-value">{addIconsToDescription(holders > 0 ? `${gem}${copies > 1 ? ` x${copies}` : ""}: ${holders} fielded Pokémon gain ${copies * GEM_HARVEST_ABILITY_POWER_PER_GEM} AP` : `${gem}${copies > 1 ? ` x${copies}` : ""}: no fielded Pokémon shares this synergy`)}</p>)}
              </BlessingTooltipCard>
            </Tooltip>,
            document.body
          )}
        </div>
      ))}
    </div>
  )
}
