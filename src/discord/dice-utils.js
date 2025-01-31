const DICE_FACES = {
  red: {
    faces: ['double', 'accuracy', 'hit', 'hit', 'crit', 'crit', 'blank', 'blank'],
    emojis: {
      double: '<:reddbl:1260990898443911229>',
      accuracy: '<:redacc:1260990874360348813>',
      hit: '<:redhit:1260990912885035078>',
      crit: '<:redcrit:1260990887526268979>',
      blank: '<:redblank:1260991705566679060>'
    }
  },
  blue: {
    faces: ['accuracy', 'accuracy', 'hit', 'hit', 'hit', 'hit', 'crit', 'crit'],
    emojis: {
      accuracy: '<:blueacc:1260990975803916339>',
      hit: '<:bluehit:1260990988160077865>',
      crit: '<:bluecrit:1260990962512040146>'
    }
  },
  black: {
    faces: ['hitcrit', 'hitcrit', 'hit', 'hit', 'hit', 'hit', 'blank', 'blank'],
    emojis: {
      hitcrit: '<:blackhitcrit:1260990950692491295>',
      hit: '<:blackhit:1260991760017133639>',
      blank: '<:blackblank:1260991683060039720>'
    }
  }
};

function parseDicePool(args) {
  const counts = { red: 0, blue: 0, black: 0 };
  const rerolls = { red: 0, blue: 0, black: 0 };
  let valid = true;
  
  // Find the index of -reroll flag
  const rerollIndex = args.findIndex(arg => arg.toLowerCase() === '-reroll');
  
  // If we have a reroll flag, split the args into initial and reroll pools
  const initialPool = rerollIndex === -1 ? args : args.slice(0, rerollIndex);
  const rerollPool = rerollIndex === -1 ? [] : args.slice(rerollIndex + 1);

  // Parse initial pool
  initialPool.forEach(arg => {
    const match = arg.match(/(\d+)(red|blue|black)/i);
    if (match) {
      counts[match[2].toLowerCase()] += parseInt(match[1]);
    } else {
      valid = false;
    }
  });

  // Parse reroll pool
  rerollPool.forEach(arg => {
    const match = arg.match(/(\d+)(red|blue|black)/i);
    if (match) {
      rerolls[match[2].toLowerCase()] += parseInt(match[1]);
    } else {
      valid = false;
    }
  });

  return { valid, counts, rerolls };
}

function rollDice(counts, rerolls = { red: 0, blue: 0, black: 0 }) {
  const results = [];
  const rerollResults = [];
  
  // Initial roll
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

  // Handle rerolls for each color
  Object.entries(rerolls).forEach(([color, rerollCount]) => {
    if (rerollCount > 0) {
      const blanks = results.filter(r => r.face === 'blank' && r.color === color);
      const actualRerolls = Math.min(rerollCount, blanks.length);
      
      for (let i = 0; i < actualRerolls; i++) {
        const face = DICE_FACES[color].faces[Math.floor(Math.random() * 8)];
        rerollResults.push({
          color,
          face,
          emoji: DICE_FACES[color].emojis[face]
        });
      }
    }
  });

  return { initial: results, rerolls: rerollResults };
}

function calculateStats(counts) {
  const stats = {
    averageDamage: 0,
    averageDamageNoCrits: 0,
    averageAccuracies: 0,
    accuracyChance: 0,
    criticalChance: 0
  };

  // Calculate averages for each die type
  if (counts.red > 0) {
    // Red dice: 1 double (2), 1 accuracy, 2 hits (1), 2 crits (1), 2 blanks
    stats.averageDamageNoCrits += counts.red * ((1/8 * 2) + (2/8 * 1)); // doubles and hits
    stats.averageDamage += counts.red * ((1/8 * 2) + (2/8 * 1) + (2/8 * 1)); // including crits
    stats.averageAccuracies += counts.red * (1/8); // one accuracy face
  }

  if (counts.blue > 0) {
    // Blue dice: 2 accuracy, 4 hits (1), 2 crits (1)
    stats.averageDamageNoCrits += counts.blue * (4/8 * 1); // just hits
    stats.averageDamage += counts.blue * ((4/8 * 1) + (2/8 * 1)); // including crits
    stats.averageAccuracies += counts.blue * (2/8); // two accuracy faces
  }

  if (counts.black > 0) {
    // Black dice: 2 hit+crit (1+1), 4 hits (1), 2 blanks
    stats.averageDamageNoCrits += counts.black * ((2/8 * 1) + (4/8 * 1)); // just hits from all faces
    stats.averageDamage += counts.black * ((2/8 * 2) + (4/8 * 1)); // counting hitcrit as 2 damage
  }

  // Calculate accuracy chance across all dice
  const noAccuracyChances = [];
  
  if (counts.red > 0) {
    noAccuracyChances.push(Math.pow(7/8, counts.red));
  }
  
  if (counts.blue > 0) {
    noAccuracyChances.push(Math.pow(6/8, counts.blue));
  }

  if (noAccuracyChances.length > 0) {
    const noAccuracyProbability = noAccuracyChances.reduce((a, b) => a * b, 1);
    stats.accuracyChance = 1 - noAccuracyProbability;
  }

  // Calculate critical chance across all dice
  const noCritChances = [];
  
  if (counts.red > 0) {
    noCritChances.push(Math.pow(6/8, counts.red));
  }
  
  if (counts.blue > 0) {
    noCritChances.push(Math.pow(6/8, counts.blue));
  }
  
  if (counts.black > 0) {
    noCritChances.push(Math.pow(6/8, counts.black));
  }

  if (noCritChances.length > 0) {
    const noCritProbability = noCritChances.reduce((a, b) => a * b, 1);
    stats.criticalChance = 1 - noCritProbability;
  }

  return stats;
}

function formatRollResults(results) {
  const formatGroup = (diceResults) => {
    const groupedResults = diceResults.reduce((acc, result) => {
      if (!acc[result.color]) acc[result.color] = [];
      acc[result.color].push(result.emoji);
      return acc;
    }, {});

    return Object.entries(groupedResults)
      .map(([, emojis]) => emojis.join(' '))
      .join(' ');
  };

  let output = ['### 🎲 Initial Roll\n #', formatGroup(results.initial)];
  
  if (results.rerolls.length > 0) {
    output.push('\n### 🎯 Reroll Results\n #', formatGroup(results.rerolls));
  }

  return output.join('\n');
}

export { parseDicePool, rollDice, calculateStats, formatRollResults }; 

function parseEmojiRerolls(content) {
  const rerolls = { red: 0, blue: 0, black: 0 };
  
  // Map emoji IDs to dice colors and faces
  const emojiMap = {
    'reddbl': 'red',
    'redacc': 'red',
    'redhit': 'red',
    'redcrit': 'red',
    'redblank': 'red',
    'blueacc': 'blue',
    'bluehit': 'blue',
    'bluecrit': 'blue',
    'blackhitcrit': 'black',
    'blackhit': 'black',
    'blackblank': 'black'
  };

  // Extract emoji IDs from the content
  const emojiMatches = content.match(/:(\w+):/g) || [];
  
  // Count rerolls for each color
  emojiMatches.forEach(emoji => {
    const emojiId = emoji.replace(/:/g, '');
    const color = emojiMap[emojiId];
    if (color) {
      rerolls[color]++;
    }
  });

  return rerolls;
}

function parseEmbedResults(description) {
  // Get the first line which contains the dice results
  const resultLine = description.split('\n')[0];
  
  const results = [];
  
  // Match all emoji patterns like <:reddbl:1260990898443911229>
  const emojiMatches = resultLine.match(/<:\w+:\d+>/g) || [];
  
  // Create reverse mapping from emoji ID to dice info
  const emojiToDice = {};
  Object.entries(DICE_FACES).forEach(([color, data]) => {
    Object.entries(data.emojis).forEach(([face, emojiId]) => {
      emojiToDice[emojiId] = { color, face };
    });
  });

  // Convert emojis back to dice results
  emojiMatches.forEach(emoji => {
    const diceInfo = emojiToDice[emoji];
    if (diceInfo) {
      results.push({
        color: diceInfo.color,
        face: diceInfo.face,
        emoji: emoji
      });
    }
  });

  return results;
}