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

function formatGroup(diceResults) {
  const groupedResults = diceResults.reduce((acc, result) => {
    if (!acc[result.color]) acc[result.color] = [];
    acc[result.color].push(result.emoji);
    return acc;
  }, {});

  return Object.entries(groupedResults)
    .map(([, emojis]) => emojis.join(' '))
    .join(' ');
}

function formatRollResults(results) {
  if (results.finalPool) {
    // Defense roll format
    return [
      '### 🎲 Original Pool',
      formatGroup(results.initial),
      '',
      '### 🎲 Final Pool',
      formatGroup(results.finalPool)
    ].join('\n');
  } else {
    // Attack roll format
    let output = ['### 🎲 Initial Roll\n #', formatGroup(results.initial)];
    
    if (results.rerolls.length > 0) {
      output.push('\n### 🎯 Reroll Results\n #', formatGroup(results.rerolls));
    }
    
    return output.join('\n');
  }
}

function parseEmojiRerolls(content) {
  const rerolls = [];
  
  // Map text identifiers to dice info
  const diceMap = {
    'red-double': { color: 'red', face: 'double' },
    'red-accuracy': { color: 'red', face: 'accuracy' },
    'red-hit': { color: 'red', face: 'hit' },
    'red-crit': { color: 'red', face: 'crit' },
    'red-blank': { color: 'red', face: 'blank' },
    'blue-accuracy': { color: 'blue', face: 'accuracy' },
    'blue-hit': { color: 'blue', face: 'hit' },
    'blue-crit': { color: 'blue', face: 'crit' },
    'black-hitcrit': { color: 'black', face: 'hitcrit' },
    'black-hit': { color: 'black', face: 'hit' },
    'black-blank': { color: 'black', face: 'blank' }
  };

  // Extract dice identifiers from content
  const diceIdentifiers = content.toLowerCase().split(' ').filter(word => diceMap[word]);
  
  // Convert to dice results
  diceIdentifiers.forEach(id => {
    if (diceMap[id]) {
      rerolls.push({
        color: diceMap[id].color,
        face: diceMap[id].face
      });
    }
  });

  return rerolls;
}

function parseEmbedResults(description) {
  // Get the first line which contains the dice results
  const lines = description.split('\n');
  
  // Find the line that contains the Initial Roll results
  const initialRollIndex = lines.findIndex(line => line.includes('Initial Roll'));
  
  // Get the next line which should contain the dice emojis
  const resultLine = initialRollIndex >= 0 ? lines[initialRollIndex + 2] : '';
  
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

function calculatePeakDamage(counts) {
  const peaks = {
    maxDamage: 0,
    maxDamageNoCrits: 0,
    maxDamageWithAcc: 0,
    maxDamageWithAccNoCrits: 0
  };

  // Calculate max damage without accuracy considerations
  if (counts.red > 0) {
    peaks.maxDamageNoCrits += counts.red * 2; // All doubles
    peaks.maxDamage += counts.red * 2; // All doubles (same as no crits for red)
  }

  if (counts.blue > 0) {
    peaks.maxDamageNoCrits += counts.blue * 1; // All hits
    peaks.maxDamage += counts.blue * 1; // All crits
  }

  if (counts.black > 0) {
    peaks.maxDamageNoCrits += counts.black * 1; // All hits
    peaks.maxDamage += counts.black * 2; // All hitcrits
  }

  // Copy values for accuracy calculations
  peaks.maxDamageWithAccNoCrits = peaks.maxDamageNoCrits;
  peaks.maxDamageWithAcc = peaks.maxDamage;

  // Subtract damage for one accuracy, prioritizing blue dice
  if (counts.blue > 0) {
    peaks.maxDamageWithAccNoCrits -= 1; // Remove one hit
    peaks.maxDamageWithAcc -= 1; // Remove one crit
  } else if (counts.red > 0) {
    peaks.maxDamageWithAccNoCrits -= 2; // Remove one double
    peaks.maxDamageWithAcc -= 2; // Remove one double
  }
  // We don't use black dice for accuracy as they don't have accuracy faces

  return peaks;
}

function parseDefenseRerolls(args) {
  const rerolls = [];
  
  // Map text identifiers to dice info
  const diceMap = {
    'red-double': { color: 'red', face: 'double' },
    'red-accuracy': { color: 'red', face: 'accuracy' },
    'red-hit': { color: 'red', face: 'hit' },
    'red-crit': { color: 'red', face: 'crit' },
    'red-blank': { color: 'red', face: 'blank' },
    'blue-accuracy': { color: 'blue', face: 'accuracy' },
    'blue-hit': { color: 'blue', face: 'hit' },
    'blue-crit': { color: 'blue', face: 'crit' },
    'black-hitcrit': { color: 'black', face: 'hitcrit' },
    'black-hit': { color: 'black', face: 'hit' },
    'black-blank': { color: 'black', face: 'blank' }
  };

  args.forEach(arg => {
    if (diceMap[arg.toLowerCase()]) {
      rerolls.push(diceMap[arg.toLowerCase()]);
    }
  });

  return rerolls;
}

export { 
  parseDicePool, 
  rollDice, 
  calculateStats, 
  formatRollResults, 
  parseEmojiRerolls,
  parseEmbedResults,
  calculatePeakDamage,
  parseDefenseRerolls,
  formatGroup,
  DICE_FACES
}; 