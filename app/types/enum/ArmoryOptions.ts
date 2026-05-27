export enum LowPriceOptions {
    BERRYBUNDLE = "BERRY_BUNDLE",
    UNOWNBUNDLE = "UNOWN_BUNDLE",
    SWEETSBUNDLE = "SWEETS_BUNDLE",
    DITTOBUNDLE = "DITTO_BUNDLE"
}

export enum MiddlePriceOptions {
    GEMSBUNDLE = "GEMS_BUNDLE",
    EPICBUNDLE = "EPIC_BUNDLE",
    ULTRABUNDLE = "ULTRA_BUNDLE"
}

export enum HighPriceOptions {
    UNIQUEBUNDLE = "UNIQUE_BUNDLE",
    LEGENDARYBUNDLE = "LEGENDARY_BUNDLE"
}

export type ArmoryOptions = LowPriceOptions | MiddlePriceOptions | HighPriceOptions