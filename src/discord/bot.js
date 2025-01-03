import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseDicePool, rollDice, calculateStats, formatRollResults } from './dice-utils.js';
import { createClient } from '@supabase/supabase-js';

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

// Define server IDs as constants
const LEGACY_SERVER_ID = '1128659616222425141';
const LEGENDS_SERVER_ID = '1256627568627421205';

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

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  
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

      if (error) throw error;
      if (!fleet) {
        return message.reply('Fleet not found or not shared.');
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
      message.reply('This fleet is not shared to the public.');
    }
  }

  // Get the appropriate nickname map based on server ID
  const nicknameMap = message.guild?.id === LEGACY_SERVER_ID 
    ? legacyNicknameMap 
    : message.guild?.id === LEGENDS_SERVER_ID
      ? legendsNicknameMap
      : legendsNicknameMap; // default to legends for any other server

  // Help commands
  if (message.content.toLowerCase().match(/^!holo(?:-)?help$/)) {
    const embed = new EmbedBuilder()
      .setTitle('Holocron Bot Help')
      .setDescription('Welcome to the Holocron Bot! Here are the available commands:')
      .addFields(
        { 
          name: '🎲 Dice Rolling',
          value: '`!dice [quantity][color]`\nRoll Armada dice and get statistics.\nExample: `!dice 2red 2blue 1black`\nAvailable colors: red, blue, black'
        },
        {
          name: '🔍 Card Search',
          value: '`!holo [card name]`\nSearch for cards by name or nickname.\nExample: `!holo Vader` or `!holo TEA`'
        },
        {
          name: '💡 Tips',
          value: [
            '• Card searches are not case-sensitive',
            '• Many cards have common nicknames (like "TEA" for "Take Evasive Action!")',
            '• If no exact match is found, the bot will suggest similar cards',
            '• For dice rolls, you can combine any number of dice'
          ].join('\n')
        }
      )
      .setFooter({ text: 'For bug reports or feature requests, visit our GitHub repository' });

    return message.reply({ embeds: [embed] });
  }

  if (message.content.toLowerCase().startsWith('!holo')) {
    const nickname = message.content.slice(6).trim();
    
    if (!nickname) {
      return message.reply('Please provide a card name to search for. Example: `!holo Vader`');
    }

    // Find exact match first
    let matches = nicknameMap[nickname];
    
    // If no exact match, try case-insensitive search
    if (!matches) {
      const lowercaseNickname = nickname.toLowerCase();
      const possibleMatch = Object.keys(nicknameMap).find(
        key => key.toLowerCase() === lowercaseNickname
      );
      matches = possibleMatch ? nicknameMap[possibleMatch] : null;
    }

    if (!matches) {
      // Find similar nicknames for suggestions
      const suggestions = Object.keys(nicknameMap)
        .filter(name => name.toLowerCase().includes(nickname.toLowerCase()))
        .slice(0, 5);
      
      if (suggestions.length > 0) {
        return message.reply(`No exact matches found. Did you mean: ${suggestions.join(', ')}?`);
      }
      return message.reply('No cards found with that nickname.');
    }

    // Create an array of embeds for all matches (up to 10 - Discord's limit)
    const embeds = matches.slice(0, 10).map((match, index) => 
      new EmbedBuilder()
        .setImage(`https://api.swarmada.wiki/images/${match}.webp`)
        .setFooter({ text: `${index + 1}/${Math.min(matches.length, 10)}` })
    );

    // Set the title only on the first embed
    embeds[0].setTitle(`Card Results for "${nickname}"`);

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
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(fleetName)
    .setURL(`https://star-forge.tools/share/${fleetId}`)
    .setDescription('Click on any card name to view it!');

  let currentSection = '';
  let currentField = { name: '', value: '' };

  for (const line of lines) {
    if (line.startsWith('Faction:')) {
      embed.addFields({ name: 'Faction', value: line.replace('Faction: ', ''), inline: true });
    } else if (line.startsWith('Commander:')) {
      const commander = line.replace('Commander: ', '').split('(')[0].trim();
      const points = line.match(/\((\d+)\)/)?.[1] || '';
      const cardId = findCardInNicknameMaps(commander);
      embed.addFields({ 
        name: 'Commander', 
        value: `[${commander}](https://api.swarmada.wiki/images/${cardId}.webp) (${points})`, 
        inline: true 
      });
    } else if (line.match(/^(Assault|Defense|Navigation):/)) {
      const objective = line.split(': ')[1];
      const cardId = findCardInNicknameMaps(objective);
      currentSection = 'Objectives';
      if (!currentField.name) currentField.name = 'Objectives';
      currentField.value += `[${objective}](https://api.swarmada.wiki/images/${cardId}.webp)\n`;
    } else if (line.match(/^[A-Za-z].*\(\d+\)$/) || line === 'Squadrons:') {
      // Ship or Squadron header
      if (currentField.name) {
        embed.addFields(currentField);
        currentField = { name: '', value: '' };
      }
      if (line === 'Squadrons:') {
        currentField.name = '**Squadrons**';
        currentField.value = '';
      } else {
        // Handle ship headers
        const shipName = line.split('(')[0].trim();
        const points = line.match(/\((\d+)\)/)?.[1] || '';
        const cardId = findCardInNicknameMaps(shipName);
        currentField.name = `**[${shipName}](https://api.swarmada.wiki/images/${cardId}.webp) (${points})**`;
        currentField.value = '';
      }
    } else if (line.startsWith('•')) {
      // Upgrade or Squadron
      const upgrade = line.replace('• ', '');
      const name = upgrade.split('(')[0].trim();
      const points = upgrade.match(/\((\d+)\)/)?.[1] || '';
      const cardId = findCardInNicknameMaps(name);
      currentField.value += `• [${name}](https://api.swarmada.wiki/images/${cardId}.webp) (${points})\n`;
    }
  }

  if (currentField.name) {
    embed.addFields(currentField);
  }

  const totalPoints = lines.find(line => line.startsWith('Total Points:'));
  if (totalPoints) {
    embed.setFooter({ text: totalPoints });
  }

  return embed;
}

// Helper function to find card ID in nickname maps
function findCardInNicknameMaps(cardName) {
  // Try both nickname maps
  const legacyMatch = legacyNicknameMap[cardName];
  const legendsMatch = legendsNicknameMap[cardName];
  
  // Return the first match found, defaulting to the card name if no match
  return (legacyMatch?.[0] || legendsMatch?.[0] || cardName).toLowerCase().replace(/\s+/g, '-');
}

client.login(process.env.DISCORD_TOKEN);