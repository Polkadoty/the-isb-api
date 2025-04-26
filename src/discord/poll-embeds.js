import { EmbedBuilder } from 'discord.js';

// In-memory poll storage: { [messageId]: { question, options, votes: { [userId]: [rankings] } } }
const polls = {};

/**
 * Create a ranked choice poll embed.
 * @param {string} question - The poll question.
 * @param {string[]} options - The poll options.
 * @returns {EmbedBuilder}
 */
export function createPollEmbed(question, options) {
  const embed = new EmbedBuilder()
    .setTitle('📊 Ranked Choice Poll')
    .setDescription(question)
    .setColor('#00b0f4');

  options.forEach((option, i) => {
    embed.addFields({
      name: `Option ${i + 1}`,
      value: option,
      inline: false
    });
  });

  embed.setFooter({ text: 'Vote by replying: !vote [rank for option 1] [rank for option 2] ...' });
  return embed;
}

/**
 * Register a poll in memory.
 * @param {string} messageId - The Discord message ID for the poll.
 * @param {string} question
 * @param {string[]} options
 */
export function registerPoll(messageId, question, options) {
  polls[messageId] = {
    question,
    options,
    votes: {} // userId: [rankings]
  };
}

/**
 * Record a user's vote for a poll.
 * @param {string} messageId
 * @param {string} userId
 * @param {number[]} rankings - Array of ranks, 1 = highest, N = lowest.
 * @returns {string|null} - Error message if invalid, otherwise null.
 */
export function votePoll(messageId, userId, rankings) {
  const poll = polls[messageId];
  if (!poll) return 'Poll not found.';
  if (rankings.length !== poll.options.length) return `You must rank all ${poll.options.length} options.`;
  // Check for valid rankings (1..N, no duplicates)
  const sorted = [...rankings].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== i + 1) return 'Ranks must be unique and between 1 and N.';
  }
  poll.votes[userId] = rankings;
  return null;
}

/**
 * Calculate poll results using Borda count (weighted sum, 1st = N points, 2nd = N-1, ...)
 * @param {string} messageId
 * @returns {Array<{ option: string, score: number, votes: number }>} - Sorted by score descending
 */
export function calculateResults(messageId) {
  const poll = polls[messageId];
  if (!poll) return [];
  const scores = poll.options.map(() => 0);
  const voteCounts = poll.options.map(() => 0);
  const N = poll.options.length;
  Object.values(poll.votes).forEach(ranks => {
    ranks.forEach((rank, i) => {
      scores[i] += N - rank + 1;
      voteCounts[i]++;
    });
  });
  return poll.options.map((option, i) => ({
    option,
    score: scores[i],
    votes: voteCounts[i]
  })).sort((a, b) => b.score - a.score);
}

/**
 * Format poll results as an embed.
 * @param {string} messageId
 * @returns {EmbedBuilder}
 */
export function resultsEmbed(messageId) {
  const poll = polls[messageId];
  if (!poll) return null;
  const results = calculateResults(messageId);
  const embed = new EmbedBuilder()
    .setTitle('📊 Poll Results')
    .setDescription(poll.question)
    .setColor('#00b0f4');
  results.forEach((res, i) => {
    embed.addFields({
      name: `${i + 1}. ${res.option}`,
      value: `Score: ${res.score} | Votes: ${res.votes}`,
      inline: false
    });
  });
  return embed;
} 