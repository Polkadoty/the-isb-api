/*
Tournament-fleets schema:
FACTION,COMMANDER,ASSAULT OBJECTIVE,DEFENSE OBJECTIVE,NAVIGATION OBJECTIVE,FLAGSHIP,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,SHIP #2,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,SHIP #3,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,SHIP #4,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,SHIP #5,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,SHIP #6,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,SHIP #7,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,SHIP #8,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,UPGRADE,SHIP #9,UPGRADE,UPGRADE,SHIP TOTAL,SQUADRON #1,SQUADRON #2,SQUADRON #3,SQUADRON #4,SQUADRON #5,SQUADRON #6,SQUADRON #7,SQUADRON #8,SQUADRON #9,SQUADRON #10,SQUADRON #11,SQUADRON #12,SQUADRON #13,SQUADRON #14,SQUADRON #15,SQUADRON #16,SQUADRON #17,SQUADRON #18,SQUADRON TOTAL,LIST TOTAL,

---

fleets schema:
id,user_id,fleet_data,faction,fleet_name,created_at,updated_at,commander,points,date_added,legends,legacy,old_legacy,arc,shared,numerical_id

---

Example conversion:

Input (tournament-fleets):
Empire,Moff Jerjerrod,Advanced Gunnery,Fire Lanes,Hyperspace Migration,ISD 2,Chimera,Expert Shield Tech,Boarding Troopers,"Early Warning
System",Point Defense Ion Cannons,"Dual Turbolaser 
Turrets","Entrapment 
Formation!",,,,,ISD 2,Expert Shield Tech,Boarding Troopers,"Early Warning
System",Point Defense Ion Cannons,"Dual Turbolaser 
Turrets",,,,,"Gozanti
Cruisers",Suppressor,Minister Tua,"Electronic 
Countermeasures",Comms Net,,,,"Gozanti
Cruisers","Darth Vader 
(Officer)",Comms Net,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,389,,,,,,,,,,,,,,,,,,,0,389,

Output (fleets):
Name: Double ISD Squadless
Faction: Empire
Commander: Moff Jerjerrod (23)

Assault: Advanced Gunnery
Defense: Fire Lanes
Navigation: Hyperspace Migration

Imperial II-class Star Destroyer (120)
• Moff Jerjerrod (23)
• Expert Shield Tech (5)
• Boarding Troopers (3)
• Early Warning System (7)
• Point Defense Ion Cannons (6)
• Dual Turbolaser Turrets (4)
• Chimaera (4)
• Entrapment Formation! (5)
= 177 Points

Imperial II-class Star Destroyer (120)
• Expert Shield Tech (5)
• Boarding Troopers (3)
• Early Warning System (7)
• Point Defense Ion Cannons (6)
• Dual Turbolaser Turrets (4)
= 145 Points

Gozanti-class Cruisers (23)
• Darth Vader (4)
• Comms Net (2)
= 29 Points

Gozanti-class Cruisers (23)
• Minister Tua (2)
• Comms Net (2)
• Suppressor (4)
• Electronic Countermeasures (7)
= 38 Points

Squadrons:
= 0 Points

Total Points: 389
*/

// Required modules
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Paths to resources
const ALIASES_PATH = path.join(__dirname, '../src/discord/public/aliases.json');
const NICKNAMES_PATH = path.join(__dirname, '../src/discord/public/armada-nickname-map.json');
const TOURNAMENT_CSV = path.join(__dirname, 'tournament-fleets.csv');
const OUTPUT_CSV = path.join(__dirname, 'converted-fleets.csv');
const LOG_FILE = path.join(__dirname, 'fleetconverter.log');

// Delete old log and output CSV if they exist
if (fs.existsSync(LOG_FILE)) {
  fs.unlinkSync(LOG_FILE);
}
if (fs.existsSync(OUTPUT_CSV)) {
  fs.unlinkSync(OUTPUT_CSV);
}

// Load alias and nickname maps
const aliases = JSON.parse(fs.readFileSync(ALIASES_PATH, 'utf8'));
const nicknames = JSON.parse(fs.readFileSync(NICKNAMES_PATH, 'utf8'));

// Helper: Get canonical key from aliases/nicknames
function getCanonicalKey(name) {
  // Try direct alias match
  if (aliases[name]) return aliases[name];
  // Try nickname match
  if (nicknames[name]) return nicknames[name][0];
  // Try case-insensitive match
  const aliasKey = Object.keys(aliases).find(k => k.toLowerCase() === name.toLowerCase());
  if (aliasKey) return aliases[aliasKey];
  const nicknameKey = Object.keys(nicknames).find(k => k.toLowerCase() === name.toLowerCase());
  if (nicknameKey) return nicknames[nicknameKey][0];
  return null;
}

// Helper: Extract points from a string like "ISD 2" or "Moff Jerjerrod (23)"
function extractPoints(name) {
  const match = name.match(/\((\d+)\)/);
  return match ? parseInt(match[1], 10) : null;
}

// Helper: Clean up multi-line CSV fields
function cleanField(field) {
  return field.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function getPointsFromName(name) {
  // Try to extract points from the name itself
  const points = extractPoints(name);
  if (points !== null) return points;
  // Try to find a key in aliases with points
  const aliasKey = Object.keys(aliases).find(k => k.toLowerCase() === name.toLowerCase());
  if (aliasKey) {
    const pts = extractPoints(aliasKey);
    if (pts !== null) return pts;
  }
  return null;
}

function getDisplayNameAndPoints(name) {
  // Try to find a canonical name with points
  let displayName = name;
  let points = extractPoints(name);
  if (points !== null) {
    displayName = name.replace(/\s*\(\d+\)$/, '');
    return { displayName, points };
  }
  // Try to find a matching alias with points
  const aliasKey = Object.keys(aliases).find(k => k.toLowerCase() === name.toLowerCase());
  if (aliasKey) {
    points = extractPoints(aliasKey);
    displayName = aliasKey.replace(/\s*\(\d+\)$/, '');
    return { displayName, points };
  }
  // Try partial match
  const partialKey = Object.keys(aliases).find(k => k.toLowerCase().includes(name.toLowerCase()));
  if (partialKey) {
    points = extractPoints(partialKey);
    displayName = partialKey.replace(/\s*\(\d+\)$/, '');
    return { displayName, points };
  }
  return { displayName, points: null };
}

function normalizeName(name) {
  return name ? name.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim().toLowerCase() : '';
}

function logToFile(message) {
  fs.appendFileSync(LOG_FILE, message + '\n');
}

// New helper function to find an alias with points for a given canonical ID
function findAliasWithPointsForCanonicalId(targetCanonicalId, preferredAlias) {
  if (!targetCanonicalId) { // Safety check if canonicalId is undefined
    return preferredAlias;
  }
  // If preferredAlias already has non-zero points, use it.
  const pointsInPreferred = extractPoints(preferredAlias);
  if (pointsInPreferred !== null && pointsInPreferred !== 0) {
    return preferredAlias;
  }

  // Search for an alternative alias key for the same canonicalId that has points.
  let bestAlternative = preferredAlias; // Start with the original

  for (const aliasKey in aliases) {
    if (aliases[aliasKey] === targetCanonicalId) {
      const pointsInKey = extractPoints(aliasKey);
      if (pointsInKey !== null && pointsInKey !== 0) {
        // Found an alternative with non-zero points.
        bestAlternative = aliasKey;
        break; // Take the first one found with non-zero points.
      }
    }
  }
  return bestAlternative;
}

function getDisplayNameFromNicknameAndAlias(name, context = 'unknown') {
  const original = name;
  let cleanedName = cleanField(name); 

  // --- New: Strip trailing (0) point costs ---
  if (cleanedName.match(/\(\s*0\s*\)\s*$/)) {
    cleanedName = cleanedName.replace(/\s*\(\s*0\s*\)\s*$/, '').trim();
    logToFile(`[CLEANING] Orig:'${original}' Ctx:'${context}' - After (0) strip: '${cleanedName}'`);
  }

  const finalTrimmedCleanedName = cleanedName.trim();
  if (!finalTrimmedCleanedName || /^\d+$/.test(finalTrimmedCleanedName)) {
    const placeholder = `match not found for ${finalTrimmedCleanedName}`;
    logToFile(`[MATCH NOT FOUND - INVALID CLEANED] Ctx:'${context}' - Orig:'${original}' - Cleaned:'${finalTrimmedCleanedName}' - Returning placeholder: "${placeholder}"`);
    return placeholder;
  }
  const normInput = normalizeName(finalTrimmedCleanedName);

  // Helper for context filtering display names - DEFINED HERE
  const passesContextFilter = (aliasDisplayName, currentContext) => {
    const lowerAlias = aliasDisplayName.toLowerCase();
    const isMarkedCommander = lowerAlias.includes('(commander)');
    const isMarkedSquadron = lowerAlias.includes('(squadron)'); // Kept for potential clarity if needed

    if (currentContext === 'commander' || currentContext === 'flagship_upgrade') {
      return isMarkedCommander || !isMarkedSquadron; // Prefer commander, allow if not squadron
    } else if (currentContext === 'squadron') {
      return !isMarkedCommander; // For squadrons, must NOT be a commander.
    } else { // 'ship', 'ship_upgrade', 'unknown'
      return !isMarkedCommander && !isMarkedSquadron;
    }
  };

  // --- Stage 1: Nickname to Canonical Key(s) & Initial Alias Gathering ---
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
    logToFile(`[NICKNAME MAP] Ctx:'${context}' - Orig:'${original}' => Potential CanonIDs: ${JSON.stringify(potentialCanonicalIds)}`);
    
    let allFoundAliases = [];
    for (const canonId of potentialCanonicalIds) {
        const aliasesForThisId = Object.keys(aliases).filter(k => aliases[k] === canonId);
        allFoundAliases.push(...aliasesForThisId);
    }
    allFoundAliases = [...new Set(allFoundAliases)]; // Deduplicate

    if (allFoundAliases.length > 0) {
      logToFile(`[ALIASES PRE-FILTER VIA NICKNAME->CANONICAL(S)] Ctx:'${context}' - CanonIDs:'${JSON.stringify(potentialCanonicalIds)}' - Aliases: ${JSON.stringify(allFoundAliases)}`);
      const contextFilteredAliases = allFoundAliases.filter(aliasDisplayName => passesContextFilter(aliasDisplayName, context));

      if (contextFilteredAliases.length > 0) {
        let selectedAlias = contextFilteredAliases[0]; // Default selection

        // Officer preference for upgrade contexts (applied to all aliases found via any canonical ID)
        if ((context === 'ship_upgrade' || context === 'flagship_upgrade') && contextFilteredAliases.length > 0) { // Check > 0 here, pref logic handles >1
          const officerPreferredAliases = contextFilteredAliases.filter(aliasKey => {
            const canonicalIdForAlias = aliases[aliasKey]; 
            return canonicalIdForAlias && canonicalIdForAlias.toLowerCase().includes('officer');
          });

          if (officerPreferredAliases.length > 0) {
            selectedAlias = officerPreferredAliases[0];
            logToFile(`[PREFER OFFICER (CANONICAL ID) VIA NICKNAME] Ctx:'${context}' - Orig:'${original}' - Selected Officer Alias: '${selectedAlias}' (CanonID: '${aliases[selectedAlias]}') from ${JSON.stringify(officerPreferredAliases)}`);
          } else {
            logToFile(`[NO OFFICER PREF (CANONICAL ID) VIA NICKNAME] Ctx:'${context}' - Orig:'${original}' - No officer variant in ${JSON.stringify(contextFilteredAliases)}, using default: '${selectedAlias}' (CanonID: '${aliases[selectedAlias]}')`);
          }
        }

        // Enhance with points
        const canonicalIdForSelected = aliases[selectedAlias];
        if (canonicalIdForSelected) {
            const originalSelectedAliasForLog = selectedAlias;
            selectedAlias = findAliasWithPointsForCanonicalId(canonicalIdForSelected, selectedAlias);
            if (selectedAlias !== originalSelectedAliasForLog) {
                logToFile(`[POINT ENHANCEMENT VIA NICKNAME] Ctx:'${context}' - OrigSelected:'${originalSelectedAliasForLog}' enhanced to '${selectedAlias}' for CanonID:'${canonicalIdForSelected}'`);
            }
        }

        logToFile(`[MAP VIA NICKNAME] Ctx:'${context}' - '${original}' (CanonIDs:${JSON.stringify(potentialCanonicalIds)}) => '${selectedAlias}'`);
        return selectedAlias;
      } else if (allFoundAliases.length > 0) {
        logToFile(`[WARN NO CONTEXT MATCH VIA NICKNAME->CANONICAL(S)] Ctx:'${context}' - Orig:'${original}'. Aliases ${JSON.stringify(allFoundAliases)} did not pass context filter.`);
      }
    }
  } else {
    logToFile(`[NICKNAME NOT FOUND] Ctx:'${context}' - Orig:'${original}'`);
  }

  // --- Stage 3: Direct Alias Lookup (Input text IN Normalized Key, Context Filtered) ---
  logToFile(`[DIRECT INCLUDES ALIAS LOOKUP START] Ctx:'${context}' - Orig:'${original}' - NormInput:'${normInput}'`);
  // Find alias keys where the normalized alias key INCLUDES the normalized input.
  const directIncludesMatchAliasKeys = Object.keys(aliases).filter(aliasKey => normalizeName(aliasKey).includes(normInput));

  if (directIncludesMatchAliasKeys.length > 0) {
    logToFile(`[DIRECT INCLUDES MATCH KEYS PRE-FILTER] Ctx:'${context}' - Orig:'${original}' - Matched Keys: ${JSON.stringify(directIncludesMatchAliasKeys)}`);
    
    const contextFilteredDirectMatches = directIncludesMatchAliasKeys.filter(aliasDisplayName => passesContextFilter(aliasDisplayName, context));

    if (contextFilteredDirectMatches.length > 0) {
      let selectedAlias = contextFilteredDirectMatches[0]; // Default selection

      // New: Officer preference for upgrade contexts based on canonical ID
      if ((context === 'ship_upgrade' || context === 'flagship_upgrade') && contextFilteredDirectMatches.length > 1) {
        const officerPreferredAliases = contextFilteredDirectMatches.filter(aliasKey => {
          const canonicalId = aliases[aliasKey]; // Get the canonical ID for this alias key
          return canonicalId && canonicalId.toLowerCase().includes('officer');
        });
        
        if (officerPreferredAliases.length > 0) {
          selectedAlias = officerPreferredAliases[0];
          logToFile(`[PREFER OFFICER (CANONICAL ID) DIRECT INCLUDES] Ctx:'${context}' - Orig:'${original}' - Selected Officer Alias: '${selectedAlias}' (CanonID: '${aliases[selectedAlias]}') from ${JSON.stringify(officerPreferredAliases)}`);
        } else {
          logToFile(`[NO OFFICER PREF (CANONICAL ID) DIRECT INCLUDES] Ctx:'${context}' - Orig:'${original}' - No officer variant found in ${JSON.stringify(contextFilteredDirectMatches)}, using default: '${selectedAlias}'`);
        }
      }
      // End New

      // Enhance with points
      const canonicalIdForSelected = aliases[selectedAlias];
      if (canonicalIdForSelected) {
          const originalSelectedAliasForLog = selectedAlias;
          selectedAlias = findAliasWithPointsForCanonicalId(canonicalIdForSelected, selectedAlias);
          if (selectedAlias !== originalSelectedAliasForLog) {
              logToFile(`[POINT ENHANCEMENT DIRECT INCLUDES] Ctx:'${context}' - OrigSelected:'${originalSelectedAliasForLog}' enhanced to '${selectedAlias}' for CanonID:'${canonicalIdForSelected}'`);
          }
      }

      logToFile(`[MAP DIRECT INCLUDES KEY] Ctx:'${context}' - '${original}' => '${selectedAlias}'`);
      return selectedAlias;
    } else if (directIncludesMatchAliasKeys.length > 0) {
        logToFile(`[WARN NO CONTEXT MATCH DIRECT INCLUDES] Ctx:'${context}' - Orig:'${original}'. Includes matches ${JSON.stringify(directIncludesMatchAliasKeys)} did not pass context filter.`);
    }
  }

  // --- Fallback: No suitable exact match found ---
  const placeholder = `match not found for ${finalTrimmedCleanedName}`;
  logToFile(`[MATCH NOT FOUND] Ctx:'${context}' - Orig:'${original}' - LookupName:'${finalTrimmedCleanedName}' (Norm:'${normInput}') - Returning placeholder: "${placeholder}"`);
  return placeholder;
}

function formatShipBlock(shipName, upgrades) {
  const displayName = getDisplayNameFromNicknameAndAlias(shipName, 'ship');
  let block = `${displayName}`;
  for (const upg of upgrades) {
    if (!upg) continue;
    let upgName = cleanField(upg);
    if (!upgName) continue;
    const upgDisplay = getDisplayNameFromNicknameAndAlias(upgName, 'upgrade');
    block += `\n• ${upgDisplay}`;
  }
  // Sum up points from the displayName (extract from parentheses)
  let total = 0;
  const shipPoints = extractPoints(displayName);
  if (shipPoints) total += shipPoints;
  for (const upg of upgrades) {
    if (!upg) continue;
    let upgName = cleanField(upg);
    if (!upgName) continue;
    const upgDisplay = getDisplayNameFromNicknameAndAlias(upgName, 'upgrade');
    const upgPoints = extractPoints(upgDisplay);
    if (upgPoints) total += upgPoints;
  }
  block += `\n= ${total} Points`;
  return { block, total };
}

function parseShipsAndUpgrades(row) {
  // This function parses the row in strict left-to-right order, grouping upgrades under the most recent ship.
  const colNames = Object.keys(row);
  const shipBlocks = [];
  let currentShip = null;
  let currentUpgrades = [];
  for (let i = 0; i < colNames.length; ++i) {
    const col = colNames[i];
    const val = row[col];
    if (!val || val.trim() === '') continue;
    // Ship columns: FLAGSHIP, SHIP #2, SHIP #3, ...
    if (col.startsWith('FLAGSHIP') || col.startsWith('SHIP')) {
      // If we already have a ship, push it with its upgrades
      if (currentShip) {
        shipBlocks.push(formatShipBlock(currentShip, currentUpgrades));
      }
      currentShip = cleanField(val);
      currentUpgrades = [];
    } else if (col.startsWith('UPGRADE')) {
      // Only add non-empty upgrades
      if (val && val.trim() !== '') {
        currentUpgrades.push(val);
      }
    }
  }
  // Push the last ship if present
  if (currentShip) {
    shipBlocks.push(formatShipBlock(currentShip, currentUpgrades));
  }
  return shipBlocks;
}

function formatSquadronsBlock(squadronNames) {
  let block = 'Squadrons:';
  let total = 0;
  // Deduplicate and count
  const squadronMap = {};
  for (const sq of squadronNames) {
    if (!sq) continue;
    let sqName = cleanField(sq);
    if (!sqName) continue;
    const displayName = getDisplayNameFromNicknameAndAlias(sqName, 'squadron');
    const points = extractPoints(displayName) || 0;
    const key = `${displayName}|${points}`; // Use name and points as key
    if (!squadronMap[key]) squadronMap[key] = { count: 0, displayName, points };
    squadronMap[key].count++;
  }
  // Output in the order they first appear
  const sortedSquadronKeys = Object.keys(squadronMap).sort(); // Sort for consistent output
  for (const key of sortedSquadronKeys) {
    const { count, displayName, points } = squadronMap[key];
    const linePoints = points * count;

    // Create a baseDisplayName by removing (Squadron) tag and then trailing parenthetical points.
    let baseDisplayName = displayName; // Start with the full name from lookup

    if (baseDisplayName) { // Ensure displayName is not null/undefined
        // 1. Remove (Squadron) tag, case-insensitive. Replaces with empty string and trims.
        baseDisplayName = baseDisplayName.replace(/\(\s*squadron\s*\)/ig, '').trim();

        // 2. Remove trailing parenthetical points (e.g., (8) or (8pts))
        //    from the (potentially) squadron-stripped name.
        //    This regex specifically targets points at the END of the string.
        if (points !== null) { // points can be 0, so check not null
            baseDisplayName = baseDisplayName.replace(/\s*\(\s*\d+\s*(pts)?\s*\)\s*$/, '').trim();
        }
    }

    // Fallback: If baseDisplayName ended up empty after stripping,
    // (e.g. original was "(Squadron) (8)" or just "(8)"),
    // try to use the original displayName but strip only its points for a cleaner look.
    if (!baseDisplayName.trim() && displayName && displayName.trim()) {
        baseDisplayName = displayName.replace(/\s*\(\s*\d+\s*(pts)?\s*\)\s*$/, '').trim();
        // If it's STILL empty (e.g., original displayName was just "(8)"),
        // then use the original displayName as is.
        if (!baseDisplayName.trim()) {
            baseDisplayName = displayName.trim();
        }
    }

    if (count > 1) {
      // For multiple squadrons, show count x base_name (total_line_points)
      block += `\n• ${count} x ${baseDisplayName} (${linePoints})\n`;
    } else {
      // For a single squadron, show base_name (individual_points)
      block += `\n• ${baseDisplayName}${points !== null ? ` (${points})` : ''}\n`;
    }
    total += linePoints;
  }
  block += `\n= ${total} Points`;
  return { block, total };
}

function parseFleetRow(row) {
  // Parse ships and upgrades
  const colNames = Object.keys(row);
  let ships = [];
  let currentShip = null;
  let currentUpgrades = [];
  for (let i = 0; i < colNames.length; ++i) {
    const col = colNames[i];
    let val = row[col];
    if (!val || val.trim() === '') continue;
    val = cleanField(val);
    if (col.startsWith('FLAGSHIP') || col.startsWith('SHIP')) {
      if (currentShip) {
        ships.push({ name: currentShip, upgrades: currentUpgrades });
      }
      currentShip = val;
      currentUpgrades = [];
    } else if (col.startsWith('UPGRADE')) {
      if (val && val.trim() !== '') {
        currentUpgrades.push(val);
      }
    }
  }
  if (currentShip) {
    ships.push({ name: currentShip, upgrades: currentUpgrades });
  }
  // Parse squadrons
  const squadronCols = colNames.filter(k => k.startsWith('SQUADRON'));
  const squadrons = squadronCols.map(k => row[k]).filter(Boolean).map(cleanField);
  return { ships, squadrons };
}

function formatFleetDataRKStyle({ fleetName, faction, commander, assault, defense, navigation, ships, squadrons, listTotal, squadronTotal }) {
  let out = '';
  out += `Name: ${fleetName || ''}\n`;
  out += `Faction: ${faction}\n`;
  // Commander: remove duplicate points if present
  let commanderDisplay = getDisplayNameFromNicknameAndAlias(commander, 'commander');
  let commanderPoints = extractPoints(commanderDisplay);
  // Remove points from commanderDisplay if present
  commanderDisplay = commanderDisplay.replace(/\s*\(\d+\)$/, '');
  out += `Commander: ${commanderDisplay}`;
  if (commanderPoints !== null) out += ` (${commanderPoints})`;

  out += `\n\nAssault: ${assault}\nDefense: ${defense}\nNavigation: ${navigation}\n\n`;

  // Output each ship and all its upgrades (including blanks, then remove empty bullets)
  ships.forEach((ship, index) => {
    const shipNameClean = ship.name ? cleanField(ship.name) : '';
    if (!shipNameClean) return; // Skip blank ships (continue in forEach)

    // Context is 'ship' for retrieving ship display names
    const shipDisplay = getDisplayNameFromNicknameAndAlias(shipNameClean, 'ship');
    out += shipDisplay + '\n';

    let totalShipPoints = extractPoints(shipDisplay) || 0;
    let upgradeLines = [];

    // Add commander to flagship's upgrades if it's the flagship and a commander exists
    if (index === 0 && commander && commander.trim() !== '') {
      // commanderDisplay is the name part, commanderPoints is the points value
      // The commanderDisplay variable is already stripped of its own parenthetical points.
      let commanderUpgradeLine = `• ${commanderDisplay}`;
      if (commanderPoints !== null) {
        commanderUpgradeLine += ` (${commanderPoints})`;
        totalShipPoints += commanderPoints;
      }
      upgradeLines.push(commanderUpgradeLine);
    }

    // Process ship upgrades
    for (const upg of ship.upgrades) {
      // Determine context based on whether it's the flagship or not
      const upgradeContext = (index === 0) ? 'flagship_upgrade' : 'ship_upgrade';
      let upgDisplay = upg ? getDisplayNameFromNicknameAndAlias(upg, upgradeContext) : '';
      if (upgDisplay && upgDisplay.trim() !== '') {
        const upgPoints = extractPoints(upgDisplay) || 0;
        totalShipPoints += upgPoints;
        upgradeLines.push(`• ${upgDisplay}`);
      }
    }

    out += upgradeLines.join('\n') + (upgradeLines.length ? '\n' : '');

    out += `= ${totalShipPoints} Points\n\n`;
  });

  // Format Squadrons block
  out += 'Squadrons:\n';
  let calculatedSquadronPoints = 0;
  const squadronMap = {};
  for (const sq of squadrons) {
    if (!sq) continue;
    let sqName = cleanField(sq);
    if (!sqName) continue;
    // Context is 'squadron' for squadron names
    const displayName = getDisplayNameFromNicknameAndAlias(sqName, 'squadron');
    const points = extractPoints(displayName) || 0;
    const key = `${displayName}|${points}`; // Use name and points as key
    if (!squadronMap[key]) squadronMap[key] = { count: 0, displayName, points };
    squadronMap[key].count++;
  }

  // Output formatted squadrons
  const sortedSquadronKeys = Object.keys(squadronMap).sort(); // Sort for consistent output
  for (const key of sortedSquadronKeys) {
    const { count, displayName, points } = squadronMap[key];
    const linePoints = points * count;

    // Create a baseDisplayName by removing (Squadron) tag and then trailing parenthetical points.
    let baseDisplayName = displayName; // Start with the full name from lookup

    if (baseDisplayName) { // Ensure displayName is not null/undefined
        // 1. Remove (Squadron) tag, case-insensitive. Replaces with empty string and trims.
        baseDisplayName = baseDisplayName.replace(/\(\s*squadron\s*\)/ig, '').trim();

        // 2. Remove trailing parenthetical points (e.g., (8) or (8pts))
        //    from the (potentially) squadron-stripped name.
        //    This regex specifically targets points at the END of the string.
        if (points !== null) { // points can be 0, so check not null
            baseDisplayName = baseDisplayName.replace(/\s*\(\s*\d+\s*(pts)?\s*\)\s*$/, '').trim();
        }
    }

    // Fallback: If baseDisplayName ended up empty after stripping,
    // (e.g. original was "(Squadron) (8)" or just "(8)"),
    // try to use the original displayName but strip only its points for a cleaner look.
    if (!baseDisplayName.trim() && displayName && displayName.trim()) {
        baseDisplayName = displayName.replace(/\s*\(\s*\d+\s*(pts)?\s*\)\s*$/, '').trim();
        // If it's STILL empty (e.g., original displayName was just "(8)"),
        // then use the original displayName as is.
        if (!baseDisplayName.trim()) {
            baseDisplayName = displayName.trim();
        }
    }

    if (count > 1) {
      // For multiple squadrons, show count x base_name (total_line_points)
      out += `• ${count} x ${baseDisplayName} (${linePoints})\n`;
    } else {
      // For a single squadron, show base_name (individual_points)
      out += `• ${baseDisplayName}${points !== null ? ` (${points})` : ''}\n`;
    }
    calculatedSquadronPoints += linePoints;
  }
  out += `= ${calculatedSquadronPoints} Points\n\n`; // Use calculated points

  // Always output Total Points: LIST TOTAL
  out += `Total Points: ${listTotal}`;
  return out.trim();
}

function parseFleetRowExplicit(rowArray, headerArray) {
  logToFile(`[PARSE ROW] Processing row with ${rowArray.length} values using ${headerArray.length} headers.`);

  let ships = [];
  let squadrons = [];
  let currentShip = null; // Stores the name of the current ship being processed
  let currentUpgrades = [];

  for (let i = 0; i < headerArray.length; ++i) {
    const colName = headerArray[i];
    let val = (i < rowArray.length) ? rowArray[i] : "";
    const cleanedVal = cleanField(val); // Clean val once at the start

    // Process based on column name prefix
    if (colName.startsWith('SQUADRON') || colName.startsWith('SHIP TOTAL') || colName.startsWith('LIST TOTAL')) {
      // Handle Squadrons specifically
      if (colName.startsWith('SQUADRON') && cleanedVal && cleanedVal !== '0') {
        const parts = cleanedVal.split('•');
        for (let part of parts) {
          part = part.trim();
          if (part === '') continue;

          if (/^\d+$/.test(part)) {
            logToFile(`[SQUADRON PARSE] Skipping purely numeric squadron part: '${part}' from original CSV value '${val}'`);
            continue;
          }
          const countMatch = part.match(/^(\d+)\s*x\s*(.+)$/i);
          if (countMatch) {
            const count = parseInt(countMatch[1], 10);
            const squadronName = countMatch[2].trim();
            if (squadronName) {
              for (let k = 0; k < count; k++) {
                squadrons.push(squadronName);
              }
            }
          } else {
            squadrons.push(part);
          }
        }
      }
      // Skip further processing for total columns or continue if squadron
      if (colName.startsWith('SHIP TOTAL') || colName.startsWith('LIST TOTAL')) {
          // We could potentially parse totals here if needed later
      }

    // Process Flagship and Ship columns
    } else if (colName.startsWith('FLAGSHIP') || colName.startsWith('SHIP')) {
      // If the previous currentShip had a non-empty name, store it and its upgrades.
      if (currentShip && currentShip.trim() !== '') {
        ships.push({ name: currentShip, upgrades: currentUpgrades.slice() });
      }
      
      // Start tracking the new ship.
      // If cleanedVal is empty, currentShip will be set to an empty string.
      // Subsequent logic will prevent adding upgrades to an empty currentShip.
      currentShip = cleanedVal; 
      currentUpgrades = []; // Reset upgrades for the new ship
    } else if (colName.startsWith('UPGRADE')) {
      // Only add non-empty upgrades if we have a current ship with a non-empty name.
      if (currentShip && currentShip.trim() !== '' && cleanedVal && cleanedVal.trim() !== '') {
        currentUpgrades.push(cleanedVal); // Push the cleaned upgrade value
      } else if ((!currentShip || currentShip.trim() === '') && cleanedVal && cleanedVal.trim() !== '') {
        // Log if an upgrade is found but there's no valid current ship.
        logToFile(`[ORPHAN UPGRADE/DATA MISALIGNMENT?] Encountered upgrade '${cleanedVal}' without a valid current ship (currentShip: '${currentShip}'). Header: '${colName}'. Original val: '${val}'. This item will be skipped for the current ship.`);
      }
    }
  }

  // Push the last ship if it has a non-empty name
  if (currentShip && currentShip.trim() !== '') {
    ships.push({ name: currentShip, upgrades: currentUpgrades.slice() });
  }

  return { ships, squadrons };
}

function convertTournamentFleets() {
  const input = fs.readFileSync(TOURNAMENT_CSV, 'utf8');

  // Get the header array
  const headerParsingResult = parse(input, { to_line: 1, skip_empty_lines: true, bom: true });
  if (!headerParsingResult || headerParsingResult.length === 0 || headerParsingResult[0].length === 0) {
    console.error("Could not parse header row from CSV or header is empty.");
    logToFile("[ERROR] Could not parse header row from CSV or header is empty.");
    return;
  }
  const headerArray = headerParsingResult[0];
  logToFile(`[CSV HEADER] Parsed headers: ${JSON.stringify(headerArray)}`);

  // Parse all data records as arrays, skipping the header line
  const dataRecordsAsArrays = parse(input, {
    from_line: 2, // Start after the header
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true
  });

  logToFile(`[CSV DATA] Parsed ${dataRecordsAsArrays.length} data records as arrays.`);

  const outputRows = [];
  let numericalIdCounter = 1; // Initialize counter

  for (const rowArray of dataRecordsAsArrays) {
    // Create an object view of the row for convenience for other parts of the code
    // that expect direct property access (e.g., row['FACTION'])
    const rowObject = {};
    headerArray.forEach((header, index) => {
      // Ensure the key is valid and doesn't overwrite critical object properties
      const key = header || `_col_${index}`; // Use header or a placeholder if header is empty
      if (index < rowArray.length) {
        rowObject[key] = rowArray[index];
      } else {
        // If rowArray is shorter than headerArray (due to relax_column_count and empty trailing cells)
        rowObject[key] = ''; 
      }
    });

    const fleetName = ''; // This was always hardcoded as empty
    const faction = rowObject['FACTION'] || '';
    const commander = rowObject['COMMANDER'] || '';
    const assault = rowObject['ASSAULT OBJECTIVE'] || '';
    const defense = rowObject['DEFENSE OBJECTIVE'] || '';
    const navigation = rowObject['NAVIGATION OBJECTIVE'] || '';
    const listTotal = rowObject['LIST TOTAL'] || '';
    const squadronTotal = rowObject['SQUADRON TOTAL'] || '';

    // Parse ships and upgrades using the row array and header array
    const { ships, squadrons } = parseFleetRowExplicit(rowArray, headerArray);

    // --- Conditional Skip Logic ---
    const parsedListTotal = parseInt(listTotal, 10);
    const isCommanderEmpty = !commander || commander.includes('match not found for');
    const areObjectivesEmpty = (!assault || assault.includes('match not found for')) &&
                               (!defense || defense.includes('match not found for')) &&
                               (!navigation || navigation.includes('match not found for'));
    const areShipsEmpty = !ships || ships.every(ship => !ship.name || ship.name.includes('match not found for'));
    const areSquadronsEmpty = !squadrons || squadrons.every(sq => !sq || sq.includes('match not found for'));

    if (parsedListTotal === 0 && isCommanderEmpty && areObjectivesEmpty && areShipsEmpty && areSquadronsEmpty) {
      logToFile(`[SKIP FLEET] Skipping fleet due to 0 points and empty fields. Commander: '${commander}', Objectives: '${assault}', '${defense}', '${navigation}', Ships: ${ships.length}, Squadrons: ${squadrons.length}, ListTotal: ${listTotal}`);
      continue; // Skip this iteration
    }
    // --- End Conditional Skip Logic ---

    // Format output in RK/Armada style
    const fleetData = formatFleetDataRKStyle({
      fleetName,
      faction,
      commander,
      assault,
      defense,
      navigation,
      ships, // This will now be correctly populated
      squadrons, // Pass the parsed squadrons
      listTotal,
      squadronTotal
    });

    outputRows.push({
      id: '',
      user_id: '',
      fleet_data: fleetData,
      faction,
      fleet_name: fleetName,
      created_at: '',
      updated_at: '',
      commander, // Store the original commander name
      points: listTotal,
      date_added: '',
      legends: '',
      legacy: '',
      old_legacy: '',
      arc: '',
      shared: '',
      numerical_id: numericalIdCounter++ // Assign and increment counter
    });
  }

  // Write output CSV
  const header = [
    'id','user_id','fleet_data','faction','fleet_name','created_at','updated_at','commander','points','date_added','legends','legacy','old_legacy','arc','shared','numerical_id'
  ];
  const csvString = stringify(outputRows, { header: true, columns: header });
  fs.writeFileSync(OUTPUT_CSV, csvString);

  console.log(`Converted ${outputRows.length} fleets to ${OUTPUT_CSV}`);
}

// Run the conversion
convertTournamentFleets();
