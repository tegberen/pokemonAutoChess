import { Item } from "../../../types/enum/Item"
import { Pkm } from "../../../types/enum/Pokemon"
import { Synergy } from "../../../types/enum/Synergy"
import {
  countItemAnywhere,
  countItemsOnPokemon,
  getRegionalsOfSynergy,
  getRegularPoolOfSynergy,
  hasItemAnywhere,
  hasItemInInventory,
  hasItemOnPokemon,
  hasLevel,
  hasPokemon,
  hasPokemonAtStars,
  hasPokemonOnBoard,
  hasSynergyTier
} from "../guide-conditions"
import { giveGuidePokemon, removeGuidePokemon } from "../guide-effects"
import { GuideTopic } from "../guide-lesson"
import type { GuideLessonScript } from "../guide-script"

/* One way to play Grass.

   The lesson is an itemization plan with a fork in it. Every component has a
   named source and the ledger balances exactly: the three crafts at stage 5
   empty the inventory, and whichever way stage 12 goes, the last two crafts
   consume everything left over. That is what lets the text say "the water in
   your inventory" and be telling the truth.

   Item ledger:
      0  MAGNET (starter)    1  CHARCOAL      2  MAGNET    3  MIRACLE_SEED
      4  TWISTED_SPOON       5  MYSTIC_WATER  -> glove + upgrade + orb
      8  MYSTIC_WATER + ORAN_BERRY (tree) -> GROTLE
      9  TWISTED_SPOON      11  MYSTIC_WATER
     12  MIRACLE_SEED -> orb + dew   | rewind: MYSTIC_WATER -> egg + dew
     14  BLACK_GLASSES      17  BLACK_GLASSES -> wonder box
     19  HEART_SCALE x2 -> rocky helmet */
export const GrassLesson: GuideLessonScript = {
  synergy: Synergy.GRASS,

  /* The three item holders are rented, so each is released on the stage that
     hands its items onward: Dolliv to Carnivine at 10, Quilladin and Rowlet to
     the endgame bodies at 20. Seedot is the unit stage 16 deliberately cuts. */
  protect: [
    { pkm: Pkm.TURTWIG },
    { pkm: Pkm.SMOLIV, untilStage: 10 },
    { pkm: Pkm.ROWLET, untilStage: 20 },
    { pkm: Pkm.SEEDOT, untilStage: 16 },
    { pkm: Pkm.GOSSIFLEUR },
    { pkm: Pkm.BUDEW },
    { pkm: Pkm.BURMY_PLANT },
    { pkm: Pkm.CARNIVINE },
    { pkm: Pkm.CHESPIN, untilStage: 20 },
    { pkm: Pkm.BULBASAUR }
  ],

  /* The plan is a second GREEN_ORB. The replay takes the seed away and the
     waters already in the bag become an AQUA_EGG instead. takeBack is what the
     stage PRODUCED, not what it consumed: by the time the player asks to see
     the other branch they have already crafted. */
  rewind: {
    stage: 12,
    takeBack: [Item.GREEN_ORB, Item.SOUL_DEW],
    // Carnivine has carried a GREEN_ORB since stage 5, so say whose to take
    holder: Pkm.ROWLET,
    restore: [Item.MYSTIC_WATER, Item.MYSTIC_WATER, Item.TWISTED_SPOON],
    target: Item.MYSTIC_WATER,
    excludes: [Item.MIRACLE_SEED]
  },

  stages: [
    {
      /* The starter screen is built while the counter is still 0 but answered
         during stage 1, so the forced pick is declared on both. */
      stage: 0,
      shop: [Pkm.ROWLET],
      proposition: Pkm.TURTWIG,
      pickItem: Item.MAGNET
    },
    {
      stage: 1,
      level: 2,
      shop: [Pkm.ROWLET],
      proposition: Pkm.TURTWIG,
      reward: [Item.CHARCOAL],
      steps: [
        { key: "welcome", topic: GuideTopic.BOARD },
        {
          key: "regular_pool",
          topic: GuideTopic.BOARD,
          showPokemons: getRegularPoolOfSynergy(Synergy.GRASS)
        },
        {
          key: "regionals",
          topic: GuideTopic.BOARD,
          showPokemons: getRegionalsOfSynergy(Synergy.GRASS)
        },
        {
          key: "choose_starter",
          topic: GuideTopic.BOARD,
          confirmFirst: true,
          isCompleted: (player) => hasPokemon(player, Pkm.TURTWIG)
        },
        {
          key: "opener",
          topic: GuideTopic.BOARD,
          buyable: [Pkm.ROWLET],
          isCompleted: (player) =>
            hasPokemonOnBoard(player, Pkm.TURTWIG) &&
            hasPokemonOnBoard(player, Pkm.ROWLET)
        }
      ]
    },
    {
      stage: 2,
      // three copies make the 2-star, and the starter supplied the first
      shop: [Pkm.TURTWIG, Pkm.TURTWIG],
      reward: [Item.MAGNET],
      steps: [
        {
          key: "grotle",
          topic: GuideTopic.BOARD,
          buyable: [Pkm.TURTWIG],
          isCompleted: (player) => hasPokemonAtStars(player, Pkm.TURTWIG, 2)
        }
      ]
    },
    {
      stage: 3,
      shop: [Pkm.SMOLIV],
      reward: [Item.MIRACLE_SEED],
      steps: [
        {
          key: "smoliv_in",
          topic: GuideTopic.BOARD,
          buyable: [Pkm.SMOLIV],
          isCompleted: (player) => hasPokemonOnBoard(player, Pkm.SMOLIV)
        }
      ]
    },
    {
      stage: 4,
      level: 3,
      carousel: Item.TWISTED_SPOON,
      steps: [
        { key: "wincon", topic: GuideTopic.ITEMIZATION },
        {
          key: "take_spoon",
          topic: GuideTopic.ITEMIZATION,
          isCompleted: (player) => hasItemAnywhere(player, Item.TWISTED_SPOON)
        }
      ]
    },
    {
      stage: 5,
      level: 4,
      shop: [Pkm.SMOLIV, Pkm.SMOLIV],
      pickItem: Item.MYSTIC_WATER,
      steps: [
        {
          key: "pick_water",
          topic: GuideTopic.ITEMIZATION,
          confirmFirst: true,
          isCompleted: (player) => hasItemAnywhere(player, Item.MYSTIC_WATER)
        },
        {
          key: "smoliv_two",
          topic: GuideTopic.BOARD,
          buyable: [Pkm.SMOLIV],
          isCompleted: (player) => hasPokemonAtStars(player, Pkm.SMOLIV, 2)
        },
        {
          key: "craft_three",
          topic: GuideTopic.ITEMIZATION,
          itemTarget: Pkm.SMOLIV,
          allowedCrafts: [Item.PUNCHING_GLOVE, Item.UPGRADE, Item.GREEN_ORB],
          isCompleted: (player) =>
            hasItemOnPokemon(player, Pkm.SMOLIV, Item.PUNCHING_GLOVE) &&
            hasItemOnPokemon(player, Pkm.SMOLIV, Item.UPGRADE) &&
            hasItemOnPokemon(player, Pkm.SMOLIV, Item.GREEN_ORB)
        }
      ]
    },
    {
      stage: 8,
      level: 4,
      pickItem: Item.MYSTIC_WATER,
      ripeBerry: Item.ORAN_BERRY,
      steps: [
        {
          key: "pick_water_two",
          topic: GuideTopic.ITEMIZATION,
          confirmFirst: true,
          isCompleted: (player) => hasItemAnywhere(player, Item.MYSTIC_WATER)
        },
        /* Grotle is the only body on the board the ledger never gives an item
           to, which is what makes it a safe berry holder: a unit that is one
           slot short later cannot take a berry now. */
        {
          key: "harvest_berry",
          topic: GuideTopic.ITEMIZATION,
          itemTarget: Pkm.TURTWIG,
          // the MYSTIC_WATER picked a moment ago is a stage 12 component
          allowedItems: [Item.ORAN_BERRY],
          isCompleted: (player) =>
            hasItemOnPokemon(player, Pkm.TURTWIG, Item.ORAN_BERRY)
        }
      ]
    },
    {
      stage: 9,
      level: 4,
      xpPurchases: 1,
      shop: [Pkm.SEEDOT, Pkm.GOSSIFLEUR, Pkm.BUDEW],
      reward: [Item.TWISTED_SPOON],
      steps: [
        {
          key: "level_five",
          topic: GuideTopic.ECONOMY,
          allowActions: ["levelup"],
          isCompleted: (player) => hasLevel(player, 5)
        },
        {
          key: "grass_five",
          topic: GuideTopic.BOARD,
          params: { threshold: 5 },
          buyable: [Pkm.SEEDOT, Pkm.GOSSIFLEUR, Pkm.BUDEW],
          isCompleted: (player) => hasSynergyTier(player, Synergy.GRASS, 2)
        }
      ]
    },
    {
      stage: 10,
      level: 5,
      // Carnivine is a UNIQUE: picked here, never available in a shop
      proposition: Pkm.CARNIVINE,
      steps: [
        {
          key: "pick_carnivine",
          topic: GuideTopic.BOARD,
          confirmFirst: true,
          isCompleted: (player) => hasPokemon(player, Pkm.CARNIVINE)
        },
        {
          key: "carnivine",
          topic: GuideTopic.ITEMIZATION,
          itemTarget: Pkm.CARNIVINE,
          isCompleted: (player) =>
            hasPokemonOnBoard(player, Pkm.CARNIVINE) &&
            countItemsOnPokemon(player, Pkm.CARNIVINE) >= 3
        }
      ]
    },
    {
      stage: 11,
      level: 6,
      pickItem: Item.MYSTIC_WATER,
      steps: [
        {
          key: "pick_water_three",
          topic: GuideTopic.ITEMIZATION,
          confirmFirst: true,
          isCompleted: (player) =>
            countItemAnywhere(player, Item.MYSTIC_WATER) >= 2
        },
        { key: "realize_aqua_egg", topic: GuideTopic.ITEMIZATION }
      ]
    },
    {
      stage: 12,
      level: 6,
      carousel: Item.MIRACLE_SEED,
      // the third copy is the Rowlet bought at stage 1
      shop: [Pkm.ROWLET, Pkm.ROWLET],
      steps: [
        { key: "confirm_plan", topic: GuideTopic.ITEMIZATION },
        {
          key: "take_seed",
          topic: GuideTopic.ITEMIZATION,
          isCompleted: (player) => hasItemAnywhere(player, Item.MIRACLE_SEED)
        },
        {
          key: "evolve_rowlet",
          topic: GuideTopic.BOARD,
          buyable: [Pkm.ROWLET],
          isCompleted: (player) => hasPokemonAtStars(player, Pkm.ROWLET, 2)
        },
        {
          key: "orb_and_dew",
          topic: GuideTopic.ITEMIZATION,
          itemTarget: Pkm.ROWLET,
          allowedCrafts: [Item.GREEN_ORB, Item.SOUL_DEW],
          /* On Rowlet specifically. Components can also be merged in the bag,
             so checking that the items merely exist would clear the step with
             nothing equipped - and naming the holder is the point. */
          isCompleted: (player) =>
            hasItemOnPokemon(player, Pkm.ROWLET, Item.GREEN_ORB) &&
            hasItemOnPokemon(player, Pkm.ROWLET, Item.SOUL_DEW)
        },
        { key: "second_carry", topic: GuideTopic.ITEMIZATION },
        {
          key: "rewind_intro",
          topic: GuideTopic.ITEMIZATION,
          triggersRewind: true
        },
        { key: "rewind_confirm", topic: GuideTopic.ITEMIZATION },
        {
          key: "rewind_take_water",
          topic: GuideTopic.ITEMIZATION,
          // the restore put two back, so taking the third is what clears this
          isCompleted: (player) =>
            countItemAnywhere(player, Item.MYSTIC_WATER) >= 3
        },
        {
          key: "rewind_aqua_and_dew",
          topic: GuideTopic.ITEMIZATION,
          itemTarget: Pkm.ROWLET,
          allowedCrafts: [Item.AQUA_EGG, Item.SOUL_DEW],
          isCompleted: (player) =>
            hasItemOnPokemon(player, Pkm.ROWLET, Item.AQUA_EGG) &&
            hasItemOnPokemon(player, Pkm.ROWLET, Item.SOUL_DEW)
        },
        { key: "rewind_second_carry", topic: GuideTopic.ITEMIZATION }
      ]
    },
    {
      stage: 14,
      level: 6,
      shop: [Pkm.CHESPIN],
      reward: [Item.BLACK_GLASSES],
      steps: [
        {
          key: "chespin_in",
          topic: GuideTopic.BOARD,
          buyable: [Pkm.CHESPIN],
          isCompleted: (player) => hasPokemonOnBoard(player, Pkm.CHESPIN)
        }
      ]
    },
    {
      stage: 15,
      level: 6,
      xpPurchases: 2,
      shop: [Pkm.BURMY_PLANT],
      steps: [
        {
          key: "level_seven",
          topic: GuideTopic.ECONOMY,
          allowActions: ["levelup"],
          isCompleted: (player) => hasLevel(player, 7)
        },
        {
          key: "grass_seven",
          topic: GuideTopic.BOARD,
          params: { threshold: 7 },
          buyable: [Pkm.BURMY_PLANT],
          isCompleted: (player) =>
            hasPokemonOnBoard(player, Pkm.BURMY_PLANT) &&
            hasSynergyTier(player, Synergy.GRASS, 3)
        },
        {
          key: "roll_chespin",
          topic: GuideTopic.ECONOMY,
          buyable: [Pkm.CHESPIN],
          pity: { pokemon: Pkm.CHESPIN, afterRolls: 8 },
          allowActions: ["reroll"],
          isCompleted: (player) => hasPokemonAtStars(player, Pkm.CHESPIN, 2)
        }
      ]
    },
    {
      stage: 16,
      level: 7,
      steps: [
        { key: "evolve_rule", topic: GuideTopic.BOARD },
        {
          key: "roll_petilil",
          topic: GuideTopic.ECONOMY,
          buyable: [Pkm.GOSSIFLEUR, Pkm.BUDEW],
          pity: { pokemon: Pkm.GOSSIFLEUR, afterRolls: 8 },
          allowActions: ["reroll"],
          isCompleted: (player) => hasPokemonAtStars(player, Pkm.GOSSIFLEUR, 2)
        },
        {
          key: "roll_snover",
          topic: GuideTopic.ECONOMY,
          buyable: [Pkm.SNOVER],
          pity: { pokemon: Pkm.SNOVER, afterRolls: 3 },
          allowActions: ["reroll"],
          isCompleted: (player) => hasPokemon(player, Pkm.SNOVER)
        },
        {
          key: "cut_seedot",
          topic: GuideTopic.BOARD,
          isCompleted: (player) =>
            !hasPokemon(player, Pkm.SEEDOT) &&
            hasPokemonOnBoard(player, Pkm.SNOVER)
        }
      ]
    },
    {
      stage: 17,
      level: 7,
      carousel: Item.BLACK_GLASSES,
      steps: [
        { key: "glasses_plan", topic: GuideTopic.ITEMIZATION },
        {
          key: "take_glasses",
          topic: GuideTopic.ITEMIZATION,
          isCompleted: (player) =>
            countItemAnywhere(player, Item.BLACK_GLASSES) >= 2
        },
        {
          key: "wonder_box",
          topic: GuideTopic.ITEMIZATION,
          itemTarget: Pkm.CHESPIN,
          allowedCrafts: [Item.WONDER_BOX],
          isCompleted: (player) =>
            hasItemOnPokemon(player, Pkm.CHESPIN, Item.WONDER_BOX)
        }
      ]
    },
    {
      // no steps: a fast-forwarded stage that exists only to pay its reward
      stage: 19,
      reward: [Item.HEART_SCALE, Item.HEART_SCALE]
    },
    {
      stage: 20,
      level: 7,
      xpPurchases: 5,
      // Virizion is a LEGENDARY, offered at the stage 20 portal carousel
      proposition: Pkm.VIRIZION,
      steps: [
        {
          key: "pick_virizion",
          topic: GuideTopic.BOARD,
          confirmFirst: true,
          isCompleted: (player) => hasPokemon(player, Pkm.VIRIZION)
        },
        {
          key: "level_eight",
          topic: GuideTopic.ECONOMY,
          allowActions: ["levelup"],
          isCompleted: (player) => hasLevel(player, 8)
        },
        {
          key: "virizion_in",
          topic: GuideTopic.BOARD,
          isCompleted: (player) => hasPokemonOnBoard(player, Pkm.VIRIZION)
        },
        {
          key: "sell_quilladin",
          topic: GuideTopic.BOARD,
          /* The box has to be back in the bag, not merely somewhere: while
             Quilladin still holds it, an anywhere-check would already pass and
             the step would clear before the player had done anything. */
          isCompleted: (player) =>
            !hasPokemon(player, Pkm.CHESPIN) &&
            hasItemInInventory(player, Item.WONDER_BOX)
        },
        {
          key: "wonder_box_virizion",
          topic: GuideTopic.ITEMIZATION,
          itemTarget: Pkm.VIRIZION,
          isCompleted: (player) =>
            hasItemOnPokemon(player, Pkm.VIRIZION, Item.WONDER_BOX)
        },
        {
          key: "rocky_helmet",
          topic: GuideTopic.ITEMIZATION,
          itemTarget: Pkm.VIRIZION,
          allowedCrafts: [Item.ROCKY_HELMET],
          isCompleted: (player) =>
            hasItemOnPokemon(player, Pkm.VIRIZION, Item.ROCKY_HELMET)
        },
        {
          /* Plan A: chase the synergy's ULTRA. Two Dittos come with it, which
             is what turns a single copy into a 2-star. */
          key: "roll_grookey",
          topic: GuideTopic.ECONOMY,
          buyable: [Pkm.GROOKEY],
          pity: { pokemon: Pkm.GROOKEY, afterRolls: 12 },
          allowActions: ["reroll"],
          onEnter: (player) => giveGuidePokemon(player, Pkm.DITTO, 2),
          isCompleted: (player) => hasPokemon(player, Pkm.GROOKEY)
        },
        {
          key: "ditto_grookey",
          topic: GuideTopic.BOARD,
          isCompleted: (player) => hasPokemonAtStars(player, Pkm.GROOKEY, 2)
        },
        {
          /* Plan A is itemized, not just built: the point of the fork is that
             both branches end with the same two items on a real carry. */
          key: "carry_to_thwackey",
          topic: GuideTopic.ITEMIZATION,
          itemTarget: Pkm.GROOKEY,
          isCompleted: (player) =>
            hasItemOnPokemon(player, Pkm.GROOKEY, Item.AQUA_EGG) &&
            hasItemOnPokemon(player, Pkm.GROOKEY, Item.SOUL_DEW)
        },
        {
          key: "ultra_not_consistent",
          topic: GuideTopic.ECONOMY
        },
        {
          /* Plan B, on the same resources: the Grookey goes away and the two
             Dittos come back, so the only thing that changed is what we are
             rolling for. */
          key: "roll_bulbasaur",
          topic: GuideTopic.ECONOMY,
          buyable: [Pkm.BULBASAUR],
          pity: { pokemon: Pkm.BULBASAUR, afterRolls: 12 },
          allowActions: ["reroll", "levelup"],
          onEnter: (player) => {
            removeGuidePokemon(player, Pkm.GROOKEY)
            giveGuidePokemon(player, Pkm.DITTO, 2)
          },
          isCompleted: (player) => hasPokemonAtStars(player, Pkm.BULBASAUR, 2)
        },
        {
          key: "carry_to_ivysaur",
          topic: GuideTopic.ITEMIZATION,
          itemTarget: Pkm.BULBASAUR,
          isCompleted: (player) =>
            hasItemOnPokemon(player, Pkm.BULBASAUR, Item.AQUA_EGG) &&
            hasItemOnPokemon(player, Pkm.BULBASAUR, Item.SOUL_DEW)
        },
        { key: "final", topic: GuideTopic.POSITIONING }
      ]
    }
  ]
}
