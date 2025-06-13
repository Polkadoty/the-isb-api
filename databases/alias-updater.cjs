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
function updateFleetDataAliases(fleetData, debug = false) {
  if (!fleetData) return fleetData;

  const lines = fleetData.split(/\r\n|\n|\r/);
  const updatedLines = [];
  let aliasCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    let updatedLine = line;
    let wasUpdated = false;

    if (trimmedLine.startsWith('Commander:')) {
      const commanderMatch = trimmedLine.match(/^Commander:\s*(.+?)(\s*\(\d+\))?$/);
      if (commanderMatch) {
        const commanderName = commanderMatch[1].trim();
        const starForgeAlias = getStarForgeAlias(commanderName, 'commander');
        if (starForgeAlias !== commanderName) {
          const cleanAlias = starForgeAlias.replace(/\s*\(\d+\)$/, '');
          updatedLine = line.replace(commanderName, cleanAlias);
          aliasCount++;
          wasUpdated = true;
          if (debug) console.log(`  Commander: "${commanderName}" → "${cleanAlias}"`);
        }
      }
    } else if (trimmedLine.startsWith('• ')) {
      // This is an upgrade - be more careful with replacement
      const bulletAndSpaces = line.match(/^(\s*•\s*)/)[0]; // Preserve original spacing
      const upgradeName = trimmedLine.substring(2).trim();
      const starForgeAlias = getStarForgeAlias(upgradeName, 'ship_upgrade');
      
      if (starForgeAlias !== upgradeName && !starForgeAlias.startsWith('match not found')) {
        updatedLine = bulletAndSpaces + starForgeAlias;
        aliasCount++;
        wasUpdated = true;
        if (debug) console.log(`  Upgrade: "${upgradeName}" → "${starForgeAlias}"`);
      }
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
      if (starForgeAlias !== trimmedLine && !starForgeAlias.startsWith('match not found')) {
        // Preserve original line indentation
        const leadingSpaces = line.match(/^\s*/)[0];
        updatedLine = leadingSpaces + starForgeAlias;
        aliasCount++;
        wasUpdated = true;
        if (debug) console.log(`  Ship: "${trimmedLine}" → "${starForgeAlias}"`);
      }
    }

    updatedLines.push(updatedLine);
    
    // Show first few updates for debugging
    if (debug && wasUpdated && aliasCount <= 5) {
      console.log(`    Line ${i + 1}: ${wasUpdated ? 'UPDATED' : 'unchanged'}`);
    }
  }

  if (debug && aliasCount > 0) {
    console.log(`  Total aliases updated in this fleet: ${aliasCount}`);
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
  let debugMode = process.argv.includes('--debug');
  
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
      // Enable debug for first few records if debug mode
      const shouldDebug = debugMode && (index < 3 || totalAliasUpdates < 5);
      if (shouldDebug) {
        console.log(`\n🔍 Debugging Fleet ${index + 1}:`);
      }
      
      record.fleet_data = updateFleetDataAliases(record.fleet_data, shouldDebug);
      
      // Count changes (simple check)
      if (record.fleet_data !== originalData) {
        totalAliasUpdates++;
        if (shouldDebug) {
          console.log(`✅ Fleet ${index + 1} had aliases updated\n`);
        }
      } else if (shouldDebug) {
        console.log(`ℹ️ Fleet ${index + 1} had no alias changes\n`);
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
  console.error("Usage: node alias-updater.cjs <input_csv> <output_csv> [--debug]");
  console.error("Example: node alias-updater.cjs converted-fleets.csv updated-fleets.csv");
  console.error("Example: node alias-updater.cjs converted-fleets.csv updated-fleets.csv --debug");
  process.exit(1);
}

// Test the alias lookup with a few known items
console.log("🧪 Testing alias lookup:");
console.log(`  "ISD 2" (ship) → "${getStarForgeAlias('ISD 2', 'ship')}"`);
console.log(`  "Expert Shield Tech" (upgrade) → "${getStarForgeAlias('Expert Shield Tech', 'ship_upgrade')}"`);
console.log(`  "Moff Jerjerrod" (commander) → "${getStarForgeAlias('Moff Jerjerrod', 'commander')}"`);
console.log(`  "TIE Fighter Squadron" (squadron) → "${getStarForgeAlias('TIE Fighter Squadron', 'squadron')}"`);
console.log("");

const inputPath = path.join(__dirname, inputFile);
const outputPath = path.join(__dirname, outputFile);

updateFleetAliases(inputPath, outputPath); 