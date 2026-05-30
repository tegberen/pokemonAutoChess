import Player from "../models/colyseus-models/player"
import Synergies from "../models/colyseus-models/synergies"
import PokemonFactory from "../models/pokemon-factory"
import { getPokemonData } from "../models/precomputed/precomputed-pokemon-data"
import { PRECOMPUTED_POKEMONS_PER_RARITY } from "../models/precomputed/precomputed-rarity"
import { Berries, CraftableItemsNoScarves, Item, Sweets, SynergyGems } from "../types"
import { FreeOptions, PaidOptions, ArmoryOptions } from "../types/enum/ArmoryOptions"
import { Rarity } from "../types/enum/Game"
import { Pkm, Unowns } from "../types/enum/Pokemon"
import { Synergy } from "../types/enum/Synergy"
import { getFirstAvailablePositionInBench, getFreeSpaceOnBench } from "../utils/board"
import { pickNRandomIn, pickRandomIn } from "../utils/random"

const giftAmountOfItem = (toPlayer: Player, amount: number, itemName: string): boolean => {
    if (itemName === "BERRIES") {
        const randomBerries = pickNRandomIn(Berries, amount)
        randomBerries.forEach((berry) => toPlayer.items.push(berry))
    } else if (itemName === "SWEETS") {
        const randomSweets = pickNRandomIn(Sweets, amount)
        randomSweets.forEach((sweet) => toPlayer.items.push(sweet))
    } else if (itemName === "GEMS"){
        const randomGems = pickNRandomIn(SynergyGems, 3)
        randomGems.forEach((gem) => toPlayer.items.push(gem))
    } else if (itemName === "COMBINED_ITEMS"){
        const randomCombinedItems = pickNRandomIn(CraftableItemsNoScarves, 3)
        randomCombinedItems.forEach((x) => toPlayer.items.push(x))
    }
    else {
        return false;
    }
    
    return true
}

const giftAmountOfPokemon = (toPlayer: Player, amount: number, pokemon: Pkm): boolean => {
    const spaceInBench = getFreeSpaceOnBench(toPlayer.board)
    if (spaceInBench < amount) return false
    
    if (!pokemon) return false
    
    for (var i = 0; i<amount; i++){
        let pkm = pokemon
        if (pokemon === Pkm.UNOWN_A) pkm = pickRandomIn(Unowns)

        const replacement = PokemonFactory.createPokemonFromName(getPokemonData(pkm).name, toPlayer)
        const freeCellX = getFirstAvailablePositionInBench(toPlayer.board)
    
        if (freeCellX === null) return false
        replacement.positionX = freeCellX
        replacement.positionY = 0
        toPlayer.board.set(replacement.id, replacement)
        replacement.onAcquired(toPlayer)
    }

    return true
}

const giftRandomPokemonByRarity = (toPlayer: Player, rarity: Rarity): boolean => {
    const spaceInBench = getFreeSpaceOnBench(toPlayer.board)
    if (spaceInBench < 1) return false
    let wantedStars : number
    let shouldBeRegionalOrAdditional = false

    switch(rarity){
        case Rarity.COMMON:
        case Rarity.UNIQUE:
        case Rarity.LEGENDARY:
            wantedStars = 3
            break
        case Rarity.UNCOMMON:
        case Rarity.RARE:
        case Rarity.EPIC:
            wantedStars = 2
            shouldBeRegionalOrAdditional = true
            break
        case Rarity.ULTRA:
        default:
            wantedStars = 1
            break
    }

    const nbOfSynergies = rarity === Rarity.ULTRA ? 2 : 1
    var wantedSynergy = toPlayer.synergies.getTopSynergies(nbOfSynergies)
    if (wantedSynergy.includes(Synergy.BABY)) {
        wantedSynergy = toPlayer.synergies.getTopSynergies(nbOfSynergies + 1)
        wantedSynergy.splice(wantedSynergy.indexOf(Synergy.BABY), 1)
    }

    const pkmByRarity = PRECOMPUTED_POKEMONS_PER_RARITY[rarity]
    const pkmByRarityWithWantedSyns = pkmByRarity.filter((p) => {
        const pkmData = getPokemonData(p)
        if (pkmData.stars !== wantedStars) return false
        if (shouldBeRegionalOrAdditional && !(pkmData.additional || pkmData.regional)) return false
        if (!shouldBeRegionalOrAdditional && (pkmData.additional || pkmData.regional)) return false
        if (shouldBeRegionalOrAdditional && pkmData.regional && !toPlayer.regionalPokemons.includes(p)) return false
        const types = pkmData.types
        let res = false
        wantedSynergy.forEach((syn) => {
            if (types.includes(syn)) res = true
        })
        return res
    })
    if (pkmByRarityWithWantedSyns.length === 0) pkmByRarityWithWantedSyns.push(Pkm.UNOWN_A) //Fallback if no Pokémon satisfy the filter
    const pkm = pickRandomIn(pkmByRarityWithWantedSyns)
    
    if (!pkm) return false
    
    const replacement = PokemonFactory.createPokemonFromName(getPokemonData(pkm).name, toPlayer)
    const freeCellX = getFirstAvailablePositionInBench(toPlayer.board)

    if (freeCellX === null) return false
    replacement.positionX = freeCellX
    replacement.positionY = 0
    toPlayer.board.set(replacement.id, replacement)
    replacement.onAcquired(toPlayer)
    
    return true
}

const giftPotion = (toPlayer: Player): boolean => {
    toPlayer.life = Math.min(100, (toPlayer.life + 10))
    return true
}

export const armoryGiftService: { [key in ArmoryOptions ]? : (playerId: Player) => boolean } = {
    [FreeOptions.BERRYBUNDLE]: (playerId: Player) => giftAmountOfItem(playerId, 7, "BERRIES"),
    [FreeOptions.SWEETSBUNDLE]: (playerId: Player) => giftAmountOfItem(playerId, 5, "SWEETS"),
    [FreeOptions.UNOWNBUNDLE]: (playerId: Player) => giftAmountOfPokemon(playerId, 5, Pkm.UNOWN_A),
    [FreeOptions.DITTOBUNDLE]: (playerId: Player) => giftAmountOfPokemon(playerId, 1, Pkm.DITTO),
    
    [PaidOptions.GEMSBUNDLE] : (playerId: Player) => giftAmountOfItem(playerId, 3, "GEMS"),
    [PaidOptions.POTION] : (playerId: Player) => giftPotion(playerId),
    [PaidOptions.DELUXE_BOX] : (playerId: Player) => giftAmountOfItem(playerId, 3, "COMBINED_ITEMS"),
    [PaidOptions.COMMONBUNDLE] : (playerId: Player) => giftRandomPokemonByRarity(playerId, Rarity.COMMON),
    [PaidOptions.UNCOMMONBUNDLE] : (playerId: Player) => giftRandomPokemonByRarity(playerId, Rarity.UNCOMMON),
    [PaidOptions.RAREBUNDLE] : (playerId: Player) => giftRandomPokemonByRarity(playerId, Rarity.RARE),
    [PaidOptions.EPICBUNDLE] : (playerId: Player) => giftRandomPokemonByRarity(playerId, Rarity.EPIC),
    [PaidOptions.ULTRABUNDLE] : (playerId: Player) => giftRandomPokemonByRarity(playerId, Rarity.ULTRA),
    [PaidOptions.UNIQUEBUNDLE] : (playerId: Player) => giftRandomPokemonByRarity(playerId, Rarity.UNIQUE),
    [PaidOptions.LEGENDARYBUNDLE] : (playerId: Player) => giftRandomPokemonByRarity(playerId, Rarity.LEGENDARY),
}