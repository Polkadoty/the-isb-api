import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Using the same directory structure as your other scripts
const directories = {
  ships: path.join(__dirname, 'public/converted-json/ships'),
  squadrons: path.join(__dirname, 'public/converted-json/squadrons'),
  upgrades: path.join(__dirname, 'public/converted-json/upgrades'),
  objectives: path.join(__dirname, 'public/converted-json/objectives'),
  'legends-ships': path.join(__dirname, 'public/converted-json/legends-ships'),
  'legends-squadrons': path.join(__dirname, 'public/converted-json/legends-squadrons'),
  'legends-upgrades': path.join(__dirname, 'public/converted-json/legends-upgrades'),
  'legacy-ships': path.join(__dirname, 'public/converted-json/legacy-ships'),
  'legacy-squadrons': path.join(__dirname, 'public/converted-json/legacy-squadrons'),
  'legacy-upgrades': path.join(__dirname, 'public/converted-json/legacy-upgrades'),
  'old-legacy-ships': path.join(__dirname, 'public/converted-json/old-legacy-ships'),
  'old-legacy-squadrons': path.join(__dirname, 'public/converted-json/old-legacy-squadrons'),
  'old-legacy-upgrades': path.join(__dirname, 'public/converted-json/old-legacy-upgrades'),
  'arc-upgrades': path.join(__dirname, 'public/converted-json/arc-upgrades'),
  'arc-ships': path.join(__dirname, 'public/converted-json/arc-ships'),
  'arc-squadrons': path.join(__dirname, 'public/converted-json/arc-squadrons'),
  'arc-objectives': path.join(__dirname, 'public/converted-json/arc-objectives')
};

// Initialize statistics object
const statistics = {
  ships: {
    total: 0,
    byFaction: {},
    bySize: {},
    byHullValue: {},
    speedDistribution: {
      speed1: { exists: 0, doesntExist: 0 },
      speed2: { exists: 0, doesntExist: 0 },
      speed3: { exists: 0, doesntExist: 0 },
      speed4: { exists: 0, doesntExist: 0 }
    },
    shieldDistribution: {
      front: {},
      rear: {},
      left: {},
      right: {},
      left_aux: {},
      right_aux: {}
    },
    traits: {},
    pointCosts: {
      min: Infinity,
      max: -Infinity,
      average: 0,
      distribution: {}
    },
    defenseTokens: {
      scatter: {},
      evade: {},
      brace: {},
      redirect: {},
      contain: {},
      salvo: {}
    },
    commandValues: {},
    squadronValues: {},
    engineerValues: {},
    upgradeSlots: {},
    armamentDistribution: {
      asa: { red: {}, blue: {}, black: {} },
      front: { red: {}, blue: {}, black: {} },
      rear: { red: {}, blue: {}, black: {} },
      left: { red: {}, blue: {}, black: {} },
      right: { red: {}, blue: {}, black: {} },
      left_aux: { red: {}, blue: {}, black: {} },
      right_aux: { red: {}, blue: {}, black: {} },
      special: { red: {}, blue: {}, black: {} }
    }
  },
  squadrons: {
    total: 0,
    byFaction: {},
    byHullValue: {},
    bySpeed: {},
    defenseTokens: {
      scatter: {},
      evade: {},
      brace: {}
    },
    armamentDistribution: {
      antiSquadron: { red: {}, blue: {}, black: {} },
      antiShip: { red: {}, blue: {}, black: {} }
    },
    abilities: {
      adept: {},
      aiBattery: {},
      aiAntisquadron: {},
      assault: 0,
      bomber: 0,
      cloak: 0,
      counter: {},
      dodge: {},
      escort: 0,
      grit: 0,
      heavy: 0,
      intel: 0,
      relay: {},
      rogue: 0,
      scout: 0,
      screen: 0,
      snipe: {},
      strategic: 0,
      swarm: 0
    },
    pointCosts: {
      min: Infinity,
      max: -Infinity,
      average: 0,
      distribution: {}
    },
    uniqueCount: 0,
    aceCount: 0
  },
  upgrades: {
    total: 0,
    byType: {},
    byFaction: {},
    pointCosts: {
      min: Infinity,
      max: -Infinity,
      average: 0,
      distribution: {}
    },
    uniqueCount: 0,
    modificationCount: 0,
    byRestriction: {
      traits: {},
      size: {},
      disqualUpgrades: {},
      disableUpgrades: {},
      enableUpgrades: {},
      flagshipCount: 0
    },
    startCommands: {
      byType: {},
      byIcon: {},
      byAmount: {}
    },
    exhaustTypes: {
      blank: 0,
      recur: 0,
      nonrecur: 0,
      discard: 0
    }
  }
};

function updateValueCount(obj, value) {
  obj[value] = (obj[value] || 0) + 1;
}

function processShipData(shipData) {
  // Process chassis level data
  updateValueCount(statistics.ships.bySize, shipData.size);
  updateValueCount(statistics.ships.byHullValue, shipData.hull);

  // Process speed data
  for (let i = 1; i <= 4; i++) {
    const speedKey = `speed${i}`;
    if (shipData.speed[i] && shipData.speed[i].length > 0) {
      statistics.ships.speedDistribution[speedKey].exists++;
    } else {
      statistics.ships.speedDistribution[speedKey].doesntExist++;
    }
  }

  // Process shield data
  Object.entries(shipData.shields).forEach(([zone, value]) => {
    updateValueCount(statistics.ships.shieldDistribution[zone], value);
  });

  // Process models
  Object.values(shipData.models).forEach(model => {
    statistics.ships.total++;
    updateValueCount(statistics.ships.byFaction, model.faction);

    // Process traits
    model.traits.forEach(trait => {
      if (trait) updateValueCount(statistics.ships.traits, trait);
    });

    // Process points
    updateValueCount(statistics.ships.pointCosts.distribution, model.points);
    statistics.ships.pointCosts.min = Math.min(statistics.ships.pointCosts.min, model.points);
    statistics.ships.pointCosts.max = Math.max(statistics.ships.pointCosts.max, model.points);

    // Process defense tokens
    Object.entries(model.tokens).forEach(([token, count]) => {
      const tokenName = token.replace('def_', '');
      updateValueCount(statistics.ships.defenseTokens[tokenName], count);
    });

    // Process command values
    updateValueCount(statistics.ships.commandValues, model.values.command);
    updateValueCount(statistics.ships.squadronValues, model.values.squadron);
    updateValueCount(statistics.ships.engineerValues, model.values.engineer);

    // Process upgrade slots
    model.upgrades.forEach(upgrade => {
      updateValueCount(statistics.ships.upgradeSlots, upgrade);
    });

    // Process armament
    Object.entries(model.armament).forEach(([arc, [red, blue, black]]) => {
      updateValueCount(statistics.ships.armamentDistribution[arc].red, red);
      updateValueCount(statistics.ships.armamentDistribution[arc].blue, blue);
      updateValueCount(statistics.ships.armamentDistribution[arc].black, black);
    });
  });
}

function processSquadronData(squadronData) {
  Object.values(squadronData.squadrons).forEach(squadron => {
    statistics.squadrons.total++;
    updateValueCount(statistics.squadrons.byFaction, squadron.faction);
    updateValueCount(statistics.squadrons.byHullValue, squadron.hull);
    updateValueCount(statistics.squadrons.bySpeed, squadron.speed);

    // Process defense tokens
    Object.entries(squadron.tokens || {}).forEach(([token, count]) => {
      const tokenName = token.replace('def_', '');
      updateValueCount(statistics.squadrons.defenseTokens[tokenName], count);
    });

    // Process armament with safety checks
    ['antiSquadron', 'antiShip'].forEach((type) => {
      const armamentKey = type === 'antiSquadron' ? 'anti-squadron' : 'anti-ship';
      if (squadron.armament && Array.isArray(squadron.armament[armamentKey])) {
        const [red = 0, blue = 0, black = 0] = squadron.armament[armamentKey];
        updateValueCount(statistics.squadrons.armamentDistribution[type].red, red);
        updateValueCount(statistics.squadrons.armamentDistribution[type].blue, blue);
        updateValueCount(statistics.squadrons.armamentDistribution[type].black, black);
      }
    });

    // Process abilities with safety check
    if (squadron.abilities) {
      Object.entries(squadron.abilities).forEach(([ability, value]) => {
        if (typeof value === 'boolean') {
          statistics.squadrons.abilities[ability] += value ? 1 : 0;
        } else if (value !== undefined) {
          updateValueCount(statistics.squadrons.abilities[ability], value);
        }
      });
    }

    // Process points
    if (squadron.points !== undefined) {
      updateValueCount(statistics.squadrons.pointCosts.distribution, squadron.points);
      statistics.squadrons.pointCosts.min = Math.min(statistics.squadrons.pointCosts.min, squadron.points);
      statistics.squadrons.pointCosts.max = Math.max(statistics.squadrons.pointCosts.max, squadron.points);
    }

    // Count uniques and aces
    if (squadron.unique) statistics.squadrons.uniqueCount++;
    if (squadron.ace) statistics.squadrons.aceCount++;
  });
}

function processUpgradeData(upgradeData) {
  Object.values(upgradeData.upgrades).forEach(upgrade => {
    statistics.upgrades.total++;
    updateValueCount(statistics.upgrades.byType, upgrade.type);

    // Process factions
    upgrade.faction.forEach(faction => {
      updateValueCount(statistics.upgrades.byFaction, faction);
    });

    // Process points
    updateValueCount(statistics.upgrades.pointCosts.distribution, upgrade.points);
    statistics.upgrades.pointCosts.min = Math.min(statistics.upgrades.pointCosts.min, upgrade.points);
    statistics.upgrades.pointCosts.max = Math.max(statistics.upgrades.pointCosts.max, upgrade.points);

    // Count uniques and modifications
    if (upgrade.unique) statistics.upgrades.uniqueCount++;
    if (upgrade.modification) statistics.upgrades.modificationCount++;

    // Process restrictions
    if (upgrade.restrictions) {
      upgrade.restrictions.traits?.forEach(trait => {
        updateValueCount(statistics.upgrades.byRestriction.traits, trait);
      });
      upgrade.restrictions.size?.forEach(size => {
        updateValueCount(statistics.upgrades.byRestriction.size, size);
      });
      if (upgrade.restrictions.flagship) {
        statistics.upgrades.byRestriction.flagshipCount++;
      }
    }

    // Process start commands
    if (upgrade.start_command) {
      updateValueCount(statistics.upgrades.startCommands.byType, upgrade.start_command.type);
      upgrade.start_command.start_icon?.forEach(icon => {
        updateValueCount(statistics.upgrades.startCommands.byIcon, icon);
      });
      updateValueCount(statistics.upgrades.startCommands.byAmount, upgrade.start_command.start_amount);
    }

    // Process exhaust types
    if (upgrade.exhaust) {
      statistics.upgrades.exhaustTypes[upgrade.exhaust.type]++;
    }
  });
}

function findStatistics(directory) {
  const files = fs.readdirSync(directory);

  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findStatistics(filePath);
    } else if (file.endsWith('.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (data.ships) {
          Object.values(data.ships).forEach(processShipData);
        }
        if (data.squadrons) {
          processSquadronData(data);
        }
        if (data.upgrades) {
          processUpgradeData(data);
        }
      } catch (error) {
        console.error(`Error processing file: ${filePath}`, error);
      }
    }
  });
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    base: args.length === 0 || args.includes('-base'),
    legends: args.includes('-legends'),
    legacy: args.includes('-legacy'),
    oldLegacy: args.includes('-old-legacy'),
    arc: args.includes('-arc')
  };
}

// Main execution
const flags = parseArgs();

// Process directories based on flags
const selectedDirectories = {};

// Always include base game content
if (flags.base) {
  selectedDirectories.ships = directories.ships;
  selectedDirectories.squadrons = directories.squadrons;
  selectedDirectories.upgrades = directories.upgrades;
  selectedDirectories.objectives = directories.objectives;
}

if (flags.legends) {
  selectedDirectories['legends-ships'] = directories['legends-ships'];
  selectedDirectories['legends-squadrons'] = directories['legends-squadrons'];
  selectedDirectories['legends-upgrades'] = directories['legends-upgrades'];
}

if (flags.legacy) {
  selectedDirectories['legacy-ships'] = directories['legacy-ships'];
  selectedDirectories['legacy-squadrons'] = directories['legacy-squadrons'];
  selectedDirectories['legacy-upgrades'] = directories['legacy-upgrades'];
}

if (flags.oldLegacy) {
  selectedDirectories['old-legacy-ships'] = directories['old-legacy-ships'];
  selectedDirectories['old-legacy-squadrons'] = directories['old-legacy-squadrons'];
  selectedDirectories['old-legacy-upgrades'] = directories['old-legacy-upgrades'];
}

if (flags.arc) {
  selectedDirectories['arc-ships'] = directories['arc-ships'];
  selectedDirectories['arc-squadrons'] = directories['arc-squadrons'];
  selectedDirectories['arc-upgrades'] = directories['arc-upgrades'];
  selectedDirectories['arc-objectives'] = directories['arc-objectives'];
}

// Process each selected directory
Object.values(selectedDirectories).forEach(directory => {
  if (fs.existsSync(directory)) {
    findStatistics(directory);
  }
});

// Calculate averages
['ships', 'squadrons', 'upgrades'].forEach(type => {
  if (statistics[type].total > 0) {
    const totalPoints = Object.entries(statistics[type].pointCosts.distribution)
      .reduce((sum, [points, count]) => sum + (Number(points) * count), 0);
    statistics[type].pointCosts.average = totalPoints / statistics[type].total;
  }
});

// Write the statistics to a file
fs.writeFileSync(
  path.join(__dirname, 'public/statistics.json'),
  JSON.stringify(statistics, null, 2)
); 