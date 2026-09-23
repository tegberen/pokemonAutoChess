# Server Guide

## Synergies

### Flora

Flora is the synergy built around RANGE. Ability damage and status durations are
designed around that stat.

**(2) Springtide:** Allies deal 10% more damage for each tile between them and
their target.

> Flora (2) is a generic damage amp splash. It applies to every ally on the board,
> not only FLORA units.

#### Items on flower pots

Flower pots can now be itemized, and the flower that blossoms carries those items
into the fight.

- Left click a flower to take its items back. They also return if you drop the
  FLORA tier that unlocked the pot.
- Pots cannot be itemized once the fighting phase starts.
- Pots refuse RARE_CANDY, GOLD_BOW, dojo tickets, and anything a Pokemon could
  never hold.
- A pot only contributes the synergies its items grant, never its own types.

#### Abilities

Every Flora ability hits within the caster's RANGE, and several lose power with
each tile of gap.

| Pokemon | Ability | Effect |
| --- | --- | --- |
| Hoppip | Acrobatics | {{ability:ACROBATICS}} |
| Bellsprout | Ingrain | {{ability:INGRAIN}} |
| Chikorita | Sweet Scent | {{ability:SWEET_SCENT}} |
| Oddish | Sleep Powder | {{ability:SLEEP_POWDER}} |
| Bellossom | Petal Blizzard | {{ability:PETAL_BLIZZARD}} |
| Petilil | Aromatherapy | {{ability:AROMATHERAPY}} |
| Budew | Petal Dance | {{ability:PETAL_DANCE}} |

- Chikorita Line: RANGE 2 to 3
- Roserade: 1 extra petal per bonus RANGE, max 3

#### Uniques and Legendaries

- Xerneas: new passive, the ally in your LIGHT spot gains +2 RANGE
- Celebi: Time Travel heals the user and allies within RANGE and grants them
  +1 RANGE. Double Up: at most 2 player HP per round
- Shaymin: ATK 25 to 22, RANGE 3 to 4
- Shaymin Sky: ATK 28 to 25, RANGE 3 to 5

#### Blossom weather

{{weather:BLOSSOM}}

#### Wishes

- Blossom Festival: the Mulch from KO'd FLORA allies is doubled until you get
  Bellossom. Your STRONGEST Bellossom gains GRASS and 1 RANGE every 3 casts.
- Flytrap: the Bellsprout keeps its full LOCKED duration at any distance, and
  heals 10 HP for each enemy it LOCKED.
- Mega Sol: allies within the Chikorita's RANGE benefit from ZENITH.
- Spore Clouds: the Oddish clouds enemies within its RANGE for 2 seconds.
- Double Windfall: two Hoppip spawn, one of them carrying the pot's items.

[Flora in the Wiki](#wiki/types/FLORA)

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

### Fighting

{{synergy:FIGHTING}}

#### Zen Zone weather

{{weather:ZEN_ZONE}}

#### Zen Ball

{{item:ZEN_BALL}}

#### Pokémon

- Marshadow: GHOST / FIGHTING, sets the weather to ZEN_ZONE.
- Makuhita Line: counts as 3 for ZEN_ZONE.
- Cobalion, Terrakion, Virizion: under ZEN_ZONE, gain 4 DEF, ATK or SPE_DEF the first time each ally falls below 50% HP.

#### Wishes

- Third Eye: gain a Meditite and add it to the pool. Meditate is doubled under ZEN_ZONE.
- Brace for Impact: now a generic wish for all allies, does not stack with FIGHTING 8, which grants the same effect.
- Shodan: at FIGHTING 8, the single-hit cap drops to 20% max HP and the excess is redirected to an ADJACENT enemy.

[Fighting in the Wiki](#wiki/types/FIGHTING)

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
| ZEN_ZONE | {{weather:ZEN_ZONE}} |

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

Attacks have a [20,LK]% chance to hit the target again immediately. Extra attacks from any source cannot trigger this.

> Similar to ELECTRIC. Think of it as a LOADED_DICE on the same unit. This item provides another option to do more actions per second, which helps you dish out more damage, but is also useful for ON_HIT and ON_ATTACK effects.

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
- Cinderace: has NORMAL. Raboot evolves into Cinderace Pirate, which swaps NORMAL for AQUATIC, when your AQUATIC count is at least your NORMAL count
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

- Vikavolt: regular pool, has SOUND
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
- Samurott: the Oshawott line is AQUATIC / FIELD / FIGHTING
- Walrein: the Spheal line is ICE / WATER, filling the WATER tank role
- Exeggutor: has GOURMET, COCONUT_MILK
- Alolan Exeggutor: has GOURMET, COCONUT_MALASADA.
- Tsareena: {{ability:TROP_KICK}}

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
- Meowscarada: GRASS / DARK / HUMAN.
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
- Urshifu (Single Strike): teaches its style, so the training bag and pillars also grant 10 AP permanently.
- Urshifu (Rapid Strike): teaches its style, so the training bag and pillars also grant 5 SPEED permanently.

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

### Tournament

Played in Double Up. Join from the Tournament tab, then team up in **Find a partner**.

- **Qualification**: 3 Swiss rounds of 4 teams, scored 8/4/2/1 by team placement. Ties are broken by Buchholz, then average placement
- **Knockout**: the top 8 play two semi-finals and the top 2 of each play the final. With 8 teams or fewer, the top 4 go straight to the final
- **Lobbies**: start once everyone is ready, or after 15 minutes without the teams missing a player. Those forfeit the round and score 0 points
- **Wishes**: off unless enabled for the tournament
- **Substitutes**: players without a team sit on the bench. A team that swaps one in keeps its points

### Wish Festival

[Wishes in the Wiki](#wiki/blessings)

Choose a **Wish at stages 4 and 12**. Stage-12 synergy-specific offers are tailored to your active synergies.

### Smeargle Scribbles

Selectable in Custom Lobbies.

Smeargle Scribbles do not change your Elo.

- **Six Pack**: {{scribble:SIX_PACK}}
- **Evolution Lab**: {{scribble:EVOLUTION_LAB}}
- **The Bazaar**: {{scribble:BAZAAR}}
- **Juggernaut**: {{scribble:JUGGERNAUT}}
- **Kaiju Battle**: {{scribble:KAIJU_BATTLE}}
- **Avatar**: {{scribble:AVATAR}}
- **Science & Arts**: {{scribble:LIGHT_SHOW}}
- **Smeargle Pack**: {{scribble:SMEARGLE_PACK}}
- **Overtime**: {{scribble:OVERTIME}}

## Misc

- The full collection is unlocked, with all nine emotions when available. Boosters are exclusive to the Smeargle Pack Scribble.
- There is no Elo decay.
- Shop-upgrade outlines and Walking Avatar are under [Options > Interface](#options/interface).

## Patch Log

Every balance change on this server, newest first.

### 23 September 2026

**Abilities**
- Glaive Rush | now aimed at the target's backline and hits all enemies in the target's column, instead of the user's own column
- Trick Room | FATIGUE and BLINDED duration 5 → [3,4,5,6,SP] seconds

**Game Mode**
- Double Up | the finale duel between partners is removed: the game ends as soon as one team is left, and both partners share first place

**Wishes**
- Glaive Strike {{new}} | Prismatic Wish at stage 12: gain a Frigibax. Enemies hit by your STRONGEST Frigibax's ability are marked, and 2 seconds later an Ice Sword falls on each mark, dealing [200,SP]% of ATK + SPE_DEF as SPECIAL, then shatters, dealing the same to ADJACENT enemies
- Mountain Egg {{new}} | Prismatic Wish at stage 12: gain a Happiny. The NUTRITIOUS_EGG of your STRONGEST Happiny also grants the dish effects of all your GOURMET Pokémon, each dish once, without permanent dish effects
- Mother Yarn {{new}} | Prismatic Wish at stage 12: gain a Sewaddle and move to a random Sewaddle region. Sewaddle gains NORMAL and returns its items when benched. After 3/2/1 stages at 1/2/3 STAR, your STRONGEST Sewaddle completes its held component with a SILK_SCARF and permanently gains the crafted item's stats, SHIELD as HP
- Cell Brawler {{new}} | Prismatic Wish at stage 12: gain a Solosis. Your STRONGEST Solosis gains 50% HP, DEF and SPE_DEF but becomes 1 range. It heals for 50% of the damage dealt by its ability, with 50% of overheal gained as max HP
- Gale Wings {{new}} | Prismatic Wish at stage 12: gain a Fletchling. Your STRONGEST Fletchling starts combat with max PP. After combat, collect any EMBER remaining on the field, gaining 1 GOLD for every 4/3/2 EMBER collected at 1/2/3 STAR, and a FIRE_SHARD if at least 10 are collected, which does not count towards your max total
- Multishot {{new}} | Prismatic Wish at stage 12: gain a Sobble. Your STRONGEST Sobble's ability fires 2 additional shots through random enemies, each dealing 25% damage. Each cast increases the number of additional shots by 1
- Decelerate {{new}} | Prismatic Wish at stage 12: gain a Duskull. While a Duskull is on your board, enemies start combat with at most 30 SPEED. Your STRONGEST Duskull's ability also applies FATIGUE and BLINDED to the enemies it damages
- Jungle Cacophony {{new}} | Prismatic Wish at stage 12: gain a Grookey. Your STRONGEST Grookey drums instead of attacking, even with enemies in RANGE. Its drum beats reach all allies within RANGE instead of only ADJACENT ones, and burn 1/2/4 PP from each enemy within RANGE
- Honey Exploration {{new}} | Prismatic Wish at stage 12: gain a Teddiursa. At the start of each fight, Teddiursa on your bench go exploring for 3/2/1 stages at 1/2/3 STAR, returning with a HONEY and a strong friend met along the way, which also has WILD synergy. Uniques and legendaries met this way sell for 0 GOLD. Eating HONEY also permanently grants 5 DEF and SPE_DEF
- King's Gambit {{new}} | Prismatic Wish at stage 12: gain a Pawniard. Your STRONGEST Pawniard disappears at the start of combat and rejoins the fight when 4 allies have been KO'd, or when you have no other units left. It gains 20% of the total ATK and HP of its fallen allies, and 50 SPEED

**Fixes**
- Evolution | permanent CRIT_CHANCE, CRIT_POWER and PP gains now carry over when a Pokémon evolves, like its other permanent stats
- Trick Room | ADJACENT enemies faster than the user now also receive FATIGUE and BLINDED, as described

### 21 September 2026

**Game Mode**
- Tournaments | reworked into Double Up tournaments: Swiss qualification, then semi-finals and a final
- Tournament lobbies | show every expected player, have locked settings, and start after 15 minutes at the latest

**Items**
- GRIP_CLAW | reworked: +10 CRIT_CHANCE, and attacks have a [20,LK]% chance to hit the target again immediately. It no longer stacks CRIT_POWER; Seizing Claw keeps that effect, without the tripling at 100% CRIT_CHANCE

**Wishes**
- Hydrated Cells | AMORPHOUS_GEM and a WATER_STONE → 2 WATER_STONE
- Human Horror | SPELL_TAG and a HUMAN_GEM → 2 SPELL_TAG

**PvE**
- Stage 3 | every mini-boss is now normalized to the same statline: 150 HP, 10 ATK, 0 DEF, 0 SPE_DEF, -50 AP
- Stage path | the icon shows the encounter you will actually face, variant included, instead of the default one, and no longer falls back to a missing portrait

**Misc**
- Player panel | hovering a player lists their Wishes, and the rounds since you last fought them moved onto their avatar, hidden for a Double Up partner
- Walking avatar | shows the player's level next to its HP bar
- Chimecho | its carousel reminder no longer repeats on every later carousel
- Add Picks | Pokémon a Wish added to the pool now have their own row in the addpick-panel, and are no longer proposed as add picks or reroll results in Additional Rethink I/II
- Avatar cosmetics | new Teleport movement cosmetic, unlocked by winning with the Prismatic Spoon Wish. Celestial → Dragon Veil, and the list is now grouped by trails, veils and movement

### 19 September 2026

**Game Mode**
- Double Up | global PvE nerf
- Smeargle Scribbles and Whimsy | no longer change Elo
- Ditto Party, Play Test | removed from Smeargle Scribbles
- Whimsy | Shiniest Hunter can no longer be rolled
- Omelette Cook → Legends in the Shells | its 3 eggs grant that Pokémon's Prismatic Wish when they hatch
- Light Show → Science & Arts | Smeargle no longer draws shapes: each stage it asks which of two Pokémon has more of a stat, and a correct answer unlocks a shape. Paint every unlocked shape wherever you want on your board from the panel beside it. shapes are now 8 Tetris pieces, 4 defensive ones built for the front row (SHIELD, DEF, SPE_DEF, HP) and 4 offensive ones to slot in behind (ATK, SPEED, CRIT_CHANCE and CRIT_POWER, starting PP), plus a single-cell Dot for +100 AP. Unlocking every shape grants 3 GOLD_BOW, and painting the whole canvas earns the new Artist title, no more sketchbook rewards

**Pokémon**
- Teddiursa Line | gains LIGHT. Bloodmoon Ursaluna | ROCK → LIGHT
- Sewaddle Line | now regional
- Grubbin Line | Zap Cannon → Circuit Cannon, max PP 85 → 60

**Abilities**
- Eruption | damage 30/60/90 → 30/50/70
- Circuit Cannon {{new}} | for 6 seconds, SILENCE the user, gain 10/20/40 SPEED, and replace attacks with cannon shots that deal PHYSICAL to all enemies in a line, losing 20/10/0% damage per enemy passed through, down to 20%
- Mole Maze {{new}} | burrow into the ground, becoming untargetable. If a dug hole exists, pop out of a random one and dive back in, then jump out of a new hole next to the target. Each time it jumps out, deal 100% of ATK + DEF as SPECIAL to enemies in that hole and ADJACENT to it. (New holes only last until the end of the fight.)

**Wishes**
- High Breaching | stage 4 or 12 → stage 12 only
- Toxic Resonance | POISONNED allies gain 5 → 10 PP
- Colony | Spewpa now evolves into a Vivillon form you do not have yet
- Rampage | no longer doubles damage after 5 seconds of channeling, each ADJACENT KO now grants 20% CRIT_POWER
- Icebreaker | a KO now also grants 30 SPEED
- Curse of Coral | stage 12 → stage 4, Corsola after every PvP round until stage 12
- Chosen Ones | no more boosted stats, cannot be sold, each gains 10 permanent max HP per fight when all three are fielded
- Fogbound Lake | stage 4 only, no movement on the stage 10 carousel, Unique selection always includes the Illumise and Volbeat duo
- Molecular Corrosion | 25% → 20% more damage taken
- Overload | every 8 → 10 seconds
- Unison | HUMAN Pokémon heal 20 HP every 2 seconds per ADJACENT allied HUMAN; the bond now builds from damage blocked by HUMAN Pokémon instead of damage dealt, retaliates every 8 seconds with the bond built since the last strike, instead of once on the first HUMAN KO; no longer keeps TMs
- Bull Leaping | second ability cast at 1 STAR → at the user's own STAR level
- Seizing Claw | at 100% CRIT_CHANCE, the CRIT_POWER gain is tripled
- Star Dust Veil | no more RUNE_PROTECT, ADJACENT allies get 100% → 50% of the SHIELD
- Mortar Shells | removed
- Move Tutor | TMs taught to HUMAN Pokémon are no longer consumed
- Verdant Growth | 5 AP → 10 AP and 1 ATK every 2 seconds
- Wrapped Up | scarf holders also gain their scarf's base stats a second time
- Aurora Borealis | unlocks Amaura and opens the fossil menu, instead of gifting one and adding it to the pool
- Trash to Treasure | Trubbish is now added to the pool, TRASH recycles into a Tool after 5/3/1 → 3/2/1 rounds
- Mole Maze {{new}} | Gold Wish at stage 4: Drilbur is added to the pool, and you gain one after 3 rounds. Your STRONGEST Drilbur's ability is replaced with Mole Maze, and it permanently gains 1 AP each time it scores a KO
- Lance's Ace | the Dratini is now gifted on pick instead of after 3 rounds
- Prismatic Spoon {{new}} | Prismatic Wish at stage 4: gain an Abra. An Abra line Pokémon holding a component bends it into a TWISTED_SPOON after 3/2/1 rounds at 1/2/3 STAR, and benching one gives back everything it holds. Pokémon holding a TWISTED_SPOON or an item made from it cast Teleport on their next attack after using their ability
- Gym Trainers | starters that are add picks are now added to the pool

### 17 September 2026

**Wishes**
- Magic Shield I/II | SHIELD equal to AP → +10/20 AP, each ability cast grants 15/20 SHIELD
- Brute Shield I/II | +0/4 ATK, SHIELD 300/300% ATK → +1/2 ATK, SHIELD 100/150% ATK
- Pulse Shield I/II | +0/20 SPEED, SHIELD 70/70% SPEED → +5/10 SPEED, SHIELD 35/50% SPEED
- Potential Energy I/II | 20/30 SHIELD and 10/20 SPEED per missing STAR → 15/30 SHIELD and 10/10 SPEED per missing STAR
- Vitamins | 2 ATK, 10 AP → 0 ATK, 20 AP
- First Wind | heal after 10 → 12 seconds
- Drill, Surge, Shatter, Empower, Critical Rush I/II | duration 8/12 → 10/15 seconds
- Shatter I/II | 40% DEF and SPE_DEF → 5 + 10% DEF and SPE_DEF
- Empower I/II | +20/40% damage below 70% HP → +25/30% damage after 5 seconds of combat
- Minimalist I/II | 8/12% PP per empty slot → 10/20%, Pokémon without items gain 0/40 → 30/40 AP
- Spiky Guard | 5 → 10 SHIELD per free tile
- Protect the Weak | 7 → 10 SPEED per Common and Uncommon Pokémon
- Requiem | SHIELD 15% → 25% max HP
- Star Guard | Gold → Prismatic, now also grants 5 SHIELD per STAR
- Brave Formation | 10% → 15% CRIT_CHANCE per empty tile
- Burning Force | 50% → 75% base ATK
- Rivalry | now capped at 20 ATK and 100 HP in total
- Rank Up | XP every stage → until stage 10
- Prize Money | no longer grants a free reroll, every 8 → 10 player damage
- Waiting Game | 1 or 2 free rerolls → 1 free reroll
- Lasting Effects | negative statuses last 40% → 50% longer
- Supportive Soul | another support item every 8 → 10 rounds
- Layered Armor | 4 SHIELD per shop roll, up to 200 → 2 SHIELD per shop roll, up to 100
- Morph Ball | 1 SPEED per 2 shop rolls → 1 SPEED per shop roll, up to 50 SPEED
- Heart Shield I | 4 → 5 HP per ally sharing a synergy
- Potion | 15 → 20 player HP, now also grants 5 GOLD
- Starter Pack | the Uncommon is now 2 STAR
- Silver Kit | random component + 2 RECYCLE_TICKET → SILVER_DOJO_TICKET + 2 RECYCLE_TICKET
- Additional Rethink I/II | 4/8 → 5/10 GOLD
- Treasure Hunt II | 3 → 4 synergy gems
- Badges | one 1 STAR Uncommon → one 1 STAR Uncommon and one 1 STAR Common
- Gear Shield I/II | now applies to all Pokémon instead of melee only
- Starter Choice | now also grants a SILVER_DOJO_TICKET
- Pocket Daycare | now also grants a SILVER_DOJO_TICKET
- Safari Encounter, All Fours | BRONZE_DOJO_TICKET → SILVER_DOJO_TICKET
- Taxes | 7 → 8 GOLD
- Called Shot | win streak 4 → 5, GOLD 4 → 5
- Munchlax Delivery | now also grants 5 GOLD, stage 4 only
- Gift Bag | now also grants 5 GOLD
- Quick Claw | now also grants 5 GOLD
- Greedy Wish | 10 → 20 GOLD if the next Wish is already Prismatic
- Baby Opener | 2 → 4 player HP per egg obtained
- Croagunk's Aid | now also grants 10 GOLD, EXCHANGE_TICKET 3 → 2
- Gold Kit | random component + 2 RECYCLE_TICKET → GOLD_DOJO_TICKET + 2 RECYCLE_TICKET
- Golden Ticket | removed
- Third Eye {{new}} | Silver Wish at stage 12: gain a Meditite and add it to the pool, Meditate is doubled under ZEN_ZONE
- Meditite Line | loses its passive, Meditate is only doubled with the Third Eye Wish
- Gym Trainer | one starter is locked until stage 9, like a Manifestation (the Epic, or the named Rare)
- Heart Shield II | 8 → 10 HP per ally sharing a synergy
- Crests | two 1 STAR Uncommons → one 1 STAR Uncommon and one 1 STAR Rare

**Pokémon**
- Urshifu (Single Strike) | training grants 10 AP.
- Urshifu (Rapid Strike) | training grants 5 SPEED.

**Fixes**
- Wishes | buying, rerolling and buying XP are locked while a Wish choice is open

### 16 September 2026

**Pokémon**
- Mienfoo Line | gains NORMAL

**Synergies**
- FIGHTING | throwing a target away also grants 10% CRIT_CHANCE per STAR
- FIGHTING | throwing a target away also inflicts PARALYSIS for 2s

**Fixes**
- FIGHTING | thrown DARK melee Pokémon wait 0.8s before jumping back in
- FIGHTING | a throw with no melee target in contact is now kept for the next hit instead of being lost

### 15 September 2026

**Pokémon**
- Oddish Line | Stun Spore → Sleep Powder
- Bellsprout Line | HP 70/140/220 → 60/130/200
- Chikorita Line | HP 80/160/280 → 70/140/220

**Abilities**
- Sleep Powder {{new}} | put 1/2/3 enemies in the backline to SLEEP for 2s, dealing 10 SPECIAL + 10 per tile between the user and the target
- Ingrain | no longer deals damage
- Petal Dance | damage 15/20/30 → 10/15/20
- Flamethrower | eruption no longer hits ADJACENT enemies, PP burn 100/150/200% → 100/200/300% of ATK

**Synergies**
- FLORA | Flower Pots must be grown in order

### 14 September 2026

**Pokémon**
- Meditite Line | new passive, Meditate is doubled under ZEN_ZONE
- Marshadow | loses HUMAN, ATK 20 → 23, new passive sets the weather to ZEN_ZONE
- Makuhita Line | counts as 3 for ZEN_ZONE
- Cobalion, Terrakion, Virizion | new passive, under ZEN_ZONE gain 4 DEF, ATK or SPE_DEF the first time each ally falls below 50% HP

**Abilities**
- Petal Blizzard | damage [30,SP] → 20 + [10,SP]

**Synergies**
- FIGHTING 8 | FIGHTING Pokémon cannot take more than 40% of their max HP in a single hit
- ZEN_ZONE {{new}} | FIGHTING weather, all Pokémon block 3 damage on every hit, 6 if FIGHTING

**Wishes**
- Shodan {{new}} | at FIGHTING 8, the single-hit cap drops from 40% to 20% max HP and the excess is redirected to an ADJACENT enemy
- Amazing Gardening | Gold → Prismatic, no longer grants a Gossifleur
- Brace for Impact | now a generic wish, all allies cannot take more than 40% max HP in a single hit, no longer grants a Machop, does not stack with FIGHTING 8

**Items**
- ZEN_BALL {{new}} | counts as 3 towards ZEN_ZONE, your team gains 4 DEF, awakens ROCK Pokémon as FIGHTING

**Fixes**
- Flower pots | once every pot is fully grown, collected mulch is AMAZE_MULCH again instead of RICH_MULCH
- LOCKED | ending it restores all bonus RANGE, including from COVERT_CLOAK and abilities

### 13 September 2026

**Pokémon**
- Bellsprout Line | DEF 3/5/7 → 1/3/5, HP 60/130/200 → 70/140/220, loses GRASS
- Chikorita Line | HP 70/140/220 → 80/160/280, loses GRASS
- Dracovish, Dracozolt, Arctozolt, Arctovish | HP 150 → 120
- Piloswine, Mamoswine | HP 120/200 → 100/180
- Cranidos | unlock DRAGON STAR needed 6 → 7
- Shieldon | unlock TRUE needed 100 → 120
- Tyrunt | unlock rerolls needed 12 → 15
- Spheal Line | ICE / WATER → ICE / AQUATIC / WATER
- Froakie, Frogadier | HP 80/140 → 60/120
- Litten | HP 90 → 70
- Nacli Line | HP 80/160/280 → 75/150/300
- Sprigatito Line | GRASS / FLORA / DARK → GRASS / DARK / HUMAN, HP 70/120/230 → 80/130/200, Meowscarada ATK 23 → 21
- Stoutland | HP 270 → 240, ATK 28 → 24, DEF and SPE_DEF 12 → 10
- Sandile Line | HP 80/150/220 → 60/140/200
- Litwick Line | HP 70/110/170 → 50/100/150
- Piplup Line | ATK 5/10/15 → 4/8/12
- Snivy Line | HP 90/160/240 → 80/130/200, DEF and SPE_DEF 2/2/2 → 2/3/4
- Lotad Line | HP 60/130/190 → 80/130/200, Ludicolo ATK 24 → 21
- Braixen, Delphox | HP 140/220 → 130/200, Delphox ATK 16 → 18
- Hydreigon | HP 200 → 220
- Roserade | HP 200 → 180
- Oddish Line | DEF 4/6/8 → 2/4/6, max PP 80 → 100
- Vespiquen | HP 190 → 180, DEF 8 → 6, max PP 90 → 100
- Bellossom | DEF 10 → 8

**Abilities**
- Defend Order | SHIELD 10/20/30/50 → 5/10/20/40
- Flower Trick | 15/40/85/170 → 25/50/100/200, per critical hit 15 → 20
- Ingrain | damage and heal 15/30/60/120 → 10/20/40/80
- Mystical Fire | damage per hit 30% → 40% ATK
- Petal Dance | damage per petal 20/30/50/100 → 15/20/30/60
- Sand Tomb | 200/300/400/500% → 100/200/300/400%

**Wishes**
- Legendary songs | the reinforcement Pokémon is only granted on stage 17, no longer on stage 22

**Items**
- ROCK_SALT | RUNE_PROTECT 10 → 5 seconds, SHIELD 15% → 50% max HP
- All Fairy wands | additional SPECIAL 15% → 20%
- BLAST_WAND on critical hit | 30% → 40%
- TWO_EDGED_WAND | 30% → 40%

**Fixes**
- EXP_CHARM | no longer gains PP from attacks blocked by PROTECT
- Dojo Tickets | can no longer be used on Pokémon locked on the bench by Manifestation
- Kyurem, Zacian, Zamazenta | still receive their PvE reward item while training in the Dojo
- FIGHTING knockback | removing a SHIELD now counts as breaking it, triggering ABILITY_SHIELD, EXPLOSIVE_BAND and similar effects
- Shield breaks | effects no longer trigger when SHIELD is removed from a Pokémon that had none
- Foul Play | deals the listed 2/4/6× target ATK instead of one star level higher

### 12 September 2026

**Pokémon**
- Rowlet | ATK 4 → 5
- Dartrix | HP 90 → 75, ATK 7 → 10
- Decidueye | HP 170 → 150, ATK 17 → 20, SPE_DEF 4 → 3
- Taillow | ATK 7 → 6
- Swellow | ATK 15 → 13
- Mega Feraligatr | permanent AP and SPEED gains are now capped at 100 each.

**Abilities**
- Hyper Drill | 10/30/50/100/200 → 10/20/40/50/100
- Sparkling Aria | 20/40/80/160 → 25/50/100/200
- Whirlpool | 100/115/125/250% → 125/125/125/250%

**Wishes**
- Park Bench {{new}} | gain a 9th bench slot. At the start of each round, gain 2 XP if your bench is full.
- Wild Escape | Ultra summons now also wait until stage 20, like Legendary ones.

**Items**
- Herba Mystica | renamed to Herb, always grants RUNE_PROTECT for the next fight
- LIFE_SEED, EYEDROP_SEED, EMPOWERMENT_SEED | only affect FLYING allies
- TINY_REVIVER_SEED | only raises the ATK of the resurrected ally

**Fixes**
- Hieroglyphs | no longer summons several Unown from one cast
- Double Up bundles | fall back to a regular-pool 2-star instead of Unown A
- Hotkeys | can be rebound again in Options

### 11 September 2026


**Abilities**
- Ingrain | damage and healing fall off by 20% per tile of distance

**Wishes**
- Prismatic Wish chance after a Gold Wish | 25% → 30%
- Blessing of Phione | PP granted by Phione 5 → 3
- Berry Growth | permanent max HP per Berry +10/+15 → +20/+30
- Brute Shield II | ATK 3 → 4
- Champion's Mask | SHIELD per FIGHTING tier 50 → 100
- Gracidea Garden | heal 5% → 10% max HP
- Impending Doom | Gold → Silver, no longer grants a Dartrix
- King of the Monsters | Hyper Beam every 8 → 6 seconds
- Layered Armor | SHIELD per roll 3 → 4, capped at 200
- Lone Wolf | SPEED duration 5 → 10 seconds, plus 2 permanent ATK
- Lucky Feather | also grants 2 DEF ON_ATTACK
- Morph Ball | 1 SPEED per roll → 1 SPEED per 2 rolls
- Orb Wand | AP capped at 100
- Parting Gift | SHIELD 50 → 100
- Plushify | the Substitute also gets PROTECT for 1.5 seconds
- Scorching Tome | damage amp 30% → 40%
- Power Mirror | AP per hit 5 → 10
- Quest: Crit | target CRIT_POWER 5 → 4.5
- Rainbow Droplet | synergies required 8 → 9
- Haunted Cloth | the Ghost cannot be targeted for 8 seconds
- Lock-On Lens | now offered at stage 4 as well as 12
- Spiky Guard | retaliation 10% → 15%, plus 5 SHIELD per free ADJACENT tile
- Sticky Thorns | when the holder is KO'd, the barb passes to an ADJACENT ally

### 10 September 2026

**Pokémon**
- Bounsweet Line | max PP 120 → 80

**Abilities**
- Trop Kick | reworked, kicks twice plus once more each cast, up to 8

**Wishes**
- Gym Trainer | you can no longer move on the stage 10 carousel.
- Fire / Field Gym Trainer | Ponyta and Growlithe → Litten and Cyndaquil
- Poison / Amorphous Gym Trainer | Koffing → Gastly
- Abnormality | NORMAL Pokémon also gain 5 AP per empty ADJACENT tile.
- All for One | the Substitute no longer takes up board space.
- Ruby Orb reworked | every 4 attacks, erupt on the target and ADJACENT enemies for 20 SPECIAL and BURN.
- Shady Price | keeps all 6 shop slots, rerolls cost 4 GOLD once the free ones are spent.
- Sweet Subscription | stage 4 only

### 9 September 2026

**Pokémon**
- Hisuian Samurott | WATER → AQUATIC
- Spheal Line | AQUATIC / ICE → ICE / WATER
- Cinderace (Pirate) | DARK → AQUATIC
- Seedot / Nuzleaf | HP 60/120 → 50/100

**Wishes**
- Wish tiers | stage 12 now depends on the tier offered at stage 4, see Wiki > Data
- A New Friend | now an Uncommon from a 3-star line
- Quick Fang | follow-up attack 40% → 25% ATK
- Shady Price | Gold → Silver
- Super Upgrade | stacks required 12 → 10
- Vision of Truth | attacks required 4 → 2

**Fixes**
- Seeing Triple | clones Combees on Vespiquen instead of Vespiquen

### 7 September 2026

**Wishes**
- Empower I and II {{new}}
- Gamble I, II and III {{new}}
- Heart Shield I and II {{new}}
- Layered Armor, Morph Ball and Orb Wand {{new}}
- Rank Up {{new}}
- Shady Price {{new}}
- Drill, Shatter and Surge | trigger threshold 60% → 70% max HP
- Shatter | reworked to deal 40% of DEF and SPE_DEF to ADJACENT enemies every second
- Coast Wave | tidal wave delay 4 → 12 seconds
- Sticky Thorns | self-damage 20% → 150% ATK

### 6 September 2026

**Pokémon**
- Quaxwell / Quaquaval | HP 140/220 → 120/200
- Roggenrola Line | max PP 90 → 100
- Snorunt | HP 60 → 50, ATK 6 → 5
- Chikorita Line | RANGE 2 → 3
- Combusken | ATK 14 → 12
- Origin Palkia | max PP 130 → 140
- Shaymin | ATK 25 → 22, RANGE 3 → 4
- Shaymin (Sky) | ATK 28 → 25, RANGE 3 → 5
- Rowlet | HP 50 → 45, ATK 5 → 4
- Dartrix | HP 100 → 90, ATK 9 → 7
- Stunky Line | max PP 80 → 90, Skuntank HP 280 → 250

**Abilities**
- Flora abilities | hit within the caster's RANGE, several lose power with distance
- Spirit Shackle | 25/50/75/150 → 20/40/80/160
- Time Travel | also grants +1 RANGE

**Wishes**
- Verdant Growth {{new}}

**Items**
- BAN_SEED, SLEEP_SEED, STUN_SEED and TOTTER_SEED | status 3 → 2 seconds
- DOOM_SEED | KO after 4 → 8 seconds
- EMPOWERMENT_SEED | CRIT_POWER 25% → 10%
- EYEDROP_SEED | RANGE +3 → +2, no longer grants SPEED
- PURE_SEED | AP 50 → 25

### 5 September 2026

**Wishes**
- Gym Trainer {{new}} | one for each pair of synergies
- Gym Leader {{new}}

### 4 September 2026

**Wishes**
- Blighted Garden {{new}}
- Convergent Paradox {{new}}
- Rocky Exoskeleton {{new}}
- Earthen Barrier {{new}}
- Frozen Ocean {{new}}
- Fury Unleashed {{new}}
- Human Horror {{new}}
- Hydrated Cells {{new}}
- Magic Metals {{new}}
- Midnight Sun {{new}}
- Mind Rush {{new}}
- Monstrous Gluttony {{new}}
- Shedding Scales {{new}}
- Steam Engine {{new}}
- Symbiotic Symphony {{new}}

### 2 September 2026

**Wishes**
- Synergy Crests | grant a signature item instead of a Gem
- Synergy Crowns | include a LAPRAS_PASSPORT and a stronger starter
- Absolute Darkness | BLINDED chance 5% → 10%
- Auto-Crafting | components granted 2 → 3
- Berry Growth | golden Berries when taken at stage 12, 2 → 5
- Berserker Hordes | WILD-only shop every 10 → 8 shops
- Chef's Greed | Gold → Prismatic
- Deep Wounds | permanent DEF and SPE_DEF removed 2 → 4
- Dragon King | SHIELD per star 5 → 10, SPEED and AP per star 1 → 2
- Festive Picnic | Prismatic → Gold, permanent max HP 5 → 10
- Impending Doom | Prismatic → Gold, delay 10 → 7 seconds
- Jester | CRIT_POWER needed per extra star 100% → 50%
- Machine Residue | SHIELD from SPIKES 20 → 50
- Molecular Corrosion | extra damage taken 30% → 25%
- Move Tutor | max PP 80 → 70

### 28 August 2026

**Wishes**
- Amazing Gardening | no longer grants an extra flower when one fully evolves

### 27 August 2026

**Pokémon**
- Dragonite | passive removed

**Synergies**
- FLYING 8 | Letter rewards simplified, no longer include Big Nuggets or full items

**Wishes**
- Big Pecks | reworked, your Pokémon deliver their LETTER one stage faster

**Items**
- Sharp Beak | removed

### 26 August 2026

**Pokémon**
- Magby Line | max PP 120 → 125
- Magmar | gains ARTIFICIAL, HP 130 → 125
- Magmortar | gains ARTIFICIAL, HP 270 → 250, ATK 28 → 30
- Origin Palkia | max PP 120 → 130

**Synergies**
- FLYING 8 | Letter rewards give fewer components and more Rusty Coins

**Wishes**
- High Breaching | no longer sets max PP to 60
- Shared Vision | allies now have a minimum of 100 max PP instead of their PP set to 100

**Items**
- BAN_SEED, BLINKER_SEED, SLEEP_SEED, STUN_SEED and TOTTER_SEED | Sky Dive damage 300% → 250% ATK
- QUICK_SEED | SPEED per free ADJACENT tile 10 → 5
- TRAINING_SEED | no longer grants SPEED

### 25 August 2026

**Pokémon**
- Dracovish, Dracozolt, Arctozolt, Arctovish | HP 180 → 150, ATK reduced by 2
- Slither Wing | ADJACENT ally bonuses +5/+10/+5 → +2/+4/+2

**Abilities**
- Scale Shot | 6/10/20/40 → 2/6/10/20

**Wishes**
- Abyssal Fang, Ancient Crown and Blessing of Phione {{new}}
- Charm of Truth, Clear Diamond and Coast Wave {{new}}
- Counter Pads, Exp Book and Focus Glove {{new}}
- Gracidea Garden, Haunted Cloth and Honed Claw {{new}}
- King's Crown, Knock Off Punch and Lock-On Lens {{new}}
- Lucky Feather, Mist Cloak and Power Mirror {{new}}
- President Box, Quick Fang and Red Thread {{new}}
- Revival Pulse, Scorching Tome and Seizing Claw {{new}}
- Shared Vision, Shuriken and Soothe Carol {{new}}
- Star Dust Veil, Sticky Thorns and Super Upgrade {{new}}
- Supreme Ability Shield, Telescope and Training Band {{new}}
- Vision of Truth, Weatherproof Goggles and Wild Escape {{new}}
- Quests | rewards now also include a RECYCLE_TICKET

### 23 August 2026

**Pokémon**
- Popplio Line | no longer regional

**Wishes**
- High Breaching {{new}}

### 22 August 2026

**Pokémon**
- Magby Line | RANGE 2 → 3, max PP 80 → 120, HP reduced by 10
- Magmar, Magmortar | DEF and SPE_DEF reduced by 1
- Fuecoco Line | RANGE 3 → 2
- Makuhita Line | Rare → Epic, HP 80/200 → 100/280, Hariyama ATK 23 → 24
- Hisuian Voltorb Line | max PP 100 → 80
- Bewear | gains WILD
- Yamask Line | loses FOSSIL
- Dracovish, Dracozolt, Arctozolt, Arctovish | now Special units restored from fossil pairs, with new passives, max PP 100 → 60
- Archen Line | Uncommon → Rare, HP 70/130 → 80/160, ATK 6/13 → 9/18, DEF and SPE_DEF increased by 1, Archeops max PP 100 → 90
- Shieldon Line | Rare → Epic, Iron Defense → Hard Face, HP 90/250 → 140/300, ATK 7/11 → 4/8, DEF 6/12 → 12/18, SPE_DEF 4/8 → 10/14
- Lileep Line | Rare → Uncommon, ROCK / AQUATIC / FLORA → FOSSIL / GRASS / AQUATIC, HP 80/180 → 60/140, ATK 7/22 → 6/16
- Cranidos Line | Uncommon → Epic, HP 60/160 → 90/180, ATK 7/15 → 14/32
- Kabuto Line | Rare → Common, BUG → DARK, Protect → Slashing Claw, HP 80/190 → 60/120, ATK 8/22 → 6/10, max PP 80 → 100
- Omanyte Line | Uncommon → Common, HP 70/150 → 50/100, ATK 6/14 → 4/8, max PP 90 → 100
- Clamperl Line | Epic → Rare, Clamperl HP 100 → 60, Huntail HP 200 → 140, lower DEF and SPE_DEF across the line
- Tyrunt Line | Rare → Epic, HP 70/170 → 120/220, ATK 8/18 → 13/22, DEF 8/12 → 10/14
- Wimpod Line | Epic → Common, MONSTER → FOSSIL, HP 90/180 → 40/80, ATK 8/20 → 2/8

**Abilities**
- Amping Beak, Frozen Beak and Frozen Rend {{new}}
- Hard Face {{new}}
- Dynamic Punch | 40/80/160/320 → 50/100/200/400
- First Impression | 45/90/180/360 → 25/50/100/200, FLINCH 5 → 3 seconds
- Fishious Rend | reworked, seizes the farthest enemy until the user is KO'd
- Flamethrower | reworked, burns PP equal to 100/150/200/400% ATK and erupts the excess as SPECIAL
- Head Smash | 40/80/150/300 → 90/120/150/300
- Rock Head | 120/120/150/300% → 150/200/250/300%
- Rock Smash | 25/50/100/200 → 50/75/120/200

**Synergies**
- FOSSIL 8 | new tier, unlocks the Restoration Panel
- Fossil lines and Tangela | unlocked through the Restoration Panel instead of additional picks
- POISON 3 | no longer gains PP or ruptures
- POISON 5 | rupture 80% → 60% of remaining PP
- POISON 7 | rupture 120% → 100% of remaining PP
- FIRE 8 | IGNITE SHIELD 30 → 50
- DARK 5 | BLINDED when the Substitute is KO'd 3 → 2 seconds
- DARK 9 | untargetable after a KO 3 → 1.5 seconds
- FLYING 4 | ATK reduction now ON_ATTACK, 2 → 1

**Items**
- COVERT_CLOAK | also triggers at the start of the fight
- FIRE_SHARD | player HP cost 3 → 2

### 20 August 2026

**Wishes**
- Misfits | stage 4 only, HP and AP 40 → 30, ATK, DEF and SPE_DEF 4 → 3, now also grants 3 SPEED
- Shell Armor | removed from the wish pool
- Quests | rewards now also include an EXCHANGE_TICKET

### 18 August 2026

**Abilities**
- Overdrive | radius 3 → 4 in ELECTRIC_FIELD

**Synergies**
- POISON | reworked, POISON Pokémon gain PP ON_ATTACK and rupture on KO, dealing part of their remaining PP as SPECIAL to ADJACENT enemies
- POISON 7 | no longer corrodes items
- FIRE 6 | grants a FIRE_SHARD every round, moved from FIRE 8
- FIRE 8 | a FIRE_SHARD can now IGNITE a Pokémon for 1 round

**Wishes**
- Manifestation: DEF {{new}}
- Atlantean Magic and Neuroforce | Gold → Prismatic
- Beauty Contest, Singularity II and Water Fountain | Prismatic → Gold
- Berry Breakfast and Forecast | Gold → Silver
- Regional Treasures and Requiem | Silver → Gold
- Singularity I | Gold → Silver
- Croagunk's Aid | Silver → Gold, stage 4 only, benching a Pokémon returns its items
- Gold Kit and Silver Kit | stage 12 only, renamed from Wobbuffet's Gold and Silver Prize
- Regional Treasures II | stage 4 only, no longer grants Pokémon
- Additional Rethink I and II | now also grant 4 and 8 GOLD
- All for One | Substitute max HP 60% → 100%
- Axe Blast | RANGE +2 → +1
- Brace for Impact | damage cap 50% → 40% max HP
- Burning Shards and Charging Up | player damage per item 15 → 12
- Deep Wounds | DEF and SPE_DEF removed 1 → 2
- Drill, Shatter and Surge | trigger threshold 50% → 60% max HP
- Echo Chamber | PP 3 → 2 and 6 → 4
- Efficient Economy | XP per reroll 1 → 2
- Exhausting Flame | now also grants 5 LUCK per STAR
- Fast Food Delivery | dishes last 1 → 3 rounds
- Fertile Soil | max HP on a fully dug hole 20% → 10%
- Gem Harvest | no longer grants ATK per gem
- Grand Ignition | Fennekin loses 10% max PP per torch
- Icebreaker | KOs also grant 20 LUCK
- Itemfinder III | rounds 6 → 5
- Language Barrier | SHIELD 15 → 30
- Minimalist I and II | PP per empty slot 10% → 8% and 15% → 12%
- Molecular Corrosion | extra damage taken 40% → 30%
- Pack Attack | Houndoom chance 20% → 15%
- Panic Button | the draw now deals 4 player damage
- Potential Energy I | now per missing STAR, SHIELD 25 → 20, SPEED 5 → 10
- Potential Energy II | now per missing STAR, SHIELD 40 → 30, SPEED 10 → 20
- Pulse Shield I and II | SHIELD 50% → 70% of SPEED
- Quest: Absorb and Quest: Grow | target 1300 → 1000
- Quest: Evolve II | evolutions needed 16 → 12
- Quest: Expand | sell price needed 5 → 4
- Quest: Revive | revives needed 20 → 16
- Rainbow Droplet | synergies needed 7 → 8
- Rivalry | permanent HP 5 → 4, no longer grants a RELIC_CROWN
- Sacrifice | the MONSTER is also ENRAGED for 2 seconds
- Shapeless Synergies | bonus SPEED 100% → 50%
- Soul Blaze | reworked, IGNITE works at any FIRE tier with no cooldown
- Vampiric | player HP now 1 per 10 player damage dealt
- Gold Bar | renamed from Nugget
- Gift Bag | renamed from Free Coupon

**Items**
- FIRE_SHARD | ATK and SPEED +4 → +2

### 17 August 2026

**Pokémon**
- Scream Tail | HP 140 → 210, ATK 14 → 16

**Wishes**
- Frost Gear | RANGE +2 → +3, no longer loses max HP on cast, Shell Smash ATK scales with AP
- Mortar Shells | base ATK +100% → +150%

**Items**
- SYNCHRO_MASHINE | no longer copies CRIT_CHANCE and CRIT_POWER

### 16 August 2026

**Wishes**
- Brave Formation, Guard Formation and Tough Formation {{new}}
- Critical Path I and II {{new}}
- Critical Rush I and II {{new}}
- Exploit, Lasting Effects and Rippling Effects {{new}}
- Lone Wolf, Parting Gift and Requiem {{new}}
- Minimalist I and II {{new}}
- Pulse Shield I and II {{new}}
- Reveille {{new}}
- Water Fountain | Pond effects doubled at WATER 6, quadrupled at WATER 9

### 15 August 2026

**Wishes**
- Banana Business, Munchlax Delivery and Sweet Treats | Gold → Silver
- Banana Business | NANAB_BERRY per stage 1 → 3
- Berry Breakfast | now also grants 3 Berries
- Impending Doom | delay 12 → 10 seconds
- Vampiric | team healing 10% → 20%
- Bowl of Berries | renamed from Berry Pouch
- Breaking Bones | renamed from Misfortune

### 14 August 2026

**Pokémon**
- Igglybuff Line | Sing → Inhale, new passive Inflatable, max PP 90 → 100
- Houndoom, Mega Houndoom | ATK 24 → 20
- Hippowdon | gains WILD
- Grookey Line | RANGE 1 → 2

**Abilities**
- Rock Artillery | 20/30/40/80 → 15/25/35/70
- Sand Tomb | reworked into quicksand that SILENCE and deals ATK-based SPECIAL when it ends

**Wishes**
- Show Off {{new}}
- Quest: Epic | 7 Unique, 7 Epic or 7 Ultra Pokémon now count separately

### 13 August 2026

**Wishes**
- Auto-Crafting, Center Stage and Hieroglyphs {{new}}
- Brute Shield I and II {{new}}
- Burning Force and Spiky Guard {{new}}
- Calculated Offence, Machine Residue and Robin Gems {{new}}
- Drill I and II {{new}}
- Gear Shield I and II {{new}}
- Magic Shield I and II {{new}}
- Shatter I and II {{new}}
- Star Guard {{new}}
- Surge I and II {{new}}
- Adoption Agency | stage 4 only
- Spore Clouds | stage 12 only
- Magnetosphere | PARALYSIS 5 → 8 seconds
- Quest: Crit | CRIT_POWER needed 4 → 5

### 12 August 2026

**Wishes**
- Champion's Mask {{new}}
- Curse of Two | Gold → Prismatic
- Unison | HUMAN damage also builds a bond that is released as SPECIAL

### 11 August 2026

**Synergies**
- BUG 8 | BUG Pokémon copied 5 → 4

**Wishes**
- Adoption Agency, Archeological Site and Bull Leaping {{new}}
- Festive Picnic, Fogbound Lake and Furious Fabric {{new}}
- Gem Harvest, Grudge and Icy Reflection {{new}}
- King of the Monsters, Limit Breaker and Magnetosphere {{new}}
- Mystogan, Overload and Rainbow Droplet {{new}}
- Tidal Guardian {{new}}
- Deep Wounds | ARMOR_BREAK 3 → 5 seconds
- Molecular Corrosion | extra damage taken 30% → 40%

**Items**
- RELIC_STATUE | no longer grants AP, curse delay 3 → 1 second

### 10 August 2026

**Pokémon**
- Arcanine, Hisuian Arcanine | passive can IGNITE every round

**Wishes**
- Berry Growth, Deep Wounds and Fast Delivery {{new}}
- Fertile Soil, Molecular Corrosion and Soul Blaze {{new}}
- Unison and Water Fountain {{new}}
- Bag of Sweets | SWEETS 4 → 10

### 9 August 2026

**Pokémon**
- Scizor, Kleavor | sell for 4 GOLD

**Wishes**
- Colony, Grand Ignition and Jester {{new}}
- Sand Buddies, Toxic Resonance and Valor {{new}}
- Hail to the King | Gold → Prismatic
- Safari Encounter | Gold → Silver
- Legendary songs and Rivalry | stage 12 only

**Items**
- FIERY_DRUM | ATK per cast +3 → +2
- SKY_MELODICA | SPEED per cast +5 → +4

### 8 August 2026

**Pokémon**
- Politoed | max PP 90 → 100

**Wishes**
- Wish Festival beta {{new}} | over 200 wishes, offered at stages 4 and 12
- Chosen Ones | Gold → Prismatic
- Replicator | Gold → Silver
- You Forgot Something! | Prismatic → Gold
- Golden Ticket, Vitamins and Weather Institute | stage 12 only
- Absolute Darkness | reworked, 5% chance to BLINDED ON_ATTACK, damage becomes TRUE on crits against BLINDED enemies
- Charging My Bug | permanent ATK 1 → 2
- Misfits | HP and AP 50 → 40, ATK, DEF and SPE_DEF 5 → 4, now per STAR
- Quest: Crit | CRIT_POWER needed 5 → 4
- Quest: Evolve II | evolutions needed 20 → 16
- Rivalry | permanent ATK 2 → 1, permanent HP 10 → 5
- Tidal Surge | items needed 3 → 2
- Vitamins | now at the start of the fight, ATK 1 → 2, AP and SPEED 5 → 10
- Dragon Orb | renamed from Dragon Fang

### 6 August 2026

**Pokémon**
- Grubbin Line | AMORPHOUS → SOUND, HP 70/120/180 → 65/115/175, max PP 100 → 85, Charjabug and Vikavolt ATK 11/17 → 10/16

**Abilities**
- Unbound | the summoned Legendary starts at 50% of its base max HP, plus 25% per 100 AP
