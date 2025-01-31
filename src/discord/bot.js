import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseDicePool, rollDice, calculateStats, formatRollResults } from './dice-utils.js';
import { createClient } from '@supabase/supabase-js';
import errataKeys from './public/errata-keys.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Load the nickname mappings
const legacyNicknameMap = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'public/legacy-nickname-map.json'), 'utf8')
);
const legendsNicknameMap = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'public/legends-nickname-map.json'), 'utf8')
);

const armadaNicknameMap = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'public/armada-nickname-map.json'), 'utf8')
);

// Define server IDs as constants
const LEGACY_SERVER_ID = '1128659616222425141';
const LEGENDS_SERVER_ID = '1256627568627421205';
const TEXAS_SERVER_ID = '1256627568627421205';
const ARMADA_SERVER_ID = '219608175333081088';
const UK_SERVER_ID = '690948893122363443';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Add this near the top with other constants
const KEYWORD_RESPONSES = {
  'tragedy': {
    reaction: '😢',
    gifUrl: 'https://media1.giphy.com/media/l3diT8stVH9qImalO/giphy.gif?cid=6c09b9525fdxdlzp64duce6cahijwny0yfn1nc546o905q5v&ep=v1_gifs_search&rid=giphy.gif&ct=g'
  }
  // Add more keywords and responses as needed, for example:
  // 'hello': {
  //   reaction: '👋',
  //   gifUrl: 'some_gif_url_here'
  // }
};

// Add this helper function before the messageCreate event handler
function isDummyCard(cardName) {
  return cardName.toLowerCase().includes('dummy');
}

// In the messageCreate event handler, modify the !holo logic:
function filterDummyCards(matches) {
  if (!matches) return null;
  return matches.filter(match => !match.includes('dummy'));
}

// Add this helper function before the messageCreate event handler
function hasErrata(cardKey) {
  // Remove any existing -errata suffix for checking
  const baseKey = cardKey.replace(/-errata(-.*)?$/, '');
  
  // Check all categories in errata keys
  for (const category of Object.values(errataKeys)) {
    // Look for exact match with -errata
    const exactMatch = category.find(key => {
      // Remove any source suffixes (like -arc or -old-legacy)
      const cleanKey = key.replace(/-errata(-.*)?$/, '');
      return cleanKey === baseKey;
    });
    
    if (exactMatch) {
      // If the match has a source suffix, only return true if it's the base -errata
      return !exactMatch.match(/-errata-.*$/);
    }
  }
  return false;
}

// Add this function to handle image path generation
function getImagePath(cardKey) {
  if (hasErrata(cardKey)) {
    return `${cardKey}-errata`;
  }
  return cardKey;
}

client.on('messageCreate', async message => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Check message content against keywords
  const messageContent = message.content.toLowerCase();
  
  for (const [keyword, response] of Object.entries(KEYWORD_RESPONSES)) {
    if (messageContent.includes(keyword)) {
      try {
        // Add reaction
        await message.react(response.reaction);
        
        // If there's a gif URL, send it as an embed reply
        if (response.gifUrl) {
          const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setImage(response.gifUrl);
          
          await message.reply({ embeds: [embed] });
        }
      } catch (error) {
        console.error(`Error responding to keyword "${keyword}":`, error);
      }
    }
  }

  // Check if message contains only a star-forge.tools/share link
  const fleetLinkRegex = /^https?:\/\/star-forge\.tools\/share\/(\d+)\/?$/;
  if (message.content.trim().match(fleetLinkRegex)) {
    const fleetId = message.content.match(fleetLinkRegex)[1];
    
    try {
      // Fetch fleet data from Supabase
      const { data: fleet, error } = await supabase
        .from('fleets')
        .select('*')
        .eq('numerical_id', fleetId)
        .eq('shared', true)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return message.reply(`Database error: ${error.message}`);
      }
      
      if (!fleet) {
        return message.reply('Fleet not found or not marked as shared.');
      }

      // Parse the fleet data
      const fleetData = fleet.fleet_data;
      const embed = await formatFleetEmbed(fleetData, fleetId);

      // Delete original message and send embed
      await message.delete();
      const response = await message.channel.send({ embeds: [embed] });

      // Add reaction to indicate clickable elements
      await response.react('🔍');
    } catch (error) {
      console.error('Error processing fleet link:', error);
      message.reply(`Error processing fleet: ${error.message}`);
    }
  }

  // Get the appropriate nickname map based on server ID
  const nicknameMap = message.guild?.id === LEGACY_SERVER_ID 
    ? legacyNicknameMap 
    : message.guild?.id === LEGENDS_SERVER_ID
      ? legendsNicknameMap
      : message.guild?.id === TEXAS_SERVER_ID
        ? legacyNicknameMap
        : message.guild?.id === ARMADA_SERVER_ID || message.guild?.id === UK_SERVER_ID
          ? armadaNicknameMap
          : legendsNicknameMap; // default to legends for any other server

  // Help commands
  if (message.content.toLowerCase().match(/^!help$/)) {
    const embed = new EmbedBuilder()
      .setTitle('Holocron Bot Help')
      .setDescription('Welcome to the Holocron Bot! Use !help to get a list of commands in any channel:')
      .addFields(
        { 
          name: '🎲 Dice Rolling',
          value: [
            '`!dice [quantity][color]`',
            'Roll Armada dice and get detailed statistics.',
            '**Example:** `!dice 2red 2blue 1black`',
            '**Available colors:** red, blue, black',
            '**Stats include:** Average damage, accuracy chance, crit chance, and more!'
          ].join('\n')
        },
        {
          name: '🔍 Card Search',
          value: [
            '`!holo [card name]`',
            'Search for cards by name or nickname.',
            '**Basic search:** `!holo Vader`',
            '**Card comparison:** `!holo Vader -compare Thrawn`',
            'Shows all matching cards for the first term and compares with the second!'
          ].join('\n')
        },
        {
          name: '📋 Fleet Links',
          value: [
            'Simply paste a Star Forge fleet link to get a formatted view!',
            '**Example:** `https://star-forge.tools/share/12345`',
            'Shows ships, squadrons, upgrades, and objectives with clickable card links.'
          ].join('\n')
        },
        {
          name: '💡 Tips',
          value: [
            '• Card searches are not case-sensitive',
            '• Many cards have common nicknames (like "TEA" for "Take Evasive Action!")',
            '• If no exact match is found, the bot will suggest similar cards',
            '• Click the 🔍 reaction on fleet posts to expand card images',
            '• For dice rolls, you can combine any number of dice'
          ].join('\n')
        }
      )
      .setColor('#0099ff')
      .setFooter({ text: 'For bug reports or feature requests, visit our GitHub repository' });

    return message.reply({ embeds: [embed] });
  }

  if (message.content.toLowerCase().startsWith('!holo')) {
    const input = message.content.slice(6).trim();
    
    // Check if this is a comparison request
    const compareMatch = input.match(/^(.*?)\s*-\s*compare\s+(.*)$/i);
    
    if (compareMatch) {
      // Handle comparison
      const [, card1, card2] = compareMatch;
      
      // Keep points values in the search
      const matches1 = nicknameMap[card1.trim()] || findSimilarCardsWithPoints(card1.trim(), nicknameMap);
      const matches2 = nicknameMap[card2.trim()] || findSimilarCardsWithPoints(card2.trim(), nicknameMap);
      
      if (!matches1 || !matches2) {
        const notFound = !matches1 ? card1 : card2;
        return message.reply(`Could not find card: ${notFound}`);
      }

      // Create embeds for all matches of first card and one of second card
      const embeds = [
        // First card's matches (up to 10)
        ...matches1.slice(0, 10).map((match, index) => 
          new EmbedBuilder()
            .setTitle(index === 0 ? `Comparing: ${card1.trim()} vs ${card2.trim()}` : undefined)
            .setImage(`https://api.swarmada.wiki/images/${getImagePath(match)}.webp`)
            .setFooter({ text: `${card1.trim()} (${index + 1}/${Math.min(matches1.length, 10)})` })
        ),
        // Second card's matches (up to 10)
        ...matches2.slice(0, 10).map((match, index) => 
          new EmbedBuilder()
            .setImage(`https://api.swarmada.wiki/images/${getImagePath(match)}.webp`)
            .setFooter({ text: `${card2.trim()} (${index + 1}/${Math.min(matches2.length, 10)})` })
        )
      ];

      // If there are more matches than we can show, add messages
      if (matches1.length > 10) {
        message.channel.send(`...and ${matches1.length - 10} more results for ${card1.trim()}.`);
      }
      if (matches2.length > 10) {
        message.channel.send(`...and ${matches2.length - 10} more results for ${card2.trim()}.`);
      }

      return message.reply({ embeds });
    }

    // Original !holo logic
    const cardQuery = input;
    
    if (!cardQuery) {
      return message.reply('Please provide a card name to search for. Example: `!holo Vader (28)` or `!holo "Vader (28)" -compare "Thrawn (32)"`');
    }

    // Find exact match first
    let matches = nicknameMap[cardQuery];

    // Filter out dummy cards from matches
    matches = filterDummyCards(matches);

    // If no exact match or all matches were dummy cards, try case-insensitive search
    if (!matches) {
      const lowercaseNickname = cardQuery.toLowerCase();
      const possibleMatch = Object.keys(nicknameMap)
        .filter(key => !isDummyCard(key))
        .find(key => key.toLowerCase() === lowercaseNickname);
      matches = possibleMatch ? filterDummyCards(nicknameMap[possibleMatch]) : null;
    }

    if (!matches) {
      // Find similar nicknames for suggestions, excluding dummy cards
      const suggestions = Object.keys(nicknameMap)
        .filter(name => !isDummyCard(name))
        .filter(name => name.toLowerCase().includes(cardQuery.toLowerCase()))
        .slice(0, 5);
      
      if (suggestions.length === 1) {
        // If there's exactly one suggestion, show that card
        matches = nicknameMap[suggestions[0]];
        // Create embeds for the single match
        const embeds = matches.map((match, index) => 
          new EmbedBuilder()
            .setImage(`https://api.swarmada.wiki/images/${getImagePath(match)}.webp`)
            .setFooter({ text: `${index + 1}/${matches.length}` })
        );
        embeds[0].setTitle(`Card Result for "${suggestions[0]}"`);
        return message.reply({ embeds });
      } else if (suggestions.length > 0) {
        return message.reply(`No exact matches found. Did you mean: ${suggestions.join(', ')}?`);
      }
      return message.reply('No cards found with that nickname.');
    }

    // Create an array of embeds for all matches (up to 10 - Discord's limit)
    const embeds = matches.slice(0, 10).map((match, index) => 
      new EmbedBuilder()
        .setImage(`https://api.swarmada.wiki/images/${getImagePath(match)}.webp`)
        .setFooter({ text: `${index + 1}/${Math.min(matches.length, 10)}` })
    );

    // Set the title only on the first embed
    embeds[0].setTitle(`Card Results for "${cardQuery}"`);

    // Send all embeds in a single message
    await message.reply({ embeds });

    // If there are more than 10 matches, let the user know
    if (matches.length > 10) {
      message.channel.send(`...and ${matches.length - 10} more results.`);
    }
  }

  if (message.content.toLowerCase().startsWith('!dice')) {
    const args = message.content.slice(5).trim().split(' ');
    const dicePool = parseDicePool(args);
    
    if (!dicePool.valid) {
      return message.reply('Please provide a valid dice pool. Example: `!dice 2red 2blue [-reroll2red]`');
    }

    const rollResults = rollDice(dicePool.counts, dicePool.rerolls);
    const stats = calculateStats(dicePool.counts);

    const embed = new EmbedBuilder()
      .setTitle('🎲 Dice Roll Results')
      .setDescription([
        formatRollResults(rollResults),
        '\n',
        '## 📊 Statistics',
        '▫️ Average Damage (with crits): ' + stats.averageDamage.toFixed(2),
        '▫️ Average Damage (no crits): ' + stats.averageDamageNoCrits.toFixed(2),
        '▫️ Accuracy Chance: ' + (stats.accuracyChance * 100).toFixed(1) + '%',
        '▫️ Critical Chance: ' + (stats.criticalChance * 100).toFixed(1) + '%',
        '▫️ Average Accuracy Count: ' + stats.averageAccuracies.toFixed(2)
      ].join('\n'));

    message.reply({ embeds: [embed] });
  }
});

function formatFleetEmbed(fleetData, fleetId) {
  const lines = fleetData.split('\n');
  const fleetName = lines[0].replace('Name: ', '');
  let currentFaction = '';
  
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(fleetName)
    .setURL(`https://star-forge.tools/share/${fleetId}`)
    .setDescription('Click on any card name to view it!');

  let currentSection = '';
  let currentField = { name: '', value: '' };

  for (const line of lines) {
    // Only add fields when they have both name and value
    if (currentField.name && currentField.value && 
        (line.match(/^[A-Za-z].*\(\d+\)$/) || 
         line === 'Squadrons:' || 
         line.startsWith('Total Points:'))) {
      embed.addFields(currentField);
      currentField = { name: '', value: '' };
    }

    if (line.startsWith('Faction:')) {
      currentFaction = line.replace('Faction: ', '').toLowerCase();
      const factionValue = line.replace('Faction: ', '');
      if (factionValue) {
        embed.addFields({ name: 'Faction', value: factionValue, inline: true });
      }
    } else if (line.startsWith('Commander:')) {
      const commander = line.replace('Commander: ', '').split('(')[0].trim();
      const points = line.match(/\((\d+)\)/)?.[1] || '';
      if (commander) {
        const cardId = findCardInNicknameMaps(commander, currentFaction);
        embed.addFields({ 
          name: 'Commander', 
          value: `[${commander}](https://api.swarmada.wiki/images/${getImagePath(cardId)}.webp) (${points})`, 
          inline: true 
        });
      }
    } else if (line.match(/^(Assault|Defense|Navigation):/)) {
      const objective = line.split(': ')[1];
      const cardId = findCardInNicknameMaps(objective, currentFaction);
      currentSection = 'Objectives';
      if (!currentField.name) currentField.name = 'Objectives';
      currentField.value += `[${objective}](https://api.swarmada.wiki/images/${getImagePath(cardId)}.webp)\n`;
    } else if (line.match(/^[A-Za-z].*\(\d+\)$/) || line === 'Squadrons:') {
      if (currentField.name) {
        embed.addFields(currentField);
        currentField = { name: '', value: '' };
      }
      if (line === 'Squadrons:') {
        currentField.name = '**Squadrons**';
        currentField.value = '';
      } else {
        const shipName = line.split('(')[0].trim();
        const points = line.match(/\((\d+)\)/)?.[1] || '';
        const cardId = findCardInNicknameMaps(shipName, currentFaction);
        currentField.name = `**${shipName} (${points})**`;
        currentField.value = `[View Ship Card](https://api.swarmada.wiki/images/${getImagePath(cardId)}.webp)\n`;
      }
    } else if (line.startsWith('•')) {
      const upgrade = line.replace('• ', '');
      const name = upgrade.split('(')[0].trim();
      const points = upgrade.match(/\((\d+)\)/)?.[1] || '';
      const cardId = findCardInNicknameMaps(name, currentFaction);
      currentField.value += `• [${name}](https://api.swarmada.wiki/images/${getImagePath(cardId)}.webp) (${points})\n`;
    }
  }

  // Add the final field if it has content
  if (currentField.name && currentField.value) {
    embed.addFields(currentField);
  }

  const totalPoints = lines.find(line => line.startsWith('Total Points:'));
  if (totalPoints) {
    embed.setFooter({ text: totalPoints });
  }

  return embed;
}

// Helper function to find card ID in nickname maps
function findCardInNicknameMaps(cardName, faction = '') {
  // Load aliases for fleet embeds
  const aliases = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'public/aliases.json'), 'utf8')
  );

  // First try to find exact match in aliases (includes points)
  if (aliases[cardName]) {
    return aliases[cardName];
  }

  // If no alias match, fall back to nickname maps
  const legacyMatch = legacyNicknameMap[cardName];
  const legendsMatch = legendsNicknameMap[cardName];
  
  // Combine matches and remove duplicates
  const allMatches = [...new Set([...(legacyMatch || []), ...(legendsMatch || [])])];
  
  if (allMatches.length > 0) {
    // If we have a faction, try to find a faction-specific match first
    if (faction) {
      const factionMatch = allMatches.find(match => 
        match.toLowerCase().includes(faction.toLowerCase())
      );
      if (factionMatch) {
        return factionMatch;
      }
    }
    // If no faction match found, return the first match
    return allMatches[0];
  }
  
  // Default to the card name if no matches found
  return cardName.toLowerCase().replace(/\s+/g, '-');
}

client.login(process.env.DISCORD_TOKEN);