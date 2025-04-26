import { EmbedBuilder } from 'discord.js';

// Unicode emoji for 1-9
export const RANK_EMOJIS = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
const MAX_OPTIONS = 9;
const PROGRESS_BAR_LENGTH = 10;
const POLL_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory poll storage: { [mainMessageId]: { question, options, optionMsgIds, createdAt, closed, scores, voters } }
const polls = {};

// Utility: progress bar
function makeProgressBar(score, maxScore) {
  if (maxScore === 0) return '░'.repeat(PROGRESS_BAR_LENGTH);
  const filled = Math.round((score / maxScore) * PROGRESS_BAR_LENGTH);
  return '▓'.repeat(filled) + '░'.repeat(PROGRESS_BAR_LENGTH - filled);
}

/**
 * Create the main poll embed.
 */
export function createMainPollEmbed(question, options, scores = null, closed = false, timeLeft = null) {
  const embed = new EmbedBuilder()
    .setTitle(closed ? '📊 Poll Results' : '📊 Ranked Choice Poll')
    .setDescription(question)
    .setColor(closed ? '#888888' : '#00b0f4');

  let maxScore = 1;
  if (scores) {
    maxScore = Math.max(...scores.map(s => s.score), 1);
  }

  options.forEach((option, i) => {
    let value = '';
    if (scores) {
      value = `${makeProgressBar(scores[i].score, maxScore)}  ${scores[i].score} pts`;
    }
    embed.addFields({
      name: `${i + 1}. ${option}`,
      value: value || '\u200b',
      inline: false
    });
  });

  if (closed) {
    embed.setFooter({ text: 'Poll closed' });
  } else {
    embed.setFooter({ text: `Vote by reacting 1️⃣–${RANK_EMOJIS[options.length-1]} to each option below. Poll closes in: ${timeLeft || '24h'}` });
  }
  return embed;
}

/**
 * Create an option embed for voting, with optional image.
 */
export function createOptionEmbed(option, index, total, imageUrl = null) {
  const embed = new EmbedBuilder()
    .setTitle(`Option ${index + 1}`)
    .setDescription(option)
    .setColor('#00b0f4')
    .setFooter({ text: `React with your rank for this option (1️⃣ = best, ${RANK_EMOJIS[total-1]} = worst)` });
  if (imageUrl) embed.setImage(imageUrl);
  return embed;
}

/**
 * Register a poll in memory.
 * @param {string} mainMsgId
 * @param {string} question
 * @param {string[]} options
 * @param {string[]} optionMsgIds
 * @param {string} creatorId
 * @param {string[]} optionImages
 */
export function registerPoll(mainMsgId, question, options, optionMsgIds, creatorId, optionImages) {
  polls[mainMsgId] = {
    question,
    options,
    optionMsgIds,
    createdAt: Date.now(),
    closed: false,
    scores: options.map(() => ({ score: 0, voters: 0 })),
    voters: {}, // userId: { [optionIdx]: rank }
    creatorId,
    optionImages: optionImages || [],
    dirty: true
  };
}

/**
 * Mark a poll as closed.
 */
export function closePoll(mainMsgId) {
  if (polls[mainMsgId]) {
    polls[mainMsgId].closed = true;
  }
}

/**
 * Tally votes from option message reactions.
 * @param {object} client - Discord client
 * @param {string} mainMsgId
 * @param {object} channel - Discord channel
 * @returns {Promise<{scores: Array<{score:number, voters:number}>, voters: object}>}
 */
export async function tallyVotes(client, mainMsgId, channel) {
  const poll = polls[mainMsgId];
  if (!poll) return null;
  const { optionMsgIds, options } = poll;
  // userId -> { optionIdx: rank }
  const userRanks = {};
  // optionIdx -> { userId: rank }
  const optionRanks = options.map(() => ({}));

  for (let i = 0; i < optionMsgIds.length; i++) {
    const msg = await channel.messages.fetch(optionMsgIds[i]);
    for (let rank = 1; rank <= options.length; rank++) {
      const emoji = RANK_EMOJIS[rank-1];
      const reaction = msg.reactions.cache.get(emoji);
      if (!reaction) continue;
      const users = await reaction.users.fetch();
      users.forEach(user => {
        if (user.bot) return;
        // Only allow one rank per option per user
        if (!optionRanks[i][user.id]) {
          optionRanks[i][user.id] = rank;
        }
      });
    }
  }
  // Now, for each user, build their full ballot
  Object.keys(optionRanks).forEach(optionIdx => {
    Object.entries(optionRanks[optionIdx]).forEach(([userId, rank]) => {
      if (!userRanks[userId]) userRanks[userId] = {};
      userRanks[userId][optionIdx] = rank;
    });
  });
  // Enforce: each user can only use each rank once across all options
  // If a user uses the same rank for multiple options, only the first is counted
  const validUserRanks = {};
  Object.entries(userRanks).forEach(([userId, ranks]) => {
    const usedRanks = new Set();
    validUserRanks[userId] = {};
    Object.entries(ranks).forEach(([optionIdx, rank]) => {
      if (!usedRanks.has(rank) && rank >= 1 && rank <= options.length) {
        validUserRanks[userId][optionIdx] = rank;
        usedRanks.add(rank);
      }
    });
  });
  // Calculate Borda scores
  const scores = options.map(() => ({ score: 0, voters: 0 }));
  Object.values(validUserRanks).forEach(ranks => {
    Object.entries(ranks).forEach(([optionIdx, rank]) => {
      const idx = parseInt(optionIdx);
      scores[idx].score += options.length - rank + 1;
      scores[idx].voters++;
    });
  });
  poll.scores = scores;
  poll.voters = validUserRanks;
  return { scores, voters: validUserRanks };
}

/**
 * Get poll info
 */
export function getPoll(mainMsgId) {
  return polls[mainMsgId];
}

export function __getAllPolls() {
  return polls;
}

/**
 * Remove a poll from memory.
 */
export function removePoll(mainMsgId) {
  delete polls[mainMsgId];
}

export function setPollDirty(mainMsgId) {
  if (polls[mainMsgId]) polls[mainMsgId].dirty = true;
}

export function clearPollDirty(mainMsgId) {
  if (polls[mainMsgId]) polls[mainMsgId].dirty = false;
}

export function isPollDirty(mainMsgId) {
  return polls[mainMsgId] && polls[mainMsgId].dirty;
} 