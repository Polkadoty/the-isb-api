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

  // Calculate average damage for each die type
  if (counts.red > 0) {
    // Red dice: 1 double (2 damage), 2 hits (1 damage each), 2 crits (1 damage each)
    stats.averageDamage += counts.red * ((1/8 * 2) + (2/8 * 1) + (2/8 * 1));
  }

  if (counts.blue > 0) {
    // Blue dice: 4 hits (1 damage each), 2 crits (1 damage each)
    stats.averageDamage += counts.blue * ((4/8 * 1) + (2/8 * 1));
  }

  if (counts.black > 0) {
    // Black dice: 2 hit+crit (1 damage each), 4 hits (1 damage each)
    stats.averageDamage += counts.black * ((2/8 * 1) + (4/8 * 1));
  }

  // Calculate accuracy chance across all dice
  const noAccuracyChances = [];
  
  if (counts.red > 0) {
    // Red dice have 1 accuracy face
    noAccuracyChances.push(Math.pow(7/8, counts.red));
  }
  
  if (counts.blue > 0) {
    // Blue dice have 2 accuracy faces
    noAccuracyChances.push(Math.pow(6/8, counts.blue));
  }

  // Calculate probability of at least one accuracy across all dice
  if (noAccuracyChances.length > 0) {
    // Probability of no accuracies = product of individual no-accuracy probabilities
    const noAccuracyProbability = noAccuracyChances.reduce((a, b) => a * b, 1);
    stats.accuracyChance = 1 - noAccuracyProbability;
  }

  // Calculate critical chance across all dice
  const noCritChances = [];
  
  if (counts.red > 0) {
    // Red dice have 2 crit faces
    noCritChances.push(Math.pow(6/8, counts.red));
  }
  
  if (counts.blue > 0) {
    // Blue dice have 2 crit faces
    noCritChances.push(Math.pow(6/8, counts.blue));
  }
  
  if (counts.black > 0) {
    // Black dice have 2 hit+crit faces
    noCritChances.push(Math.pow(6/8, counts.black));
  }

  // Calculate probability of at least one crit across all dice
  if (noCritChances.length > 0) {
    // Probability of no crits = product of individual no-crit probabilities
    const noCritProbability = noCritChances.reduce((a, b) => a * b, 1);
    stats.criticalChance = 1 - noCritProbability;
  }

  return stats;
}

function formatRollResults(results) {
  // Group dice by color
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.color]) acc[result.color] = [];
    acc[result.color].push(result.emoji);
    return acc;
  }, {});

  // Format each color group on its own line
  return Object.entries(groupedResults)
    .map(([color, emojis]) => `${color.toUpperCase()}: ${emojis.join(' ')}`)
    .join('\n');
}

export { parseDicePool, rollDice, calculateStats, formatRollResults }; 