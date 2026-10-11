import { useTranslation } from "react-i18next"
import {
  RarityColor,
  RarityCost,
  SynergyTiersThresholds
} from "../../../../../config"
import {
  decodeGhostIncantation,
  getIncantationStrength,
  IncantationKind
} from "../../../../../config/game/ghost-incantations"
import {
  GHOST_NIGHT_SHADE_THRESHOLD,
  type SynergyTier,
  SynergyTiers
} from "../../../../../config/game/synergies"
import type { Pokemon } from "../../../../../models/colyseus-models/pokemon"
import { getWildChance } from "../../../../../models/colyseus-models/synergies"
import { getPokemonData } from "../../../../../models/precomputed/precomputed-pokemon-data"
import { PRECOMPUTED_POKEMONS_PER_TYPE_AND_CATEGORY } from "../../../../../models/precomputed/precomputed-types-and-categories"
import type { IPlayer } from "../../../../../types"
import {
  type Pkm,
  PkmFamily,
  PkmRegionalVariants
} from "../../../../../types/enum/Pokemon"
import { GameMode } from "../../../../../types/enum/Game"
import { RulesWithAllPokemonsAvailable } from "../../../../../types/enum/SpecialGameRule"
import { Synergy } from "../../../../../types/enum/Synergy"
import type { IPokemonData } from "../../../../../types/interfaces/PokemonData"
import { isOnBench } from "../../../../../utils/board"
import { roundToNDigits } from "../../../../../utils/number"
import { schemaValues } from "../../../../../utils/schemas"
import { EffectEnum } from "../../../../../types/enum/Effect"
import { GalarFossil } from "../../../../../types/enum/FossilUnlock"
import {
  selectSpectatedFossilUnlocks,
  selectSpectatedPlayer,
  useAppSelector
} from "../../../hooks"
import type { IFossilUnlocksState } from "../../../stores/GameStore"
import {
  addIconsToDescription,
  getGhostSpiritCoinSentence
} from "../../utils/descriptions"
import { cc } from "../../utils/jsx"
import { getCachedPortrait } from "../game/game-pokemon-portrait"
import {
  describeIncantationLines,
  describeIncantationOption,
  getIncantationIcon
} from "../game/ghost-incantation-text"
import SynergyIcon from "../icons/synergy-icon"
import {
  FossilRestorationList,
  SynergyTierDescription
} from "./synergy-tier-description"

function WrittenIncantation(props: {
  encoded: string
  ghostLevel: number
  ritualTrigger: string
}) {
  const { t: tBase } = useTranslation()
  const t = tBase as any
  const incantation = decodeGhostIncantation(props.encoded)
  const strength = getIncantationStrength(incantation.kind, props.ghostLevel)
  const lines: { kind: IncantationKind | null; text: string }[] =
    incantation.kind === IncantationKind.FATED
      ? [
          {
            kind: IncantationKind.HEXING,
            text: describeIncantationOption(
              t,
              IncantationKind.FATED,
              0,
              incantation.cause,
              null,
              props.ritualTrigger
            )
          },
          {
            kind: IncantationKind.RITUAL,
            text: describeIncantationOption(
              t,
              IncantationKind.FATED,
              1,
              incantation.effect,
              null,
              props.ritualTrigger
            )
          }
        ]
      : describeIncantationLines(
          t,
          incantation.kind,
          [incantation.cause, incantation.effect, incantation.bonus],
          props.ritualTrigger
        ).map((text) => ({ kind: null, text }))
  return (
    <p className="synergy-written-incantation">
      <img src={getIncantationIcon(incantation.kind)} alt="" />
      <span>
        {lines.map((line, index) => (
          <span key={index} className="synergy-written-incantation-line">
            {line.kind && (
              <img
                className="synergy-written-incantation-kind"
                src={getIncantationIcon(line.kind)}
                alt=""
              />
            )}
            {addIconsToDescription(line.kind ? `${line.text}.` : line.text, {
              ap: 0,
              luck: 0,
              stars: strength + 1,
              showAbilityTiers: true
            })}
          </span>
        ))}
      </span>
    </p>
  )
}

// the store holds a JSON copy of each player, so the board is a plain object
// until a live MapSchema replaces it
function getBoardPokemons(player: IPlayer) {
  const board = player.board
  return typeof board.forEach === "function"
    ? schemaValues(board)
    : (Object.values(board) as ReturnType<typeof schemaValues<Pokemon>>)
}

const keepFirstOfFamily = (arr: Pkm[]): Pkm[] => {
  const seenFamilies = new Set<Pkm>()
  return arr.filter((p) => {
    const family = PkmFamily[p]
    if (seenFamilies.has(family)) return false
    seenFamilies.add(family)
    return true
  })
}

const baseVariant = (pkm: Pkm): Pkm =>
  (Object.keys(PkmRegionalVariants) as Pkm[]).find((p) =>
    PkmRegionalVariants[p]!.includes(pkm)
  ) ?? pkm

export default function SynergyDetailComponent(props: {
  type: Synergy
  value: number
}) {
  const { t: tBase } = useTranslation(); const t = tBase as any
  const additionalPokemons = useAppSelector(
    (state) => state.game.additionalPokemons
  )
  const fossilUnlocks = useAppSelector(selectSpectatedFossilUnlocks)
  const stageLevel = useAppSelector((state) => state.game.stageLevel)
  const spectatedPlayer = useAppSelector(selectSpectatedPlayer)
  const specialGameRule = useAppSelector((state) => state.game.specialGameRule)
  const gameMode = useAppSelector((state) => state.game.gameMode)
  const writtenIncantations = useAppSelector(
    (state) =>
      state.game.ghostIncantationsByPlayerId[spectatedPlayer?.id ?? ""]
  )

  const thresholdReached = SynergyTiersThresholds[props.type]
    .filter((n) => n <= props.value)
    .at(-1)

  const regulars = keepFirstOfFamily(
    PRECOMPUTED_POKEMONS_PER_TYPE_AND_CATEGORY[props.type].pokemons
  )
    .map((p) => getPokemonData(p as Pkm))
    .sort((a, b) => RarityCost[a.rarity] - RarityCost[b.rarity])

  const additionals = keepFirstOfFamily(
    PRECOMPUTED_POKEMONS_PER_TYPE_AND_CATEGORY[
      props.type
    ].additionalPokemons.filter(
      (p) =>
        additionalPokemons.includes(baseVariant(PkmFamily[p])) ||
        (specialGameRule != null &&
          RulesWithAllPokemonsAvailable.includes(specialGameRule))
    )
  ).map((p) => getPokemonData(p as Pkm))

  /* fossil unlocks are personal, so only the ones this player has earned are
     listed, the same way additionals wait on the lobby's picks */
  const unlockables = keepFirstOfFamily(
    PRECOMPUTED_POKEMONS_PER_TYPE_AND_CATEGORY[props.type].unlockablePokemons
  ).map((p) => getPokemonData(p as Pkm))

  const uniques = keepFirstOfFamily(
    PRECOMPUTED_POKEMONS_PER_TYPE_AND_CATEGORY[props.type].uniquePokemons
  ).map((p) => getPokemonData(p as Pkm))

  const legendaries = keepFirstOfFamily(
    PRECOMPUTED_POKEMONS_PER_TYPE_AND_CATEGORY[props.type].legendaryPokemons
  ).map((p) => getPokemonData(p as Pkm))

  const specials = keepFirstOfFamily(
    PRECOMPUTED_POKEMONS_PER_TYPE_AND_CATEGORY[props.type].specialPokemons
  ).map((p) => getPokemonData(p as Pkm))

  let additionalInfo = ""

  if (spectatedPlayer) {
    switch (props.type) {
      case Synergy.WILD: {
        const wildChance = getWildChance(spectatedPlayer, stageLevel)
        additionalInfo = t("synergy_description.WILD_ADDITIONAL", {
          wildChance: roundToNDigits(wildChance * 100, 1)
        })
        break
      }
      case Synergy.BABY: {
        additionalInfo = t("synergy_description.BABY_CHANCE_STACKED", {
          eggChance: roundToNDigits(
            (thresholdReached === 7
              ? spectatedPlayer.goldenEggChance
              : spectatedPlayer.eggChance) * 100,
            1
          )
        })
        break
      }
      case Synergy.DRAGON: {
        const totalDragonStars = getBoardPokemons(spectatedPlayer).reduce(
          (acc, pokemon) =>
            acc +
            (pokemon.types.has(Synergy.DRAGON) && !isOnBench(pokemon)
              ? pokemon.stars
              : 0),
          0
        )
        additionalInfo = t("synergy_description.DRAGON_STARS", {
          totalStars: totalDragonStars
        })
        break
      }
      case Synergy.ELECTRIC: {
        additionalInfo = t("synergy_description.ELECTRIC_CHARGE", {
          charge: spectatedPlayer.cellBattery
        })
        break
      }
      case Synergy.NORMAL: {
        additionalInfo = t("synergy_description.NORMAL_SCARVES", {
          scarves: spectatedPlayer.scarvesItems.join(" ")
        })
        break
      }
      default:
        break
    }
  }

  if (props.type === Synergy.GHOST) {
    additionalInfo = getGhostSpiritCoinSentence()
  }

  if (props.type === Synergy.FAIRY && spectatedPlayer) {
    additionalInfo = t("synergy_description.FAIRY_WANDS", {
      wands: spectatedPlayer.fairyWands.join(" ")
    })
  }

  return (
    <div style={{ maxWidth: "560px" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <SynergyIcon type={props.type} size="40px" />
        <h3 style={{ margin: 0 }}>{t(`synergy.${props.type}`)}</h3>
      </div>
      <p style={{ whiteSpace: "pre-wrap" }}>
        {addIconsToDescription(
          t(`synergy_description.${props.type}`, { additionalInfo })
        )}
      </p>

      {SynergyTiers[props.type].map((tier: SynergyTier, i: number) => {
        // In Double Up, the Baby synergy is capped at its second tier (Baby 5),
        // so hide the unreachable third tier (Baby 7 / Golden Eggs)
        if (
          gameMode === GameMode.DOUBLE_UP &&
          props.type === Synergy.BABY &&
          SynergyTiersThresholds[props.type][i] >
            SynergyTiersThresholds[Synergy.BABY][1]
        ) {
          return null
        }
        const isCurrentTier =
          thresholdReached === SynergyTiersThresholds[props.type][i]
        return (
          <div
            key={tier}
            style={{
              color: isCurrentTier
                ? "var(--color-fg-primary)"
                : "var(--color-fg-secondary)",
              backgroundColor: isCurrentTier
                ? "var(--color-bg-secondary)"
                : "transparent",
              border: isCurrentTier ? "var(--border-thick)" : "none",
              borderRadius: "12px",
              padding: "5px"
            }}
          >
            <h4 style={{ fontSize: "1.2em", marginBottom: 0 }}>
              ({SynergyTiersThresholds[props.type][i]}) {t(`effect.${tier}`)}
            </h4>
            <SynergyTierDescription tier={tier} />
            {props.type === Synergy.GHOST && writtenIncantations?.[i] && (
              <WrittenIncantation
                encoded={writtenIncantations[i]}
                ghostLevel={props.value}
                ritualTrigger={
                  writtenIncantations
                    .map(decodeGhostIncantation)
                    .find(({ kind }) => kind === IncantationKind.RITUAL)
                    ?.cause ?? ""
                }
              />
            )}
            {tier === EffectEnum.PRIMORDIAL_POWER && (
              <>
                <FossilRestorationList
                  restoredPokemon={fossilUnlocks.restoredPokemon}
                />
                <FossilRestorationState unlocks={fossilUnlocks} />
              </>
            )}
          </div>
        )
      })}
      {props.type === Synergy.GHOST &&
        props.value >= GHOST_NIGHT_SHADE_THRESHOLD && (
          <div
            style={{
              color: "var(--color-fg-primary)",
              backgroundColor: "var(--color-bg-secondary)",
              border: "var(--border-thick)",
              borderRadius: "12px",
              padding: "5px"
            }}
          >
            <h4 style={{ fontSize: "1.2em", marginBottom: 0 }}>
              ({GHOST_NIGHT_SHADE_THRESHOLD}){" "}
              {t("synergy_description.GHOST_NIGHT_SHADE")}
            </h4>
            <p className="synergy-description">
              {t("synergy_description.GHOST_NIGHT_SHADE_DESCRIPTION")}
            </p>
          </div>
        )}
      <PokemonPortraitList
        pokemons={regulars}
        type={props.type}
        player={spectatedPlayer}
      />
      <PokemonPortraitList
        pokemons={additionals}
        type={props.type}
        player={spectatedPlayer}
        marginTop="0.5em"
      />
      <PokemonPortraitList
        pokemons={unlockables}
        type={props.type}
        player={spectatedPlayer}
        unlockedFossils={fossilUnlocks.unlocked}
        marginTop="0.5em"
      />
      <PokemonPortraitList
        pokemons={uniques}
        type={props.type}
        player={spectatedPlayer}
        marginTop="0.5em"
      />
      <PokemonPortraitList
        pokemons={legendaries}
        type={props.type}
        player={spectatedPlayer}
        marginTop="0.5em"
      />
      <PokemonPortraitList
        pokemons={specials}
        type={props.type}
        player={spectatedPlayer}
        marginTop="0.5em"
      />
    </div>
  )
}

/* Restoration state is public: which Galar fossils this player holds. The form
   they restored is highlighted in the tier's recipe list above. Their quest
   progress is not shown. */
function FossilRestorationState(props: { unlocks: IFossilUnlocksState }) {
  const { t } = useTranslation()
  const { galarFossils } = props.unlocks
  if (galarFossils.length === 0) return null

  return (
    <div className="synergy-fossil-restoration">
      {Object.values(GalarFossil).map((fossil) => (
        <img
          key={fossil}
          className={galarFossils.includes(fossil) ? "" : "is-locked"}
          src={`assets/item/${fossil}.webp`}
          alt={fossil}
          title={t(`galar_fossil.${fossil}`)}
        />
      ))}
    </div>
  )
}

function PokemonPortraitList(props: {
  pokemons: IPokemonData[]
  type: Synergy
  player?: IPlayer
  unlockedFossils?: Pkm[]
  marginTop?: string
}) {
  const teamFamilies = new Set(
    props.player == null
      ? []
      : getBoardPokemons(props.player)
          .filter((x) => x.types.has(props.type))
          .map((x) => PkmFamily[x.name])
  )

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        ...(props.marginTop ? { marginTop: props.marginTop } : {})
      }}
    >
      {props.pokemons.map((p) => (
        <PokemonPortrait
          p={p}
          key={p.name}
          type={props.type}
          player={props.player}
          teamFamilies={teamFamilies}
          locked={
            props.unlockedFossils != null &&
            !props.unlockedFossils.includes(PkmFamily[p.name])
          }
        />
      ))}
    </div>
  )
}

function PokemonPortrait(props: {
  p: IPokemonData
  type: Synergy
  player?: IPlayer
  teamFamilies: Set<Pkm>
  locked?: boolean
}) {
  return (
    <div
      className={cc("pokemon-portrait", {
        additional: props.p.additional,
        unlockable: props.locked === true,
        regional: props.p.regional,
        acquired: props.teamFamilies.has(PkmFamily[props.p.name])
      })}
      key={props.p.name}
      style={{
        color: RarityColor[props.p.rarity],
        border: "3px solid " + RarityColor[props.p.rarity]
      }}
    >
      <img
        src={getCachedPortrait(props.p.index, props.player?.pokemonCustoms)}
        alt={`${props.p.name} portrait`}
      />
    </div>
  )
}
