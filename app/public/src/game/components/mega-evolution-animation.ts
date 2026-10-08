import Phaser, { GameObjects } from "phaser"
import { getPokemonData } from "../../../../models/precomputed/precomputed-pokemon-data"
import { Pkm, PkmFamily } from "../../../../types/enum/Pokemon"
import { DEPTH } from "../depths"

// Legends Z-A style: a swirling globe darkens into a glowing shell that
// cracks open on the Mega, drawn small and scaled up to match the pixel art
const MIN_SPHERE_RADIUS = 58
const MAX_SPHERE_RADIUS = 110
// the globe wraps the Pokemon with a little room to spare
const SPHERE_TO_SPRITE_RATIO = 0.62
// one globe size for both Primals, growing only with the stage 32 boost
const SCALE_SIZED_FAMILIES: Pkm[] = [Pkm.GROUDON, Pkm.KYOGRE]
const BASE_SCALE = 2
const PIXEL_SCALE = 2
const PIXEL_TEXTURE = "mega-pixel"
const LOADING_TEXTURE = "loading_pokeball"
const AURA_DURATION = 1300
// rings of shadow copies nudged outward: [offset in pixels, alpha]
const AURA_RINGS: [number, number][] = [
  [6, 0.14],
  [3, 0.2]
]
const AURA_DIRECTIONS = [
  [1, 0],
  [0.7, 0.7],
  [0, 1],
  [-0.7, 0.7],
  [-1, 0],
  [-0.7, -0.7],
  [0, -1],
  [0.7, -0.7]
]

const SPHERE_START = 400
const SPHERE_FORM_DURATION = 600
const POKEMON_FADE_IN_DURATION = 450
const ORIGINAL_VANISH_DURATION = SPHERE_START + 150
const SWIRL_DURATION = 650
const SWIRL_GROW_DURATION = 450
const SWIRL_STAGGER = 40
// timed to the mega_evolution sound: its dip, swell and peak at 3.63s
const DARKEN_START = 1900
const DARKEN_DURATION = 550
const CRACK_START = 2900
const BURST_START = 3630
const CRACK_DURATION = BURST_START - CRACK_START
const REVEAL_DURATION = 900
const LIGHT_RAY_DURATION = REVEAL_DURATION
const NB_LIGHT_RAYS = 26
const SHATTER_DURATION = 700
const TOTAL_DURATION = BURST_START + Math.max(REVEAL_DURATION, AURA_DURATION)
const SCENE_DIM_MAX = 0.35
const SCENE_DIM_IN_DURATION = 600
const SCENE_DIM_OUT_DURATION = 500

const GLOBE_PITCH = 0.35
const GLOBE_ROLL = -0.45
const GLOBE_SPIN_PER_SECOND = 2

const NB_INNER_SWIRL_ARCS = 12
const NB_OUTER_SWIRL_ARCS = 3
const NB_SWIRL_FILAMENTS = 28
const SWIRL_ARC_SEGMENTS = 20
// [tilt, roundness] of each reveal ribbon, coloured by the palette
const REVEAL_RIBBON_SHAPES: [number, number][] = [
  [GLOBE_ROLL - 0.1, 0.55],
  [GLOBE_ROLL + 0.1, 0.68],
  [GLOBE_ROLL, 0.5]
]

type Rgb = [number, number, number]

type MegaAnimationPalette = {
  swirlArcs: [string, string][]
  swirlFilaments: string[]
  revealRibbons: [string, string][]
  bands: string[]
  bandRim: string
  // [bright core, outer ribbon] of the ribbons wrapping the dark shell
  orbit: [string, string][]
  shatterSparks: number[]
  lightRays: string[]
  aura: Rgb[]
  seams: Rgb[]
  crack: Rgb
  // each lattice cell takes one, so several make a plated shell
  shells: Rgb[]
  halo: Rgb
  rim: Rgb
  coreCenter: string
  coreEdge: [Rgb, Rgb]
  // the energy bolts default to a crack core with seam colour edges
  boltCore?: Rgb
  boltEdges?: Rgb[]
  // swirl filaments of these colours are drawn thicker
  thickFilaments?: string[]
  // [offset, alpha] of each ring of the aura under the revealed Mega
  auraRings?: [number, number][]
}

const DEFAULT_MEGA_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#ffffff", "#f2a6dc"],
    ["#b9f2cf", "#f2a6dc"],
    ["#ffffff", "#b9f2cf"],
    ["#f6f29c", "#f2a6dc"],
    ["#e7b7ff", "#ffffff"]
  ],
  swirlFilaments: ["#ffffff", "#fbe6f6", "#e6fbef", "#fdfbe0"],
  revealRibbons: [
    ["#b9f2cf", "#f2a6dc"],
    ["#f6f29c", "#ffffff"],
    ["#e7b7ff", "#ffffff"]
  ],
  bands: ["#f2a6dc", "#e98be0", "#b9f2cf", "#f6f29c", "#f2a6dc", "#ffffff"],
  bandRim: "#ffffff",
  orbit: [
    ["#ffffff", "#f2a6dc"],
    ["#fffbe0", "#f6f29c"],
    ["#ffffff", "#b9f2cf"]
  ],
  shatterSparks: [0xffffff, 0xfff2b0, 0xffd27a, 0x8fe8ff],
  lightRays: ["#ffffff", "#fff4fb", "#f6ecff", "#fffbe0", "#eafff4"],
  aura: [
    [242, 166, 220],
    [231, 163, 240],
    [185, 242, 207],
    [246, 242, 156]
  ],
  seams: [
    [255, 200, 105],
    [130, 225, 255],
    [255, 214, 140],
    [120, 150, 255]
  ],
  crack: [255, 251, 232],
  shells: [[70, 48, 96]],
  halo: [240, 200, 255],
  rim: [214, 140, 255],
  coreCenter: "#ffffff",
  coreEdge: [
    [233, 248, 170],
    [246, 186, 226]
  ]
}

// gold cores: white never reads on red
const PRIMAL_GROUDON_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#ff9a30", "#c8202a"],
    ["#6a5460", "#2e2228"],
    ["#ffd23a", "#c8202a"],
    ["#e53a2a", "#2e2228"],
    ["#f070b0", "#4e3c46"]
  ],
  swirlFilaments: ["#ffe36b", "#3a2c34", "#ff9a30", "#ffb0d8"],
  revealRibbons: [
    ["#ff9a30", "#2e2228"],
    ["#c8202a", "#4e3c46"],
    ["#f070b0", "#2e2228"]
  ],
  bands: ["#4e3c46", "#e53a2a", "#ff9a30", "#3a2c34", "#c8202a", "#ffd23a"],
  bandRim: "#ffb82e",
  orbit: [
    ["#ffe36b", "#ff9a30"],
    ["#ffb070", "#c8202a"],
    ["#ffd0e8", "#f070b0"]
  ],
  shatterSparks: [0xffe36b, 0xffd23a, 0xff9a30, 0xe53a2a, 0xf070b0],
  lightRays: ["#fff0a0", "#ffe36b", "#ffd23a", "#ff9a30", "#ffb0d8"],
  aura: [
    [255, 154, 48],
    [200, 32, 42],
    [78, 60, 70],
    [240, 112, 176]
  ],
  seams: [
    [255, 154, 48],
    [255, 210, 58],
    [229, 58, 42]
  ],
  crack: [255, 236, 180],
  shells: [
    [66, 50, 58],
    [56, 42, 50],
    [76, 58, 66]
  ],
  halo: [240, 112, 176],
  rim: [255, 154, 48],
  coreCenter: "#fff0a0",
  coreEdge: [
    [255, 180, 50],
    [200, 32, 42]
  ],
  boltCore: [255, 236, 180],
  boltEdges: [
    [255, 154, 48],
    [229, 58, 42]
  ],
  thickFilaments: ["#3a2c34"]
}

const PRIMAL_KYOGRE_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#ffd09a", "#3a2a8a"],
    ["#5fc8ff", "#2a1f6b"],
    ["#ffe6c8", "#3a4fd0"],
    ["#e070c0", "#2a1f6b"],
    ["#ffb070", "#3a2a8a"]
  ],
  swirlFilaments: ["#ffd09a", "#5fc8ff", "#ffe6c8", "#e070c0"],
  revealRibbons: [
    ["#ffd09a", "#3a2a8a"],
    ["#5fc8ff", "#2a1f6b"],
    ["#ffe6c8", "#3a4fd0"]
  ],
  bands: ["#3a2a8a", "#3a4fd0", "#ffd09a", "#1a1440", "#5fc8ff", "#e070c0"],
  bandRim: "#ffd09a",
  orbit: [
    ["#ffe6c8", "#3a4fd0"],
    ["#ffd09a", "#5fc8ff"],
    ["#ffe6c8", "#e070c0"]
  ],
  shatterSparks: [0xffe6c8, 0xffd09a, 0x5fc8ff, 0xe070c0],
  lightRays: ["#ffe6c8", "#ffd09a", "#5fc8ff", "#ffb070", "#c8b8ff"],
  aura: [
    [58, 42, 138],
    [95, 200, 255],
    [255, 208, 154],
    [224, 112, 192]
  ],
  seams: [
    [120, 225, 255],
    [180, 245, 255],
    [90, 200, 255]
  ],
  crack: [235, 250, 255],
  shells: [
    [26, 38, 96],
    [20, 30, 78]
  ],
  halo: [140, 120, 255],
  rim: [95, 140, 255],
  coreCenter: "#ffe6c8",
  coreEdge: [
    [255, 176, 112],
    [95, 200, 255]
  ]
}

const MEGA_RAYQUAZA_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#a8e878", "#1f5a28"],
    ["#f8c040", "#3fa040"],
    ["#e0f8c0", "#1f5a28"],
    ["#f08030", "#18241a"],
    ["#88d860", "#3fa040"]
  ],
  swirlFilaments: ["#ffffff", "#a8e878", "#e0f8c0", "#f8c040"],
  revealRibbons: [
    ["#a8e878", "#1f5a28"],
    ["#f8c040", "#3fa040"],
    ["#e0f8c0", "#18241a"]
  ],
  bands: ["#3fa040", "#1f5a28", "#a8e878", "#18241a", "#6ac848", "#f8c040"],
  bandRim: "#a8e878",
  orbit: [
    ["#f8c040", "#f08030"],
    ["#e0f8c0", "#6ac848"],
    ["#e0f8c0", "#3fa040"]
  ],
  shatterSparks: [0xffffff, 0xa8e878, 0xf8c040, 0xe0f8c0],
  lightRays: ["#ffffff", "#a8e878", "#e0f8c0", "#f8c040", "#d0f0a8"],
  aura: [
    [63, 160, 64],
    [168, 232, 120],
    [106, 200, 72],
    [240, 128, 48]
  ],
  seams: [
    [248, 192, 64],
    [168, 232, 120],
    [240, 128, 48]
  ],
  crack: [255, 252, 230],
  shells: [
    [28, 52, 24],
    [20, 40, 18]
  ],
  halo: [168, 232, 120],
  rim: [136, 216, 96],
  coreCenter: "#f4ffe0",
  coreEdge: [
    [168, 232, 120],
    [106, 200, 72]
  ]
}

const PALETTE_BY_FAMILY: Partial<Record<Pkm, MegaAnimationPalette>> = {
  [Pkm.GROUDON]: PRIMAL_GROUDON_PALETTE,
  [Pkm.KYOGRE]: PRIMAL_KYOGRE_PALETTE,
  [Pkm.RAYQUAZA]: MEGA_RAYQUAZA_PALETTE
}

const MEGA_ABSOL_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#ff70b0", "#c81860"],
    ["#f03c8c", "#1a1a40"],
    ["#f4f6fa", "#3a6a9a"],
    ["#d82040", "#1a1a40"],
    ["#7a5ad0", "#2a1a6a"]
  ],
  swirlFilaments: ["#ffffff", "#ff90c8", "#1a1a40", "#a0c0e8"],
  revealRibbons: [
    ["#f03c8c", "#2a1a6a"],
    ["#f4f6fa", "#3a6a9a"],
    ["#d82040", "#1a1a40"]
  ],
  bands: ["#2a1a6a", "#f03c8c", "#f4f6fa", "#1a1a40", "#3a6a9a", "#d82040"],
  bandRim: "#ff90c8",
  orbit: [
    ["#ffd0e8", "#f03c8c"],
    ["#ffffff", "#3a6a9a"],
    ["#e0d0ff", "#7a5ad0"]
  ],
  shatterSparks: [0xffffff, 0xff90c8, 0xf03c8c, 0x7a5ad0],
  lightRays: ["#ffffff", "#ff90c8", "#f03c8c", "#a0c0e8", "#d82040"],
  aura: [
    [240, 60, 140],
    [216, 32, 64],
    [122, 90, 208],
    [58, 106, 154]
  ],
  seams: [
    [240, 60, 140],
    [255, 144, 200],
    [122, 90, 208]
  ],
  crack: [255, 244, 250],
  shells: [
    [34, 32, 72],
    [26, 26, 58]
  ],
  halo: [240, 60, 140],
  rim: [216, 32, 64],
  coreCenter: "#ffffff",
  coreEdge: [
    [255, 144, 200],
    [240, 60, 140]
  ],
  boltCore: [255, 244, 250],
  boltEdges: [
    [240, 60, 140],
    [216, 32, 64]
  ],
  thickFilaments: ["#1a1a40"]
}

const MEGA_AERODACTYL_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#d8c9f0", "#7e6699"],
    ["#f0308a", "#1a1420"],
    ["#a797c7", "#3f3758"],
    ["#bfcff7", "#4f5f97"],
    ["#ff9ac8", "#571f77"]
  ],
  swirlFilaments: ["#ffffff", "#1a1420", "#bfcff7", "#ffb0d8"],
  revealRibbons: [
    ["#d8c9f0", "#1a1420"],
    ["#f0308a", "#571f77"],
    ["#00a050", "#1a1420"]
  ],
  bands: ["#3f3758", "#a797c7", "#f0308a", "#6787af", "#d8c9f0", "#4a3599"],
  bandRim: "#d8c9f0",
  orbit: [
    ["#f4eeff", "#a797c7"],
    ["#ffd0e8", "#f0308a"],
    ["#c0f0d8", "#00a050"]
  ],
  shatterSparks: [0xffffff, 0xd8c9f0, 0xa797c7, 0xf0308a, 0x00a050],
  lightRays: ["#ffffff", "#f4eeff", "#d8c9f0", "#ffb0d8", "#bfcff7"],
  aura: [
    [126, 102, 153],
    [240, 48, 138],
    [216, 201, 240],
    [103, 135, 175]
  ],
  seams: [
    [240, 48, 138],
    [216, 201, 240],
    [255, 112, 184]
  ],
  crack: [255, 248, 252],
  shells: [
    [63, 55, 88],
    [52, 46, 72],
    [56, 66, 112]
  ],
  halo: [216, 201, 240],
  rim: [126, 102, 153],
  coreCenter: "#ffffff",
  coreEdge: [
    [216, 201, 240],
    [240, 48, 138]
  ],
  boltCore: [255, 248, 252],
  boltEdges: [
    [240, 48, 138],
    [255, 112, 184]
  ],
  thickFilaments: ["#1a1420"]
}

const MEGA_ALAKAZAM_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#ff80c0", "#f0208c"],
    ["#a0ecff", "#40d0f0"],
    ["#f0e890", "#1a1418"],
    ["#f0208c", "#1a1418"],
    ["#40d0f0", "#8a6a7a"]
  ],
  swirlFilaments: ["#ffffff", "#ffb0d8", "#c8f4ff", "#f8f0b0"],
  revealRibbons: [
    ["#ffffff", "#f0208c"],
    ["#ff80c0", "#f0208c"],
    ["#a0ecff", "#40d0f0"]
  ],
  bands: ["#8a6a7a", "#f0208c", "#40d0f0", "#1a1418", "#f0e890", "#ffffff"],
  bandRim: "#ffb0d8",
  orbit: [
    ["#ffffff", "#f0208c"],
    ["#e8fcff", "#40d0f0"],
    ["#fffce0", "#f0e890"]
  ],
  shatterSparks: [0xffffff, 0xff80c0, 0x40d0f0, 0xf0e890, 0xe01828],
  lightRays: ["#ffffff", "#ffb0d8", "#c8f4ff", "#f8f0b0", "#ff80c0"],
  aura: [
    [240, 32, 140],
    [64, 208, 240],
    [240, 232, 144],
    [224, 24, 40]
  ],
  seams: [
    [255, 128, 192],
    [64, 208, 240],
    [240, 32, 140],
    [160, 236, 255]
  ],
  crack: [255, 255, 255],
  shells: [
    [60, 44, 56],
    [48, 36, 46],
    [30, 24, 30]
  ],
  halo: [240, 32, 140],
  rim: [224, 24, 40],
  coreCenter: "#ffffff",
  coreEdge: [
    [255, 128, 192],
    [64, 208, 240]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [240, 32, 140],
    [64, 208, 240]
  ],
  auraRings: [
    [10, 0.1],
    [6, 0.14],
    [3, 0.2]
  ]
}

const MEGA_ALTARIA_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#ffffff", "#c8b8f0"],
    ["#8ad0f0", "#0e2050"],
    ["#f0b0d8", "#2a4ab0"],
    ["#f0eefa", "#8ad0f0"],
    ["#ffd890", "#2a4ab0"]
  ],
  swirlFilaments: ["#ffffff", "#ffd8f0", "#c8ecff", "#fff0c8"],
  revealRibbons: [
    ["#f0eefa", "#2a4ab0"],
    ["#8ad0f0", "#0e2050"],
    ["#f0b0d8", "#c8b8f0"]
  ],
  bands: ["#2a4ab0", "#f0eefa", "#8ad0f0", "#0e2050", "#f0b0d8", "#b8f0e0"],
  bandRim: "#ffffff",
  orbit: [
    ["#ffffff", "#c8ecff"],
    ["#fff4fa", "#f0b0d8"],
    ["#fffaf0", "#ffd890"]
  ],
  shatterSparks: [0xffffff, 0xffd8f0, 0xc8ecff, 0xfff0c8, 0xb8f0e0],
  lightRays: ["#ffffff", "#ffd8f0", "#c8ecff", "#fff0c8", "#e0d8ff"],
  aura: [
    [138, 208, 240],
    [240, 176, 216],
    [255, 216, 144],
    [184, 240, 224]
  ],
  seams: [
    [200, 236, 255],
    [255, 216, 240],
    [255, 240, 200],
    [184, 240, 224]
  ],
  crack: [255, 255, 255],
  shells: [
    [24, 40, 96],
    [18, 32, 80],
    [36, 58, 130]
  ],
  halo: [200, 236, 255],
  rim: [138, 208, 240],
  coreCenter: "#ffffff",
  coreEdge: [
    [255, 240, 200],
    [138, 208, 240]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [200, 236, 255],
    [255, 216, 240]
  ]
}

const MEGA_BANETTE_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#ffe070", "#f08020"],
    ["#e040a0", "#1a1420"],
    ["#a080d0", "#2a1a50"],
    ["#f0c030", "#1a1420"],
    ["#ff70c0", "#5a3a9a"]
  ],
  swirlFilaments: ["#fff4c0", "#1a1420", "#ffa0d8", "#1a1420"],
  revealRibbons: [
    ["#f0c030", "#1a1420"],
    ["#e040a0", "#2a1a50"],
    ["#ff9a40", "#5a3a9a"]
  ],
  bands: ["#2a2230", "#f0c030", "#e040a0", "#1a1420", "#5a3a9a", "#f08020"],
  bandRim: "#ffe070",
  orbit: [
    ["#fff4c0", "#f0c030"],
    ["#ffd0ec", "#e040a0"],
    ["#ffd8a0", "#f08020"]
  ],
  shatterSparks: [0xfff4c0, 0xffe070, 0xf08020, 0xe040a0],
  lightRays: ["#fff4c0", "#ffe070", "#ffa0d8", "#f0c030", "#c0a0f0"],
  aura: [
    [240, 192, 48],
    [224, 64, 160],
    [26, 20, 32],
    [90, 58, 154]
  ],
  seams: [
    [240, 192, 48],
    [255, 224, 112],
    [224, 64, 160]
  ],
  crack: [255, 248, 220],
  shells: [
    [42, 34, 48],
    [34, 28, 40],
    [40, 28, 70]
  ],
  halo: [240, 128, 32],
  rim: [240, 192, 48],
  coreCenter: "#fff4c0",
  coreEdge: [
    [255, 224, 112],
    [224, 64, 160]
  ],
  boltCore: [255, 248, 220],
  boltEdges: [
    [240, 192, 48],
    [240, 128, 32]
  ],
  thickFilaments: ["#1a1420"]
}

// gold cores: white never reads on red
const MEGA_CAMERUPT_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#ffd040", "#f07020"],
    ["#ff5a30", "#4a2418"],
    ["#f0e8d8", "#6a5048"],
    ["#f07020", "#2a1610"],
    ["#ffd040", "#d82020"]
  ],
  swirlFilaments: ["#fff4b0", "#2a1610", "#ffb050", "#4ab0f8"],
  revealRibbons: [
    ["#f07020", "#2a1610"],
    ["#ffd040", "#d82020"],
    ["#f0e8d8", "#6a5048"]
  ],
  bands: ["#4a2418", "#f07020", "#ffd040", "#2a1610", "#d82020", "#f0e8d8"],
  bandRim: "#ffd040",
  orbit: [
    ["#fff4b0", "#f07020"],
    ["#ffd8a0", "#d82020"],
    ["#fffcf0", "#c8b8a8"]
  ],
  shatterSparks: [0xfff4b0, 0xffd040, 0xf07020, 0xd82020, 0x4ab0f8],
  lightRays: ["#fff4b0", "#ffd040", "#ffb050", "#f07020", "#f0e8d8"],
  aura: [
    [240, 112, 32],
    [216, 32, 32],
    [255, 208, 64],
    [74, 36, 24]
  ],
  seams: [
    [255, 208, 64],
    [240, 112, 32],
    [255, 90, 48]
  ],
  crack: [255, 244, 200],
  shells: [
    [58, 34, 26],
    [46, 28, 22],
    [72, 56, 50]
  ],
  halo: [240, 112, 32],
  rim: [216, 32, 32],
  coreCenter: "#fff4b0",
  coreEdge: [
    [255, 208, 64],
    [240, 112, 32]
  ],
  boltCore: [255, 244, 200],
  boltEdges: [
    [255, 160, 48],
    [216, 32, 32]
  ],
  thickFilaments: ["#2a1610"]
}

const MEGA_CHARIZARD_X_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#a8ecff", "#2c3c70"],
    ["#5cd0f0", "#1c2648"],
    ["#e8fcff", "#3aa8b8"],
    ["#3aa8b8", "#1c2648"],
    ["#a8ecff", "#1e7080"]
  ],
  swirlFilaments: ["#e8fcff", "#1c2648", "#5cd0f0", "#1c2648"],
  revealRibbons: [
    ["#1c2648", "#5cd0f0"],
    ["#a8ecff", "#1e7080"],
    ["#2c3c70", "#a8ecff"]
  ],
  bands: ["#2c3c70", "#5cd0f0", "#1c2648", "#3aa8b8", "#1e7080", "#a8ecff"],
  bandRim: "#a8ecff",
  orbit: [
    ["#e8fcff", "#5cd0f0"],
    ["#a8ecff", "#2c3c70"],
    ["#e8fcff", "#3aa8b8"]
  ],
  shatterSparks: [0xe8fcff, 0xa8ecff, 0x5cd0f0, 0x3aa8b8],
  lightRays: ["#e8fcff", "#a8ecff", "#5cd0f0", "#c8f4ff", "#3aa8b8"],
  aura: [
    [92, 208, 240],
    [58, 168, 184],
    [28, 38, 72],
    [168, 236, 255]
  ],
  seams: [
    [92, 208, 240],
    [168, 236, 255],
    [58, 168, 184]
  ],
  crack: [232, 252, 255],
  shells: [
    [30, 40, 74],
    [24, 32, 60]
  ],
  halo: [92, 208, 240],
  rim: [58, 168, 184],
  coreCenter: "#e8fcff",
  coreEdge: [
    [92, 208, 240],
    [58, 168, 184]
  ],
  boltCore: [14, 20, 36],
  boltEdges: [
    [92, 208, 240],
    [168, 236, 255]
  ],
  thickFilaments: ["#1c2648"]
}

const MEGA_DARKRAI_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#d080ff", "#4a1080"],
    ["#b040f0", "#140c1c"],
    ["#c81838", "#140c1c"],
    ["#f0e8ff", "#8020c0"],
    ["#b040f0", "#3a0a20"]
  ],
  swirlFilaments: ["#f0e8ff", "#1a1420", "#d080ff", "#1a1420"],
  revealRibbons: [
    ["#b040f0", "#140c1c"],
    ["#c81838", "#140c1c"],
    ["#f0e8ff", "#8020c0"]
  ],
  bands: ["#140c1c", "#b040f0", "#c81838", "#2a1838", "#8020c0", "#f0e8ff"],
  bandRim: "#d080ff",
  orbit: [
    ["#f0e8ff", "#b040f0"],
    ["#ff6080", "#c81838"],
    ["#e0ffff", "#40e0ff"]
  ],
  shatterSparks: [0xf0e8ff, 0xd080ff, 0xb040f0, 0xc81838, 0x40e0ff],
  lightRays: ["#f0e8ff", "#d080ff", "#b040f0", "#ff6080", "#40e0ff"],
  aura: [
    [176, 64, 240],
    [26, 20, 32],
    [200, 24, 56],
    [128, 32, 192]
  ],
  seams: [
    [176, 64, 240],
    [208, 128, 255],
    [200, 24, 56]
  ],
  crack: [248, 236, 255],
  shells: [
    [30, 22, 38],
    [22, 16, 28]
  ],
  halo: [176, 64, 240],
  rim: [128, 32, 192],
  coreCenter: "#f0e8ff",
  coreEdge: [
    [208, 128, 255],
    [200, 24, 56]
  ],
  boltCore: [248, 236, 255],
  boltEdges: [
    [176, 64, 240],
    [208, 128, 255]
  ],
  thickFilaments: ["#1a1420"]
}

const MEGA_DIANCIE_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#ffffff", "#f4a8c8"],
    ["#ffd8e8", "#b05a84"],
    ["#c8b8e8", "#7a5a98"],
    ["#e87aa8", "#8a3a60"],
    ["#b0d8f0", "#5a7aa8"]
  ],
  swirlFilaments: ["#ffffff", "#ffe8f2", "#e8f4ff", "#fff8d8"],
  revealRibbons: [
    ["#ffffff", "#e87aa8"],
    ["#ffd8e8", "#b05a84"],
    ["#c8b8e8", "#7a5a98"]
  ],
  bands: ["#e87aa8", "#ffffff", "#f4a8c8", "#b05a84", "#c8b8e8", "#ffd8e8"],
  bandRim: "#ffffff",
  orbit: [
    ["#ffffff", "#f4a8c8"],
    ["#f4f0ff", "#c8b8e8"],
    ["#fffae0", "#fff0a0"]
  ],
  shatterSparks: [0xffffff, 0xffd8e8, 0xf4a8c8, 0xc8b8e8, 0xb0d8f0, 0xfff0a0],
  lightRays: ["#ffffff", "#ffe8f2", "#ffd8e8", "#e8f4ff", "#fff8d8"],
  aura: [
    [244, 168, 200],
    [255, 255, 255],
    [200, 184, 232],
    [184, 232, 208]
  ],
  seams: [
    [255, 255, 255],
    [255, 216, 232],
    [200, 184, 232],
    [176, 216, 240]
  ],
  crack: [255, 255, 255],
  shells: [
    [176, 90, 132],
    [154, 76, 114],
    [122, 90, 152]
  ],
  halo: [255, 216, 232],
  rim: [232, 122, 168],
  coreCenter: "#ffffff",
  coreEdge: [
    [255, 216, 232],
    [244, 168, 200]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [255, 216, 232],
    [200, 184, 232]
  ]
}

const MEGA_DRAGALGE_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#ff7a80", "#ac3952"],
    ["#c0a8d8", "#36211b"],
    ["#b8d860", "#4a5a28"],
    ["#ca4a53", "#36211b"],
    ["#9a7cb4", "#773f27"]
  ],
  swirlFilaments: ["#ffffff", "#ffb0b8", "#d8f0a0", "#36211b"],
  revealRibbons: [
    ["#ca4a53", "#36211b"],
    ["#9a7cb4", "#36211b"],
    ["#7b9441", "#773f27"]
  ],
  bands: ["#36211b", "#ca4a53", "#9a7cb4", "#773f27", "#7b9441", "#ac3952"],
  bandRim: "#ffb0b8",
  orbit: [
    ["#ffd8dc", "#ca4a53"],
    ["#ece0f8", "#9a7cb4"],
    ["#eef8c8", "#7b9441"]
  ],
  shatterSparks: [0xffffff, 0xffb0b8, 0xca4a53, 0xc0a8d8, 0xb8d860],
  lightRays: ["#ffffff", "#ffd8dc", "#ffb0b8", "#e0d0f0", "#d8f0a0"],
  aura: [
    [202, 74, 83],
    [154, 124, 180],
    [123, 148, 65],
    [139, 82, 65]
  ],
  seams: [
    [255, 122, 128],
    [192, 168, 216],
    [184, 216, 96]
  ],
  crack: [255, 248, 244],
  shells: [
    [70, 42, 34],
    [54, 33, 27],
    [80, 50, 40]
  ],
  halo: [202, 74, 83],
  rim: [154, 124, 180],
  coreCenter: "#ffffff",
  coreEdge: [
    [255, 176, 184],
    [202, 74, 83]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [255, 122, 128],
    [184, 216, 96]
  ],
  thickFilaments: ["#36211b"]
}

const MEGA_DRAMPA_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#f4f4f0", "#8a90a8"],
    ["#30e0b0", "#141830"],
    ["#f4f4f0", "#5a3ab0"],
    ["#50e0f0", "#2a1a6a"],
    ["#f0d840", "#141830"]
  ],
  swirlFilaments: ["#ffffff", "#f4f4f0", "#fff4a0", "#ffffff"],
  revealRibbons: [
    ["#f4f4f0", "#2a1a6a"],
    ["#30e0b0", "#141830"],
    ["#f0d840", "#5a3ab0"]
  ],
  bands: ["#2a1a6a", "#20c8a0", "#f4f4f0", "#141830", "#40d8e0", "#5a3ab0"],
  bandRim: "#f4f4f0",
  orbit: [
    ["#ffffff", "#c8ccd8"],
    ["#d0fff0", "#20c8a0"],
    ["#fff8c0", "#f0d840"]
  ],
  shatterSparks: [0xffffff, 0xf4f4f0, 0x30e0b0, 0xf0d840, 0x50e0f0],
  lightRays: ["#ffffff", "#f4f4f0", "#d0fff0", "#fff8c0", "#50e0f0"],
  aura: [
    [32, 200, 160],
    [64, 216, 224],
    [90, 58, 176],
    [240, 216, 64]
  ],
  seams: [
    [48, 224, 176],
    [80, 224, 240],
    [240, 216, 64]
  ],
  crack: [255, 255, 250],
  shells: [
    [30, 26, 76],
    [24, 22, 60],
    [20, 52, 60]
  ],
  halo: [80, 224, 240],
  rim: [32, 200, 160],
  coreCenter: "#ffffff",
  coreEdge: [
    [80, 224, 240],
    [32, 200, 160]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [48, 224, 176],
    [240, 216, 64]
  ]
}

const MEGA_EELEKTROSS_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#e8f040", "#a0a010"],
    ["#40c8f8", "#122a50"],
    ["#b02a8a", "#122a50"],
    ["#e8f040", "#6a2a8a"],
    ["#c0e8f8", "#1e5a8a"]
  ],
  swirlFilaments: ["#ffffff", "#f8ff90", "#a0e8ff", "#f8ff90"],
  revealRibbons: [
    ["#40c8f8", "#122a50"],
    ["#e8f040", "#6a2a8a"],
    ["#b83a4a", "#122a50"]
  ],
  bands: ["#122a50", "#40c8f8", "#e8f040", "#6a2a8a", "#1e5a8a", "#b02a8a"],
  bandRim: "#a0e8ff",
  orbit: [
    ["#e0f8ff", "#40c8f8"],
    ["#fcffc0", "#e8f040"],
    ["#ffc0e0", "#b02a8a"]
  ],
  shatterSparks: [0xffffff, 0xf8ff90, 0xe8f040, 0x40c8f8, 0xb02a8a],
  lightRays: ["#ffffff", "#f8ff90", "#a0e8ff", "#e8f040", "#c0e8f8"],
  aura: [
    [64, 200, 248],
    [232, 240, 64],
    [176, 42, 138],
    [18, 42, 80]
  ],
  seams: [
    [232, 240, 64],
    [64, 200, 248],
    [248, 255, 144]
  ],
  crack: [252, 255, 230],
  shells: [
    [20, 44, 82],
    [16, 34, 66],
    [56, 30, 80]
  ],
  halo: [64, 200, 248],
  rim: [64, 200, 248],
  coreCenter: "#ffffff",
  coreEdge: [
    [248, 255, 144],
    [64, 200, 248]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [232, 240, 64],
    [248, 255, 144]
  ],
  auraRings: [
    [10, 0.1],
    [6, 0.14],
    [3, 0.2]
  ]
}

const MEGA_EXCADRILL_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#eef2f8", "#8a9098"],
    ["#c8ccd4", "#2a2c32"],
    ["#d82828", "#4a1414"],
    ["#a0603a", "#2a2c32"],
    ["#b8d0e8", "#4a4e58"]
  ],
  swirlFilaments: ["#ffffff", "#2a2c32", "#dce8f4", "#2a2c32"],
  revealRibbons: [
    ["#c8ccd4", "#2a2c32"],
    ["#d82828", "#4a1414"],
    ["#b8d0e8", "#6a4a38"]
  ],
  bands: ["#4a4e58", "#c8ccd4", "#6a4a38", "#2a2c32", "#d82828", "#a0603a"],
  bandRim: "#eef2f8",
  orbit: [
    ["#ffffff", "#8a9098"],
    ["#ffb0a8", "#d82828"],
    ["#eef6ff", "#b8d0e8"]
  ],
  shatterSparks: [0xffffff, 0xdce8f4, 0xc8ccd4, 0xd82828, 0xa0603a],
  lightRays: ["#ffffff", "#eef2f8", "#dce8f4", "#c8ccd4", "#b8d0e8"],
  aura: [
    [200, 204, 212],
    [216, 40, 40],
    [106, 74, 56],
    [184, 208, 232]
  ],
  seams: [
    [216, 40, 40],
    [238, 242, 248],
    [255, 112, 96]
  ],
  crack: [248, 250, 255],
  shells: [
    [58, 60, 68],
    [48, 50, 56],
    [70, 52, 42]
  ],
  halo: [184, 208, 232],
  rim: [200, 204, 212],
  coreCenter: "#ffffff",
  coreEdge: [
    [238, 242, 248],
    [138, 144, 152]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [216, 40, 40],
    [255, 112, 96]
  ],
  thickFilaments: ["#2a2c32"]
}

const MEGA_FERALIGATR_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#e8fcff", "#40c8f0"],
    ["#ff4a50", "#5a0c18"],
    ["#40c8f0", "#102040"],
    ["#2a6ad0", "#102040"],
    ["#f0e090", "#d82838"]
  ],
  swirlFilaments: ["#ffffff", "#a0ecff", "#ffffff", "#ff9a5a"],
  revealRibbons: [
    ["#d82838", "#102040"],
    ["#40c8f0", "#1a6a8a"],
    ["#e8fcff", "#2a6ad0"]
  ],
  bands: ["#1a6a8a", "#d82838", "#40c8f0", "#102040", "#2a6ad0", "#f0e090"],
  bandRim: "#a0ecff",
  orbit: [
    ["#ffffff", "#40c8f0"],
    ["#ffc0b0", "#d82838"],
    ["#fff8d0", "#f0e090"]
  ],
  shatterSparks: [0xffffff, 0xa0ecff, 0x40c8f0, 0xff4a50, 0xf08030],
  lightRays: ["#ffffff", "#a0ecff", "#40c8f0", "#ff7a6a", "#f0e090"],
  aura: [
    [64, 200, 240],
    [216, 40, 56],
    [42, 106, 208],
    [240, 224, 144]
  ],
  seams: [
    [64, 200, 240],
    [160, 236, 255],
    [255, 74, 80]
  ],
  crack: [240, 252, 255],
  shells: [
    [20, 48, 78],
    [16, 38, 64],
    [72, 20, 32]
  ],
  halo: [64, 200, 240],
  rim: [216, 40, 56],
  coreCenter: "#e8fcff",
  coreEdge: [
    [160, 236, 255],
    [42, 106, 208]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [64, 200, 240],
    [255, 74, 80]
  ],
  auraRings: [
    [14, 0.08],
    [10, 0.1],
    [6, 0.14],
    [3, 0.2]
  ]
}

// only its own red, blue and black, kept dark
const MEGA_FLOETTE_ETERNAL_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#ff4a5a", "#5a0c1c"],
    ["#4a8af0", "#10142e"],
    ["#e02040", "#14101a"],
    ["#c8dcff", "#2a5ad8"],
    ["#e02040", "#10142e"]
  ],
  swirlFilaments: ["#e8eeff", "#14101a", "#ff8090", "#14101a"],
  revealRibbons: [
    ["#e02040", "#14101a"],
    ["#2a5ad8", "#10142e"],
    ["#c8dcff", "#5a0c1c"]
  ],
  bands: ["#14101a", "#e02040", "#2a5ad8", "#10142e", "#a01830", "#6ab0ff"],
  bandRim: "#c8dcff",
  orbit: [
    ["#ffc0c8", "#e02040"],
    ["#d8e8ff", "#2a5ad8"],
    ["#ff8090", "#a01830"]
  ],
  shatterSparks: [0xe8eeff, 0xff4a5a, 0xe02040, 0x6ab0ff],
  lightRays: ["#e8eeff", "#ff8090", "#e02040", "#6ab0ff", "#c8dcff"],
  aura: [
    [224, 32, 64],
    [20, 16, 26],
    [42, 90, 216],
    [160, 24, 48]
  ],
  seams: [
    [224, 32, 64],
    [106, 176, 255],
    [255, 74, 90]
  ],
  crack: [240, 244, 255],
  shells: [
    [28, 22, 30],
    [22, 18, 24],
    [20, 24, 52]
  ],
  halo: [224, 32, 64],
  rim: [42, 90, 216],
  coreCenter: "#e8eeff",
  coreEdge: [
    [255, 74, 90],
    [42, 90, 216]
  ],
  boltCore: [240, 244, 255],
  boltEdges: [
    [224, 32, 64],
    [106, 176, 255]
  ],
  thickFilaments: ["#14101a"]
}

const MEGA_GALLADE_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#fff070", "#e0b010"],
    ["#40b8f0", "#14204a"],
    ["#f4f4f8", "#7880b0"],
    ["#ffe020", "#14204a"],
    ["#40b8f0", "#1a3a8a"]
  ],
  swirlFilaments: ["#ffffff", "#fff070", "#80d8ff", "#e03040"],
  revealRibbons: [
    ["#ffe020", "#14204a"],
    ["#40b8f0", "#1a3a8a"],
    ["#f4f4f8", "#e03040"]
  ],
  bands: ["#1a3a8a", "#ffe020", "#40b8f0", "#14204a", "#f4f4f8", "#e03040"],
  bandRim: "#fff070",
  orbit: [
    ["#ffffff", "#ffe020"],
    ["#e0f6ff", "#40b8f0"],
    ["#ffffff", "#e03040"]
  ],
  shatterSparks: [0xffffff, 0xfff070, 0x40b8f0, 0xe03040],
  lightRays: ["#ffffff", "#fff070", "#80d8ff", "#ffe020", "#40c060"],
  aura: [
    [255, 224, 32],
    [64, 184, 240],
    [224, 48, 64],
    [64, 192, 96]
  ],
  seams: [
    [255, 224, 32],
    [64, 184, 240],
    [255, 240, 112]
  ],
  crack: [255, 255, 240],
  shells: [
    [30, 36, 64],
    [24, 28, 52]
  ],
  halo: [128, 216, 255],
  rim: [64, 184, 240],
  coreCenter: "#ffffff",
  coreEdge: [
    [255, 240, 112],
    [64, 184, 240]
  ]
}

const MEGA_GARDEVOIR_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#f4f0ff", "#8a70d8"],
    ["#e050b0", "#2a2a6a"],
    ["#ffe070", "#c040a0"],
    ["#60e0e0", "#2a2a6a"],
    ["#c8b8f0", "#5a3aa0"]
  ],
  swirlFilaments: ["#ffffff", "#ffe070", "#60e0e0", "#f0a0e0"],
  revealRibbons: [
    ["#f4f0ff", "#8a70d8"],
    ["#e050b0", "#2a2a6a"],
    ["#ffe070", "#3ab8b8"]
  ],
  bands: ["#2a2a6a", "#c8b8f0", "#e050b0", "#1a2050", "#3ab8b8", "#f4f0ff"],
  bandRim: "#f4f0ff",
  orbit: [
    ["#ffffff", "#c8b8f0"],
    ["#ffe070", "#e050b0"],
    ["#e0ffff", "#3ab8b8"]
  ],
  shatterSparks: [0xffffff, 0xffe070, 0xe050b0, 0x60e0e0, 0xc8b8f0],
  lightRays: ["#ffffff", "#ffe070", "#f0a0e0", "#60e0e0", "#c8b8f0"],
  aura: [
    [200, 184, 240],
    [224, 80, 176],
    [255, 224, 112],
    [96, 224, 224]
  ],
  seams: [
    [255, 224, 112],
    [96, 224, 224],
    [240, 160, 224]
  ],
  crack: [255, 252, 240],
  shells: [
    [34, 38, 92],
    [28, 30, 76]
  ],
  halo: [200, 184, 240],
  rim: [138, 112, 216],
  coreCenter: "#ffffff",
  coreEdge: [
    [200, 184, 240],
    [96, 224, 224]
  ]
}

const MEGA_GENGAR_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#b797df", "#572f9f"],
    ["#f4ecd8", "#2f1832"],
    ["#d020b0", "#2f1832"],
    ["#8f67bf", "#373f8f"],
    ["#eaeffc", "#674d8a"]
  ],
  swirlFilaments: ["#fffaf0", "#140a16", "#d8c4f0", "#140a16"],
  revealRibbons: [
    ["#eaeffc", "#2f1832"],
    ["#8f67bf", "#140a16"],
    ["#e63e3e", "#532a63"]
  ],
  bands: ["#572f9f", "#f4ecd8", "#9e0983", "#2f1832", "#8f67bf", "#e63e3e"],
  bandRim: "#d8c4f0",
  orbit: [
    ["#f4eeff", "#b797df"],
    ["#f8c8ec", "#9e0983"],
    ["#ffc8a8", "#d73f00"]
  ],
  shatterSparks: [0xfffaf0, 0xd8c4f0, 0xb797df, 0xd020b0, 0xe63e3e, 0xf0d020],
  lightRays: ["#fffaf0", "#eaeffc", "#d8c4f0", "#b797df", "#f8c8ec"],
  aura: [
    [143, 103, 191],
    [158, 9, 131],
    [230, 62, 62],
    [87, 47, 159]
  ],
  seams: [
    [208, 32, 176],
    [183, 151, 223],
    [244, 236, 216],
    [230, 62, 62]
  ],
  crack: [255, 250, 240],
  shells: [
    [64, 42, 86],
    [58, 36, 104],
    [76, 56, 100]
  ],
  halo: [183, 151, 223],
  rim: [143, 103, 191],
  coreCenter: "#fffaf0",
  coreEdge: [
    [234, 239, 252],
    [183, 151, 223]
  ],
  boltCore: [255, 250, 240],
  boltEdges: [
    [208, 32, 176],
    [183, 151, 223]
  ],
  thickFilaments: ["#140a16"],
  auraRings: [
    [14, 0.08],
    [10, 0.1],
    [6, 0.14],
    [3, 0.2]
  ]
}

const MEGA_HOUNDOOM_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#ffc840", "#cf5f2f"],
    ["#ff8f6e", "#241414"],
    ["#e8dcc8", "#241414"],
    ["#cf5f2f", "#241414"],
    ["#fff0c0", "#d82a1a"]
  ],
  swirlFilaments: ["#fff0c0", "#241414", "#ffc0a8", "#241414"],
  revealRibbons: [
    ["#cf5f2f", "#241414"],
    ["#ff8f6e", "#a15c54"],
    ["#e8dcc8", "#241414"]
  ],
  bands: ["#241414", "#cf5f2f", "#5a2a28", "#241414", "#cf5f2f", "#e8dcc8"],
  bandRim: "#ffc0a8",
  orbit: [
    ["#ffe0d4", "#cf5f2f"],
    ["#ffd8c8", "#ff8f6e"],
    ["#fff0c0", "#ffc840"]
  ],
  shatterSparks: [0xfff0c0, 0xffc0a8, 0xcf5f2f, 0xff8f6e, 0xff6a3a, 0xffc840],
  lightRays: ["#fff0c0", "#ffc840", "#ff8f6e", "#ff6a3a", "#ffc0a8"],
  aura: [
    [207, 95, 47],
    [255, 143, 110],
    [58, 28, 28],
    [255, 200, 64]
  ],
  seams: [
    [255, 106, 58],
    [255, 192, 168],
    [255, 143, 110],
    [207, 95, 47]
  ],
  crack: [255, 240, 200],
  shells: [
    [48, 26, 26],
    [38, 20, 20],
    [62, 34, 30]
  ],
  halo: [207, 95, 47],
  rim: [207, 95, 47],
  coreCenter: "#fff0c0",
  coreEdge: [
    [255, 192, 168],
    [207, 95, 47]
  ],
  boltCore: [255, 240, 200],
  boltEdges: [
    [255, 106, 58],
    [255, 143, 110]
  ],
  thickFilaments: ["#241414"],
  auraRings: [
    [14, 0.08],
    [10, 0.1],
    [6, 0.14],
    [3, 0.2]
  ]
}

const MEGA_LATI_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#ff60b0", "#c0106a"],
    ["#7a5ad0", "#1e1450"],
    ["#e4e8f0", "#6a6e88"],
    ["#f0208c", "#1e1450"],
    ["#c8ecf8", "#1a4a48"]
  ],
  swirlFilaments: ["#ffffff", "#ff90c8", "#c8ecf8", "#b8a0f0"],
  revealRibbons: [
    ["#f0208c", "#1e1450"],
    ["#e4e8f0", "#5a3aa8"],
    ["#c8ecf8", "#1a4a48"]
  ],
  bands: ["#5a3aa8", "#f0208c", "#e4e8f0", "#1e1450", "#c8ecf8", "#7a5ad0"],
  bandRim: "#ff90c8",
  orbit: [
    ["#ffd0e8", "#f0208c"],
    ["#ffffff", "#9aa0b8"],
    ["#e8f8ff", "#7a5ad0"]
  ],
  shatterSparks: [0xffffff, 0xc8ecf8, 0xff60b0, 0xb8a0f0],
  lightRays: ["#ffffff", "#e8f8ff", "#ff90c8", "#c8ecf8", "#f0208c"],
  aura: [
    [240, 32, 140],
    [90, 58, 168],
    [200, 236, 248],
    [228, 232, 240]
  ],
  seams: [
    [240, 32, 140],
    [255, 144, 200],
    [200, 236, 248]
  ],
  crack: [250, 252, 255],
  shells: [
    [44, 32, 96],
    [36, 26, 80],
    [26, 58, 60]
  ],
  halo: [240, 32, 140],
  rim: [122, 90, 208],
  coreCenter: "#ffffff",
  coreEdge: [
    [255, 144, 200],
    [200, 236, 248]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [240, 32, 140],
    [200, 236, 248]
  ]
}

const MEGA_LOPUNNY_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#fff79f", "#bf8425"],
    ["#ff60b0", "#241307"],
    ["#d7bf67", "#773f00"],
    ["#e73f67", "#241307"],
    ["#ff9a40", "#a75f1f"]
  ],
  swirlFilaments: ["#fffbe0", "#ff90c8", "#241307", "#fff79f"],
  revealRibbons: [
    ["#e73f67", "#241307"],
    ["#d7bf67", "#773f00"],
    ["#fff79f", "#a75f1f"]
  ],
  bands: ["#773f00", "#d7bf67", "#e73f67", "#241307", "#fff79f", "#a75f1f"],
  bandRim: "#fffbe0",
  orbit: [
    ["#fffbe0", "#d7bf67"],
    ["#ffd0e0", "#e73f67"],
    ["#ffe0c0", "#ff9a40"]
  ],
  shatterSparks: [0xfffbe0, 0xfff79f, 0xd7bf67, 0xff60b0, 0xff9a40],
  lightRays: ["#fffbe0", "#fff79f", "#ff90c8", "#d7bf67", "#ffc080"],
  aura: [
    [215, 191, 103],
    [231, 63, 103],
    [167, 95, 31],
    [255, 247, 159]
  ],
  seams: [
    [255, 247, 159],
    [255, 96, 176],
    [215, 191, 103]
  ],
  crack: [255, 252, 236],
  shells: [
    [54, 32, 14],
    [42, 24, 10],
    [86, 52, 18]
  ],
  halo: [215, 191, 103],
  rim: [231, 63, 103],
  coreCenter: "#fffbe0",
  coreEdge: [
    [255, 247, 159],
    [231, 63, 103]
  ],
  boltCore: [255, 252, 236],
  boltEdges: [
    [255, 247, 159],
    [231, 63, 103]
  ],
  thickFilaments: ["#241307"]
}

const MEGA_LUCARIO_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#a0d8ff", "#2a6ae0"],
    ["#f8d860", "#141a30"],
    ["#60b8f0", "#141a30"],
    ["#e83040", "#5a0c18"],
    ["#2a6ae0", "#141a30"]
  ],
  swirlFilaments: ["#ffffff", "#c8ecff", "#fff0a0", "#c8ecff"],
  revealRibbons: [
    ["#2a6ae0", "#141a30"],
    ["#f8d860", "#c81830"],
    ["#60b8f0", "#1a3a8a"]
  ],
  bands: ["#141a30", "#2a6ae0", "#f8d860", "#1a3a8a", "#c81830", "#60b8f0"],
  bandRim: "#c8ecff",
  orbit: [
    ["#e8f8ff", "#2a6ae0"],
    ["#fff8d0", "#f8d860"],
    ["#e8f8ff", "#60b8f0"]
  ],
  shatterSparks: [0xffffff, 0xc8ecff, 0x60b8f0, 0xf8d860, 0xe83040],
  lightRays: ["#ffffff", "#c8ecff", "#60b8f0", "#fff0a0", "#a0d8ff"],
  aura: [
    [42, 106, 224],
    [96, 184, 240],
    [248, 216, 96],
    [200, 24, 48]
  ],
  seams: [
    [96, 184, 240],
    [160, 216, 255],
    [248, 216, 96]
  ],
  crack: [240, 250, 255],
  shells: [
    [20, 28, 56],
    [16, 22, 46],
    [26, 48, 110]
  ],
  halo: [96, 184, 240],
  rim: [42, 106, 224],
  coreCenter: "#e8f8ff",
  coreEdge: [
    [160, 216, 255],
    [42, 106, 224]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [42, 106, 224],
    [96, 184, 240]
  ],
  auraRings: [
    [10, 0.1],
    [6, 0.14],
    [3, 0.2]
  ]
}

const MEGA_MANECTRIC_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#fff700", "#a76f00"],
    ["#209fe6", "#00305a"],
    ["#9fe7ff", "#0067b7"],
    ["#dfb700", "#00305a"],
    ["#ffffff", "#209fe6"]
  ],
  swirlFilaments: ["#ffffff", "#fffa80", "#9fe7ff", "#ffffff"],
  revealRibbons: [
    ["#fff700", "#00305a"],
    ["#209fe6", "#0067b7"],
    ["#dfb700", "#a76f00"]
  ],
  bands: ["#0067b7", "#fff700", "#209fe6", "#00305a", "#dfb700", "#9fe7ff"],
  bandRim: "#fffa80",
  orbit: [
    ["#ffffff", "#fff700"],
    ["#e0f8ff", "#209fe6"],
    ["#fff4b0", "#dfb700"]
  ],
  shatterSparks: [0xffffff, 0xfffa80, 0xfff700, 0x9fe7ff, 0x209fe6],
  lightRays: ["#ffffff", "#fffa80", "#fff700", "#9fe7ff", "#ffffff"],
  aura: [
    [255, 247, 0],
    [32, 159, 230],
    [223, 183, 0],
    [0, 103, 183]
  ],
  seams: [
    [255, 247, 0],
    [159, 231, 255],
    [32, 159, 230]
  ],
  crack: [255, 255, 230],
  shells: [
    [0, 48, 90],
    [0, 38, 74],
    [0, 66, 122]
  ],
  halo: [255, 247, 0],
  rim: [32, 159, 230],
  coreCenter: "#ffffff",
  coreEdge: [
    [255, 250, 128],
    [32, 159, 230]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [255, 247, 0],
    [159, 231, 255]
  ],
  auraRings: [
    [14, 0.08],
    [10, 0.1],
    [6, 0.14],
    [3, 0.2]
  ]
}

const MEGA_MAWILE_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#ff70b8", "#a01868"],
    ["#40d8b0", "#14302c"],
    ["#f0e0a0", "#1a1418"],
    ["#d02a8a", "#1a1418"],
    ["#80f0d0", "#20a890"]
  ],
  swirlFilaments: ["#ffffff", "#1a1418", "#a0f8e0", "#1a1418"],
  revealRibbons: [
    ["#d02a8a", "#1a1418"],
    ["#40d8b0", "#14302c"],
    ["#f0e0a0", "#4a1a4a"]
  ],
  bands: ["#1a1418", "#d02a8a", "#40d8b0", "#4a1a4a", "#f04aa0", "#20a890"],
  bandRim: "#ffb0d8",
  orbit: [
    ["#ffd0e8", "#f04aa0"],
    ["#d0fff0", "#40d8b0"],
    ["#fff8d8", "#f0e0a0"]
  ],
  shatterSparks: [0xffffff, 0xff70b8, 0x40d8b0, 0xf0e0a0],
  lightRays: ["#ffffff", "#ff90c8", "#80f0d0", "#f0e0a0", "#f04aa0"],
  aura: [
    [208, 42, 138],
    [64, 216, 176],
    [26, 20, 24],
    [240, 74, 160]
  ],
  seams: [
    [240, 74, 160],
    [64, 216, 176],
    [255, 144, 200]
  ],
  crack: [255, 250, 240],
  shells: [
    [36, 28, 34],
    [28, 22, 26],
    [64, 22, 60]
  ],
  halo: [240, 74, 160],
  rim: [64, 216, 176],
  coreCenter: "#ffffff",
  coreEdge: [
    [255, 144, 200],
    [64, 216, 176]
  ],
  boltCore: [255, 250, 240],
  boltEdges: [
    [240, 74, 160],
    [64, 216, 176]
  ],
  thickFilaments: ["#1a1418"]
}

const MEGA_MEDICHAM_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#d080ff", "#7a20b0"],
    ["#f4f4f8", "#3a3a7a"],
    ["#b040e0", "#1e2050"],
    ["#f0b830", "#3a3a7a"],
    ["#e8c8ff", "#b040e0"]
  ],
  swirlFilaments: ["#ffffff", "#e8c8ff", "#a0f0ff", "#ffe0a0"],
  revealRibbons: [
    ["#b040e0", "#1e2050"],
    ["#f4f4f8", "#7a20b0"],
    ["#f0b830", "#3a3a7a"]
  ],
  bands: ["#1e2050", "#b040e0", "#f4f4f8", "#3a3a7a", "#f0b830", "#d080ff"],
  bandRim: "#e8c8ff",
  orbit: [
    ["#f4e0ff", "#b040e0"],
    ["#fff4d0", "#f0b830"],
    ["#e0faff", "#60e0f0"]
  ],
  shatterSparks: [0xffffff, 0xe8c8ff, 0xd080ff, 0xf0b830, 0x60e0f0],
  lightRays: ["#ffffff", "#e8c8ff", "#d080ff", "#ffe0a0", "#a0f0ff"],
  aura: [
    [176, 64, 224],
    [244, 244, 248],
    [240, 184, 48],
    [224, 90, 90]
  ],
  seams: [
    [208, 128, 255],
    [176, 64, 224],
    [240, 184, 48]
  ],
  crack: [252, 248, 255],
  shells: [
    [34, 36, 84],
    [28, 30, 70],
    [52, 34, 96]
  ],
  halo: [208, 128, 255],
  rim: [176, 64, 224],
  coreCenter: "#ffffff",
  coreEdge: [
    [232, 200, 255],
    [176, 64, 224]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [176, 64, 224],
    [208, 128, 255]
  ]
}

const MEGA_MEWTWO_Y_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#f0eaf8", "#b8a8d0"],
    ["#d8a8f0", "#2a1448"],
    ["#c070d8", "#3a1a5a"],
    ["#9a50c8", "#2a1448"],
    ["#e8e0f0", "#7a3a9a"]
  ],
  swirlFilaments: ["#ffffff", "#f0e0ff", "#e0b8f8", "#d8d0e8"],
  revealRibbons: [
    ["#f0eaf8", "#7a3a9a"],
    ["#c070d8", "#2a1448"],
    ["#d8a8f0", "#3a1a5a"]
  ],
  bands: ["#2a1448", "#e8e0f0", "#9a50c8", "#3a1a5a", "#d8a8f0", "#c070d8"],
  bandRim: "#f0eaf8",
  orbit: [
    ["#ffffff", "#b8a8d0"],
    ["#f8e8ff", "#9a50c8"],
    ["#f4e4ff", "#c070d8"]
  ],
  shatterSparks: [0xffffff, 0xf0e0ff, 0xd8a8f0, 0xc070d8],
  lightRays: ["#ffffff", "#f0eaf8", "#e0b8f8", "#d8a8f0", "#c070d8"],
  aura: [
    [184, 168, 208],
    [154, 80, 200],
    [192, 112, 216],
    [216, 168, 240]
  ],
  seams: [
    [216, 168, 240],
    [192, 112, 216],
    [240, 224, 255]
  ],
  crack: [252, 248, 255],
  shells: [
    [42, 22, 70],
    [34, 18, 58],
    [58, 30, 90]
  ],
  halo: [216, 168, 240],
  rim: [154, 80, 200],
  coreCenter: "#ffffff",
  coreEdge: [
    [240, 224, 255],
    [192, 112, 216]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [192, 112, 216],
    [216, 168, 240]
  ]
}

const MEGA_SABLEYE_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#ff5aa8", "#c0185a"],
    ["#ffd060", "#3a2080"],
    ["#f0287a", "#2a1660"],
    ["#30c070", "#1a3a40"],
    ["#ffe890", "#c0185a"]
  ],
  swirlFilaments: ["#ffffff", "#ffe890", "#ff8ac0", "#60e0a0"],
  revealRibbons: [
    ["#f0287a", "#2a1660"],
    ["#ffd060", "#c0185a"],
    ["#30c070", "#3a2080"]
  ],
  bands: ["#c0185a", "#ff5aa8", "#ffd060", "#2a1660", "#f0287a", "#30c070"],
  bandRim: "#ffe890",
  orbit: [
    ["#fff4c0", "#ffd060"],
    ["#ffd0e8", "#f0287a"],
    ["#d0ffe8", "#30c070"]
  ],
  shatterSparks: [0xffffff, 0xffe890, 0xff5aa8, 0x30c070],
  lightRays: ["#ffffff", "#fff4c0", "#ffd060", "#ff8ac0", "#ffe890"],
  aura: [
    [240, 40, 122],
    [255, 208, 96],
    [90, 48, 160],
    [48, 192, 112]
  ],
  seams: [
    [255, 208, 96],
    [255, 232, 144],
    [255, 190, 80]
  ],
  crack: [255, 250, 230],
  shells: [
    [120, 20, 64],
    [96, 16, 56],
    [58, 32, 112]
  ],
  halo: [255, 90, 168],
  rim: [255, 208, 96],
  coreCenter: "#ffffff",
  coreEdge: [
    [255, 232, 144],
    [255, 90, 168]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [255, 208, 96],
    [255, 138, 192]
  ]
}

const MEGA_SKARMORY_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#e9ff00", "#b08600"],
    ["#dee2e6", "#5d6166"],
    ["#ffcc00", "#2a3438"],
    ["#ab6164", "#1c1f23"],
    ["#b7bfc8", "#2e515b"]
  ],
  swirlFilaments: ["#ffffff", "#f4ff80", "#dee2e6", "#1c1f23"],
  revealRibbons: [
    ["#ffcc00", "#2a3438"],
    ["#dee2e6", "#5d6166"],
    ["#ab6164", "#1c1f23"]
  ],
  bands: ["#2a3438", "#ffcc00", "#b7bfc8", "#2e515b", "#e9ff00", "#ab6164"],
  bandRim: "#f4ff80",
  orbit: [
    ["#fbffc0", "#e9ff00"],
    ["#ffffff", "#8a989a"],
    ["#f0d0d0", "#ab6164"]
  ],
  shatterSparks: [0xffffff, 0xf4ff80, 0xffcc00, 0xdee2e6, 0xab6164],
  lightRays: ["#ffffff", "#fbffc0", "#f4ff80", "#dee2e6", "#ffcc00"],
  aura: [
    [255, 204, 0],
    [222, 226, 230],
    [171, 97, 100],
    [46, 81, 91]
  ],
  seams: [
    [233, 255, 0],
    [255, 204, 0],
    [222, 226, 230]
  ],
  crack: [252, 255, 230],
  shells: [
    [42, 52, 56],
    [34, 42, 46],
    [46, 81, 91]
  ],
  halo: [255, 204, 0],
  rim: [233, 255, 0],
  coreCenter: "#ffffff",
  coreEdge: [
    [244, 255, 128],
    [255, 204, 0]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [233, 255, 0],
    [255, 204, 0]
  ],
  thickFilaments: ["#1c1f23"]
}

const MEGA_SLOWBRO_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#60c0f0", "#1a3a7a"],
    ["#f8e840", "#c89a20"],
    ["#f08098", "#c03a5a"],
    ["#a0e080", "#3a7a3a"],
    ["#e0e4ec", "#1a1a3a"]
  ],
  swirlFilaments: ["#ffffff", "#a0e0ff", "#fff480", "#ffc0d0"],
  revealRibbons: [
    ["#60c0f0", "#1a1a3a"],
    ["#f8e840", "#c03a5a"],
    ["#f08098", "#3a7a3a"]
  ],
  bands: ["#c03a5a", "#f08098", "#a0e080", "#1a1a3a", "#f0d870", "#60c0f0"],
  bandRim: "#ffd0dc",
  orbit: [
    ["#e0f6ff", "#60c0f0"],
    ["#fffcc0", "#f8e840"],
    ["#ffe0e8", "#f08098"]
  ],
  shatterSparks: [0xffffff, 0xa0e0ff, 0xf8e840, 0xf08098, 0xa0e080],
  lightRays: ["#ffffff", "#a0e0ff", "#fff480", "#ffc0d0", "#d0f4b8"],
  aura: [
    [240, 128, 152],
    [96, 192, 240],
    [248, 232, 64],
    [160, 224, 128]
  ],
  seams: [
    [96, 192, 240],
    [248, 232, 64],
    [255, 160, 184]
  ],
  crack: [255, 252, 240],
  shells: [
    [40, 34, 74],
    [32, 28, 60],
    [88, 34, 56]
  ],
  halo: [240, 128, 152],
  rim: [96, 192, 240],
  coreCenter: "#ffffff",
  coreEdge: [
    [255, 160, 184],
    [248, 232, 64]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [96, 192, 240],
    [248, 232, 64]
  ]
}

const MEGA_STEELIX_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#cbd1e4", "#616982"],
    ["#008cce", "#1e2448"],
    ["#9c9cb7", "#4f4f4f"],
    ["#30e0f0", "#1e2448"],
    ["#f5f7fa", "#9c9cb7"]
  ],
  swirlFilaments: ["#ffffff", "#cbd1e4", "#c6e7ef", "#ffc7df"],
  revealRibbons: [
    ["#cbd1e4", "#4f4f4f"],
    ["#008cce", "#1e2448"],
    ["#8a5ad8", "#3a3a6a"]
  ],
  bands: ["#616982", "#cbd1e4", "#008cce", "#4f4f4f", "#9c9cb7", "#30e0f0"],
  bandRim: "#f5f7fa",
  orbit: [
    ["#ffffff", "#9c9cb7"],
    ["#d0f0ff", "#008cce"],
    ["#e0fcff", "#30e0f0"]
  ],
  shatterSparks: [0xffffff, 0xcbd1e4, 0x008cce, 0x30e0f0, 0xffc7df],
  lightRays: ["#ffffff", "#f5f7fa", "#c6e7ef", "#cbd1e4", "#a0f4ff"],
  aura: [
    [156, 156, 183],
    [0, 140, 206],
    [48, 224, 240],
    [97, 105, 130]
  ],
  seams: [
    [0, 140, 206],
    [48, 224, 240],
    [203, 209, 228]
  ],
  crack: [240, 252, 255],
  shells: [
    [70, 74, 94],
    [58, 62, 80],
    [79, 79, 79]
  ],
  halo: [48, 224, 240],
  rim: [156, 156, 183],
  coreCenter: "#ffffff",
  coreEdge: [
    [198, 231, 239],
    [0, 140, 206]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [0, 140, 206],
    [48, 224, 240]
  ]
}

const MEGA_TYRANITAR_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#f0f870", "#a8b818"],
    ["#d8e830", "#1a2018"],
    ["#c0dca8", "#3a5a3a"],
    ["#e05090", "#1a2018"],
    ["#d8e830", "#2a4a2a"]
  ],
  swirlFilaments: ["#fbffd0", "#f0f870", "#f0a0c8", "#a080c8"],
  revealRibbons: [
    ["#d8e830", "#1a2018"],
    ["#e05090", "#3a5a3a"],
    ["#c0dca8", "#8060a0"]
  ],
  bands: ["#3a5a3a", "#d8e830", "#e05090", "#1a2018", "#a8c890", "#f0a0c8"],
  bandRim: "#f0f870",
  orbit: [
    ["#fbffd0", "#d8e830"],
    ["#ffd0e8", "#e05090"],
    ["#e0f0d0", "#a8c890"]
  ],
  shatterSparks: [0xfbffd0, 0xf0f870, 0xd8e830, 0xe05090],
  lightRays: ["#fbffd0", "#f0f870", "#d8e830", "#f0a0c8", "#c0dca8"],
  aura: [
    [216, 232, 48],
    [168, 200, 144],
    [224, 80, 144],
    [128, 96, 160]
  ],
  seams: [
    [216, 232, 48],
    [240, 248, 112],
    [224, 80, 144]
  ],
  crack: [252, 255, 220],
  shells: [
    [36, 52, 36],
    [28, 42, 28]
  ],
  halo: [216, 232, 48],
  rim: [168, 184, 24],
  coreCenter: "#fbffd0",
  coreEdge: [
    [216, 232, 48],
    [224, 80, 144]
  ],
  boltCore: [252, 255, 220],
  boltEdges: [
    [216, 232, 48],
    [240, 248, 112]
  ]
}

const MEGA_ZERAORA_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#79eaed", "#12afd9"],
    ["#f2d356", "#ab812e"],
    ["#4bbad9", "#262121"],
    ["#fff6a2", "#41575c"],
    ["#ade6c6", "#262121"]
  ],
  swirlFilaments: ["#ffffff", "#c8f8fa", "#fff6a2", "#262121"],
  revealRibbons: [
    ["#79eaed", "#262121"],
    ["#f2d356", "#41575c"],
    ["#12afd9", "#262121"]
  ],
  bands: ["#262121", "#12afd9", "#f2d356", "#41575c", "#79eaed", "#be8136"],
  bandRim: "#c8f8fa",
  orbit: [
    ["#ffffff", "#79eaed"],
    ["#fffbd8", "#f2d356"],
    ["#e0faf0", "#ade6c6"]
  ],
  shatterSparks: [0xffffff, 0xc8f8fa, 0x79eaed, 0xfff6a2, 0xf2d356],
  lightRays: ["#ffffff", "#c8f8fa", "#79eaed", "#fff6a2", "#ade6c6"],
  aura: [
    [18, 175, 217],
    [242, 211, 86],
    [121, 234, 237],
    [38, 33, 33]
  ],
  seams: [
    [121, 234, 237],
    [18, 175, 217],
    [242, 211, 86]
  ],
  crack: [240, 252, 252],
  shells: [
    [38, 33, 33],
    [59, 58, 58],
    [65, 87, 92]
  ],
  halo: [121, 234, 237],
  rim: [18, 175, 217],
  coreCenter: "#ffffff",
  coreEdge: [
    [200, 248, 250],
    [18, 175, 217]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [121, 234, 237],
    [18, 175, 217]
  ],
  thickFilaments: ["#262121"],
  auraRings: [
    [10, 0.1],
    [6, 0.14],
    [3, 0.2]
  ]
}

const MEGA_ZYGARDE_PALETTE: MegaAnimationPalette = {
  swirlArcs: [
    ["#ff70b8", "#c0106a"],
    ["#b8f840", "#1a1420"],
    ["#60e8ff", "#2a3ab0"],
    ["#f8f060", "#1a1420"],
    ["#ff3a9a", "#4a2090"]
  ],
  swirlFilaments: ["#ffffff", "#b8f840", "#1a1420", "#60e8ff"],
  revealRibbons: [
    ["#ff3a9a", "#1a1420"],
    ["#b8f840", "#2a1428"],
    ["#60e8ff", "#2a3ab0"]
  ],
  bands: ["#2a1428", "#ff3a9a", "#b8f840", "#1a1420", "#60e8ff", "#f8f060"],
  bandRim: "#ffb0d8",
  orbit: [
    ["#ffd0e8", "#ff3a9a"],
    ["#f0ffc0", "#a8f030"],
    ["#e0faff", "#40d8ff"]
  ],
  shatterSparks: [0xffffff, 0xff70b8, 0xb8f840, 0x60e8ff, 0xf8f060],
  lightRays: ["#ffffff", "#ff70b8", "#b8f840", "#60e8ff", "#f8f060"],
  aura: [
    [255, 58, 154],
    [168, 240, 48],
    [64, 216, 255],
    [96, 64, 192]
  ],
  seams: [
    [255, 58, 154],
    [168, 240, 48],
    [255, 112, 184],
    [184, 248, 64]
  ],
  crack: [255, 255, 255],
  shells: [
    [44, 20, 40],
    [34, 16, 32],
    [28, 22, 44]
  ],
  halo: [255, 58, 154],
  rim: [168, 240, 48],
  coreCenter: "#ffffff",
  coreEdge: [
    [255, 112, 184],
    [184, 248, 64]
  ],
  boltCore: [255, 255, 255],
  boltEdges: [
    [64, 216, 255],
    [96, 232, 255]
  ],
  thickFilaments: ["#1a1420"],
  auraRings: [
    [10, 0.1],
    [6, 0.14],
    [3, 0.2]
  ]
}

const PALETTE_BY_MEGA: Partial<Record<Pkm, MegaAnimationPalette>> = {
  [Pkm.MEGA_ABSOL]: MEGA_ABSOL_PALETTE,
  [Pkm.MEGA_AERODACTYL]: MEGA_AERODACTYL_PALETTE,
  [Pkm.MEGA_ALAKAZAM]: MEGA_ALAKAZAM_PALETTE,
  [Pkm.MEGA_ALTARIA]: MEGA_ALTARIA_PALETTE,
  [Pkm.MEGA_BANETTE]: MEGA_BANETTE_PALETTE,
  [Pkm.MEGA_CAMERUPT]: MEGA_CAMERUPT_PALETTE,
  [Pkm.MEGA_CHARIZARD_X]: MEGA_CHARIZARD_X_PALETTE,
  [Pkm.MEGA_DARKRAI]: MEGA_DARKRAI_PALETTE,
  [Pkm.MEGA_DIANCIE]: MEGA_DIANCIE_PALETTE,
  [Pkm.MEGA_DRAGALGE]: MEGA_DRAGALGE_PALETTE,
  [Pkm.MEGA_DRAMPA]: MEGA_DRAMPA_PALETTE,
  [Pkm.MEGA_EELEKTROSS]: MEGA_EELEKTROSS_PALETTE,
  [Pkm.MEGA_EXCADRILL]: MEGA_EXCADRILL_PALETTE,
  [Pkm.MEGA_FERALIGATR]: MEGA_FERALIGATR_PALETTE,
  [Pkm.MEGA_FLOETTE_ETERNAL]: MEGA_FLOETTE_ETERNAL_PALETTE,
  [Pkm.MEGA_GALLADE]: MEGA_GALLADE_PALETTE,
  [Pkm.MEGA_GARDEVOIR]: MEGA_GARDEVOIR_PALETTE,
  [Pkm.MEGA_GENGAR]: MEGA_GENGAR_PALETTE,
  [Pkm.MEGA_HOUNDOOM]: MEGA_HOUNDOOM_PALETTE,
  [Pkm.MEGA_LATIAS]: MEGA_LATI_PALETTE,
  [Pkm.MEGA_LATIOS]: MEGA_LATI_PALETTE,
  [Pkm.MEGA_LOPUNNY]: MEGA_LOPUNNY_PALETTE,
  [Pkm.MEGA_LUCARIO]: MEGA_LUCARIO_PALETTE,
  [Pkm.MEGA_MANECTRIC]: MEGA_MANECTRIC_PALETTE,
  [Pkm.MEGA_MAWILE]: MEGA_MAWILE_PALETTE,
  [Pkm.MEGA_MEDICHAM]: MEGA_MEDICHAM_PALETTE,
  [Pkm.MEGA_MEWTWO_Y]: MEGA_MEWTWO_Y_PALETTE,
  [Pkm.MEGA_SABLEYE]: MEGA_SABLEYE_PALETTE,
  [Pkm.MEGA_SKARMORY]: MEGA_SKARMORY_PALETTE,
  [Pkm.MEGA_SLOWBRO]: MEGA_SLOWBRO_PALETTE,
  [Pkm.MEGA_STEELIX]: MEGA_STEELIX_PALETTE,
  [Pkm.MEGA_TYRANITAR]: MEGA_TYRANITAR_PALETTE,
  [Pkm.MEGA_ZERAORA]: MEGA_ZERAORA_PALETTE,
  [Pkm.MEGA_ZYGARDE]: MEGA_ZYGARDE_PALETTE
}

// the dev button plays it on the regular form, so that form uses its Mega's
function getMegaAnimationPalette(pkm: Pkm): MegaAnimationPalette {
  const mega = PALETTE_BY_MEGA[pkm]
    ? pkm
    : (getPokemonData(pkm).evolution ?? pkm)
  return (
    PALETTE_BY_MEGA[mega] ??
    PALETTE_BY_FAMILY[PkmFamily[pkm]] ??
    DEFAULT_MEGA_PALETTE
  )
}

const PRIMAL_FORMS: Pkm[] = [Pkm.PRIMAL_GROUDON, Pkm.PRIMAL_KYOGRE]

// Megas and Primal Reversions share this animation
export function hasMegaEvolutionAnimation(pkm: Pkm) {
  return pkm.startsWith("MEGA_") || PRIMAL_FORMS.includes(pkm)
}

// the regular form a Mega or Primal comes from, like Kyogre for Primal Kyogre
export function getFormBeforeMegaEvolution(pkm: Pkm): Pkm | undefined {
  if (!hasMegaEvolutionAnimation(pkm)) return undefined
  return Object.values(Pkm).find(
    (other) => getPokemonData(other).evolution === pkm
  )
}

const LIGHT_DIRECTION = [-0.45, -0.55, 0.7]

const PATCH_SEGMENTS = 40
const PATCH_NOISE_SAMPLES = 64
const NB_LATTICE_CELLS = 14
const SHELL_SHADE_STEPS = 6
const SEAM_GLOW_WIDTH = 0.08
const SEAM_CORE_RATIO = 0.4
const SEAM_HALO_BRIGHTNESS = 0.55
// a slow, slight swell, never a flash, for photosensitive players
const SEAM_PULSE_WIDTH = 0.3
const SEAM_PULSE_WIDEN = 1.3
const SEAM_PULSE_LIGHTEN = 0.3
const SEAM_PULSE_SLOW_SWEEPS = 1
const SEAM_PULSE_FAST_SWEEPS = 0.5
const NB_ENERGY_BOLTS = 14
const NB_BOLT_SEGMENTS = 6
const ENERGY_BOLT_WIDTH = 0.032
const BOLT_CORE_RATIO = 0.6
// each bolt strobes on and off in steps of this many ms, like crackling energy
const BOLT_FLICKER_MS = 70
const NB_ORBIT_RIBBONS = 4
const ORBIT_RADIUS = 1.12
const ORBIT_SPEED = 1.4
const SHARD_GAP = 0.05
const SHARD_BORDER_WIDTH = 1.8
const NB_BANDS = 9
const BAND_SPAN: [number, number] = [3.8, 5.4]
const BAND_HALF_WIDTH: [number, number] = [0.12, 0.22]
const BAND_RIM_WIDTH = 2

export type OriginalLook = {
  textureKey: string
  frameName: string | number
  scaleX: number
  scaleY: number
  flipX: boolean
}

type MegaEvolvingSprite = {
  name: string
  scene: Phaser.Scene
  x: number
  y: number
  sprite: GameObjects.Sprite
  shadow?: GameObjects.Sprite
  itemsContainer?: GameObjects.Container
  add(child: GameObjects.GameObject): unknown
  addAt(child: GameObjects.GameObject, index?: number): unknown
  emoteAnimation(): void
}

type GlobePatch = {
  lat: number
  halfWidth: number
  lon: number
  span: number
  color: string
  noise: number[]
}

type ProjectedPoint = { x: number; y: number; z: number }
type PatchRun = { top: ProjectedPoint[]; bottom: ProjectedPoint[] }
type Vector3 = [number, number, number]
// appearAt is the crack progress at which this piece of the bolt shows up
type BoltSegment = {
  from: Vector3
  to: Vector3
  index: number
  appearAt: number
}

type ShellShard = {
  outline: { x: number; y: number }[]
  fill: string
  centreX: number
  centreY: number
  angle: number
  speed: number
  spin: number
}

type LightRay = {
  angle: number
  speed: number
  length: number
  width: number
  color: string
}

type SwirlArc = {
  u: Vector3
  v: Vector3
  radius: number
  length: number
  speed: number
  phase: number
  width: number
  body: string
  edge: string | null
}

type MegaScenery = {
  palette: MegaAnimationPalette
  swirlArcs: SwirlArc[]
  lightRays: LightRay[]
  shards: ShellShard[] | null
  bands: GlobePatch[]
  orbitPatches: GlobePatch[]
  orbitCores: GlobePatch[]
  latticeCells: Vector3[]
  bolts: BoltSegment[]
  latticeCanvas: HTMLCanvasElement
  // the globe's radius in screen pixels, sized to the Pokemon
  radius: number
}

let animationCount = 0

// originalLook is the form before the Mega; left out (the dev test button),
// the Pokemon's current look stands in, and null means there is none to show
export function playMegaEvolutionAnimation(
  pokemon: MegaEvolvingSprite,
  originalLook?: OriginalLook | null
) {
  const { scene, x, y } = pokemon
  const look =
    originalLook === undefined ? lookOf(pokemon.sprite) : originalLook
  const original = look ? createOriginalGhost(pokemon, look) : null
  ensurePixelTexture(scene)
  const animationId = animationCount++
  const textureKey = `mega-evolution-${animationId}`
  const radius = getSphereRadius(pokemon, look)
  const canvasSize = getCanvasSize(radius)
  const canvas = scene.textures.createCanvas(textureKey, canvasSize, canvasSize)
  if (!canvas) return
  canvas.setFilter(Phaser.Textures.FilterMode.NEAREST)
  const image = scene.add
    .image(x, y, textureKey)
    .setScale(PIXEL_SCALE)
    .setDepth(DEPTH.ITEM_FOUND)
  const palette = getMegaAnimationPalette(pokemon.name as Pkm)
  const auraSprites = createOrbAura(pokemon, palette)
  const random = seededRandom(Math.floor(Math.random() * 1e6))
  const scenery: MegaScenery = {
    palette,
    radius,
    swirlArcs: createSwirlArcs(random, palette),
    lightRays: createLightRays(random, palette),
    shards: null,
    bands: createBands(random, palette),
    ...createOrbitRibbons(random, palette),
    latticeCells: createLatticeCells(random),
    bolts: createEnergyBolts(random),
    latticeCanvas: createLatticeCanvas(radius)
  }
  let revealed = false
  let emoted = false

  scene.tweens.addCounter({
    from: 0,
    to: TOTAL_DURATION,
    duration: TOTAL_DURATION,
    onUpdate: (tween) => {
      const time = tween.getValue() ?? 0
      pokemon.sprite.setAlpha(getPokemonAlpha(time))
      pokemon.itemsContainer?.setAlpha(getPokemonAlpha(time))
      const shadowBeforeBurst = original
        ? 1 - updateOriginalGhost(original, time)
        : 0
      pokemon.shadow?.setAlpha(
        time < BURST_START ? shadowBeforeBurst : getPokemonAlpha(time)
      )
      if (time >= BURST_START && !revealed) {
        revealed = true
        burstIntoShatterSparks(scene, x, y, palette)
      }
      // a sprite still loading would drop the emote, so it waits for it
      if (
        revealed &&
        !emoted &&
        pokemon.sprite.texture.key !== LOADING_TEXTURE
      ) {
        emoted = true
        pokemon.emoteAnimation()
      }
      drawFrame(canvas.context, time, scenery)
      canvas.refresh()
      if (pokemon.shadow) {
        updateOrbAura(auraSprites, pokemon.shadow, time, palette)
      }
      setSceneDim(scene, animationId, getSceneDim(time))
    },
    onComplete: () => {
      pokemon.sprite.setAlpha(1)
      pokemon.itemsContainer?.setAlpha(1)
      pokemon.shadow?.setAlpha(1)
      original?.colored.destroy()
      original?.white.destroy()
      image.destroy()
      auraSprites.forEach((auraSprite) => auraSprite.destroy())
      scene.textures.remove(textureKey)
      releaseSceneDim(scene, animationId)
    }
  })
}

// the scene darkens while the globe forms and lights back up as it bursts
function getSceneDim(time: number) {
  if (time < BURST_START) {
    const fadeIn = (time - SPHERE_START) / SCENE_DIM_IN_DURATION
    return clamp01(fadeIn) * SCENE_DIM_MAX
  }
  const fadeOut = (time - BURST_START) / SCENE_DIM_OUT_DURATION
  return (1 - clamp01(fadeOut)) * SCENE_DIM_MAX
}

// one veil per scene, shared by Megas evolving together so they never stack;
// it sits above the weather and below the animation
const sceneDimmers = new WeakMap<
  Phaser.Scene,
  { veil: GameObjects.Rectangle; levels: Map<number, number> }
>()

function setSceneDim(scene: Phaser.Scene, animationId: number, level: number) {
  let dimmer = sceneDimmers.get(scene)
  if (!dimmer) {
    const { width, height } = scene.scale
    const veil = scene.add
      .rectangle(width / 2, height / 2, width * 3, height * 3, 0x000000)
      .setScrollFactor(0)
      .setDepth(DEPTH.WEATHER_FX + 1)
      .setAlpha(0)
    dimmer = { veil, levels: new Map() }
    sceneDimmers.set(scene, dimmer)
  }
  dimmer.levels.set(animationId, level)
  dimmer.veil.setAlpha(Math.max(...dimmer.levels.values()))
}

function releaseSceneDim(scene: Phaser.Scene, animationId: number) {
  const dimmer = sceneDimmers.get(scene)
  if (!dimmer) return
  dimmer.levels.delete(animationId)
  if (dimmer.levels.size > 0) {
    dimmer.veil.setAlpha(Math.max(...dimmer.levels.values()))
    return
  }
  dimmer.veil.destroy()
  sceneDimmers.delete(scene)
}

function burstIntoShatterSparks(
  scene: Phaser.Scene,
  x: number,
  y: number,
  palette: MegaAnimationPalette
) {
  const shards = scene.add
    .particles(x, y, PIXEL_TEXTURE, {
      speed: { min: 50, max: 150 },
      lifespan: { min: 350, max: 700 },
      scale: { start: PIXEL_SCALE * 1.5, end: 0 },
      tint: palette.shatterSparks,
      emitting: false
    })
    .setDepth(DEPTH.ITEM_FOUND + 2)
  shards.explode(18)
  scene.time.delayedCall(800, () => shards.destroy())
}

export function lookOf(sprite: GameObjects.Sprite): OriginalLook {
  return {
    textureKey: sprite.texture.key,
    frameName: sprite.frame.name,
    scaleX: sprite.scaleX,
    scaleY: sprite.scaleY,
    flipX: sprite.flipX
  }
}

// fits the bigger form's trimmed frame; even, so canvas sizes stay whole
function getSphereRadius(
  pokemon: MegaEvolvingSprite,
  look: OriginalLook | null
) {
  const { sprite, scene } = pokemon
  if (SCALE_SIZED_FAMILIES.includes(PkmFamily[pokemon.name as Pkm])) {
    const scaled = MIN_SPHERE_RADIUS * (Math.abs(sprite.scaleY) / BASE_SCALE)
    return toSphereRadius(scaled)
  }
  const sizes = [
    Math.max(sprite.frame.cutWidth, sprite.frame.cutHeight) *
      Math.abs(sprite.scaleY)
  ]
  if (look && scene.textures.exists(look.textureKey)) {
    const frame = scene.textures.getFrame(look.textureKey, look.frameName)
    if (frame) {
      sizes.push(
        Math.max(frame.cutWidth, frame.cutHeight) * Math.abs(look.scaleY)
      )
    }
  }
  return toSphereRadius(Math.max(...sizes) * SPHERE_TO_SPRITE_RATIO)
}

function toSphereRadius(radius: number) {
  const even = Math.round(radius / PIXEL_SCALE) * PIXEL_SCALE
  return Math.min(MAX_SPHERE_RADIUS, Math.max(MIN_SPHERE_RADIUS, even))
}

// three radii of room on each side for the swirl, ribbons and burst
const getCanvasSize = (radius: number) => (radius * 6) / PIXEL_SCALE
const getLatticeSize = (radius: number) => (radius * 2) / PIXEL_SCALE

type OriginalGhost = {
  colored: GameObjects.Sprite
  white: GameObjects.Sprite
  scaleX: number
  scaleY: number
}

// the form before the Mega, rebuilt from its last look, with a white copy over
// it so it can turn white before it shrinks away into the globe
function createOriginalGhost(
  pokemon: MegaEvolvingSprite,
  look: OriginalLook
): OriginalGhost | null {
  if (look.textureKey === LOADING_TEXTURE) return null
  const [colored, white] = [false, true].map((isWhite) => {
    const ghost = new GameObjects.Sprite(
      pokemon.scene,
      pokemon.sprite.x,
      pokemon.sprite.y,
      look.textureKey,
      look.frameName
    )
      .setScale(look.scaleX, look.scaleY)
      .setFlipX(look.flipX)
    if (isWhite) {
      ghost.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL).setAlpha(0)
    }
    pokemon.add(ghost)
    return ghost
  })
  return { colored, white, scaleX: look.scaleX, scaleY: look.scaleY }
}

// turns white first, then shrinks and fades; returns how far it has vanished
function updateOriginalGhost(ghost: OriginalGhost, time: number) {
  const progress = clamp01(time / ORIGINAL_VANISH_DURATION)
  const whiten = clamp01(progress / 0.4)
  const vanish = easeInOut(clamp01((progress - 0.3) / 0.7))
  const shrink = 1 - 0.15 * vanish
  for (const layer of [ghost.colored, ghost.white]) {
    layer.setScale(ghost.scaleX * shrink, ghost.scaleY * shrink)
  }
  ghost.colored.setAlpha(1 - whiten)
  ghost.white.setAlpha(whiten * (1 - vanish))
  return vanish
}

// the Mega's sprite is already in place when the animation starts, so it
// stays hidden until the shell bursts, then fades in
function getPokemonAlpha(time: number) {
  if (time < BURST_START) return 0
  const fadeIn = clamp01((time - BURST_START) / POKEMON_FADE_IN_DURATION)
  return 1 - (1 - fadeIn) * (1 - fadeIn)
}

function orbAuraColor(position: number, colors: Rgb[]) {
  const scaled = (((position % 1) + 1) % 1) * colors.length
  const index = Math.floor(scaled)
  const blend = scaled - index
  const from = colors[index]
  const to = colors[(index + 1) % colors.length]
  return from.map((channel, i) => channel + (to[i] - channel) * blend)
}

function ensurePixelTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(PIXEL_TEXTURE)) return
  const pixel = scene.textures.createCanvas(PIXEL_TEXTURE, 1, 1)
  if (!pixel) return
  pixel.context.fillStyle = "#ffffff"
  pixel.context.fillRect(0, 0, 1, 1)
  pixel.setFilter(Phaser.Textures.FilterMode.NEAREST)
  pixel.refresh()
}

function seededRandom(seed: number) {
  let state = seed % 2147483647 || 1
  return () => {
    state = (state * 16807) % 2147483647
    return state / 2147483647
  }
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

function easeInOut(value: number) {
  return value * value * (3 - 2 * value)
}

function createPatches(
  random: () => number,
  count: number,
  colors: string[],
  spanRange: [number, number],
  widthRange: [number, number]
): GlobePatch[] {
  return Array.from({ length: count }, () => ({
    lat: -1.2 + random() * 2.4,
    halfWidth: widthRange[0] + random() * (widthRange[1] - widthRange[0]),
    lon: random() * Math.PI * 2,
    span: spanRange[0] + random() * (spanRange[1] - spanRange[0]),
    color: colors[Math.floor(random() * colors.length)],
    noise: Array.from({ length: PATCH_NOISE_SAMPLES }, () => random())
  }))
}

// a bright core shares each ribbon's torn noise, so it runs along its middle
function createOrbitRibbons(
  random: () => number,
  palette: MegaAnimationPalette
) {
  const ribbons = createPatches(
    random,
    NB_ORBIT_RIBBONS,
    palette.orbit.map(([, outer]) => outer),
    [1.6, 2.4],
    [0.07, 0.11]
  )
  const colorPairs = ribbons.map(
    (_, i) => palette.orbit[i % palette.orbit.length]
  )
  return {
    orbitPatches: ribbons.map((ribbon, i) => ({
      ...ribbon,
      color: colorPairs[i][1]
    })),
    orbitCores: ribbons.map((ribbon, i) => ({
      ...ribbon,
      halfWidth: ribbon.halfWidth * 0.4,
      color: colorPairs[i][0]
    }))
  }
}

// long bands spread evenly from pole to pole, so they read as stripes
function createBands(
  random: () => number,
  palette: MegaAnimationPalette
): GlobePatch[] {
  return createPatches(
    random,
    NB_BANDS,
    palette.bands,
    BAND_SPAN,
    BAND_HALF_WIDTH
  ).map((band, i) => ({
    ...band,
    lat: -1.15 + (2.3 * i) / (NB_BANDS - 1) + (random() - 0.5) * 0.08
  }))
}

function createLatticeCanvas(radius: number) {
  const canvas = document.createElement("canvas")
  canvas.width = getLatticeSize(radius)
  canvas.height = getLatticeSize(radius)
  return canvas
}

// short zigzag bolts scattered over the globe, each step turning sharply the
// other way like lightning; they grow piece by piece, each at its own pace
function createEnergyBolts(random: () => number): BoltSegment[] {
  const segments: BoltSegment[] = []
  for (let index = 0; index < NB_ENERGY_BOLTS; index++) {
    const height = random() * 2 - 1
    const ringRadius = Math.sqrt(1 - height * height)
    const angle = random() * Math.PI * 2
    let point: Vector3 = [
      Math.cos(angle) * ringRadius,
      height,
      Math.sin(angle) * ringRadius
    ]
    let heading = normalize(
      cross(point, [random() - 0.5, random() - 0.5, random() - 0.5])
    )
    // every piece shows up before the burst: 0.4 + 5 steps × 0.1 < 1
    const start = random() * 0.4
    const pace = 0.06 + random() * 0.04
    for (let step = 0; step < NB_BOLT_SEGMENTS; step++) {
      // hard turns and straight runs, so it reads as lightning, not a worm
      const turn = (step % 2 === 0 ? 1 : -1) * (0.9 + random() * 0.4)
      const side = cross(point, heading)
      heading = heading.map(
        (value, axis) => value * Math.cos(turn) + side[axis] * Math.sin(turn)
      ) as Vector3
      const length = 0.1 + random() * 0.08
      const next = normalize(
        point.map((value, axis) => value + heading[axis] * length) as Vector3
      )
      segments.push({
        from: point,
        to: next,
        index,
        appearAt: start + step * pace
      })
      heading = normalize(cross(cross(next, heading), next))
      point = next
    }
  }
  return segments
}

// evenly spread cell centres (a jittered Fibonacci sphere)
function createLatticeCells(random: () => number): Vector3[] {
  return Array.from({ length: NB_LATTICE_CELLS }, (_, i) => {
    const height =
      1 - ((i + 0.5) / NB_LATTICE_CELLS) * 2 + (random() - 0.5) * 0.15
    const ringRadius = Math.sqrt(Math.max(0, 1 - height * height))
    const angle = i * 2.39996 + (random() - 0.5) * 0.5
    return [
      Math.cos(angle) * ringRadius,
      height,
      Math.sin(angle) * ringRadius
    ]
  })
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  time: number,
  scenery: MegaScenery
) {
  const canvasSize = getCanvasSize(scenery.radius)
  ctx.clearRect(0, 0, canvasSize, canvasSize)
  ctx.save()
  ctx.scale(1 / PIXEL_SCALE, 1 / PIXEL_SCALE)
  ctx.translate(scenery.radius * 3, scenery.radius * 3)
  if (time < BURST_START) {
    drawSwirl(ctx, time, scenery, false)
    drawSphere(ctx, time, scenery)
    drawSwirl(ctx, time, scenery, true)
  }
  drawLightRays(ctx, time, scenery)
  drawShatteredShell(ctx, time, scenery)
  drawRevealRibbons(ctx, time, scenery)
  ctx.restore()
  snapAlphaToSteps(ctx, canvasSize)
}

// hard alpha steps instead of smooth fades, like hand-made pixel art
function snapAlphaToSteps(ctx: CanvasRenderingContext2D, canvasSize: number) {
  const image = ctx.getImageData(0, 0, canvasSize, canvasSize)
  const { data } = image
  for (let i = 3; i < data.length; i += 4) {
    const alpha = data[i]
    data[i] = alpha < 40 ? 0 : alpha < 120 ? 96 : alpha < 200 ? 176 : 255
  }
  ctx.putImageData(image, 0, 0)
}

function drawBrushArc(
  ctx: CanvasRenderingContext2D,
  radius: number,
  from: number,
  length: number,
  body: string,
  edge: string,
  width: number
) {
  ctx.lineCap = "round"
  for (let layer = 0; layer < 3; layer++) {
    const taper = layer * 0.22
    const start = from + taper
    const end = from + length - taper * 1.5
    const lineWidth = width + 3 - layer * 3
    if (end <= start || lineWidth <= 0) continue
    ctx.strokeStyle = layer === 0 ? edge : body
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    ctx.arc(0, 0, radius, start, end)
    ctx.stroke()
  }
}

// orbit planes spread evenly over every direction (a jittered Fibonacci
// sphere of plane normals), so no side of the ball gets heavier
function createOrbitBases(random: () => number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const height = 1 - ((i + 0.5) / count) * 2
    const ring = Math.sqrt(Math.max(0, 1 - height * height))
    const azimuth = i * 2.39996 + random() * 0.4
    const normal: Vector3 = [
      Math.cos(azimuth) * ring,
      height,
      Math.sin(azimuth) * ring
    ]
    const helper: Vector3 = Math.abs(normal[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
    const u = normalize(cross(normal, helper))
    return { u, v: cross(normal, u) }
  })
}

// Rasengan-like: thin arcs and hairline filaments circle the ball in every
// direction, plus a few wide outer sweeps
function createSwirlArcs(
  random: () => number,
  palette: MegaAnimationPalette
): SwirlArc[] {
  const total = NB_INNER_SWIRL_ARCS + NB_OUTER_SWIRL_ARCS
  const arcs = createOrbitBases(random, total).map(({ u, v }, i) => {
    const isOuter = i >= NB_INNER_SWIRL_ARCS
    const [body, edge] = palette.swirlArcs[i % palette.swirlArcs.length]
    return {
      u,
      v,
      radius: isOuter ? 1.5 + random() * 0.4 : 1.05 + random() * 0.15,
      length: isOuter ? 1.6 + random() * 0.8 : 1.2 + random() * 1.1,
      speed: 5 + random() * 3,
      phase: random() * Math.PI * 2,
      width: isOuter ? 2 : 2.5 + random(),
      body,
      edge
    }
  })
  const filaments = createOrbitBases(random, NB_SWIRL_FILAMENTS).map(
    ({ u, v }, i) => {
      const body = palette.swirlFilaments[i % palette.swirlFilaments.length]
      const thick = palette.thickFilaments?.includes(body) ?? false
      return {
        u,
        v,
        radius: 1 + random() * 0.3,
        length: 0.6 + random() * 1.2,
        speed: 7 + random() * 4,
        phase: random() * Math.PI * 2,
        width: thick ? 3.5 : 2,
        body,
        edge: null
      }
    }
  )
  return [...filaments, ...arcs]
}

function cross(a: Vector3, b: Vector3): Vector3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ]
}

function normalize(vector: Vector3): Vector3 {
  const length = Math.hypot(...vector) || 1
  return [vector[0] / length, vector[1] / length, vector[2] / length]
}

// grows and shrinks by length and width: the pixel alpha steps would make a
// fade choppy
function drawSwirl(
  ctx: CanvasRenderingContext2D,
  time: number,
  scenery: MegaScenery,
  front: boolean
) {
  const unwind = easeInOut(clamp01((time - DARKEN_START) / DARKEN_DURATION))
  if (unwind >= 1) return
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  scenery.swirlArcs.forEach((arc, i) => {
    const age = time - (i % NB_INNER_SWIRL_ARCS) * SWIRL_STAGGER
    const grow = 1 - (1 - clamp01(age / SWIRL_GROW_DURATION)) ** 2
    if (grow <= 0) return
    const settle = easeInOut(clamp01(age / SWIRL_DURATION))
    const radius = scenery.radius * arc.radius * (0.7 + 0.3 * settle)
    const length = arc.length * grow * (1 - unwind)
    const width = arc.width * (0.4 + 0.6 * grow) * (1 - unwind)
    if (length <= 0 || width <= 0) return
    const start = arc.phase + (time / 1000) * arc.speed
    const runs: { x: number; y: number }[][] = []
    let run: { x: number; y: number }[] | null = null
    for (let k = 0; k <= SWIRL_ARC_SEGMENTS; k++) {
      const angle = start - (length * k) / SWIRL_ARC_SEGMENTS
      const point = arc.u.map(
        (value, axis) =>
          (value * Math.cos(angle) + arc.v[axis] * Math.sin(angle)) * radius
      )
      if (point[2] >= 0 !== front) {
        run = null
        continue
      }
      if (!run) {
        run = []
        runs.push(run)
      }
      run.push({ x: point[0], y: point[1] })
    }
    const layers = arc.edge ? [arc.edge, arc.body] : [arc.body]
    for (const [layer, color] of layers.entries()) {
      ctx.strokeStyle = color
      ctx.lineWidth = width + (layers.length - 1 - layer) * 2
      for (const points of runs) {
        if (points.length < 2) continue
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        for (const point of points.slice(1)) ctx.lineTo(point.x, point.y)
        ctx.stroke()
      }
    }
  })
}

// a point on the tilted globe, seen from the front: z < 0 faces away
function projectOnGlobe(lat: number, lon: number, r: number): ProjectedPoint {
  const x = Math.cos(lat) * Math.sin(lon)
  const y = -Math.sin(lat)
  const z = Math.cos(lat) * Math.cos(lon)
  const pitchedY = y * Math.cos(GLOBE_PITCH) - z * Math.sin(GLOBE_PITCH)
  const pitchedZ = y * Math.sin(GLOBE_PITCH) + z * Math.cos(GLOBE_PITCH)
  return {
    x: (x * Math.cos(GLOBE_ROLL) - pitchedY * Math.sin(GLOBE_ROLL)) * r,
    y: (x * Math.sin(GLOBE_ROLL) + pitchedY * Math.cos(GLOBE_ROLL)) * r,
    z: pitchedZ
  }
}

function getPatchRuns(
  patch: GlobePatch,
  r: number,
  time: number,
  front: boolean,
  spanScale: number
): PatchRun[] {
  const start = patch.lon + (time / 1000) * GLOBE_SPIN_PER_SECOND
  const runs: PatchRun[] = []
  let run: PatchRun | null = null
  for (let k = 0; k <= PATCH_SEGMENTS; k++) {
    const progress = k / PATCH_SEGMENTS
    const lon = start + patch.span * spanScale * progress
    const facesViewer = projectOnGlobe(patch.lat, lon, r).z >= 0
    if (facesViewer !== front) {
      run = null
      continue
    }
    const taper = Math.pow(Math.sin(Math.PI * progress), 0.35)
    const tearStrength = (0.3 + (1 - taper) * 0.9) * 0.6
    const tearTop = (patch.noise[k % PATCH_NOISE_SAMPLES] - 0.5) * tearStrength
    const tearBottom =
      (patch.noise[(k + 30) % PATCH_NOISE_SAMPLES] - 0.5) * tearStrength
    const top = patch.halfWidth * Math.max(0, taper + tearTop)
    const bottom = patch.halfWidth * Math.max(0, taper + tearBottom)
    if (!run) {
      run = { top: [], bottom: [] }
      runs.push(run)
    }
    run.top.push(projectOnGlobe(patch.lat + top, lon, r))
    run.bottom.push(projectOnGlobe(patch.lat - bottom, lon, r))
  }
  return runs.filter((patchRun) => patchRun.top.length > 1)
}

function drawPatches(
  ctx: CanvasRenderingContext2D,
  patches: GlobePatch[],
  r: number,
  time: number,
  front: boolean,
  alpha: number,
  rimWidth = 0,
  spanScale = 1,
  rimColor = "#ffffff"
) {
  if (alpha <= 0 || spanScale <= 0) return
  ctx.globalAlpha = alpha
  ctx.lineJoin = "round"
  for (const patch of patches) {
    const runs = getPatchRuns(patch, r, time, front, spanScale)
    for (const { top, bottom } of runs) {
      ctx.beginPath()
      ctx.moveTo(top[0].x, top[0].y)
      for (let i = 1; i < top.length; i++) ctx.lineTo(top[i].x, top[i].y)
      for (let i = bottom.length - 1; i >= 0; i--) {
        ctx.lineTo(bottom[i].x, bottom[i].y)
      }
      ctx.closePath()
      ctx.fillStyle = patch.color
      ctx.fill()
      if (rimWidth > 0) {
        ctx.strokeStyle = rimColor
        ctx.lineWidth = rimWidth
        ctx.stroke()
      }
    }
  }
  ctx.globalAlpha = 1
}

function drawOrbitRibbons(
  ctx: CanvasRenderingContext2D,
  scenery: MegaScenery,
  r: number,
  time: number,
  front: boolean,
  alpha: number
) {
  const radius = r * ORBIT_RADIUS
  for (const ribbons of [scenery.orbitPatches, scenery.orbitCores]) {
    drawPatches(ctx, ribbons, radius, time * ORBIT_SPEED, front, alpha)
  }
}

function drawSphere(
  ctx: CanvasRenderingContext2D,
  time: number,
  scenery: MegaScenery
) {
  const form = easeInOut(
    clamp01((time - SPHERE_START) / SPHERE_FORM_DURATION)
  )
  if (form <= 0) return
  const r = scenery.radius
  const dark = easeInOut(clamp01((time - DARKEN_START) / DARKEN_DURATION))

  const halo = ctx.createRadialGradient(0, 0, r * 0.85, 0, 0, r * 1.35)
  const { halo: haloColor, rim: rimColor } = scenery.palette
  halo.addColorStop(0, `rgba(${haloColor},${0.4 * form * (1 - dark)})`)
  halo.addColorStop(1, `rgba(${haloColor},0)`)
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2)
  ctx.fill()
  // the far side of the ribbons, dimmed, so they wrap around the shell
  drawOrbitRibbons(ctx, scenery, r, time, false, dark * 0.45)
  // while the light closes in from the rim, a soft heart glows in the middle,
  // so the ribbons never wind around empty ground
  if (form < 1) {
    const heart = ctx.createRadialGradient(0, 0, 0, 0, 0, r)
    heart.addColorStop(0, scenery.palette.coreCenter)
    heart.addColorStop(1, "rgba(255,255,255,0)")
    ctx.globalAlpha = 0.75 * (0.4 + 0.6 * form)
    ctx.fillStyle = heart
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.clip()
  if (form < 1) {
    ctx.beginPath()
    ctx.arc(0, 0, r * (1 - form), 0, Math.PI * 2)
    ctx.rect(-r, -r, r * 2, r * 2)
    ctx.clip("evenodd")
  }
  drawGlowingCore(ctx, r, time, scenery.palette)
  if (dark > 0) drawLatticeShell(ctx, r, time, dark, scenery)
  ctx.restore()
  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.clip()
  const lightLeft = 1 - dark
  drawPatches(ctx, scenery.bands, r, time, false, 0.3 * lightLeft, 0, form)
  drawPatches(
    ctx,
    scenery.bands,
    r,
    time,
    true,
    0.9 * lightLeft,
    BAND_RIM_WIDTH,
    form,
    scenery.palette.bandRim
  )
  ctx.restore()
  drawOrbitRibbons(ctx, scenery, r, time, true, dark)

  ctx.strokeStyle = `rgba(${rimColor},${(0.8 - dark * 0.5) * form})`
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.stroke()
}

function drawGlowingCore(
  ctx: CanvasRenderingContext2D,
  r: number,
  time: number,
  palette: MegaAnimationPalette
) {
  const drift = (Math.sin(time / 260) + 1) / 2
  const [from, to] = palette.coreEdge
  const edge = from.map((channel, i) =>
    Math.round(channel + (to[i] - channel) * drift)
  )
  const core = ctx.createRadialGradient(-r * 0.25, -r * 0.2, r * 0.05, 0, 0, r)
  core.addColorStop(0, palette.coreCenter)
  core.addColorStop(0.45, palette.coreCenter)
  core.addColorStop(1, `rgb(${edge})`)
  ctx.fillStyle = core
  ctx.fillRect(-r, -r, r * 2, r * 2)
}

// the screen point (x, y) of the unit globe, back in the spinning globe's own
// coordinates, so the lattice turns with the patches
function unprojectFromGlobe(x: number, y: number, spin: number): Vector3 {
  const z = Math.sqrt(1 - x * x - y * y)
  const unrolledX = x * Math.cos(GLOBE_ROLL) + y * Math.sin(GLOBE_ROLL)
  const unrolledY = -x * Math.sin(GLOBE_ROLL) + y * Math.cos(GLOBE_ROLL)
  const globeY =
    unrolledY * Math.cos(GLOBE_PITCH) + z * Math.sin(GLOBE_PITCH)
  const globeZ =
    -unrolledY * Math.sin(GLOBE_PITCH) + z * Math.cos(GLOBE_PITCH)
  return [
    unrolledX * Math.cos(spin) - globeZ * Math.sin(spin),
    globeY,
    unrolledX * Math.sin(spin) + globeZ * Math.cos(spin)
  ]
}

// the two closest cells; a small gap between them means a seam
function findClosestCells(point: Vector3, cells: Vector3[]) {
  let closest = { index: 0, dot: -2 }
  let secondClosest = { index: 0, dot: -2 }
  cells.forEach((cell, index) => {
    const dot = point[0] * cell[0] + point[1] * cell[1] + point[2] * cell[2]
    if (dot > closest.dot) {
      secondClosest = closest
      closest = { index, dot }
    } else if (dot > secondClosest.dot) {
      secondClosest = { index, dot }
    }
  })
  return {
    closestIndex: closest.index,
    seamDistance: closest.dot - secondClosest.dot,
    // the same pair of cells always picks the same seam colour
    seamHash: closest.index * 7 + secondClosest.index * 13
  }
}

// the closest bolt piece already grown in, measured straight through the globe
function findClosestBolt(
  point: Vector3,
  segments: BoltSegment[],
  crack: number,
  flickerFrame: number
) {
  let distance = Infinity
  let index = 0
  for (const segment of segments) {
    if (segment.appearAt > crack) continue
    // each bolt is lit about 2 frames in 5, on its own rhythm
    if ((flickerFrame * 3 + segment.index * 7) % 5 >= 2) continue
    const { from, to } = segment
    const segmentX = to[0] - from[0]
    const segmentY = to[1] - from[1]
    const segmentZ = to[2] - from[2]
    const offsetX = point[0] - from[0]
    const offsetY = point[1] - from[1]
    const offsetZ = point[2] - from[2]
    const along = clamp01(
      (offsetX * segmentX + offsetY * segmentY + offsetZ * segmentZ) /
        (segmentX * segmentX + segmentY * segmentY + segmentZ * segmentZ)
    )
    const segmentDistance = Math.hypot(
      offsetX - segmentX * along,
      offsetY - segmentY * along,
      offsetZ - segmentZ * along
    )
    if (segmentDistance < distance) {
      distance = segmentDistance
      index = segment.index
    }
  }
  return { distance, index }
}

function getShellLight(x: number, y: number) {
  const z = Math.sqrt(1 - x * x - y * y)
  return clamp01(
    x * LIGHT_DIRECTION[0] + y * LIGHT_DIRECTION[1] + z * LIGHT_DIRECTION[2]
  )
}

// computed per pixel at the final pixel size, so the seams stay crisp
function drawLatticeShell(
  ctx: CanvasRenderingContext2D,
  r: number,
  time: number,
  dark: number,
  scenery: MegaScenery
) {
  const size = getLatticeSize(scenery.radius)
  const { latticeCanvas, latticeCells, palette } = scenery
  const latticeContext = latticeCanvas.getContext("2d")
  if (!latticeContext) return
  const image = latticeContext.createImageData(size, size)
  const { data } = image
  const spin = (time / 1000) * GLOBE_SPIN_PER_SECOND
  const glow = clamp01((time - DARKEN_START - 100) / 300)
  const crack = clamp01((time - CRACK_START) / CRACK_DURATION)
  const glowWidth =
    SEAM_GLOW_WIDTH * glow * (1 - clamp01((crack - 0.3) / 0.5))
  const crackWidth = 0.022 + Math.pow(clamp01((crack - 0.7) / 0.3), 2) * 0.35
  const flickerFrame = Math.floor(time / BOLT_FLICKER_MS)
  const pulseY = getSeamPulseY(time)
  const half = size / 2
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const x = (column + 0.5 - half) / half
      const y = (row + 0.5 - half) / half
      if (x * x + y * y > 1) continue
      const point = unprojectFromGlobe(x, y, spin)
      const { closestIndex, seamDistance, seamHash } = findClosestCells(
        point,
        latticeCells
      )
      const seamColor = palette.seams[seamHash % palette.seams.length]
      const shellColor = palette.shells[closestIndex % palette.shells.length]
      const puffiness = 0.55 + 0.45 * clamp01(seamDistance / 0.35)
      const shade = (0.35 + 0.65 * getShellLight(x, y)) * puffiness
      // flat steps instead of smooth gradients, like the rest of the pixel art
      const steppedShade =
        Math.max(1, Math.ceil(shade * SHELL_SHADE_STEPS)) / SHELL_SHADE_STEPS
      let color = shellColor.map((channel) => channel * steppedShade)
      // before the burst, small energy bolts crack across the plates
      if (crack > 0) {
        const bolt = findClosestBolt(point, scenery.bolts, crack, flickerFrame)
        const boltEdges = palette.boltEdges ?? palette.seams
        if (bolt.distance < ENERGY_BOLT_WIDTH * BOLT_CORE_RATIO) {
          color = palette.boltCore ?? palette.crack
        } else if (bolt.distance < ENERGY_BOLT_WIDTH) {
          color = boltEdges[bolt.index % boltEdges.length]
        }
      }
      const inPulse =
        pulseY !== null && Math.abs(y - pulseY) < SEAM_PULSE_WIDTH
      const seamWidth = inPulse ? glowWidth * SEAM_PULSE_WIDEN : glowWidth
      // a pure seam colour core and a darker halo of the same hue: blending it
      // into the shell would turn gold on green into olive
      if (seamDistance < seamWidth * SEAM_CORE_RATIO) {
        color = inPulse
          ? seamColor.map(
              (channel, i) =>
                channel + (palette.crack[i] - channel) * SEAM_PULSE_LIGHTEN
            )
          : seamColor
      } else if (seamDistance < seamWidth) {
        color = seamColor.map((channel) => channel * SEAM_HALO_BRIGHTNESS)
      }
      if (crack > 0.3 && seamDistance < crackWidth) color = palette.crack
      const offset = (row * size + column) * 4
      data[offset] = color[0]
      data[offset + 1] = color[1]
      data[offset + 2] = color[2]
      data[offset + 3] = 255
    }
  }
  latticeContext.putImageData(image, 0, 0)
  ctx.imageSmoothingEnabled = false
  ctx.globalAlpha = dark
  ctx.drawImage(latticeCanvas, -r, -r, r * 2, r * 2)
  ctx.globalAlpha = 1
}

// a band of energy runs up the seams from the bottom of the globe, a little
// faster each time, until the cracks take over
function getSeamPulseY(time: number) {
  if (time < DARKEN_START || time >= CRACK_START) return null
  const progress = (time - DARKEN_START) / (CRACK_START - DARKEN_START)
  const sweeps =
    SEAM_PULSE_SLOW_SWEEPS * progress + SEAM_PULSE_FAST_SWEEPS * progress ** 2
  const travel = sweeps - Math.floor(sweeps)
  const reach = 1 + SEAM_PULSE_WIDTH
  return reach - travel * reach * 2
}

// tinted copies of the shadow nudged outward, so the halo keeps its exact
// shape whatever the sprite's pivot
function createOrbAura(
  pokemon: MegaEvolvingSprite,
  palette: MegaAnimationPalette
) {
  const { shadow } = pokemon
  if (!shadow) return []
  const rings = palette.auraRings ?? AURA_RINGS
  const sprites = rings.flatMap(() =>
    AURA_DIRECTIONS.map(() =>
      new GameObjects.Sprite(
        pokemon.scene,
        shadow.x,
        shadow.y,
        shadow.texture.key,
        shadow.frame.name
      )
        .setTintMode(Phaser.TintModes.FILL)
        .setVisible(false)
    )
  )
  sprites.forEach((auraSprite, i) => pokemon.addAt(auraSprite, i))
  return sprites
}

function updateOrbAura(
  sprites: GameObjects.Sprite[],
  shadow: GameObjects.Sprite,
  time: number,
  palette: MegaAnimationPalette
) {
  const progress = clamp01((time - BURST_START) / AURA_DURATION)
  const active = time >= BURST_START && progress < 1
  const swell = 1 - (1 - clamp01(progress * 4)) ** 2
  const presence = swell * (1 - progress ** 3)
  const [red, green, blue] = orbAuraColor(progress * 1.5, palette.aura).map(
    Math.round
  )
  const tint = (red << 16) | (green << 8) | blue
  const rings = palette.auraRings ?? AURA_RINGS
  sprites.forEach((auraSprite, i) => {
    auraSprite.setVisible(active)
    if (!active) return
    const [offset, alpha] = rings[Math.floor(i / AURA_DIRECTIONS.length)]
    const [dx, dy] = AURA_DIRECTIONS[i % AURA_DIRECTIONS.length]
    const reach = offset * (0.5 + 0.5 * swell)
    auraSprite
      .setFrame(shadow.frame.name)
      .setOrigin(shadow.originX, shadow.originY)
      .setScale(shadow.scaleX, shadow.scaleY)
      .setPosition(shadow.x + dx * reach, shadow.y + dy * reach * 0.6)
      .setTint(tint)
      .setAlpha(alpha * presence)
  })
}

function createLightRays(
  random: () => number,
  palette: MegaAnimationPalette
): LightRay[] {
  return Array.from({ length: NB_LIGHT_RAYS }, () => ({
    angle: random() * Math.PI * 2,
    speed: 1 + random() * 1.2,
    length: 10 + random() * 14,
    width: 4 + random() * 4,
    color: palette.lightRays[Math.floor(random() * palette.lightRays.length)]
  }))
}

// rays shorten instead of fading, which the pixel alpha steps would make choppy
function drawLightRays(
  ctx: CanvasRenderingContext2D,
  time: number,
  scenery: MegaScenery
) {
  const progress = clamp01((time - BURST_START) / LIGHT_RAY_DURATION)
  if (time < BURST_START || progress >= 1) return
  const travel = 1 - (1 - progress) ** 2
  for (const ray of scenery.lightRays) {
    const distance = scenery.radius * (0.4 + travel * ray.speed)
    const length = ray.length * (1 - progress)
    const width = ray.width * (1 - progress * 0.5)
    ctx.save()
    ctx.rotate(ray.angle)
    ctx.fillStyle = ray.color
    ctx.fillRect(distance, -width / 2, length, width)
    ctx.restore()
  }
}

// each visible cell becomes a shard, so the shell breaks where it was seen
// cracking; a shard is its cell's outline so its border stays clean as it spins
function createShellShards(
  scenery: MegaScenery,
  random: () => number
): ShellShard[] {
  const size = getLatticeSize(scenery.radius)
  const half = size / 2
  const spin = (BURST_START / 1000) * GLOBE_SPIN_PER_SECOND
  const pieces = new Map<
    number,
    { points: { x: number; y: number }[]; shade: number }
  >()
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const x = (column + 0.5 - half) / half
      const y = (row + 0.5 - half) / half
      if (x * x + y * y > 1) continue
      const { closestIndex, seamDistance } = findClosestCells(
        unprojectFromGlobe(x, y, spin),
        scenery.latticeCells
      )
      if (seamDistance < SHARD_GAP) continue
      let piece = pieces.get(closestIndex)
      if (!piece) {
        piece = { points: [], shade: 0 }
        pieces.set(closestIndex, piece)
      }
      piece.points.push({ x, y })
      piece.shade += 0.35 + 0.65 * getShellLight(x, y)
    }
  }
  const { shells } = scenery.palette
  return [...pieces.entries()]
    .filter(([, piece]) => piece.points.length >= 3)
    .map(([cellIndex, piece]) => {
      const count = piece.points.length
      const centreX = piece.points.reduce((sum, p) => sum + p.x, 0) / count
      const centreY = piece.points.reduce((sum, p) => sum + p.y, 0) / count
      const shade = (piece.shade / count) * 0.85
      const [red, green, blue] = shells[cellIndex % shells.length].map(
        (channel) => Math.round(channel * shade)
      )
      const outward =
        Math.hypot(centreX, centreY) > 0.15
          ? Math.atan2(centreY, centreX)
          : random() * Math.PI * 2
      return {
        outline: convexHull(piece.points).map((p) => ({
          x: (p.x - centreX) * scenery.radius,
          y: (p.y - centreY) * scenery.radius
        })),
        fill: `rgb(${red},${green},${blue})`,
        centreX,
        centreY,
        angle: outward + (random() - 0.5) * 0.7,
        speed: 0.6 + random() * 1.2,
        spin: (random() - 0.5) * 5
      }
    })
}

// monotone chain
function convexHull(points: { x: number; y: number }[]) {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  const turn = (
    o: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const lower: { x: number; y: number }[] = []
  for (const point of sorted) {
    while (
      lower.length >= 2 &&
      turn(lower[lower.length - 2], lower[lower.length - 1], point) <= 0
    ) {
      lower.pop()
    }
    lower.push(point)
  }
  const upper: { x: number; y: number }[] = []
  for (const point of [...sorted].reverse()) {
    while (
      upper.length >= 2 &&
      turn(upper[upper.length - 2], upper[upper.length - 1], point) <= 0
    ) {
      upper.pop()
    }
    upper.push(point)
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

function drawShatteredShell(
  ctx: CanvasRenderingContext2D,
  time: number,
  scenery: MegaScenery
) {
  const progress = clamp01((time - BURST_START) / SHATTER_DURATION)
  if (time < BURST_START || progress >= 1) return
  const shards = (scenery.shards ??= createShellShards(scenery, Math.random))
  const travel = 1 - (1 - progress) * (1 - progress)
  const r = scenery.radius
  ctx.lineJoin = "round"
  ctx.lineWidth = SHARD_BORDER_WIDTH
  ctx.strokeStyle = `rgb(${scenery.palette.crack})`
  for (const shard of shards) {
    const distance = travel * shard.speed * r * 1.3
    const fall = progress * progress * r * 0.35
    ctx.save()
    ctx.translate(
      shard.centreX * r + Math.cos(shard.angle) * distance,
      shard.centreY * r + Math.sin(shard.angle) * distance + fall
    )
    ctx.rotate(shard.spin * progress)
    ctx.scale(1 - progress * 0.75, 1 - progress * 0.75)
    ctx.beginPath()
    shard.outline.forEach((point, i) =>
      i === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y)
    )
    ctx.closePath()
    ctx.fillStyle = shard.fill
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }
}

function drawRevealRibbons(
  ctx: CanvasRenderingContext2D,
  time: number,
  scenery: MegaScenery
) {
  const progress = clamp01((time - BURST_START) / REVEAL_DURATION)
  if (progress <= 0 || progress >= 1) return
  // they unwind by length and width, like the swirl, instead of a stepped fade
  const presence = 1 - progress * progress
  REVEAL_RIBBON_SHAPES.forEach(([tilt, roundness], i) => {
    const [body, edge] = scenery.palette.revealRibbons[i]
    ctx.save()
    ctx.rotate(tilt)
    ctx.scale(1, roundness)
    const spin = (-time / 1000) * 3.5 + i * 2
    const radius = scenery.radius * (1.05 + progress * 0.5)
    drawBrushArc(ctx, radius, spin, 1.9 * presence, body, edge, 8 * presence)
    ctx.restore()
  })
}
