const fs = require('fs');
const path = require('path');

// Script will be called with: node process-ship-data.cjs <input_csv_filename>
const inputFile = process.argv[2];

if (!inputFile) {
    console.error("Usage: node process-ship-data.cjs <input_csv_filename>");
    console.error("Example: node process-ship-data.cjs converted-fleets.csv");
    process.exit(1);
}

const CSV_PATH = path.join(__dirname, inputFile);
// Derive a source tag from the input filename (e.g., "converted-fleets" from "converted-fleets.csv")
const sourceTag = path.basename(inputFile, '.csv');

console.log(`Processing data for source: ${sourceTag} from file: ${inputFile}`);

const OUTPUT_RAW_BUILDS_PATH = path.join(__dirname, 'raw_ship_builds.json');
const OUTPUT_RAW_BUILDS_CSV_PATH = path.join(__dirname, 'raw_ship_builds.csv');

function parseCSV(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const outputRecords = [];

    let headerEndPos = -1;
    for (let i = 0; i < fileContent.length; i++) {
        if (fileContent[i] === '\n') {
            headerEndPos = i;
            break;
        }
        if (fileContent[i] === '\r' && (i + 1 < fileContent.length && fileContent[i + 1] === '\n')) {
            headerEndPos = i; 
            break;
        }
    }

    if (headerEndPos === -1 && fileContent.length > 0) {
        headerEndPos = fileContent.length;
    } else if (headerEndPos === -1) {
        console.error("CSV file is empty or header could not be read.");
        return [];
    }
    
    const headerLine = fileContent.substring(0, headerEndPos).trim();
    const headerFields = headerLine.split(',');
    const fleetDataIndex = headerFields.indexOf('fleet_data');
    const factionIndex = headerFields.indexOf('faction');

    if (fleetDataIndex === -1) {
        console.error(`Could not find 'fleet_data' column in CSV header. Header found: "${headerLine}"`);
        return [];
    }
    if (factionIndex === -1) {
        console.error(`Could not find 'faction' column in CSV header. Header found: "${headerLine}"`);
        return []; // Or handle differently if faction is optional
    }

    let currentField = '';
    let currentRow = [];
    let inQuotes = false;
    let contentStartPos = headerEndPos + 1;
    if (fileContent[headerEndPos] === '\r' && fileContent[headerEndPos + 1] === '\n') {
        contentStartPos = headerEndPos + 2;
    }

    for (let i = contentStartPos; i < fileContent.length; i++) {
        const char = fileContent[i];
        const nextChar = (i + 1 < fileContent.length) ? fileContent[i + 1] : null;

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentField += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentField);
            currentField = '';
        } else if (char === '\r' && nextChar === '\n' && !inQuotes) {
            currentRow.push(currentField);
            currentField = '';
            if (currentRow.length > Math.max(fleetDataIndex, factionIndex)) {
                 outputRecords.push({
                    fleetDataString: currentRow[fleetDataIndex],
                    factionString: currentRow[factionIndex]
                });
            }
            currentRow = [];
            i++;
        } else if (char === '\n' && !inQuotes) {
            currentRow.push(currentField);
            currentField = '';
            if (currentRow.length > Math.max(fleetDataIndex, factionIndex)) {
                outputRecords.push({
                    fleetDataString: currentRow[fleetDataIndex],
                    factionString: currentRow[factionIndex]
                });
            }
            currentRow = [];
        } else {
            currentField += char;
        }
    }

    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        if (currentRow.length > Math.max(fleetDataIndex, factionIndex)) {
            outputRecords.push({
                fleetDataString: currentRow[fleetDataIndex],
                factionString: currentRow[factionIndex]
            });
        }
    }
    
    return outputRecords;
}

function extractShipBuilds(fleetDataString) {
    const builds = [];
    if (!fleetDataString) return builds;

    const lines = fleetDataString.split(/\r\n|\n|\r/);
    let currentShipName = null;
    let currentUpgrades = [];

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine ||
            trimmedLine.startsWith('Faction:') ||
            trimmedLine.startsWith('Commander:') ||
            trimmedLine.startsWith('Assault:') ||
            trimmedLine.startsWith('Defense:') ||
            trimmedLine.startsWith('Navigation:') ||
            trimmedLine.startsWith('Squadrons:') ||
            trimmedLine.startsWith('Total Points:') ||
            trimmedLine.startsWith('Name:')) {
            if (currentShipName) {
                builds.push({ ship_name: currentShipName, upgrades: currentUpgrades });
                currentShipName = null;
                currentUpgrades = [];
            }
            continue;
        }

        if (trimmedLine.startsWith('• ')) {
            if (currentShipName) {
                const fullUpgradeString = trimmedLine.substring(2).trim();
                const lastOpenParen = fullUpgradeString.lastIndexOf('(');
                const lastCloseParen = fullUpgradeString.lastIndexOf(')');
                let includeUpgrade = true; // Default to include

                if (lastOpenParen !== -1 && lastCloseParen > lastOpenParen) {
                    const pointsString = fullUpgradeString.substring(lastOpenParen + 1, lastCloseParen);
                    const points = parseInt(pointsString, 10);
                    if (!isNaN(points) && points > 20) {
                        includeUpgrade = false; // Exclude if points > 20
                    }
                    // If points are NaN (e.g., "(text)") or points <= 20, it remains included.
                }
                // If no (points) are found, it also remains included.

                if (includeUpgrade) {
                    currentUpgrades.push(fullUpgradeString);
                }
            }
        } else if (trimmedLine.startsWith('= ') && trimmedLine.endsWith(' Points')) {
            if (currentShipName) {
                builds.push({ ship_name: currentShipName, upgrades: currentUpgrades });
                currentShipName = null;
                currentUpgrades = [];
            }
        } else {
            if (currentShipName) {
                builds.push({ ship_name: currentShipName, upgrades: currentUpgrades });
            }
            if (trimmedLine.includes('(') && trimmedLine.includes(')') && !trimmedLine.startsWith('•')) {
                 currentShipName = trimmedLine;
                 currentUpgrades = [];
            } else {
                if (currentShipName) {
                    builds.push({ ship_name: currentShipName, upgrades: currentUpgrades });
                    currentShipName = null;
                    currentUpgrades = [];
                }
            }
        }
    }

    if (currentShipName) {
        builds.push({ ship_name: currentShipName, upgrades: currentUpgrades });
    }
    return builds;
}

function main() {
    console.log(`Starting data processing for ${sourceTag}...`);
    
    // Construct dynamic output paths
    const OUTPUT_RAW_BUILDS_PATH = path.join(__dirname, `raw_ship_builds_${sourceTag}.json`);
    const OUTPUT_RAW_BUILDS_CSV_PATH = path.join(__dirname, `raw_ship_builds_${sourceTag}.csv`);
    const OUTPUT_AGGREGATED_FREQUENCIES_PATH = path.join(__dirname, `ship_upgrade_frequencies_${sourceTag}.json`);
    const OUTPUT_FREQUENCIES_CSV_PATH = path.join(__dirname, `ship_upgrade_frequencies_${sourceTag}.csv`);
    const SQUADRON_JSON_PATH = path.join(__dirname, `squadron_faction_counts_${sourceTag}.json`);
    const SQUADRON_CSV_PATH = path.join(__dirname, `squadron_faction_counts_${sourceTag}.csv`);

    const fleetEntries = parseCSV(CSV_PATH);
    const allShipBuilds = [];
    const allFleetSquadrons = []; // To store { faction, squadrons: [name, name, ...] }

    if (!fleetEntries || fleetEntries.length === 0) {
        console.log('No fleet data found or error in CSV parsing.');
        return;
    }
    
    console.log(`Found ${fleetEntries.length} fleet entries to process.`);

    for (const entry of fleetEntries) { // Modified loop
        const fleetData = entry.fleetDataString;
        const faction = entry.factionString;

        const shipBuilds = extractShipBuilds(fleetData);
        allShipBuilds.push(...shipBuilds);

        const squadrons = extractSquadronsFromFleetData(fleetData); // New function to be created
        if (squadrons.length > 0) {
            allFleetSquadrons.push({ faction, squadrons });
        }
    }

    console.log(`Extracted ${allShipBuilds.length} total ship builds.`);

    if (allShipBuilds.length === 0 && fleetEntries.length > 0) {
        console.warn("Fleet data was parsed, but no ship builds were extracted. Check fleet_data content and extractShipBuilds logic.");
    }

    fs.writeFileSync(OUTPUT_RAW_BUILDS_PATH, JSON.stringify(allShipBuilds, null, 2), 'utf-8');
    console.log(`Raw ship builds saved to ${OUTPUT_RAW_BUILDS_PATH}`);

    // Generate and save raw builds CSV
    const rawBuildsCsvString = generateRawBuildsCSV(allShipBuilds);
    fs.writeFileSync(OUTPUT_RAW_BUILDS_CSV_PATH, rawBuildsCsvString, 'utf-8');
    console.log(`Raw ship builds CSV saved to ${OUTPUT_RAW_BUILDS_CSV_PATH}`);

    aggregateUpgradeFrequencies(allShipBuilds, OUTPUT_AGGREGATED_FREQUENCIES_PATH, OUTPUT_FREQUENCIES_CSV_PATH);

    // Process and save squadron data
    processAndSaveSquadronData(allFleetSquadrons, SQUADRON_JSON_PATH, SQUADRON_CSV_PATH);
}

function generateRawBuildsCSV(allShipBuilds) {
    if (!allShipBuilds || allShipBuilds.length === 0) {
        return 'build_id,ship_name,upgrade_name\n'; // Header only for empty data
    }

    const csvRows = ['build_id,ship_name,upgrade_name']; // CSV Header
    let buildIdCounter = 0;

    for (const build of allShipBuilds) {
        if (build && build.ship_name && build.upgrades && build.upgrades.length > 0) {
            buildIdCounter++;
            const shipName = build.ship_name.includes(',') ? `"${build.ship_name}"` : build.ship_name;
            for (const upgrade of build.upgrades) {
                const upgradeName = upgrade.includes(',') ? `"${upgrade}"` : upgrade;
                csvRows.push(`${buildIdCounter},${shipName},${upgradeName}`);
            }
        }
    }
    return csvRows.join('\n');
}

function aggregateUpgradeFrequencies(allShipBuilds, outputJsonPath, outputCsvPath) {
    const shipUpgradeCounts = {};

    if (allShipBuilds.length === 0) {
        console.warn("No ship builds to aggregate. Skipping frequency generation.");
        fs.writeFileSync(outputJsonPath, JSON.stringify(shipUpgradeCounts, null, 2), 'utf-8');
        console.log(`Empty aggregated ship upgrade frequencies saved to ${outputJsonPath}`);
        return;
    }

    for (const build of allShipBuilds) {
        if (!build || typeof build.ship_name === 'undefined') {
            continue;
        }
        const shipNameKey = build.ship_name;
        if (!shipUpgradeCounts[shipNameKey]) {
            shipUpgradeCounts[shipNameKey] = {};
        }

        if (build.upgrades && Array.isArray(build.upgrades)) {
            for (const upgrade of build.upgrades) {
                shipUpgradeCounts[shipNameKey][upgrade] = (shipUpgradeCounts[shipNameKey][upgrade] || 0) + 1;
            }
        } 
    }

    fs.writeFileSync(outputJsonPath, JSON.stringify(shipUpgradeCounts, null, 2), 'utf-8');
    console.log(`Aggregated ship upgrade frequencies saved to ${outputJsonPath}`);

    // Generate and save frequencies CSV
    const frequenciesCsvString = generateFrequenciesCSV(shipUpgradeCounts);
    fs.writeFileSync(outputCsvPath, frequenciesCsvString, 'utf-8');
    console.log(`Aggregated ship upgrade frequencies CSV saved to ${outputCsvPath}`);
}

function generateFrequenciesCSV(shipUpgradeCounts) {
    if (Object.keys(shipUpgradeCounts).length === 0) {
        return 'ship_name,upgrade_name,frequency\n'; // Header only for empty data
    }
    const csvRows = ['ship_name,upgrade_name,frequency']; // CSV Header
    for (const shipName in shipUpgradeCounts) {
        const upgrades = shipUpgradeCounts[shipName];
        const SName = shipName.includes(',') ? `"${shipName}"` : shipName;
        for (const upgradeName in upgrades) {
            const UName = upgradeName.includes(',') ? `"${upgradeName}"` : upgradeName;
            const frequency = upgrades[upgradeName];
            csvRows.push(`${SName},${UName},${frequency}`);
        }
    }
    return csvRows.join('\n');
}

function extractSquadronsFromFleetData(fleetDataString) {
    const extractedSquads = [];
    if (!fleetDataString) return extractedSquads;

    const lines = fleetDataString.split(/\r\n|\n|\r/);
    let inSquadronSection = false;

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.toLowerCase().startsWith('squadrons:')) {
            inSquadronSection = true;
            continue;
        }

        if (trimmedLine.startsWith('Total Points:') || 
            (trimmedLine.includes('(') && trimmedLine.includes(')') && !trimmedLine.startsWith('•')) || // Heuristic for a new ship line
            trimmedLine.startsWith('Faction:') || trimmedLine.startsWith('Commander:') || 
            trimmedLine.startsWith('Assault:') || trimmedLine.startsWith('Defense:') || trimmedLine.startsWith('Navigation:')) {
            if(inSquadronSection) { // If we encounter a new section after squadrons, stop squadron processing for this fleet data
                inSquadronSection = false;
            }
        }
        
        if (inSquadronSection && trimmedLine.startsWith('• ')) {
            let squadronName = trimmedLine.substring(2).trim();
            let count = 1;
            const match = squadronName.match(/^(\d+)\s*x\s*(.+)$/i); // Matches "N x Squadron Name"
            if (match) {
                count = parseInt(match[1], 10);
                squadronName = match[2].trim();
            }
            for (let i = 0; i < count; i++) {
                extractedSquads.push(squadronName);
            }
        } else if (inSquadronSection && !trimmedLine) { // Empty line might signify end of squadrons before points
            // This can be ambiguous. For now, an empty line ends the squadron section if one was active.
            // To be more robust, one might need to check if subsequent lines are also not squadrons.
           // inSquadronSection = false; // Let's not do this for now, rely on other terminators
        }
        
        // If we hit total points for the ship, or a new ship, squadron section also ends
        if (trimmedLine.startsWith('= ') && trimmedLine.endsWith(' Points')) {
             if(inSquadronSection) { // If we encounter ship points sum, implies end of current ship's upgrades/squadrons for that card (though squadrons are usually listed once per fleet)
                // This might not be the right place to turn off inSquadronSection globally for the fleet_data,
                // as squadrons are listed after all ships usually.
             }
        }
    }
    return extractedSquads;
}

function processAndSaveSquadronData(allFleetSquadrons, outputJsonPath, outputCsvPath) {
    if (!allFleetSquadrons || allFleetSquadrons.length === 0) {
        console.log("No squadron data to process.");
        fs.writeFileSync(outputJsonPath, JSON.stringify({}, null, 2), 'utf-8');
        fs.writeFileSync(outputCsvPath, "faction,squadron_name,total_count\n", 'utf-8');
        console.log(`Empty squadron count files written to ${outputJsonPath} and ${outputCsvPath}`);
        return;
    }

    const aggregatedSquadrons = {}; // { faction: { squadronName: count, ... }, ... }

    for (const fleet of allFleetSquadrons) {
        const faction = fleet.faction;
        if (!aggregatedSquadrons[faction]) {
            aggregatedSquadrons[faction] = {};
        }
        for (const squadronName of fleet.squadrons) {
            aggregatedSquadrons[faction][squadronName] = (aggregatedSquadrons[faction][squadronName] || 0) + 1;
        }
    }

    fs.writeFileSync(outputJsonPath, JSON.stringify(aggregatedSquadrons, null, 2), 'utf-8');
    console.log(`Aggregated squadron counts (JSON) saved to ${outputJsonPath}`);

    // Generate and save squadron CSV
    const squadronCsvString = generateSquadronFactionCSV(aggregatedSquadrons);
    fs.writeFileSync(outputCsvPath, squadronCsvString, 'utf-8');
    console.log(`Aggregated squadron counts (CSV) saved to ${outputCsvPath}`);
}

function generateSquadronFactionCSV(aggregatedSquadrons) {
    if (Object.keys(aggregatedSquadrons).length === 0) {
        return 'faction,squadron_name,total_count\n';
    }
    const csvRows = ['faction,squadron_name,total_count'];
    for (const faction in aggregatedSquadrons) {
        const squadrons = aggregatedSquadrons[faction];
        const fName = faction.includes(',') ? `"${faction}"` : faction;
        for (const squadronName in squadrons) {
            const sName = squadronName.includes(',') ? `"${squadronName}"` : squadronName;
            const totalCount = squadrons[squadronName];
            csvRows.push(`${fName},${sName},${totalCount}`);
        }
    }
    return csvRows.join('\n');
}

main(); 