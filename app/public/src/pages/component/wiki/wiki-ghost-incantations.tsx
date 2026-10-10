import { Fragment } from "react"
import { useTranslation } from "react-i18next"
import {
  FATED_ECHO_CHANCE,
  FATED_SPAWN_GHOST_CHANCE,
  FatedHexing,
  FatedRitual,
  GHOST_INCANTATION_SLOTS,
  getHexingStrength,
  getRitualStrength,
  HEXING_LOSS_VALUES,
  HEXING_STAT_LOSS_VALUES,
  HexingLoss,
  HexingStatus,
  HexingTarget,
  IncantationKind,
  RITUAL_ATTACKS_PER_TRIGGER,
  RITUAL_BONUS_VALUES,
  RITUAL_EFFECT_VALUES,
  RITUAL_GOLD_CHANCE_VALUES,
  RITUAL_SILENCE_VALUES,
  RitualBonus,
  RitualEffect,
  RitualTrigger
} from "../../../../../config/game/ghost-incantations"
import { SynergyTiers } from "../../../../../config/game/synergies"
import { Synergy } from "../../../../../types/enum/Synergy"
import { addIconsToDescription } from "../../utils/descriptions"
import {
  describeIncantationLines,
  describeIncantationOption,
  describeIncantationSentence,
  describeResurrectActivations,
  getIncantationIcon,
  type Translate
} from "../game/ghost-incantation-text"
import "./wiki-ghost-incantations.css"

const GHOST_SLOT_LEVELS = GHOST_INCANTATION_SLOTS.map((slot) => slot.ghostLevel)

const HEXING_TIER_LEVELS = [0, 1, 2].map((strength) =>
  GHOST_SLOT_LEVELS.filter((level) => getHexingStrength(level) === strength)
)

const RITUAL_LEVELS = GHOST_SLOT_LEVELS.slice(
  GHOST_INCANTATION_SLOTS.findIndex(
    (slot) => slot.kind === IncantationKind.RITUAL
  )
)

const HEXING_TIER_NUMBERS = HEXING_TIER_LEVELS.map(
  (_, strength) => strength + 1
).join(" / ")

const RITUAL_TRIGGERS = Object.values(RitualTrigger)

const RITUAL_EFFECT_GROUPS = [
  {
    label: "ghost_gain",
    effects: [
      RitualEffect.GHOST_LUCK,
      RitualEffect.GHOST_SPEED,
      RitualEffect.GHOST_PP,
      RitualEffect.GHOST_MAX_HP
    ]
  },
  {
    label: "enemies",
    effects: [RitualEffect.ENEMY_LUCK_LOSS, RitualEffect.SILENCE]
  }
]

const HEXING_TARGET_STAT_TOKENS: { [target in HexingTarget]: string } = {
  HIGHEST_DEFENSES: "DEF + SPE_DEF",
  HIGHEST_AP: "AP",
  HIGHEST_ATK: "ATK",
  HIGHEST_SPEED: "SPEED"
}

const HEXING_LOSS_UNITS: {
  [loss in Exclude<HexingLoss, HexingLoss.STAT>]: string
} = {
  GOLD_ON_KO: " GOLD",
  LUCK: " LUCK",
  MAX_PP: "%",
  MAX_HP: "%"
}

function KindHeading({
  kind,
  title
}: {
  kind: IncantationKind
  title: string
}) {
  return (
    <h3 className="wiki-ghost-kind-heading">
      <img src={getIncantationIcon(kind)} alt="" aria-hidden="true" />
      {title}
    </h3>
  )
}

function TierLegend({ t, tiers }: { t: Translate; tiers: number[][] }) {
  const tiersByLevel = tiers
    .map((levels, strength) =>
      t("wiki.ghost.tier_at", {
        tier: strength + 1,
        levels: levels
          .map((level) => t("wiki.ghost.level", { level }))
          .join(` ${t("wiki.ghost.and")} `)
      })
    )
    .join(", ")
  return (
    <p className="wiki-ghost-tier-legend">
      {addIconsToDescription(
        t("wiki.ghost.tier_legend", { tiers: tiersByLevel })
      )}
    </p>
  )
}

function RitualMatrixHead({ t }: { t: Translate }) {
  return (
    <thead>
      <tr>
        <th rowSpan={2} aria-hidden="true" />
        <th colSpan={RITUAL_TRIGGERS.length} className="wiki-ghost-span-header">
          {t("ghost_incantations.RITUAL.columns.0")}
        </th>
      </tr>
      <tr>
        {RITUAL_TRIGGERS.map((trigger) => (
          <th key={trigger}>
            {addIconsToDescription(
              t(`wiki.ghost.ritual.causes.${trigger}`, {
                count: RITUAL_ATTACKS_PER_TRIGGER
              })
            )}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function tierValues(values: readonly number[], unit = "") {
  return addIconsToDescription(`[${values.join(",")}]${unit}`)
}

function describeSilence(t: Translate, trigger: RitualTrigger) {
  const { targets, seconds } = RITUAL_SILENCE_VALUES[trigger]
  const params = {
    targets: `[${targets.join(",")}]`,
    seconds: `[${seconds.join(",")}]`
  }
  if (trigger === RitualTrigger.GHOST_CASTS) {
    return t("wiki.ghost.ritual.silence_farthest", params)
  }
  if (trigger === RitualTrigger.GHOST_ATTACKS) {
    return t("wiki.ghost.ritual.silence_behind_target", params)
  }
  if (trigger === RitualTrigger.ENEMY_KOD) {
    return t("wiki.ghost.ritual.silence_adjacent", params)
  }
  return t("wiki.ghost.ritual.silence_nearest", params)
}

function describeRitualEffectValue(
  t: Translate,
  effect: RitualEffect,
  trigger: RitualTrigger
) {
  if (effect === RitualEffect.SILENCE) {
    return addIconsToDescription(describeSilence(t, trigger))
  }
  return tierValues(RITUAL_EFFECT_VALUES[effect][trigger])
}

const PERMANENT_RITUAL_BONUSES = [
  RitualBonus.PERMANENT_HP,
  RitualBonus.PERMANENT_PP,
  RitualBonus.PERMANENT_SPEED
] as const

const GOLD_CHANCE_ROWS = [
  {
    label: "gold_chance",
    describe: (trigger: RitualTrigger) =>
      addIconsToDescription(
        `[${RITUAL_GOLD_CHANCE_VALUES[trigger].chance.join(",")},LK]%`
      )
  },
  {
    label: "gold_amount",
    describe: (trigger: RitualTrigger) =>
      addIconsToDescription(
        `[${RITUAL_GOLD_CHANCE_VALUES[trigger].gold.join(",")}] GOLD`
      )
  }
]

function describeFatedRitualValue(
  t: Translate,
  ritual: FatedRitual,
  trigger: RitualTrigger
) {
  if (ritual === FatedRitual.RESURRECT) {
    return describeResurrectActivations(t, trigger)
  }
  return addIconsToDescription(`[${FATED_SPAWN_GHOST_CHANCE[trigger]},LK]%`)
}

export function WikiGhostIncantations() {
  const { t: tBase } = useTranslation()
  const t = tBase as any
  const ghostTiers = SynergyTiers[Synergy.GHOST]

  return (
    <section id="wiki-ghost-incantations">
      <div className="my-box wiki-ghost-card">
        <h2>{t("wiki.ghost.title")}</h2>
        <p className="wiki-ghost-intro">
          {addIconsToDescription(t("wiki.ghost.intro"))}
        </p>
        <div className="wiki-ghost-table-wrap">
          <table className="wiki-ghost-unlocks">
            <thead>
              <tr>
                <th aria-hidden="true" />
                <th>{t("wiki.ghost.writes")}</th>
                <th>
                  <span className="wiki-ghost-header-icon">
                    <img
                      src={getIncantationIcon(IncantationKind.HEXING)}
                      alt=""
                      aria-hidden="true"
                    />
                    {t("wiki.ghost.hexing_tier")}
                  </span>
                </th>
                <th>
                  <span className="wiki-ghost-header-icon">
                    <img
                      src={getIncantationIcon(IncantationKind.RITUAL)}
                      alt=""
                      aria-hidden="true"
                    />
                    {t("wiki.ghost.ritual_tier")}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {GHOST_INCANTATION_SLOTS.map((slot, index) => (
                <tr key={slot.ghostLevel}>
                  <th scope="row">
                    ({slot.ghostLevel}) {t(`effect.${ghostTiers[index]}`)}
                  </th>
                  <td>
                    {addIconsToDescription(t(`wiki.ghost.slot.${index}`))}
                  </td>
                  <td>
                    {t("wiki.ghost.tier", {
                      tier: getHexingStrength(slot.ghostLevel) + 1
                    })}
                  </td>
                  <td>
                    {RITUAL_LEVELS.includes(slot.ghostLevel)
                      ? t("wiki.ghost.tier", {
                          tier: getRitualStrength(slot.ghostLevel) + 1
                        })
                      : t("wiki.ghost.none")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <section className="wiki-ghost-step">
          <h4>{addIconsToDescription(t("wiki.ghost.negative_luck_title"))}</h4>
          <p className="wiki-ghost-intro">
            {addIconsToDescription(t("wiki.ghost.negative_luck"))}
          </p>
          <p className="wiki-ghost-example">
            {addIconsToDescription(t("wiki.ghost.negative_luck_example"))}
          </p>
        </section>
      </div>

      <div className="my-box wiki-ghost-card">
        <KindHeading
          kind={IncantationKind.HEXING}
          title={t("wiki.ghost.hexing.title")}
        />
        <p className="wiki-ghost-intro">
          {addIconsToDescription(t("wiki.ghost.hexing.intro"))}
        </p>
        <p className="wiki-ghost-example">
          {addIconsToDescription(
            t("wiki.ghost.example", {
              sentence: describeIncantationSentence(
                t,
                IncantationKind.HEXING,
                [HexingTarget.HIGHEST_AP, HexingLoss.STAT, HexingStatus.FLINCH],
                ""
              )
            })
          )}
        </p>
        <section className="wiki-ghost-step">
          <h4>1. {t("ghost_incantations.HEXING.columns.0")}</h4>
          <ul className="wiki-ghost-options">
            {Object.values(HexingTarget).map((target) => (
              <li key={target}>
                {addIconsToDescription(
                  t(`ghost_incantations.HEXING.0.${target}`)
                )}
              </li>
            ))}
          </ul>
        </section>
        <section className="wiki-ghost-step">
          <h4>2. {t("ghost_incantations.HEXING.columns.1")}</h4>
          <TierLegend t={t} tiers={HEXING_TIER_LEVELS} />
          <div className="wiki-ghost-table-wrap">
            <table>
              <colgroup>
                <col className="wiki-ghost-label-column" />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th aria-hidden="true" />
                  <th>
                    {t("wiki.ghost.tier", { tier: HEXING_TIER_NUMBERS })}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="wiki-ghost-group">
                  <th scope="rowgroup" colSpan={2}>
                    {addIconsToDescription(
                      t("wiki.ghost.hexing_effects.STAT")
                    )}
                  </th>
                </tr>
                {Object.values(HexingTarget).map((target) => {
                  const statLoss = HEXING_STAT_LOSS_VALUES[target]
                  const unit = statLoss.isPercent ? "%" : ""
                  return (
                    <tr key={target} className="wiki-ghost-group-member">
                      <th scope="row">
                        {addIconsToDescription(
                          HEXING_TARGET_STAT_TOKENS[target]
                        )}
                      </th>
                      <td>{tierValues(statLoss.values, unit)}</td>
                    </tr>
                  )
                })}
                {Object.values(HexingLoss)
                  .filter((loss) => loss !== HexingLoss.STAT)
                  .map((loss) => (
                    <tr key={loss}>
                      <th scope="row">
                        {addIconsToDescription(
                          t(`wiki.ghost.hexing_effects.${loss}`)
                        )}
                      </th>
                      <td>
                        {tierValues(
                          HEXING_LOSS_VALUES[loss],
                          HEXING_LOSS_UNITS[loss]
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="wiki-ghost-step">
          <h4>
            3. {addIconsToDescription(t("ghost_incantations.HEXING.columns.2"))}
          </h4>
          <p className="wiki-ghost-intro">{t("wiki.ghost.curse_duration")}</p>
          <ul className="wiki-ghost-options">
            {Object.values(HexingStatus).map((status) => (
              <li key={status} className="wiki-ghost-curse">
                <span>{addIconsToDescription(status)}</span>
                <span className="wiki-ghost-curse-description">
                  {addIconsToDescription(t(`status_description.${status}`))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="my-box wiki-ghost-card">
        <KindHeading
          kind={IncantationKind.RITUAL}
          title={t("wiki.ghost.ritual.title")}
        />
        <p className="wiki-ghost-intro">
          {addIconsToDescription(t("wiki.ghost.ritual.intro"))}
        </p>
        <p className="wiki-ghost-example">
          {addIconsToDescription(
            t("wiki.ghost.example", {
              sentence: describeIncantationSentence(
                t,
                IncantationKind.RITUAL,
                [
                  RitualTrigger.ENEMY_KOD,
                  RitualEffect.GHOST_SPEED,
                  RitualBonus.GOLD_CHANCE
                ],
                ""
              )
            })
          )}
        </p>
        <section className="wiki-ghost-step">
          <h4>1. {t("ghost_incantations.RITUAL.columns.0")}</h4>
          <ul className="wiki-ghost-options">
            {RITUAL_TRIGGERS.map((trigger) => (
              <li key={trigger}>
                {addIconsToDescription(
                  t(`ghost_incantations.RITUAL.0.${trigger}`, {
                    count: RITUAL_ATTACKS_PER_TRIGGER
                  })
                )}
              </li>
            ))}
          </ul>
        </section>
        <section className="wiki-ghost-step">
          <h4>2. {t("ghost_incantations.RITUAL.columns.1")}</h4>
          <TierLegend
            t={t}
            tiers={RITUAL_LEVELS.map((level) => [level])}
          />
          <div className="wiki-ghost-table-wrap">
            <table className="wiki-ghost-matrix">
              <RitualMatrixHead t={t} />
              <tbody>
                {RITUAL_EFFECT_GROUPS.map(({ label, effects }) => (
                  <Fragment key={label}>
                    <tr className="wiki-ghost-group">
                      <th
                        scope="rowgroup"
                        colSpan={RITUAL_TRIGGERS.length + 1}
                      >
                        {addIconsToDescription(
                          t(`wiki.ghost.ritual.${label}`)
                        )}
                      </th>
                    </tr>
                    {effects.map((effect) => (
                      <tr key={effect} className="wiki-ghost-group-member">
                        <th scope="row">
                          {addIconsToDescription(
                            t(`wiki.ghost.ritual.effects.${effect}`)
                          )}
                        </th>
                        {RITUAL_TRIGGERS.map((trigger) => (
                          <td key={trigger}>
                            {describeRitualEffectValue(t, effect, trigger)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="wiki-ghost-step">
          <h4>3. {t("ghost_incantations.RITUAL.columns.2")}</h4>
          <div className="wiki-ghost-table-wrap">
            <table className="wiki-ghost-matrix">
              <RitualMatrixHead t={t} />
              <tbody>
                <tr className="wiki-ghost-group">
                  <th
                    scope="rowgroup"
                    colSpan={RITUAL_TRIGGERS.length + 1}
                  >
                    {addIconsToDescription(
                      t("wiki.ghost.ritual.bonuses.GOLD_CHANCE")
                    )}
                  </th>
                </tr>
                {GOLD_CHANCE_ROWS.map(({ label, describe }) => (
                  <tr key={label} className="wiki-ghost-group-member">
                    <th scope="row">
                      {addIconsToDescription(t(`wiki.ghost.ritual.${label}`))}
                    </th>
                    {RITUAL_TRIGGERS.map((trigger) => (
                      <td key={trigger}>{describe(trigger)}</td>
                    ))}
                  </tr>
                ))}
                {PERMANENT_RITUAL_BONUSES.map((bonus) => (
                  <tr key={bonus}>
                    <th scope="row">
                      {addIconsToDescription(
                        t(`wiki.ghost.ritual.bonuses.${bonus}`)
                      )}
                    </th>
                    {RITUAL_TRIGGERS.map((trigger) => (
                      <td key={trigger}>
                        {tierValues(RITUAL_BONUS_VALUES[bonus][trigger])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="wiki-ghost-example">
            {addIconsToDescription(t("wiki.ghost.ritual.permanent_cap_note"))}
          </p>
        </section>
      </div>

      <div className="my-box wiki-ghost-card">
        <KindHeading
          kind={IncantationKind.FATED}
          title={t("wiki.ghost.fated.title")}
        />
        <p className="wiki-ghost-intro">
          {addIconsToDescription(t("wiki.ghost.fated.intro"))}
        </p>
        <p className="wiki-ghost-example">
          {t("wiki.ghost.example_label")}
          {describeIncantationLines(
            t,
            IncantationKind.FATED,
            [FatedHexing.REAP, FatedRitual.ECHO],
            ""
          ).map((line, index) => (
            <span key={index} className="wiki-ghost-example-line">
              {addIconsToDescription(line)}
            </span>
          ))}
        </p>
        <section className="wiki-ghost-step">
          <h4>
            {addIconsToDescription(t("wiki.ghost.fated.hexing_heading"))}
          </h4>
          <ul className="wiki-ghost-options">
            {Object.values(FatedHexing).map((hexing) => (
              <li key={hexing}>
                {addIconsToDescription(
                  describeIncantationOption(
                    t,
                    IncantationKind.FATED,
                    0,
                    hexing,
                    null,
                    ""
                  )
                )}
              </li>
            ))}
          </ul>
          <p className="wiki-ghost-example">
            {addIconsToDescription(t("wiki.ghost.fated.hexing_reap_note"))}
          </p>
          <p className="wiki-ghost-example">
            {addIconsToDescription(t("wiki.ghost.fated.hexing_gold_note"))}
          </p>
        </section>
        <section className="wiki-ghost-step">
          <h4>
            {addIconsToDescription(t("wiki.ghost.fated.ritual_heading"))}
          </h4>
          <div className="wiki-ghost-table-wrap">
            <table className="wiki-ghost-matrix">
              <RitualMatrixHead t={t} />
              <tbody>
                {Object.values(FatedRitual).map((ritual) => (
                  <tr key={ritual}>
                    <th scope="row">
                      {addIconsToDescription(
                        t(`wiki.ghost.fated.rituals.${ritual}`)
                      )}
                    </th>
                    {ritual === FatedRitual.ECHO ? (
                      <td colSpan={RITUAL_TRIGGERS.length}>
                        {addIconsToDescription(`[${FATED_ECHO_CHANCE},LK]%`)}
                      </td>
                    ) : ritual === FatedRitual.DOUBLE_REWARDS ? (
                      <td colSpan={RITUAL_TRIGGERS.length}>
                        {t("wiki.ghost.fated.all_causes")}
                      </td>
                    ) : (
                      RITUAL_TRIGGERS.map((trigger) => (
                        <td key={trigger}>
                          {describeFatedRitualValue(t, ritual, trigger)}
                        </td>
                      ))
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  )
}
