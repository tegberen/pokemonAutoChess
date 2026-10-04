import {
  FATED_DOOM_DELAY,
  FATED_ECHO_CHANCE,
  FATED_RESURRECT_ACTIVATIONS,
  FATED_SPAWN_GHOST_CHANCE,
  FATED_SPREAD_HEX_TARGETS,
  FATED_SPREAD_STATUS_DURATION,
  FatedRitual,
  HEXING_LOSS_VALUES,
  HEXING_STAT_LOSS_VALUES,
  HexingLoss,
  type HexingTarget,
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

// incantation keys are built at runtime, which the typed i18next keys reject
export type Translate = (key: string, options?: object) => string

const UNKNOWN_VALUE = "…"

export const INCANTATION_UPGRADE_ICON =
  "/assets/icons/ghost_rework_icons/upgrade_effect.svg"

export function getIncantationIcon(kind: IncantationKind) {
  return `/assets/icons/ghost_rework_icons/${kind.toLowerCase()}.svg`
}

const HEXING_TARGET_STAT: { [target in HexingTarget]: string } = {
  HIGHEST_DEFENSES: "DEF and SPE_DEF",
  HIGHEST_AP: "AP",
  HIGHEST_ATK: "ATK",
  HIGHEST_SPEED: "SPEED"
}

function tiers(values: readonly number[] | undefined) {
  return values ? `[${values.join(",")}]` : UNKNOWN_VALUE
}

function describeHexingLoss(loss: HexingLoss, target: string | null) {
  if (loss !== HexingLoss.STAT) {
    return { key: loss, params: { value: tiers(HEXING_LOSS_VALUES[loss]) } }
  }
  if (!target) return { key: "STAT_UNKNOWN", params: {} }
  const statLoss = HEXING_STAT_LOSS_VALUES[target as HexingTarget]
  return {
    key: statLoss.isPercent ? "STAT_PERCENT" : "STAT",
    params: {
      value: tiers(statLoss.values),
      stat: HEXING_TARGET_STAT[target as HexingTarget]
    }
  }
}

const SILENCE_KEY_BY_TRIGGER: { [trigger in RitualTrigger]: string } = {
  GHOST_CASTS: "SILENCE_DAMAGED",
  GHOST_ATTACKS: "SILENCE_ONE",
  GHOST_KOD: "SILENCE_NEAREST",
  ENEMY_KOD: "SILENCE_NEAREST"
}

function describeRitualEffect(effect: RitualEffect, trigger: string | null) {
  if (effect === RitualEffect.SILENCE) {
    if (!trigger) return { key: "SILENCE", params: {} }
    const silence = RITUAL_SILENCE_VALUES[trigger as RitualTrigger]
    return {
      key: SILENCE_KEY_BY_TRIGGER[trigger as RitualTrigger],
      params: {
        targets: tiers(silence.targets),
        seconds: tiers(silence.seconds)
      }
    }
  }
  const values = trigger
    ? RITUAL_EFFECT_VALUES[effect][trigger as RitualTrigger]
    : undefined
  return { key: effect, params: { value: tiers(values) } }
}

function describeRitualBonus(bonus: RitualBonus, trigger: string | null) {
  if (bonus === RitualBonus.GOLD_CHANCE) {
    const gold = trigger
      ? RITUAL_GOLD_CHANCE_VALUES[trigger as RitualTrigger]
      : null
    return {
      chance: gold ? gold.chance.join(",") : UNKNOWN_VALUE,
      gold: tiers(gold?.gold)
    }
  }
  const values = trigger
    ? RITUAL_BONUS_VALUES[bonus][trigger as RitualTrigger]
    : undefined
  return { value: tiers(values) }
}

export function describeResurrectActivations(
  t: Translate,
  trigger: RitualTrigger
) {
  const activations = FATED_RESURRECT_ACTIVATIONS[trigger]
  if (activations === undefined) return UNKNOWN_VALUE
  if (trigger === RitualTrigger.GHOST_ATTACKS) {
    return t("ghost_incantations.activations_attacks", {
      count: activations,
      attacks: activations * RITUAL_ATTACKS_PER_TRIGGER
    })
  }
  return t("ghost_incantations.activations", { count: activations })
}

function describeFatedRitual(
  t: Translate,
  ritual: FatedRitual,
  context: string
) {
  const trigger = context as RitualTrigger
  if (ritual === FatedRitual.RESURRECT) {
    return { value: describeResurrectActivations(t, trigger) }
  }
  if (ritual === FatedRitual.SPAWN_GHOST) {
    return { value: FATED_SPAWN_GHOST_CHANCE[trigger] ?? UNKNOWN_VALUE }
  }
  return { value: FATED_ECHO_CHANCE }
}

export function describeIncantationOption(
  t: Translate,
  kind: IncantationKind,
  column: number,
  option: string,
  cause: string | null,
  context: string
) {
  const base = `ghost_incantations.${kind}.${column}.${option}`
  if (kind === IncantationKind.HEXING) {
    if (column === 1) {
      const { key, params } = describeHexingLoss(option as HexingLoss, cause)
      return t(`ghost_incantations.${kind}.1.${key}`, params)
    }
    return t(base)
  }
  if (kind === IncantationKind.RITUAL) {
    if (column === 0) return t(base, { count: RITUAL_ATTACKS_PER_TRIGGER })
    if (column === 1) {
      const { key, params } = describeRitualEffect(
        option as RitualEffect,
        cause
      )
      return t(`ghost_incantations.${kind}.1.${key}`, params)
    }
    return t(base, describeRitualBonus(option as RitualBonus, cause))
  }
  if (column === 0) {
    return t(base, {
      seconds: FATED_DOOM_DELAY / 1000,
      spreadSeconds: FATED_SPREAD_STATUS_DURATION / 1000,
      targets: FATED_SPREAD_HEX_TARGETS
    })
  }
  return t(base, describeFatedRitual(t, option as FatedRitual, context))
}

function asContinuation(text: string) {
  const firstWord = text.split(" ")[0]
  if (/^[A-Z_]+$/.test(firstWord) || firstWord.startsWith("[")) return text
  return text.charAt(0).toLowerCase() + text.slice(1)
}

export function describeIncantationLines(
  t: Translate,
  kind: IncantationKind,
  selections: (string | null)[],
  context: string
) {
  const [cause, effect, bonus] = selections
  const part = (column: number, option: string | null | undefined) =>
    option
      ? describeIncantationOption(
          t,
          kind,
          column,
          option,
          cause ?? null,
          context
        )
      : UNKNOWN_VALUE
  const continuation = (column: number, option: string | null | undefined) =>
    option ? asContinuation(part(column, option)) : UNKNOWN_VALUE
  if (kind === IncantationKind.FATED) {
    return [
      t("ghost_incantations.sentence.FATED_HEXING", { cause: part(0, cause) }),
      t("ghost_incantations.sentence.FATED_RITUAL", { effect: part(1, effect) })
    ]
  }
  return [
    t(`ghost_incantations.sentence.${kind}`, {
      cause:
        kind === IncantationKind.HEXING
          ? continuation(0, cause)
          : part(0, cause),
      effect: continuation(1, effect),
      bonus: continuation(2, bonus)
    })
  ]
}

export function describeIncantationSentence(
  t: Translate,
  kind: IncantationKind,
  selections: (string | null)[],
  context: string
) {
  return describeIncantationLines(t, kind, selections, context).join(" ")
}
