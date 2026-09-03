# Server Guide

## Synergies

### Fossil

{{synergy:FOSSIL}}

[Fossil in the Wiki](#wiki/types/FOSSIL)

### Fire

{{synergy:FIRE}}

[Fire in the Wiki](#wiki/types/FIRE)

### Poison

{{synergy:POISON}}

[Poison in the Wiki](#wiki/types/POISON)

### Flying

{{synergy:FLYING}}

[Flying in the Wiki](#wiki/types/FLYING)

### Rock

{{synergy:ROCK}}

[Rock in the Wiki](#wiki/types/ROCK)

### Dark

{{synergy:DARK}}

[Dark in the Wiki](#wiki/types/DARK)

## Weather

[See weather effects, setters and matching items](#wiki/weather).

### New Weather

| Weather | Effect |
| --- | --- |
| MAGNET_STORM | {{weather:MAGNET_STORM}} |
| PLAGUE | {{weather:PLAGUE}} |
| ECLIPSE | {{weather:ECLIPSE}} |
| FLOOD | {{weather:FLOOD}} |
| ELDER_STORM | {{weather:ELDER_STORM}} |
| DISTORTION | {{weather:DISTORTION}} |
| METEOR_SHOWER | {{weather:METEOR_SHOWER}} |
| CLOUDY | {{weather:CLOUDY}} |
| TERRAIN | {{weather:TERRAIN}} |
| BLOSSOM | {{weather:BLOSSOM}} |

## Items

[Browse item effects and recipes](#wiki/items).

### Binding Band

This chapter is the short version: what each item does, plus a line of advice. The long version — why the component exists, and the design reasoning behind every single item — is a separate read.

[Read the extended Binding Band guide](#meta/binding-band-guide)

#### SOOTHE_BELL

Grant the lowest HP ally 30 SHIELD every 3 seconds. Has a [30,LK]% chance to convert that ally’s remaining SHIELD into HP.

> It is a support item, that you should use on a ranged unit. Could also work on the frontline, when paired with some tank items.

#### EXP_CHARM

The holder gains 2 PP after getting hit by an attack. [30,LK]% chance to increase that PP gain by 1 after each received hit. When the holder is KO, gain 1 XP.

> Good for loose streaker! Use it in the early game, to level faster and start catching up. Otherwise it is a tool to gain alot of PP when paired with a tank item like ROCKY_HELMET or POKE_DOLL. Also good to generate more PP, when having SHIELD.

#### FAIRY_FEATHER

Attacks deal 50% of the user’s current DEF as additional SPECIAL. [30,LK]% chance to reduce the target’s ATK by 2.

> Its base DEF of 20 is enough, to work on any ranged unit to let it deal more damage. It is especially good on ranged ROCK units, like Snorunt, Solrock or Nihilego! Try to pair it with LOADED_DICE and SPEED items!

#### CLEAR_AMULET

The first time the holder is affected by any negative status effect, they will store the effect and gain RUNE_PROTECT for 10 seconds. On the next attack, apply said negative effect to all ADJACENT enemies for 5 seconds.

> Could be interesting with FLAME_ORB or TIGHT_BELT! Otherwise 20 SPE_DEF is always appreciated on your tank.

#### DESTINY_KNOT

Once the holder is KO, the STRONGEST ally gains the users current LUCK and base ATK for the rest of the fight.

> A way to further buff your carry, when it is already fully itemized!

#### LUCKY_PUNCH

If the target has an ally directly behind it, the attack knocks a random held item from the target to that ally. When an item is knocked off, [30, LK]% chance to inflict CONFUSION for 2 seconds.

> Use your positioning knowledge to get rid of annoying tank items. Time to scout!

#### GRIP_CLAW

Attacks grant +10% CRIT_POWER. (stackable)

#### COVERT_CLOAK

At the start of the fight and every 4 seconds, steal 5 AP from all enemies within RANGE and deal 5 SPECIAL to them.

> This item is a way to make any 2 RANGE carry less vulnerable, by giving it +1 more RANGE. Try to pair it with POKEMONOMICON, or just use the 50 AP to deal alot of damage. The AP stealing can help against PSYCHIC, ARTIFICIAL or DRAGON comps!

#### FLUFFY_TAIL

Gains [15,LK]% dodge chance. The holder is immune to ARMOR_BREAK.

#### EVER_STONE

The holder gains the ROCK type.

#### TIGHT_BELT

At the beginning of each battle, TIGHT_BELT is replaced by 2 random items. The holder is PARALYSIS during the entire fight.

> From the Wiki > Data section: Luck increases your chances in all draws, whether for critical hits, dodges, status on hit or any other effect mentioned with the LUCK symbol. Luck affects probabilities with this formula: P = baseP ^ (1 - LUCK /100);

### Other Items

| Item | Effect |
| --- | --- |
| HEAVY_DUTY_BOOTS | {{item:HEAVY_DUTY_BOOTS}} |
| GOLD_BOTTLE_CAP | {{item:GOLD_BOTTLE_CAP}} |
| TEA | {{item:TEA}} |
| BOOSTER_ENERGY | {{item:BOOSTER_ENERGY}} |
| STAR_DUST | {{item:STAR_DUST}} |
| XRAY_VISION | {{item:XRAY_VISION}} |
| RELIC_CROWN | {{item:RELIC_CROWN}} |
| WHITE_FLUTE | {{item:WHITE_FLUTE}} |

## Pokémon

[Pokémon and evolution requirements](#wiki/pokemon)

### Common

- Crobat: attacks destroy Protect, Magic Bounce and Reflect.

- Fossil unlock pool: Omanyte, Kabuto, Wimpod.
- Golisopod: has FOSSIL. Evolves from Wimpod.
- Kabutops: has DARK. Evolves from Kabuto.
- Cinderace: has NORMAL
- Butterfree: regional pool

- Kingdra: RANGE 3
- Decidueye: its regional form is a ranged FIGHTING unit.
- Mamoswine: has FOSSIL
- Cherrim Sunlight: regular pool (does not evolve via lightspot)
- Shiftry: has ICE
- Charizard: regional pool
- Orbeetle: regular pool
- Staraptor: has FIGHTING

- Arboliva: regular attacks scale with AP, SPEED 42
- Salamence: regional pool
- Torterra: regional pool (GRASS / GROUND)
- Emboar: regular pool

### Uncommon

- Fossil unlock pool: Lileep, Anorith, Tangela.
- Heliolisk: has DRAGON.
- Dragalge: DRAGON / POISON / WATER.
- Blastoise: RANGE 1. Withdraw blasts water around the user, pushes enemies back and increases DEF.
- Wigglytuff: RANGE 1, tank role
- Chesnaught: regional GRASS / FIGHTING Pokémon.

- Grimmsnarl: available in all regions
- Magnezone: has ARTIFICIAL
- Sceptile: has DRAGON after 2 STAR; 2 range
- Greninja: regular pool

- Nidoking / Nidoqueen: have MONSTER and attract catchable Nidoran♀ / Nidoran♂ respectively.
- Eldegoss: has GRASS
- Garganacl: has HUMAN after 3 STAR

- Vikavolt: regular pool, has AMORPHOUS
- Froslass: has ROCK

### Rare

- Magmortar: 3 range, the Magby line gains ARTIFICIAL at Magmar. Flamethrower burns PP in a line; excess PP burn erupts as special damage.

- Fossil unlock pool: Yanma, Archen, Clamperl.
- Exploud: has MONSTER
- Pawmot: has FIELD, buffed ability
- Pangoro: has WILD
- Sharpedo: has WILD
- Cofagrigus: GHOST / HUMAN. Evolves from Yamask.
- Runerigus: has ROCK. Evolves from Galarian Yamask.
- Primarina: regular pool
- Salazzle: RANGE 3, has MONSTER
- Dragapult: regional pool (DRAGON / GHOST) , has FLYING
- Lickilicky: regional pool (NORMAL / GOURMET)
- Swellow: Range 2, has NORMAL
- Ninetales: has GHOST
- Alolan Ninetales: has FIELD
- Swampert: has AQUATIC

- Toxtricity: form based on the dominant synergy between ELECTRIC and POISON
- Trevenant: changed ability

### Epic

- Fossil unlock pool: Cranidos, Shieldon, Amaura, Tyrunt.
- Rampardos: counts twice toward MONSTER. Evolves from Cranidos.
- Bastiodon: Hard Face. Gain Shield and retaliate with true damage against melee attacks while that Shield remains. Evolves from Shieldon.
- Scizor / Kleavor: Scyther is in the regular pool and has WILD; evolves via Metal Alloy or Black Augurite.
- Lycanroc Dusk / Lycanroc Day / Lycanroc Night: Rockruff comes from Addpicks.
- Crustle: regional pool (BUG).
- Beheeyem: has ARTIFICIAL.
- Altaria: has AMORPHOUS.
- Volcarona: has FLYING, Addpick.

- Gigalith: has SOUND

- Houndoom: has FIELD
- Aurorus: has LIGHT

- Gothitelle: has DARK. Fake Tears affects a five-tile radius around the user.

- Arcanine / Hisuian Arcanine: spirits can Ignite every round
- Kommo-O: regional pool (DRAGON / FIGHTING)
- Skeledirge: regional pool
- Escavalier: Additional pool
- Corviknight: regular pool
- Kilowattrel: has AQUATIC
- Exeggutor: has GOURMET, COCONUT_MILK
- Alolan Exeggutor: has GOURMET, COCONUT_MALASADA.

### Ultra

- Bloodmoon Ursaluna: has ROCK, sets Blood Moon.
> Ultra Pokemon have twice the HP when 3 STAR
- Inteleon: RANGE 4

- Kingambit: has HUMAN
- Reuniclus: has MONSTER
- Dusknoir: with SPEED items and REAPER_CLOTH, it is a carry. Otherwise with PP items, it should provide support
- Granbull: regular pool, has WILD

### Hatch
- Ludicolo: GRASS / AQUATIC / SOUND.
- Empoleon: WATER / ICE / STEEL.
- Hydreigon: DRAGON / DARK.
- Delphox: FIRE / PSYCHIC / HUMAN.
- Meowscarada: GRASS / FLORA / DARK.
- Stoutland: has GROUND
- Chandelure: SPECIAL carry

- Serperior: has LIGHT

### Unique

- Tropius: has FOSSIL.
- Turtonator: has ROCK.

- Alcremie: evolves from Milcery, a Unique Pokémon.
- Carbink: interacts with Crystallization. See [Awakenings](#wiki/awakening).
- Sableye: has ROCK; Crystallization unlocks Mega Sableye.
- Minior: has LIGHT.
- Veluza: has MONSTER

- Scream Tail: SOUND / FOSSIL / MONSTER.
- Morpeko: has ELECTRIC, ELECTRIC_SEED
- Cryogonal: has ROCK, MONSTER
- Togedemaru: has FIELD,
- Pinsir: has FIGHTING

### Legendary

- Diancie: Legendary Pokémon.
- Galarian Zapdos: has WILD.
- Glastrier: has WILD.
- Ho-Oh: allied FIRE Pokémon with Resurrection revive Ignited.
- Landorus, Thunderus, Tornadus, Enamorus, Marcus: have HUMAN
- Buzzwole and Pheromosa: Legendary Duo.
- Victini: has GOURMET, TABASCO
- Guzzlord: 400 HP
- Spectrier: Range 2
- Deoxys Attack: ATK 35
- Xurkitree: raises AP by 30; 220 HP
- Groudon: GROUND / FIRE, becomes MONSTER with RED_ORB
- Kyogre: WATER / ELECTRIC, becomes MONSTER with BLUE_ORB
- Heatran: has MONSTER
- Ogerpon: becomes MONSTER with TEAL_MASK, WELLSPRING_MASK, HEARTHFLAME_MASK or CORNERSTONE_MASK,
- Celebi: has FAIRY

### Special

- Galarian Fossils: Special Pokémon. Restore Dracovish, Dracozolt, Arctovish or Arctozolt in the Fossil menu.
- Mafia Eevee: via EVER_STONE

### Mega Evolution

- Mega Charizard X: evolves from Charizard.
- Mega Lopunny: evolves from Lopunny.
- Mega Camerupt: evolves from Camerupt.
- Mega Houndoom: evolves from Houndoom.
- Mega Steelix: evolves from Steelix.
- Mega Altaria: evolves from Altaria.
- Mega Banette: evolves from Banette.
- Mega Manectric: evolves from Manectric.
- Mega Slowbro: evolves from Slowbro; has ROCK.
- Mega Gallade: evolves from Gallade.
- Mega Gardevoir: evolves from Gardevoir.
- Mega Medicham: evolves from Medicham.
- Mega Alakazam: evolves from Alakazam.
- Mega Tyranitar: evolves from Tyranitar.
- Mega Aerodactyl: evolves from Aerodactyl.
- Mega Diancie: evolves from Diancie.
- Mega Gengar: evolves from Gengar.
- Mega Lucario: evolves from Lucario.
- Mega Mawile: evolves from Mawile.
- Mega Absol: evolves from Absol.
- Mega Mewtwo Y: evolves from Mewtwo.
- Mega Latias: evolves from Latias.
- Mega Latios: evolves from Latios.
- Mega Drampa: evolves from Drampa.
- Mega Excadrill: evolves from Excadrill.
- Mega Dragalge: evolves from Dragalge.
- Mega Zygarde: evolves from Zygarde.
- Mega Floette Eternal: evolves from Floette Eternal.
- Mega Feraligatr: evolves from Feraligatr; passive triggers once per fight.
- Mega Skarmory: evolves from Skarmory.
- Mega Zeraora: evolves from Zeraora.
- Mega Darkrai: evolves from Darkrai.
- Mega Sableye: Crystallization unlocks Sableye's Mega Evolution.
- Mega Eelektross: evolves from Eelektross.

## Game Mode

### Double Up

Team up with your partner and outlast every other duo!

[Double Up guide](#wiki/double-up)

### Wish Festival

[Wishes in the Wiki](#wiki/blessings)

Choose a **Wish at stages 4 and 12**. Stage-12 synergy-specific offers are tailored to your active synergies.

### Smeargle Scribbles

Selectable in Custom Lobbies.

- **Six Pack**: {{scribble:SIX_PACK}}
- **Evolution Lab**: {{scribble:EVOLUTION_LAB}}
- **The Bazaar**: {{scribble:BAZAAR}}
- **Juggernaut**: {{scribble:JUGGERNAUT}}
- **Kaiju Battle**: {{scribble:KAIJU_BATTLE}}
- **Avatar**: {{scribble:AVATAR}}
- **Light Show**: {{scribble:LIGHT_SHOW}}
- **Smeargle Pack**: {{scribble:SMEARGLE_PACK}}
- **Overtime**: {{scribble:OVERTIME}}

## Misc

- The full collection is unlocked, with all nine emotions when available. Boosters are exclusive to the Smeargle Pack Scribble.
- There is no Elo decay.
- Shop-upgrade outlines and Walking Avatar are under [Options > Interface](#options/interface).
