import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

const API_BASE = 'https://api.swarmada.wiki';

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

    try {
      const response = await fetch(`${API_BASE}/holo/${encodeURIComponent(nickname)}`);
      const data = await response.json();
      
      if (!response.ok) {
        if (data.suggestions && data.suggestions.length > 0) {
          return message.reply(`No exact matches found. Did you mean: ${data.suggestions.join(', ')}?`);
        }
        return message.reply('No cards found with that nickname.');
      }
      
      const { matches } = data;
      
      if (matches.length === 0) {
        return message.reply('No images found for that card.');
      }

      // Send first image immediately
      const embed = new EmbedBuilder()
        .setTitle(`Card Results for "${nickname}"`)
        .setImage(matches[0].imageUrl)
        .setFooter({ text: `1/${matches.length}` });
      
      await message.channel.send({ embeds: [embed] });

      // Send remaining images (if any) with a slight delay to avoid rate limits
      for (let i = 1; i < Math.min(matches.length, 5); i++) {
        const additionalEmbed = new EmbedBuilder()
          .setImage(matches[i].imageUrl)
          .setFooter({ text: `${i + 1}/${matches.length}` });
        
        await message.channel.send({ embeds: [additionalEmbed] });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (matches.length > 5) {
        message.channel.send(`...and ${matches.length - 5} more results.`);
      }
      
    } catch (error) {
      console.error('Error:', error);
      message.reply('Error fetching card images.');
    }
  }
});

client.login(process.env.DISCORD_TOKEN); 