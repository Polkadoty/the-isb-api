import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseDicePool, rollDice, calculateStats, formatRollResults } from './dice-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Load the nickname mappings
const nicknameMap = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'public/nickname-map.json'), 'utf8')
);



const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  
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
      return message.reply('Please provide a valid dice pool. Example: `!dice 2red 2blue`');
    }

    const rollResults = rollDice(dicePool.counts);
    const stats = calculateStats(dicePool.counts);

    const embed = new EmbedBuilder()
      .setTitle('🎲 Dice Roll Results')
      .setDescription([
        '## 🎲 Roll Results',
        formatRollResults(rollResults),
        '',
        '## 📊 Statistics',
        `### • Average Damage: ${stats.averageDamage.toFixed(2)}`,
        `### • Accuracy Chance: ${(stats.accuracyChance * 100).toFixed(1)}%`,
        `### • Critical Chance: ${(stats.criticalChance * 100).toFixed(1)}%`
      ].join('\n'));

    message.reply({ embeds: [embed] });
  }
});

client.login(process.env.DISCORD_TOKEN);