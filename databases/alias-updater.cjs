const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Paths to resources
const ALIASES_PATH = path.join(__dirname, '../src/discord/public/aliases.json');
const NICKNAMES_PATH = path.join(__dirname, '../src/discord/public/armada-nickname-map.json');

// Load alias and nickname maps
const aliases = JSON.parse(fs.readFileSync(ALIASES_PATH, 'utf8'));
const nicknames = JSON.parse(fs.readFileSync(NICKNAMES_PATH, 'utf8'));

// Helper: Extract points from a string like "ISD 2" or "Moff Jerjerrod (23)"
function extractPoints(name) {
  const match = name.match(/\((\d+)\)/);
  return match ? parseInt(match[1], 10) : null;
}

// Helper: Clean up multi-line CSV fields
function cleanField(field) {
  return field.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeName(name) {
  return name ? name.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim().toLowerCase() : '';
}

// Helper function to prefer Star Forge aliases (with proper points)
function preferStarForgeAlias(aliasArray) {
  if (!aliasArray || aliasArray.length === 0) return null;
  
  // First, try to find aliases with non-zero points
  const aliasesWithPoints = aliasArray.filter(alias => {
    const points = extractPoints(alias);
    return points !== null && points > 0;
  });
  
  if (aliasesWithPoints.length > 0) {
    // Sort by points descending to prefer higher point values (likely current)
    aliasesWithPoints.sort((a, b) => {
      const pointsA = extractPoints(a) || 0;
      const pointsB = extractPoints(b) || 0;
      return pointsB - pointsA;
    });
    return aliasesWithPoints[0];
  }
  
  // Otherwise, return the first alias
  return aliasArray[0];
}

// Enhanced alias lookup function
function getStarForgeAlias(name, context = 'unknown') {
  const original = name;
  let cleanedName = cleanField(name);

  // Strip trailing (0) point costs
  if (cleanedName.match(/\(\s*0\s*\)\s*$/)) {
    cleanedName = cleanedName.replace(/\s*\(\s*0\s*\)\s*$/, '').trim();
  }

  // Handle exclamation point for updated items (widen search)
  let hasExclamation = false;
  if (cleanedName.endsWith('!')) {
    hasExclamation = true;
    cleanedName = cleanedName.slice(0, -1).trim();
  }

  const finalTrimmedCleanedName = cleanedName.trim();
  if (!finalTrimmedCleanedName || /^\d+$/.test(finalTrimmedCleanedName)) {
    return original; // Return original if invalid
  }
  const normInput = normalizeName(finalTrimmedCleanedName);

  // Helper for context filtering display names
  const passesContextFilter = (aliasDisplayName, currentContext) => {
    const lowerAlias = aliasDisplayName.toLowerCase();
    const isMarkedCommander = lowerAlias.includes('(commander)');
    const isMarkedSquadron = lowerAlias.includes('(squadron)');

    if (currentContext === 'commander' || currentContext === 'flagship_upgrade') {
      return isMarkedCommander || !isMarkedSquadron;
    } else if (currentContext === 'squadron') {
      return !isMarkedCommander;
    } else {
      return !isMarkedCommander && !isMarkedSquadron;
    }
  };

  // Stage 1: Nickname to Canonical Key(s)
  let potentialCanonicalIds = [];
  if (nicknames[cleanedName]) { 
    potentialCanonicalIds = Array.isArray(nicknames[cleanedName]) ? nicknames[cleanedName] : [nicknames[cleanedName]];
  } else {
    const nicknameKey = Object.keys(nicknames).find(k => normalizeName(k) === normInput);
    if (nicknameKey) {
        potentialCanonicalIds = Array.isArray(nicknames[nicknameKey]) ? nicknames[nicknameKey] : [nicknames[nicknameKey]];
    }
  }

  if (potentialCanonicalIds.length > 0) {
    let allFoundAliases = [];
    for (const canonId of potentialCanonicalIds) {
        const aliasesForThisId = Object.keys(aliases).filter(k => aliases[k] === canonId);
        allFoundAliases.push(...aliasesForThisId);
    }
    allFoundAliases = [...new Set(allFoundAliases)];

    if (allFoundAliases.length > 0) {
      const contextFilteredAliases = allFoundAliases.filter(aliasDisplayName => passesContextFilter(aliasDisplayName, context));
      if (contextFilteredAliases.length > 0) {
        return preferStarForgeAlias(contextFilteredAliases);
      }
    }
  }

  // Stage 2: Direct Alias Lookup
  let directIncludesMatchAliasKeys = Object.keys(aliases).filter(aliasKey => normalizeName(aliasKey).includes(normInput));
  
  if (hasExclamation && directIncludesMatchAliasKeys.length === 0) {
    // Try broader matching for exclamation point items
    const nameWithoutPoints = finalTrimmedCleanedName.replace(/\s*\(\d+\)$/, '').trim();
    const normInputWithoutPoints = normalizeName(nameWithoutPoints);
    directIncludesMatchAliasKeys = Object.keys(aliases).filter(aliasKey => {
      const aliasWithoutPoints = aliasKey.replace(/\s*\(\d+\)$/, '').trim();
      return normalizeName(aliasWithoutPoints).includes(normInputWithoutPoints);
    });
  }

  if (directIncludesMatchAliasKeys.length > 0) {
    const contextFilteredDirectMatches = directIncludesMatchAliasKeys.filter(aliasDisplayName => passesContextFilter(aliasDisplayName, context));
    if (contextFilteredDirectMatches.length > 0) {
      return preferStarForgeAlias(contextFilteredDirectMatches);
    }
  }

  return original; // Return original if no match found
}

// Function to update fleet data with Star Forge aliases
function updateFleetDataAliases(fleetData) {
  if (!fleetData) return fleetData;

  const lines = fleetData.split(/\r\n|\n|\r/);
  const updatedLines = [];
  let aliasCount = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('Commander:')) {
      const commanderMatch = trimmedLine.match(/^Commander:\s*(.+?)(\s*\(\d+\))?$/);
      if (commanderMatch) {
        const commanderName = commanderMatch[1].trim();
        const starForgeAlias = getStarForgeAlias(commanderName, 'commander');
        if (starForgeAlias !== commanderName) aliasCount++;
        updatedLines.push(line.replace(commanderName, starForgeAlias.replace(/\s*\(\d+\)$/, '')));
      } else {
        updatedLines.push(line);
      }
    } else if (trimmedLine.startsWith('• ')) {
      // This is an upgrade
      const upgradeName = trimmedLine.substring(2).trim();
      const starForgeAlias = getStarForgeAlias(upgradeName, 'ship_upgrade');
      if (starForgeAlias !== upgradeName) aliasCount++;
      updatedLines.push(line.replace(upgradeName, starForgeAlias));
    } else if (trimmedLine.includes('(') && trimmedLine.includes(')') && 
               !trimmedLine.startsWith('Faction:') && 
               !trimmedLine.startsWith('Commander:') &&
               !trimmedLine.startsWith('Assault:') &&
               !trimmedLine.startsWith('Defense:') &&
               !trimmedLine.startsWith('Navigation:') &&
               !trimmedLine.startsWith('Squadrons:') &&
               !trimmedLine.startsWith('Total Points:') &&
               !trimmedLine.startsWith('Name:') &&
               !trimmedLine.startsWith('= ')) {
      // This is likely a ship name
      const starForgeAlias = getStarForgeAlias(trimmedLine, 'ship');
      if (starForgeAlias !== trimmedLine) aliasCount++;
      updatedLines.push(line.replace(trimmedLine, starForgeAlias));
    } else {
      updatedLines.push(line);
    }
  }

  return updatedLines.join('\n');
}

// Main function to process CSV file
function updateFleetAliases(inputFile, outputFile) {
  console.log(`Reading fleet data from ${inputFile}...`);
  const startTime = Date.now();
  
  const input = fs.readFileSync(inputFile, 'utf8');
  const records = parse(input, { 
    columns: true, 
    skip_empty_lines: true, 
    bom: true 
  });

  console.log(`Processing ${records.length} fleet records...`);
  const progressInterval = Math.max(1, Math.floor(records.length / 20)); // Update every 5%

  let totalAliasUpdates = 0;
  const updatedRecords = records.map((record, index) => {
    // Progress logging
    if (index % progressInterval === 0 || index === records.length - 1) {
      const progress = ((index + 1) / records.length * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = ((index + 1) / elapsed).toFixed(1);
      console.log(`  Progress: ${progress}% (${index + 1}/${records.length}) - ${elapsed}s elapsed - ${rate} records/sec`);
    }

    if (record.fleet_data) {
      const originalData = record.fleet_data;
      record.fleet_data = updateFleetDataAliases(record.fleet_data);
      // Count changes (simple check)
      if (record.fleet_data !== originalData) {
        totalAliasUpdates++;
      }
    }
    return record;
  });

  console.log(`📊 Updated aliases in ${totalAliasUpdates} fleet records`);
  console.log(`Converting to CSV format...`);
  const csvString = stringify(updatedRecords, { header: true });
  
  console.log(`Writing to ${outputFile}...`);
  fs.writeFileSync(outputFile, csvString);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Updated fleet data saved to ${outputFile} (${totalTime}s total)`);
}

// Command line interface
const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error("Usage: node alias-updater.cjs <input_csv> <output_csv>");
  console.error("Example: node alias-updater.cjs converted-fleets.csv updated-fleets.csv");
  process.exit(1);
}

const inputPath = path.join(__dirname, inputFile);
const outputPath = path.join(__dirname, outputFile);

updateFleetAliases(inputPath, outputPath); 