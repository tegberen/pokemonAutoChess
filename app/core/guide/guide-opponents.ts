import type { PVEStage } from "../../models/pve-stages"
import { Emotion } from "../../types"
import { Pkm } from "../../types/enum/Pokemon"

/* Slowking runs the school, and between the game's own wild rounds he fields
   his own board. It grows the way a real Psychic comp grows - Slowbro evolves
   into Slowking, Ralts into Kirlia, Hatenna into Hattrem, Beldum into Metang -
   so the player is reading a board that improves at roughly the rate theirs
   does, rather than a single scaled dummy.

   Stages 1, 2, 3, 9, 14 and 19 are the game's own wild rounds, authored below
   rather than read from PVEStages. This server has added variants to all six -
   stage 3 alone rolls one of 26 - and a guide is what people meet when they
   migrate from a server that has none of them. So the guide always shows the
   original encounter, and the shuffle is left to real games. */

/* The original wild rounds, fixed. Boards, avatars and emotions are copied
   verbatim from each stage's base entry, except stage 3: this server's base is
   Rapidash and the original three Spearow are not among its variants at all,
   so that one is written out. */
const GUIDE_WILD_STAGES: { [stage: number]: PVEStage } = {
  1: {
    name: "pkm.MAGIKARP",
    avatar: Pkm.MAGIKARP,
    board: [
      [Pkm.MAGIKARP, 3, 1],
      [Pkm.MAGIKARP, 5, 1]
    ]
  },
  2: {
    name: "pkm.RATTATA",
    avatar: Pkm.RATTATA,
    board: [
      [Pkm.RATTATA, 3, 1],
      [Pkm.RATTATA, 5, 1]
    ]
  },
  3: {
    name: "pkm.SPEAROW",
    avatar: Pkm.SPEAROW,
    // a flight: one bird leading, two trailing off its shoulders
    board: [
      [Pkm.SPEAROW, 4, 3],
      [Pkm.SPEAROW, 3, 2],
      [Pkm.SPEAROW, 5, 2]
    ]
  },
  9: {
    name: "pkm.GYARADOS",
    avatar: Pkm.GYARADOS,
    board: [[Pkm.GYARADOS, 4, 2]]
  },
  14: {
    name: "pkm.MEWTWO",
    avatar: Pkm.MEWTWO,
    emotion: Emotion.DETERMINED,
    board: [
      [Pkm.MEWTWO, 0, 2],
      [Pkm.MEW, 7, 2]
    ]
  },
  19: {
    name: "tower_duo",
    avatar: Pkm.LUGIA,
    emotion: Emotion.DETERMINED,
    board: [
      [Pkm.LUGIA, 3, 2],
      [Pkm.HO_OH, 5, 2]
    ]
  }
}

/* Positioned by attack range. Note y=3 is the FRONT for both sides: blue maps
   y to row (y-1) and red to row 5-(y-1), so both teams meet at y=3 and their
   y=1 rows are the far edges. Melee therefore sits on y=3 - Blipbug,
   Hatenna/Hattrem, Stantler, Wobbuffet, Beldum/Metang/Metagross and Lugia are
   all range 1 - Mr. Mime is range 2 on y=2, and the range 3 casters
   (Slowking, Ralts/Kirlia/Gothita) hold y=1. */
const GUIDE_OPPONENT_BOARDS: {
  [stage: number]: [pkm: Pkm, x: number, y: number][]
} = {
  4: [
    [Pkm.BLIPBUG, 4, 3],
    [Pkm.SLOWKING, 4, 1]
  ],
  5: [
    [Pkm.BLIPBUG, 3, 3],
    [Pkm.HATENNA, 5, 3],
    [Pkm.SLOWKING, 4, 1]
  ],
  6: [
    [Pkm.BLIPBUG, 3, 3],
    [Pkm.HATENNA, 5, 3],
    [Pkm.SLOWKING, 4, 1],
    [Pkm.RALTS, 2, 1]
  ],
  10: [
    [Pkm.BLIPBUG, 2, 3],
    [Pkm.HATENNA, 4, 3],
    [Pkm.STANTLER, 6, 3],
    [Pkm.SLOWKING, 4, 1],
    [Pkm.RALTS, 2, 1]
  ],
  11: [
    [Pkm.BLIPBUG, 2, 3],
    [Pkm.HATTREM, 4, 3],
    [Pkm.STANTLER, 6, 3],
    [Pkm.SLOWKING, 4, 1],
    [Pkm.RALTS, 2, 1]
  ],
  12: [
    [Pkm.BLIPBUG, 2, 3],
    [Pkm.HATTREM, 4, 3],
    [Pkm.STANTLER, 6, 3],
    [Pkm.MR_MIME, 6, 2],
    [Pkm.SLOWKING, 4, 1],
    [Pkm.RALTS, 2, 1]
  ],
  13: [
    [Pkm.BLIPBUG, 2, 3],
    [Pkm.HATTREM, 4, 3],
    [Pkm.STANTLER, 6, 3],
    [Pkm.MR_MIME, 6, 2],
    [Pkm.SLOWKING, 4, 1],
    [Pkm.KIRLIA, 2, 1]
  ],
  15: [
    [Pkm.BLIPBUG, 1, 3],
    [Pkm.HATTREM, 3, 3],
    [Pkm.STANTLER, 5, 3],
    [Pkm.BELDUM, 7, 3],
    [Pkm.MR_MIME, 6, 2],
    [Pkm.SLOWKING, 4, 1],
    [Pkm.KIRLIA, 2, 1]
  ],
  17: [
    [Pkm.WOBBUFFET, 1, 3],
    [Pkm.HATTREM, 3, 3],
    [Pkm.STANTLER, 5, 3],
    [Pkm.METANG, 7, 3],
    [Pkm.MR_MIME, 6, 2],
    [Pkm.SLOWKING, 4, 1],
    [Pkm.KIRLIA, 2, 1]
  ],
  20: [
    [Pkm.WOBBUFFET, 1, 3],
    [Pkm.HATTREM, 2, 3],
    [Pkm.LUGIA, 3, 3],
    [Pkm.STANTLER, 5, 3],
    [Pkm.METANG, 6, 3],
    [Pkm.MR_MIME, 6, 2],
    [Pkm.SLOWKING, 4, 1],
    [Pkm.GOTHITA, 2, 1]
  ]
}

/* Boards are authored on the stages where the comp actually changes; the
   stages between reuse the last one, which is what makes 6-8 and 15-16 read
   as "he did not improve this round" rather than needing to be repeated. */
function guideOpponentBoard(
  stageLevel: number
): [pkm: Pkm, x: number, y: number][] | null {
  const authored = Object.keys(GUIDE_OPPONENT_BOARDS)
    .map(Number)
    .filter((stage) => stage <= stageLevel)
    .sort((a, b) => b - a)[0]
  return authored === undefined ? null : GUIDE_OPPONENT_BOARDS[authored]
}

export function guidePveStage(stageLevel: number): PVEStage | null {
  const wild = GUIDE_WILD_STAGES[stageLevel]
  if (wild) return wild
  const board = guideOpponentBoard(stageLevel)
  if (!board) return null
  return {
    name: "pkm.SLOWKING",
    avatar: Pkm.SLOWKING,
    board
  }
}

// the guide never plays a wild round it did not author
export function isGuideWildStage(stageLevel: number): boolean {
  return stageLevel in GUIDE_WILD_STAGES
}
