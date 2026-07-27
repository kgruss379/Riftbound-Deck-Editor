export const MOCK_CARDS = {
  legends: [
    { id: 'l1', name: 'The Firestarter', type: 'Legend', domains: ['Fire'], image: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Annie_0.jpg', text: 'Your Fire spells deal +1 damage. Sets your Domain Identity to Fire.' },
    { id: 'l2', name: 'Tidal Sage', type: 'Legend', domains: ['Water'], image: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Nami_0.jpg', text: 'When you play a Water unit, draw a card. Sets your Domain Identity to Water.' },
    { id: 'l3', name: 'Stone Warden', type: 'Legend', domains: ['Earth'], image: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Malphite_0.jpg', text: 'Your Earth units gain +1 Health. Sets your Domain Identity to Earth.' },
    { id: 'l4', name: 'Windrunner', type: 'Legend', domains: ['Air'], image: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Janna_0.jpg', text: 'Your Air units have Haste. Sets your Domain Identity to Air.' },
    { id: 'l5', name: 'Steam Arcanist', type: 'Legend', domains: ['Fire', 'Water'], image: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Xerath_0.jpg', text: 'Allows combining Fire and Water cards. Your spells cost 1 less rune.' },
    { id: 'l6', name: 'Sandstorm Mage', type: 'Legend', domains: ['Fire', 'Earth'], image: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Taliyah_0.jpg', text: 'Allows combining Fire and Earth cards. When a friendly unit dies, deal 1 damage to an enemy.' },
    { id: 'l7', name: 'Stormbringer', type: 'Legend', domains: ['Water', 'Air'], image: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Volibear_0.jpg', text: 'Allows combining Water and Air cards. Your units gain flying when a spell is cast.' },
  ],
  champions: [
    { id: 'c1', name: 'Lux, Light Binding', type: 'Champion', domains: ['Air'], cost: 4, power: 3, health: 5, image: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Lux_0.jpg', text: 'Signature: Prismatic Barrier. When you cast a spell, deal 1 damage to the enemy champion.' },
    { id: 'c2', name: 'Yasuo, Unforgiven', type: 'Champion', domains: ['Air'], cost: 4, power: 4, health: 4, image: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Yasuo_0.jpg', text: 'Signature: Wind Wall. When an enemy is stunned, strike them for 2 damage.' },
    { id: 'c3', name: 'Garen, Might of Demacia', type: 'Champion', domains: ['Earth'], cost: 5, power: 5, health: 6, image: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Garen_0.jpg', text: 'Signature: Decisive Strike. Tough (Takes 1 less damage from all sources).' },
    { id: 'c4', name: 'Brand, Burning Vengeance', type: 'Champion', domains: ['Fire'], cost: 4, power: 4, health: 3, image: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Brand_0.jpg', text: 'Signature: Pyroclasm. When Brand attacks, deal 2 damage to all opposing units.' },
    { id: 'c5', name: 'Fizz, Tidal Trickster', type: 'Champion', domains: ['Water'], cost: 3, power: 2, health: 3, image: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Fizz_0.jpg', text: 'Signature: Chum the Waters. Cannot be targeted by spells while you have active Water runes.' },
  ],
  runes: [
    { id: 'r1', name: 'Embers of Fury', type: 'Rune', domains: ['Fire'], image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/BrandW.png', text: 'Exhaust: Add 1 Fire resource.' },
    { id: 'r2', name: 'Flow of Wisdom', type: 'Rune', domains: ['Water'], image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/FizzW.png', text: 'Exhaust: Add 1 Water resource.' },
    { id: 'r3', name: 'Roots of Bastion', type: 'Rune', domains: ['Earth'], image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/GarenW.png', text: 'Exhaust: Add 1 Earth resource.' },
    { id: 'r4', name: 'Zephyr Whispers', type: 'Rune', domains: ['Air'], image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/JannaE.png', text: 'Exhaust: Add 1 Air resource.' },
  ],
  mainDeck: [
    // Fire Cards
    { id: 'm1', name: 'Fire Adept', type: 'Unit', domains: ['Fire'], cost: 1, power: 2, health: 1, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/tiles/Annie.png', text: 'Play: Deal 1 damage to an enemy unit.' },
    { id: 'm2', name: 'Flame Burst', type: 'Spell', domains: ['Fire'], cost: 2, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/BrandW.png', text: 'Deal 3 damage to any target.' },
    { id: 'm3', name: 'Ignite', type: 'Spell', domains: ['Fire'], cost: 1, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/SummonerDot.png', text: 'Deal 1 damage. The target takes 1 damage at the end of each turn.' },
    { id: 'm4', name: 'Sunfire Aegis', type: 'Gear', domains: ['Fire'], cost: 3, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/item/3068.png', text: 'Attached unit gains +1/+2 and deals 1 damage to adjacent enemies each turn.' },
    { id: 'm5', name: 'Infernus Dragon', type: 'Unit', domains: ['Fire'], cost: 6, power: 6, health: 5, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/tiles/Shyvana.png', text: 'Flying. Play: Burn the opposing battlefield, dealing 2 damage to all enemies.' },
    
    // Water Cards
    { id: 'm6', name: 'Tidecaller', type: 'Unit', domains: ['Water'], cost: 1, power: 1, health: 2, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/NamiW.png', text: 'Play: Heal a friendly unit or champion for 2.' },
    { id: 'm7', name: 'Frostbite', type: 'Spell', domains: ['Water'], cost: 2, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/AniviaR.png', text: 'Freeze an enemy unit, preventing it from attacking next turn.' },
    { id: 'm8', name: 'Aqua Barrier', type: 'Spell', domains: ['Water'], cost: 2, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/FizzE.png', text: 'Give a friendly unit Spell Shield.' },
    { id: 'm9', name: 'Abyssal Mask', type: 'Gear', domains: ['Water'], cost: 3, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/item/8020.png', text: 'Attached unit gains +0/+3 and reduces spell cost of adjacent units.' },
    { id: 'm10', name: 'Leviathan Reef-Crusher', type: 'Unit', domains: ['Water'], cost: 5, power: 4, health: 6, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/tiles/Nautilus.png', text: 'Tough. Play: Stun an enemy unit.' },

    // Earth Cards
    { id: 'm11', name: 'Vanguard Defender', type: 'Unit', domains: ['Earth'], cost: 2, power: 1, health: 4, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/GarenW.png', text: 'Taunt (Enemies must attack this unit first).' },
    { id: 'm12', name: 'Decisive Strike', type: 'Spell', domains: ['Earth'], cost: 2, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/GarenQ.png', text: 'Silence an enemy unit and give a friendly unit +2/+0.' },
    { id: 'm13', name: 'Tremor Shock', type: 'Spell', domains: ['Earth'], cost: 3, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/MalphiteR.png', text: 'Deal 2 damage to all ground units.' },
    { id: 'm14', name: 'Thornmail', type: 'Gear', domains: ['Earth'], cost: 3, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/item/3075.png', text: 'Attached unit gains +1/+3. When attacked, deal 1 damage back to the attacker.' },
    { id: 'm15', name: 'Mountain Golem', type: 'Unit', domains: ['Earth'], cost: 6, power: 5, health: 8, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/tiles/Malphite.png', text: 'Overwhelm. Cannot be moved or bounced.' },

    // Air Cards
    { id: 'm16', name: 'Cloud Scout', type: 'Unit', domains: ['Air'], cost: 1, power: 1, health: 1, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/JannaW.png', text: 'Elusive. Play: Draw 1 card.' },
    { id: 'm17', name: 'Wind Wall', type: 'Spell', domains: ['Air'], cost: 2, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/YasuoW.png', text: 'Negate an enemy spell targeting a friendly unit.' },
    { id: 'm18', name: 'Zephyr strike', type: 'Spell', domains: ['Air'], cost: 1, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/JannaQ.png', text: 'Return a unit costing 3 or less to its owner\'s hand.' },
    { id: 'm19', name: 'Statikk Shiv', type: 'Gear', domains: ['Air'], cost: 3, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/item/3087.png', text: 'Attached unit has +1/+0 and strikes 3 enemies for 1 damage on attack.' },
    { id: 'm20', name: 'Stormbringer Griffin', type: 'Unit', domains: ['Air'], cost: 5, power: 3, health: 4, image: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/tiles/Anivia.png', text: 'Flying, Haste. Play: Relocate another unit to an adjacent battlefield.' },
  ],
  battlefields: [
    { id: 'b1', name: 'Summoner\'s Rift', type: 'Battlefield', image: 'https://ddragon.leagueoflegends.com/cdn/img/map/map11.png', text: 'Units placed here gain +1/+1 if you control another unit on this battlefield.' },
    { id: 'b2', name: 'Howling Abyss', type: 'Battlefield', image: 'https://ddragon.leagueoflegends.com/cdn/img/map/map12.png', text: 'Spells cost 1 less resource when targeting units on this battlefield.' },
    { id: 'b3', name: 'Twisted Treeline', type: 'Battlefield', image: 'https://ddragon.leagueoflegends.com/cdn/img/map/map10.png', text: 'Units have Elusive during the first turn they are played here.' },
    { id: 'b4', name: 'Freljord Tundra', type: 'Battlefield', image: 'https://ddragon.leagueoflegends.com/cdn/img/map/map12.png', text: 'At the start of the round, freeze all units with 1 power here.' },
    { id: 'b5', name: 'Shadow Isles Ruins', type: 'Battlefield', image: 'https://ddragon.leagueoflegends.com/cdn/img/map/map10.png', text: 'When a unit dies here, its owner draws a card.' },
  ]
};
