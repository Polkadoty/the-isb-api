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