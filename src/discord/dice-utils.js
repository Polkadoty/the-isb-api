function parseDicePool(args) {
  const counts = { red: 0, blue: 0, black: 0 };
  let valid = true;

  args.forEach(arg => {
    const match = arg.match(/(\d+)(red|blue|black)/i);
    if (match) {
      counts[match[2].toLowerCase()] += parseInt(match[1]);
    } else {
      valid = false;
    }
  });

  return { valid, counts };
}

function rollDice(counts) {
  const results = [];
  
  Object.entries(counts).forEach(([color, count]) => {
    for (let i = 0; i < count; i++) {
      const face = DICE_FACES[color].faces[Math.floor(Math.random() * 8)];
      results.push({
        color,
        face,
        emoji: DICE_FACES[color].emojis[face]
      });
    }
  });

  return results;
}

function calculateStats(counts) {
  const stats = {
    averageDamage: 0,
    accuracyChance: 0,
    criticalChance: 0
  };

  // Calculate probabilities for each die type
  if (counts.red > 0) {
    stats.averageDamage += counts.red * (2/8 * 2 + 2/8 * 1); // doubles and hits
    stats.accuracyChance = 1 - Math.pow(7/8, counts.red); // chance of at least one accuracy
    stats.criticalChance = 1 - Math.pow(6/8, counts.red); // chance of at least one crit
  }

  if (counts.blue > 0) {
    stats.averageDamage += counts.blue * (4/8 * 1); // hits
    stats.accuracyChance = Math.max(stats.accuracyChance, 1 - Math.pow(6/8, counts.blue));
    stats.criticalChance = Math.max(stats.criticalChance, 1 - Math.pow(6/8, counts.blue));
  }

  if (counts.black > 0) {
    stats.averageDamage += counts.black * (2/8 * 2 + 4/8 * 1); // hitcrits and hits
    stats.criticalChance = Math.max(stats.criticalChance, 1 - Math.pow(6/8, counts.black));
  }

  return stats;
}

function formatRollResults(results) {
  return results.map(result => result.emoji).join(' ');
}

export { parseDicePool, rollDice, calculateStats, formatRollResults }; 