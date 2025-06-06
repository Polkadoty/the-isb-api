import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseDicePool, rollDice, calculateStats, formatRollResults, parseEmojiRerolls, parseEmbedResults, calculatePeakDamage, parseDefenseRerolls, formatGroup, DICE_FACES } from './dice-utils.js';
import { createMainPollEmbed, createOptionEmbed, registerPoll, tallyVotes, closePoll, getPoll, RANK_EMOJIS, __getAllPolls, setPollDirty, clearPollDirty, isPollDirty } from './poll-embeds.js';

// Immediately define __filename and __dirname so that they are available for use in the file.
// This fixes the "Cannot access '__dirname' before initialization" error.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Load the keyword responses from the JSON file now that __dirname is defined.
const keywordResponses = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'public/keywords.json'), 'utf8')
);

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
  },
  'hello there': {
    reaction: '👋',
    gifUrl: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExZW43dWJvOHVpbm5lamphNmpmcmwyMDZ4a3BoeDdrdG9hd2x1dGY4cSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/7JC7bCJJGj44aBwB8p/giphy.gif'
  },
  // 'agent of chaos': {
  //   reaction: '🤖',
  //   gifUrl: 'https://tenor.com/bXSo8.gif'
  // },
  // 'causing chaos': {
  //   reaction: '👋',
  //   gifUrl: 'https://tenor.com/bfhWT.gif'
  // }
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

// Add this helper function near the top with other helpers
function normalizeErrataPath(cardId) {
  // If there's a source suffix (-arc, -old-legacy), preserve it
  const match = cardId.match(/-errata(-(?:arc|old-legacy))?-errata$/);
  if (match) {
    // Replace the duplicate -errata with a single one, preserving any source suffix
    return cardId.replace(/-errata(-(?:arc|old-legacy))?-errata$/, `-errata${match[1] || ''}`);
  }
  return cardId;
}

// Update the getImagePath function
function getImagePath(cardId) {
  if (!cardId) return '';
  
  // Normalize the card ID first
  const normalizedId = cardId.toLowerCase().replace(/\s+/g, '-');
  
  // If it's already an old-legacy errata card, don't modify the path
  if (normalizedId.includes('-errata-old-legacy')) {
    return normalizedId;
  }
  
  // Check if this card has errata
  const shouldAppendErrata = Object.values(errataKeys).some(category => 
    category.some(errataKey => {
      // Remove any existing errata suffix for comparison
      const baseErrataKey = errataKey.replace(/-errata(-.*)?$/, '');
      return baseErrataKey === normalizedId;
    })
  );

  // If it has errata, append -errata before any existing suffixes
  if (shouldAppendErrata && !normalizedId.includes('-errata')) {
    return `${normalizedId}-errata`;
  }

  return normalizeErrataPath(normalizedId);
}

// Load errata keys after defining getImagePath
const errataKeys = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'public/errata-keys.json'), 'utf8')
);

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

      // Send embed as a reply to the original message
      const response = await message.reply({ embeds: [embed] });

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
    : message.guild?.id === LEGENDS_SERVER_ID || message.guild?.id === UK_SERVER_ID
      ? legendsNicknameMap
      : message.guild?.id === TEXAS_SERVER_ID
        ? legacyNicknameMap
        : message.guild?.id === ARMADA_SERVER_ID 
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
            '`!dice [quantity][color] [-reroll quantity][color]`',
            'Roll Armada dice and get detailed statistics.',
            '**Examples:**',
            '• Initial roll: `!dice 2red 2blue 1black`',
            '• Attack reroll: `!dice 2red 1blue 1black -reroll 2red`',
            '• Defense reroll: Reply with `!defense red-double blue-hit` to reroll those dice.',
            '\n**Valid dice faces for defense:**',
            '• Red: double, accuracy, hit, crit, blank',
            '• Blue: accuracy, hit, crit',
            '• Black: hit-crit, hit, blank',
            '\n**Stats include:** Peak damage, average damage, accuracy chance, crit chance, and more!'
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
          name: '📖 Keyword Search',
          value: [
            '`!keyword [term]`',
            'Look up game terms and keywords.',
            '**Example:** `!keyword Assault`',
            'Shows the official rules text and any relevant clarifications.'
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

  // Ranked Choice Poll: !poll "Question?" Option1; Option2; Option3
  if (message.content.toLowerCase().startsWith('!poll')) {
    // Example: !poll "Best Star Wars movie?" X-Wing https://img.link/xwing.jpg; TIE Fighter https://img.link/tie.jpg --time 1h 4m 5s
    // Extract --time flag and value if present
    let pollText = message.content;
    let customDuration = null;
    let timeMatch = pollText.match(/--time\s+([\dhms\s]+)/i);
    if (timeMatch) {
      customDuration = parseDuration(timeMatch[1]);
      // Remove the --time ... part from the pollText for normal parsing
      pollText = pollText.replace(/--time\s+[\dhms\s]+/i, '').trim();
    }
    const pollMatch = pollText.match(/^!poll\s+"([^"]+)"\s+(.+)/i);
    if (!pollMatch) {
      return message.reply('Usage: !poll "Question?" Option1 [image_url]; Option2 [image_url]; ... [--time 1h 4m 5s]\nRecommended image size: 400-600px wide, 16:9 or 4:3 aspect ratio. Supported formats: jpg, png, webp, gif.');
    }
    const [, question, optionsStr] = pollMatch;
    const optionsRaw = optionsStr.split(';').map(opt => opt.trim()).filter(Boolean);
    if (optionsRaw.length < 2 || optionsRaw.length > RANK_EMOJIS.length) {
      return message.reply(`Please provide between 2 and ${RANK_EMOJIS.length} options, separated by semicolons.`);
    }
    // Parse options and images
    const options = [];
    const optionImages = [];
    for (const raw of optionsRaw) {
      const urlMatch = raw.match(/(https?:\/\/\S+)/);
      if (urlMatch) {
        options.push(raw.replace(urlMatch[1], '').trim());
        optionImages.push(urlMatch[1]);
      } else {
        options.push(raw);
        optionImages.push(null);
      }
    }
    // Post main poll embed
    const timeLeftText = customDuration ?
      (customDuration >= 60*60*1000 ? `${Math.floor(customDuration/3600000)}h ` : '') +
      (customDuration >= 60*1000 ? `${Math.floor((customDuration%3600000)/60000)}m ` : '') +
      `${Math.floor((customDuration%60000)/1000)}s`
      : null;
    const mainEmbed = createMainPollEmbed(question, options, null, false, timeLeftText);
    const pollMsg = await message.reply({ embeds: [mainEmbed] });
    // Post option embeds and add emoji reactions
    const optionMsgIds = [];
    for (let i = 0; i < options.length; i++) {
      const optEmbed = createOptionEmbed(options[i], i, options.length, optionImages[i]);
      const optMsg = await message.channel.send({ embeds: [optEmbed] });
      optionMsgIds.push(optMsg.id);
      for (let j = 0; j < options.length; j++) {
        await optMsg.react(RANK_EMOJIS[j]);
      }
    }
    // Register poll with creator and images and channelId
    registerPoll(
      pollMsg.id,
      question,
      options,
      optionMsgIds,
      message.author.id,
      optionImages,
      message.channel.id,
      customDuration || 24 * 60 * 60 * 1000,
      Date.now()
    );
    // Delete the original poll request message to keep the channel clean
    try { await message.delete(); }
    catch (e) {
      console.warn('Could not delete original poll request message:', e);
      try { await message.channel.send('I do not have permission to delete the original poll command message.'); } catch (e2) { /* ignore */ }
    }
    setTimeout(async () => {
      closePoll(pollMsg.id);
      const poll = getPoll(pollMsg.id);
      const { scores } = await tallyVotes(client, pollMsg.id, message.channel);
      // Delete all option messages
      for (const optMsgId of poll.optionMsgIds) {
        try { await message.channel.messages.delete(optMsgId); } catch (e) { /* ignore */ }
      }
      // Update the main poll embed to show 'Poll closed' in the footer
      const closedEmbed = createMainPollEmbed(question, options, scores, true);
      await pollMsg.edit({ embeds: [closedEmbed] });
    }, customDuration || 24 * 60 * 60 * 1000);
    return;
  }

  // Remove a poll: !removepoll (must reply to main poll embed, only creator can use)
  if (message.content.toLowerCase().startsWith('!removepoll')) {
    if (!message.reference) {
      return message.reply('Reply to the main poll message to remove the poll.');
    }
    const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
    const pollId = repliedMessage.id;
    const poll = getPoll(pollId);
    if (!poll) {
      return message.reply('Poll not found or already removed.');
    }
    if (poll.creatorId !== message.author.id) {
      return message.reply('Only the poll creator can remove this poll.');
    }
    // Delete all option messages
    for (const optMsgId of poll.optionMsgIds) {
      try { await message.channel.messages.delete(optMsgId); } catch (e) { /* ignore */ }
    }
    // Delete main poll message
    try { await message.channel.messages.delete(pollId); } catch (e) { /* ignore */ }
    // Remove from memory
    require('./poll-embeds.js').removePoll(pollId);
    await message.reply('Poll and all related messages have been removed.');
    return;
  }

  // Show poll results: !results (must reply to poll message)
  if (message.content.toLowerCase().startsWith('!results')) {
    if (!message.reference) {
      return message.reply('Reply to the poll message to show results.');
    }
    const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
    if (!repliedMessage.embeds[0] || !repliedMessage.embeds[0].title.startsWith('📊')) {
      return message.reply('You must reply to a poll embed to show results.');
    }
    const pollId = repliedMessage.id;
    const poll = getPoll(pollId);
    if (!poll) {
      return message.reply('Poll not found or expired.');
    }
    if (poll.closed) {
      return message.reply('Poll is closed.');
    }
    // Tally and update main embed
    const { scores } = await tallyVotes(client, pollId, message.channel);
    const updatedEmbed = createMainPollEmbed(poll.question, poll.options, scores, false);
    await repliedMessage.edit({ embeds: [updatedEmbed] });
    await message.reply('Poll results updated!');
    return;
  }

  if (message.content.toLowerCase().startsWith('!dice')) {
    const args = message.content.slice(5).trim().split(' ');
    const dicePool = parseDicePool(args);
    
    if (!dicePool.valid) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Invalid Dice Pool')
        .setDescription([
          'The dice pool format is invalid. Please use the following format:',
          '\n**For initial rolls with rerolls:**',
          '`!dice [quantity]red [quantity]blue [quantity]black -reroll [quantity]red`',
          'Example: `!dice 2red 1blue 1black -reroll 2red`',
          '\n**For defense rerolls:**',
          'Reply to a roll with: `!defense [color]-[face] [color]-[face]...`',
          'Example: `!defense red-double blue-hit`',
          '\nUse `!help` for more detailed information about dice rolling.'
        ].join('\n'))
        .setColor('#ff0000');

      return message.reply({ embeds: [embed] });
    }

    const rollResults = rollDice(dicePool.counts, dicePool.rerolls);
    const stats = calculateStats(dicePool.counts);

    const embed = new EmbedBuilder()
      .setTitle('🎲 Dice Roll Results')
      .setDescription([
        formatRollResults(rollResults),
        '\n',
        '## 📊 Statistics',
        '## Peak Damage',
        '▫️ Maximum Damage (with crits): ' + calculatePeakDamage(dicePool.counts).maxDamage,
        '▫️ Maximum Damage (no crits): ' + calculatePeakDamage(dicePool.counts).maxDamageNoCrits,
        '▫️ Maximum Damage with Accuracy (with crits): ' + calculatePeakDamage(dicePool.counts).maxDamageWithAcc,
        '▫️ Maximum Damage with Accuracy (no crits): ' + calculatePeakDamage(dicePool.counts).maxDamageWithAccNoCrits,
        '\n## Average Results',
        '▫️ Average Damage (with crits): ' + stats.averageDamage.toFixed(2),
        '▫️ Average Damage (no crits): ' + stats.averageDamageNoCrits.toFixed(2),
        '▫️ Accuracy Chance: ' + (stats.accuracyChance * 100).toFixed(1) + '%',
        '▫️ Critical Chance: ' + (stats.criticalChance * 100).toFixed(1) + '%',
        '▫️ Average Accuracy Count: ' + stats.averageAccuracies.toFixed(2)
      ].join('\n'));

    message.reply({ embeds: [embed] });
  }

  // Check if this is a reply to a dice roll
  if (message.reference && message.content.toLowerCase().startsWith('!dice')) {
    try {
      const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
      
      // Verify this is a reply to a bot dice roll message
      if (repliedMessage.author.id === client.user.id && 
          repliedMessage.embeds[0]?.title === '🎲 Dice Roll Results') {
        
        // Get original roll results from embed
        const originalResults = parseEmbedResults(repliedMessage.embeds[0].description);
        
        // Parse emoji-based rerolls from the reply
        const emojiMatches = message.content.match(/<:\w+:\d+>/g) || [];
        
        // Count how many of each die face we want to reroll
        const rerollCounts = {};
        emojiMatches.forEach(emoji => {
          rerollCounts[emoji] = (rerollCounts[emoji] || 0) + 1;
        });

        // Find matching dice in original results to reroll
        const rerollsByColor = { red: 0, blue: 0, black: 0 };
        const remainingResults = [...originalResults];
        
        Object.entries(rerollCounts).forEach(([emoji, count]) => {
          for (let i = 0; i < count; i++) {
            const dieIndex = remainingResults.findIndex(die => die.emoji === emoji);
            if (dieIndex !== -1) {
              rerollsByColor[remainingResults[dieIndex].color]++;
              remainingResults.splice(dieIndex, 1);
            }
          }
        });

        // Perform rerolls
        const rerollResults = rollDice(rerollsByColor);
        
        // Combine remaining original dice with rerolls
        const finalResults = {
          initial: remainingResults,
          rerolls: rerollResults.initial,
          finalPool: [...remainingResults, ...rerollResults.initial]
        };

        // Create new embed with results
        const stats = calculateStats(rerollsByColor);
        const embed = new EmbedBuilder()
          .setTitle('🎲 Reroll Results')
          .setDescription([
            formatRollResults(finalResults),
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
    } catch (error) {
      console.error('Error handling dice reroll:', error);
      return message.reply('Error processing reroll request.');
    }
  }

  if (message.reference && message.content.toLowerCase().startsWith('!defense')) {
    try {
      const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
      
      // Verify this is a reply to a bot dice roll message
      if (repliedMessage.author.id === client.user.id && 
          repliedMessage.embeds[0]?.title === '🎲 Dice Roll Results') {
        
        // Get original roll results from embed
        const embedDescription = repliedMessage.embeds[0].description;
        const originalResults = parseEmbedResults(embedDescription);
        
        // Parse text-based rerolls from the reply
        const rerollArgs = message.content.slice(9).trim().split(' ');
        const rerolls = parseDefenseRerolls(rerollArgs);
        
        // Find matching dice in original results to reroll
        const remainingResults = [...originalResults];
        const rerollResults = [];
        
        rerolls.forEach(reroll => {
          const dieIndex = remainingResults.findIndex(die => 
            die.color === reroll.color && die.face === reroll.face
          );
          
          if (dieIndex !== -1) {
            const die = remainingResults[dieIndex];
            remainingResults.splice(dieIndex, 1);
            
            // Roll new die of same color
            const newFace = DICE_FACES[die.color].faces[Math.floor(Math.random() * 8)];
            rerollResults.push({
              color: die.color,
              face: newFace,
              emoji: DICE_FACES[die.color].emojis[newFace]
            });
          }
        });

        // Combine remaining original dice with rerolls
        const finalResults = {
          initial: originalResults,
          rerolls: rerollResults,
          finalPool: [...remainingResults, ...rerollResults]
        };

        // Create new embed with results
        const embed = new EmbedBuilder()
          .setTitle('🛡️ Defense Reroll Results')
          .setDescription(formatRollResults({
            initial: originalResults,
            finalPool: finalResults.finalPool
          }));

        message.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error handling defense reroll:', error);
      return message.reply('Error processing defense reroll request.');
    }
  }

  if (message.content.toLowerCase().startsWith('!keyword')) {
    const input = message.content.slice('!keyword'.length).trim();
    if (!input) {
      return message.reply('Please provide a keyword. Example: `!keyword Assault`');
    }
    
    // Perform a case-insensitive search for the keyword
    const lowerInput = input.toLowerCase();
    const foundKey = Object.keys(keywordResponses).find(
      key => key.toLowerCase() === lowerInput
    );

    if (foundKey) {
      const outputText = keywordResponses[foundKey];
      return message.reply(outputText);
    } else {
      return message.reply(`No information found for keyword "${input}".`);
    }
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

// Real-time poll update and duplicate rank enforcement
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  const message = reaction.message;
  console.log(`[PollDebug] Reaction add: user=${user.id} emoji=${reaction.emoji.name} message=${message.id}`);
  for (const pollId in __getAllPolls()) {
    const poll = getPoll(pollId);
    if (!poll || poll.closed) continue;
    const optionIdx = poll.optionMsgIds.indexOf(message.id);
    if (optionIdx === -1) continue;
    const rank = RANK_EMOJIS.indexOf(reaction.emoji.name);
    if (rank === -1) return;
    // Track which options had reactions removed
    const removedOptions = [];
    for (let i = 0; i < poll.optionMsgIds.length; i++) {
      if (i === optionIdx) continue;
      try {
        const optMsg = await message.channel.messages.fetch(poll.optionMsgIds[i]);
        const otherReaction = optMsg.reactions.cache.get(RANK_EMOJIS[rank]);
        if (otherReaction) {
          const users = await otherReaction.users.fetch();
          if (users.has(user.id)) {
            await otherReaction.users.remove(user.id);
            removedOptions.push(i + 1); // Option number (1-based)
          }
        }
      } catch (e) { /* ignore */ }
    }
    if (removedOptions.length > 0) {
      try {
        const dm = await user.createDM();
        await dm.send(
          `You can only use each rank emoji once per poll. Your ${reaction.emoji.name} reaction was removed from option(s): ${removedOptions.map(n => `#${n}`).join(', ')}.\nPlease fix your votes so each rank is only used once across all options.`
        );
      } catch (e) { /* ignore DM errors */ }
    }
    // Mark poll as dirty for scheduled update
    setPollDirty(pollId);
    // Tally and update main poll embed (debug, but scheduler will also update)
    console.log(`[PollDebug] Tallying votes for poll ${pollId}`);
    const botUserId = client.user.id;
    const { scores, duplicates } = await tallyVotes(client, pollId, message.channel, botUserId, true);
    // Remove duplicate reactions for this user
    for (const dup of duplicates) {
      if (dup.userId === user.id) {
        try {
          const optMsg = await message.channel.messages.fetch(poll.optionMsgIds[dup.optionIdx]);
          const dupReaction = optMsg.reactions.cache.get(RANK_EMOJIS[dup.rank - 1]);
          if (dupReaction) await dupReaction.users.remove(user.id);
        } catch (e) { /* ignore */ }
      }
    }
    const updatedEmbed = createMainPollEmbed(poll.question, poll.options, scores, false);
    try {
      const mainMsg = await message.channel.messages.fetch(pollId);
      await mainMsg.edit({ embeds: [updatedEmbed] });
      console.log(`[PollDebug] Updated main poll embed for poll ${pollId}`);
    } catch (e) {
      console.error(`[PollDebug] Failed to update main poll embed for poll ${pollId}:`, e);
    }
    break;
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  const message = reaction.message;
  console.log(`[PollDebug] Reaction remove: user=${user.id} emoji=${reaction.emoji.name} message=${message.id}`);
  for (const pollId in __getAllPolls()) {
    const poll = getPoll(pollId);
    if (!poll || poll.closed) continue;
    if (!poll.optionMsgIds.includes(message.id)) continue;
    if (!RANK_EMOJIS.includes(reaction.emoji.name)) return;
    // Mark poll as dirty for scheduled update
    setPollDirty(pollId);
    // Tally and update main poll embed (debug, but scheduler will also update)
    console.log(`[PollDebug] Tallying votes for poll ${pollId}`);
    const botUserId = client.user.id;
    const { scores, duplicates } = await tallyVotes(client, pollId, message.channel, botUserId, true);
    // Remove duplicate reactions for this user
    for (const dup of duplicates) {
      if (dup.userId === user.id) {
        try {
          const optMsg = await message.channel.messages.fetch(poll.optionMsgIds[dup.optionIdx]);
          const dupReaction = optMsg.reactions.cache.get(RANK_EMOJIS[dup.rank - 1]);
          if (dupReaction) await dupReaction.users.remove(user.id);
        } catch (e) { /* ignore */ }
      }
    }
    const updatedEmbed = createMainPollEmbed(poll.question, poll.options, scores, false);
    try {
      const mainMsg = await message.channel.messages.fetch(pollId);
      await mainMsg.edit({ embeds: [updatedEmbed] });
      console.log(`[PollDebug] Updated main poll embed for poll ${pollId}`);
    } catch (e) {
      console.error(`[PollDebug] Failed to update main poll embed for poll ${pollId}:`, e);
    }
    break;
  }
});

// Scheduled poll update every 30 seconds
setInterval(async () => {
  for (const pollId in __getAllPolls()) {
    const poll = getPoll(pollId);
    if (!poll || poll.closed) continue;
    try {
      console.log(`[PollDebug] Scheduled update for poll ${pollId}`);
      const channel = await client.channels.fetch(poll.channelId);
      if (!channel) continue;
      const botUserId = client.user.id;
      const { scores } = await tallyVotes(client, pollId, channel, botUserId, false);
      // Calculate time left
      const now = Date.now();
      const endTime = (poll.startedAt || poll.createdAt) + (poll.durationMs || 24 * 60 * 60 * 1000);
      const msLeft = Math.max(0, endTime - now);
      const timeLeftText = msLeft > 0 ? formatDuration(msLeft) : '0s';
      const updatedEmbed = createMainPollEmbed(poll.question, poll.options, scores, false, timeLeftText);
      const mainMsg = await channel.messages.fetch(pollId);
      await mainMsg.edit({ embeds: [updatedEmbed] });
      clearPollDirty(pollId);
      console.log(`[PollDebug] Scheduled poll embed updated for poll ${pollId}`);
    } catch (e) {
      console.error(`[PollDebug] Scheduled update failed for poll ${pollId}:`, e);
    }
  }
}, 30 * 1000);

// Helper to format ms as 'xh ym zs'
function formatDuration(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`;
}

// Helper to parse duration strings like '1h 4m 5s' into milliseconds
function parseDuration(str) {
  let total = 0;
  const regex = /(\d+)\s*h|h|(\d+)\s*m|m|(\d+)\s*s|s/gi;
  let match;
  // Accepts e.g. '1h 4m 5s', '90m', '45s', etc.
  const parts = str.match(/\d+\s*[hms]/gi);
  if (!parts) return null;
  for (const part of parts) {
    const value = parseInt(part);
    if (part.includes('h')) total += value * 60 * 60 * 1000;
    else if (part.includes('m')) total += value * 60 * 1000;
    else if (part.includes('s')) total += value * 1000;
  }
  return total > 0 ? total : null;
}

client.login(process.env.DISCORD_TOKEN);