import { ensureDir } from "fs-extra"
import {
  SpriteSheetProcessor,
  runTexturePacker,
  minifySheet,
  moveFiles,
  updateEmotionsAndCredits
} from "./add-pokemon"

const SPRITE_COLLAB_PATH = "C:/Users/arbet/pac/SpriteCollab"

const CUSTOM_POKEMON = [
//  "0150-0003",
//  "0025-0006",
//  "0724-0001",
//  "0646-0001",
//  "0646-0002",
//  "0160-9999",
//  "0503-0001",
//  "0815-9999",
//  "0398-9999",
//  "0175-9999"
    "0007",
    "0008",
    "0009"
]

async function main() {
  await ensureDir("sheets")
  await ensureDir("split")

  for (const index of CUSTOM_POKEMON) {
    console.log(`\nAdding pokemon: ${index}`)
    try {
      const splitter = new SpriteSheetProcessor()
      splitter.loadDelaysFile()
      splitter.loadDurationsFile()
      await splitter.splitIndex(SPRITE_COLLAB_PATH, index)
      splitter.saveDurationsFile()
      splitter.saveDelaysFile()

      await runTexturePacker(index)
      minifySheet(index)
      moveFiles(SPRITE_COLLAB_PATH, index)

      const shinyPad = index.length === 4 ? "-0000-0001" : "-0001"
      updateEmotionsAndCredits(SPRITE_COLLAB_PATH, [index, `${index}${shinyPad}`])

      console.log(`✅ Done: ${index}`)
    } catch (error) {
      console.error(`❌ Failed for ${index}:`, error)
      process.exit(1)
    }
  }

  console.log("\nAll custom pokemon processed!")
}

main()
