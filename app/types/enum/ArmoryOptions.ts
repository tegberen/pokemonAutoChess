export enum FreeOptions {
    BERRYBUNDLE = "BERRY_BUNDLE",
    UNOWNBUNDLE = "UNOWN_BUNDLE",
    SWEETSBUNDLE = "SWEETS_BUNDLE",
    DITTOBUNDLE = "DITTO_BUNDLE",
    // GOLDBUNDLE = "GOLD_BUNDLE",
    // PICNICBUNDLE = "PICNIC_BUNDLE",
    // EGGBUNDLE = "EGG_BUNDLE"
}

export enum PaidOptions {
    GEMSBUNDLE = "GEMS_BUNDLE",
    POTION = "POTION",
    DELUXE_BOX = "DELUXE_BOX",

    COMMONBUNDLE = "COMMON_BUNDLE",
    UNCOMMONBUNDLE = "UNCOMMON_BUNDLE",
    RAREBUNDLE = "RARE_BUNDLE",
    EPICBUNDLE = "EPIC_BUNDLE",
    ULTRABUNDLE = "ULTRA_BUNDLE",
    UNIQUEBUNDLE = "UNIQUE_BUNDLE",
    LEGENDARYBUNDLE = "LEGENDARY_BUNDLE"
}

export const ArmoryOptionsPrice: { [key in ArmoryOptions ] : number } = {
    [FreeOptions.BERRYBUNDLE] : 0,
    [FreeOptions.UNOWNBUNDLE] : 0,
    [FreeOptions.SWEETSBUNDLE] : 0,
    [FreeOptions.DITTOBUNDLE] : 0,
    // [FreeOptions.GOLDBUNDLE] : 0,
    // [FreeOptions.PICNICBUNDLE] : 0,
    // [FreeOptions.EGGBUNDLE] : 0,

    [PaidOptions.GEMSBUNDLE] : 5,
    [PaidOptions.POTION] : 5,
    [PaidOptions.DELUXE_BOX] : 15,
    [PaidOptions.COMMONBUNDLE] : 15,
    [PaidOptions.UNCOMMONBUNDLE] : 6,
    [PaidOptions.RAREBUNDLE] : 9,
    [PaidOptions.EPICBUNDLE] : 12,
    [PaidOptions.ULTRABUNDLE] : 5,
    [PaidOptions.UNIQUEBUNDLE] : 15,
    [PaidOptions.LEGENDARYBUNDLE] : 40,
}

export type ArmoryOptions = FreeOptions | PaidOptions
