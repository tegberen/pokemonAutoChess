import {
  DPS_CURSE_ID,
  DPS_EMBER_ID,
  DPS_HAIL_ID,
  DPS_METEOR_SHOWER_ID,
  DPS_POISON_GAS_ID,
  DPS_SANDSTORM_ID,
  DPS_SPIKES_ID,
  DPS_STEALTH_ROCKS_ID,
  DPS_STORM_ID,
  DPS_TIDAL_WAVE_ID,
  DPS_TOXIC_SPIKES_ID,
  DPS_UNISON_ID
} from "../../../../../types"

// Display data for the synthetic Battle-Stats rows (board effects that are not a
// real Pokémon). Keyed by the row id the server sets; value gives the icon to
// draw instead of a portrait and the i18n key for its tooltip/label.
type GameStatsLabelKey =
  | "game_stats.tidal_wave"
  | "game_stats.curse"
  | "game_stats.sandstorm"
  | "game_stats.storm"
  | "game_stats.spikes"
  | "game_stats.stealth_rocks"
  | "game_stats.hail"
  | "game_stats.ember"
  | "game_stats.poison_gas"
  | "game_stats.toxic_spikes"
  | "game_stats.meteor_shower"
  | "game_stats.unison"

export const SYNTHETIC_DPS_DISPLAY: Record<
  string,
  { icon: string; labelKey: GameStatsLabelKey }
> = {
  [DPS_TIDAL_WAVE_ID]: {
    icon: "assets/icons/TIDAL_WAVE.svg",
    labelKey: "game_stats.tidal_wave"
  },
  [DPS_CURSE_ID]: {
    icon: "assets/icons/CURSE_STATS.svg",
    labelKey: "game_stats.curse"
  },
  [DPS_SANDSTORM_ID]: {
    icon: "assets/icons/SANDSTORM_DAMAGE.svg",
    labelKey: "game_stats.sandstorm"
  },
  [DPS_STORM_ID]: {
    icon: "assets/icons/THUNDER_STRUCK_DAMAGE.svg",
    labelKey: "game_stats.storm"
  },
  [DPS_SPIKES_ID]: {
    icon: "assets/icons/SPIKES.svg",
    labelKey: "game_stats.spikes"
  },
  [DPS_STEALTH_ROCKS_ID]: {
    icon: "assets/icons/STEALTH_ROCKS.svg",
    labelKey: "game_stats.stealth_rocks"
  },
  [DPS_HAIL_ID]: {
    icon: "assets/icons/HAIL.svg",
    labelKey: "game_stats.hail"
  },
  [DPS_EMBER_ID]: {
    icon: "assets/icons/EMBER.svg",
    labelKey: "game_stats.ember"
  },
  [DPS_POISON_GAS_ID]: {
    icon: "assets/icons/POISON_GAS.svg",
    labelKey: "game_stats.poison_gas"
  },
  [DPS_TOXIC_SPIKES_ID]: {
    icon: "assets/icons/TOXIC_SPIKES.svg",
    labelKey: "game_stats.toxic_spikes"
  },
  [DPS_METEOR_SHOWER_ID]: {
    icon: "assets/icons/METEOR_DAMAGE.svg",
    labelKey: "game_stats.meteor_shower"
  },
  [DPS_UNISON_ID]: {
    icon: "assets/blessings/unison.svg",
    labelKey: "game_stats.unison"
  }
}

export function getSyntheticDpsDisplay(id: string) {
  return SYNTHETIC_DPS_DISPLAY[id]
}
