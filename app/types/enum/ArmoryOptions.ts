export enum LowPriceOptions {
    BERRYBUNDLE = "BERRY_BUNDLE",
    UNOWNBUNDLE = "UNOWN_BUNDLE",
    SWEETSBUNDLE = "SWEETS_BUNDLE",
    DITTOBUNDLE = "DITTO_BUNDLE"
}

export enum MiddlePriceOptions {
    GEMSBUNDLE = "GEMS_BUNDLE",
    COMMONBUNDLE = "COMMON_BUNDLE",
    UNCOMMONBUNDLE = "UNCOMMON_BUNDLE",
    RAREBUNDLE = "RARE_BUNDLE",
    EPICBUNDLE = "EPIC_BUNDLE",
    ULTRABUNDLE = "ULTRA_BUNDLE",
    POTION = "POTION",
    DELUXE_BOX = "DELUXE_BOX"

}

export enum HighPriceOptions {
    UNIQUEBUNDLE = "UNIQUE_BUNDLE",
    LEGENDARYBUNDLE = "LEGENDARY_BUNDLE"
}

export type ArmoryOptions = LowPriceOptions | MiddlePriceOptions | HighPriceOptions
