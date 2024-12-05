import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

  if (message.content.toLowerCase().startsWith('!dice')) {
    const args = message.content.slice(6).trim().split(' ');
    const dicePool = parseDicePool(args);
    
    if (!dicePool.valid) {
      return message.reply('Please provide a valid dice pool. Example: `!dice 2red 2blue`');
    }

    const rollResults = rollDice(dicePool.counts);
    const stats = calculateStats(dicePool.counts);

    const embed = new EmbedBuilder()
      .setTitle('Dice Roll Results')
      .setDescription(formatRollResults(rollResults))
      .addFields(
        { name: 'Average Damage', value: stats.averageDamage.toFixed(2), inline: true },
        { name: 'Accuracy Chance', value: `${(stats.accuracyChance * 100).toFixed(1)}%`, inline: true },
        { name: 'Critical Chance', value: `${(stats.criticalChance * 100).toFixed(1)}%`, inline: true }
      );

    message.reply({ embeds: [embed] });
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

    // Send first image immediately
    const embed = new EmbedBuilder()
      .setTitle(`Card Results for "${nickname}"`)
      .setImage(`https://api.swarmada.wiki/images/${matches[0]}.webp`)
      .setFooter({ text: `1/${matches.length}` });
    
    await message.channel.send({ embeds: [embed] });

    // Send remaining images (if any) with a slight delay to avoid rate limits
    for (let i = 1; i < Math.min(matches.length, 5); i++) {
      const additionalEmbed = new EmbedBuilder()
        .setImage(`https://api.swarmada.wiki/images/${matches[i]}.webp`)
        .setFooter({ text: `${i + 1}/${matches.length}` });
      
      await message.channel.send({ embeds: [additionalEmbed] });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (matches.length > 5) {
      message.channel.send(`...and ${matches.length - 5} more results.`);
    }
  }


});

client.login(process.env.DISCORD_TOKEN);