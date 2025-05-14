const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, 'converted-fleets.csv');
const OUTPUT_RAW_BUILDS_PATH = path.join(__dirname, 'raw_ship_builds.json');

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

    if (fleetDataIndex === -1) {
        console.error(`Could not find 'fleet_data' column in CSV header. Header found: "${headerLine}"`);
        return [];
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
            if (currentRow.length > fleetDataIndex) outputRecords.push(currentRow[fleetDataIndex]);
            currentRow = [];
            i++;
        } else if (char === '\n' && !inQuotes) {
            currentRow.push(currentField);
            currentField = '';
            if (currentRow.length > fleetDataIndex) outputRecords.push(currentRow[fleetDataIndex]);
            currentRow = [];
        } else {
            currentField += char;
        }
    }

    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        if (currentRow.length > fleetDataIndex) outputRecords.push(currentRow[fleetDataIndex]);
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
    console.log('Starting ship data processing...');
    const fleetDataEntries = parseCSV(CSV_PATH);
    const allShipBuilds = [];

    if (!fleetDataEntries || fleetDataEntries.length === 0) {
        console.log('No fleet data found or error in CSV parsing.');
        return;
    }
    
    console.log(`Found ${fleetDataEntries.length} fleet data entries to process.`);

    for (const fleetData of fleetDataEntries) {
        const builds = extractShipBuilds(fleetData);
        allShipBuilds.push(...builds);
    }

    console.log(`Extracted ${allShipBuilds.length} total ship builds.`);

    if (allShipBuilds.length === 0 && fleetDataEntries.length > 0) {
        console.warn("Fleet data was parsed, but no ship builds were extracted. Check fleet_data content and extractShipBuilds logic.");
    }

    fs.writeFileSync(OUTPUT_RAW_BUILDS_PATH, JSON.stringify(allShipBuilds, null, 2), 'utf-8');
    console.log(`Raw ship builds saved to ${OUTPUT_RAW_BUILDS_PATH}`);

    // Generate and save raw builds CSV
    const rawBuildsCsvString = generateRawBuildsCSV(allShipBuilds);
    const OUTPUT_RAW_BUILDS_CSV_PATH = path.join(__dirname, 'raw_ship_builds.csv');
    fs.writeFileSync(OUTPUT_RAW_BUILDS_CSV_PATH, rawBuildsCsvString, 'utf-8');
    console.log(`Raw ship builds CSV saved to ${OUTPUT_RAW_BUILDS_CSV_PATH}`);

    aggregateUpgradeFrequencies(allShipBuilds);
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

function aggregateUpgradeFrequencies(allShipBuilds) {
    const OUTPUT_AGGREGATED_PATH = path.join(__dirname, 'ship_upgrade_frequencies.json');
    const shipUpgradeCounts = {};

    if (allShipBuilds.length === 0) {
        console.warn("No ship builds to aggregate. Skipping frequency generation.");
        fs.writeFileSync(OUTPUT_AGGREGATED_PATH, JSON.stringify(shipUpgradeCounts, null, 2), 'utf-8');
        console.log(`Empty aggregated ship upgrade frequencies saved to ${OUTPUT_AGGREGATED_PATH}`);
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

    fs.writeFileSync(OUTPUT_AGGREGATED_PATH, JSON.stringify(shipUpgradeCounts, null, 2), 'utf-8');
    console.log(`Aggregated ship upgrade frequencies saved to ${OUTPUT_AGGREGATED_PATH}`);

    // Generate and save frequencies CSV
    const frequenciesCsvString = generateFrequenciesCSV(shipUpgradeCounts);
    const OUTPUT_FREQUENCIES_CSV_PATH = path.join(__dirname, 'ship_upgrade_frequencies.csv');
    fs.writeFileSync(OUTPUT_FREQUENCIES_CSV_PATH, frequenciesCsvString, 'utf-8');
    console.log(`Aggregated ship upgrade frequencies CSV saved to ${OUTPUT_FREQUENCIES_CSV_PATH}`);
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

main(); 