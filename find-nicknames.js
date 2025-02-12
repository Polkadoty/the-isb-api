import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const legacyDirectories = {
  ships: path.join(__dirname, 'public/converted-json/ships'),
  squadrons: path.join(__dirname, 'public/converted-json/squadrons'),
  upgrades: path.join(__dirname, 'public/converted-json/upgrades'),
  objectives: path.join(__dirname, 'public/converted-json/objectives'),
  'legacy-squadrons': path.join(__dirname, 'public/converted-json/legacy-squadrons'),
  'legacy-upgrades': path.join(__dirname, 'public/converted-json/legacy-upgrades'),
  // 'amg-upgrades': path.join(__dirname, 'public/converted-json/amg-upgrades'),
  // 'amg-ships': path.join(__dirname, 'public/converted-json/amg-ships'),
  // 'amg-squadrons': path.join(__dirname, 'public/converted-json/amg-squadrons'),
  // 'amg-objectives': path.join(__dirname, 'public/converted-json/amg-objectives'),
  // 'old-legacy-ships': path.join(__dirname, 'public/converted-json/old-legacy-ships'),
  // 'old-legacy-squadrons': path.join(__dirname, 'public/converted-json/old-legacy-squadrons'),
  // 'old-legacy-upgrades': path.join(__dirname, 'public/converted-json/old-legacy-upgrades')
};

const legendsDirectories = {
  ships: path.join(__dirname, 'public/converted-json/ships'),
  squadrons: path.join(__dirname, 'public/converted-json/squadrons'),
  upgrades: path.join(__dirname, 'public/converted-json/upgrades'),
  objectives: path.join(__dirname, 'public/converted-json/objectives'),
  'legends-ships': path.join(__dirname, 'public/converted-json/legends-ships'),
  'legends-squadrons': path.join(__dirname, 'public/converted-json/legends-squadrons'),
  'legends-upgrades': path.join(__dirname, 'public/converted-json/legends-upgrades'),
  'legacy-squadrons': path.join(__dirname, 'public/converted-json/legacy-squadrons'),
  'legacy-upgrades': path.join(__dirname, 'public/converted-json/legacy-upgrades'),
  // 'old-legacy-ships': path.join(__dirname, 'public/converted-json/old-legacy-ships'),
  // 'old-legacy-squadrons': path.join(__dirname, 'public/converted-json/old-legacy-squadrons'),
  // 'old-legacy-upgrades': path.join(__dirname, 'public/converted-json/old-legacy-upgrades'),
  // 'arc-upgrades': path.join(__dirname, 'public/converted-json/arc-upgrades'),
  // 'arc-ships': path.join(__dirname, 'public/converted-json/arc-ships'),
  // 'arc-squadrons': path.join(__dirname, 'public/converted-json/arc-squadrons'),
  // 'arc-objectives': path.join(__dirname, 'public/converted-json/arc-objectives'),
  // 'amg-upgrades': path.join(__dirname, 'public/converted-json/amg-upgrades'),
  // 'amg-ships': path.join(__dirname, 'public/converted-json/amg-ships'),
  // 'amg-squadrons': path.join(__dirname, 'public/converted-json/amg-squadrons'),
  // 'amg-objectives': path.join(__dirname, 'public/converted-json/amg-objectives'),
};

const armadaDirectories = {
  ships: path.join(__dirname, 'public/converted-json/ships'),
  squadrons: path.join(__dirname, 'public/converted-json/squadrons'),
  upgrades: path.join(__dirname, 'public/converted-json/upgrades'),
  objectives: path.join(__dirname, 'public/converted-json/objectives'),
  // 'amg-upgrades': path.join(__dirname, 'public/converted-json/amg-upgrades'),
  // 'amg-ships': path.join(__dirname, 'public/converted-json/amg-ships'),
  // 'amg-squadrons': path.join(__dirname, 'public/converted-json/amg-squadrons'),
  // 'amg-objectives': path.join(__dirname, 'public/converted-json/amg-objectives')
};

// Create three maps
const legacyNicknameMap = {};
const legendsNicknameMap = {};
const armadaNicknameMap = {};

function generateNicknames(originalName) {
  const nicknames = new Set();
  
  // Add original name
  nicknames.add(originalName);
  
  // Handle hyphenated and space-separated versions
  const nameWithSpaces = originalName.replace(/-/g, ' ');
  const nameWithHyphens = originalName.replace(/\s+/g, '-');
  nicknames.add(nameWithSpaces);
  nicknames.add(nameWithHyphens);
  
  // Split into parts and generate combinations
  const parts = nameWithSpaces.split(/[\s-]+/);
  
  // Generate all possible consecutive combinations
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j <= parts.length; j++) {
      const combination = parts.slice(i, j).join(' ');
      if (combination.length > 2) { // Avoid single-letter combinations
        nicknames.add(combination);
        nicknames.add(combination.replace(/\s+/g, '-'));
      }
    }
  }
  
  // Generate abbreviation (first letter of each word)
  const abbreviation = parts.map(part => part[0].toUpperCase()).join('');
  if (abbreviation.length > 1) {
    nicknames.add(abbreviation);
  }
  
  return Array.from(nicknames);
}

function processNicknames(directory, nicknameMap) {
  const files = fs.readdirSync(directory);

  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processNicknames(filePath, nicknameMap);
    } else if (file.endsWith('.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const topLevelKey = Object.keys(data)[0];

        Object.entries(data[topLevelKey]).forEach(([itemKey, itemData]) => {
          if (topLevelKey === 'ships') {
            // Handle ships which have models
            Object.entries(itemData.models).forEach(([modelKey, modelData]) => {
              const nicknames = new Set();
              
              if (modelData.name) {
                generateNicknames(modelData.name).forEach(n => nicknames.add(n));
              }
              
              if (Array.isArray(modelData.nicknames)) {
                modelData.nicknames.forEach(nickname => {
                  generateNicknames(nickname).forEach(n => nicknames.add(n));
                });
              }

              nicknames.forEach(nickname => {
                if (!nicknameMap[nickname]) {
                  nicknameMap[nickname] = [];
                }
                if (!nicknameMap[nickname].includes(modelKey)) {
                  nicknameMap[nickname].push(modelKey);
                }
              });
            });
          } else {
            // Handle other types (squadrons, upgrades, objectives)
            const nicknames = new Set();
            
            if (itemData.name) {
              generateNicknames(itemData.name).forEach(n => nicknames.add(n));
            }
            
            if (itemData['ace-name']) {
              generateNicknames(itemData['ace-name']).forEach(n => nicknames.add(n));
            }
            
            if (Array.isArray(itemData.nicknames)) {
              itemData.nicknames.forEach(nickname => {
                generateNicknames(nickname).forEach(n => nicknames.add(n));
              });
            }
            
            nicknames.forEach(nickname => {
              if (!nicknameMap[nickname]) {
                nicknameMap[nickname] = [];
              }
              if (!nicknameMap[nickname].includes(itemKey)) {
                nicknameMap[nickname].push(itemKey);
              }
            });
          }
        });
      } catch (error) {
        console.error(`Error processing file: ${filePath}`, error);
      }
    }
  });

  // Remove duplicates at the end
  Object.keys(nicknameMap).forEach(nickname => {
    nicknameMap[nickname] = [...new Set(nicknameMap[nickname])];
  });
}

// Generate both maps
Object.values(legacyDirectories).forEach(directory => {
  if (fs.existsSync(directory)) {
    processNicknames(directory, legacyNicknameMap);
  }
});

Object.values(legendsDirectories).forEach(directory => {
  if (fs.existsSync(directory)) {
    processNicknames(directory, legendsNicknameMap);
  }
});

Object.values(armadaDirectories).forEach(directory => {
  if (fs.existsSync(directory)) {
    processNicknames(directory, armadaNicknameMap);
  }
});

// Create the output directory if it doesn't exist
const outputDir = path.join(__dirname, 'src', 'discord', 'public');
console.log('Creating output directory:', outputDir);

if (!fs.existsSync(outputDir)) {
  console.log('Directory does not exist, creating...');
  fs.mkdirSync(outputDir, { recursive: true });
}

const legacyOutputPath = path.join(outputDir, 'legacy-nickname-map.json');
const legendsOutputPath = path.join(outputDir, 'legends-nickname-map.json');
const armadaOutputPath = path.join(outputDir, 'armada-nickname-map.json');
console.log('Writing to:', legacyOutputPath);
console.log('Writing to:', legendsOutputPath);
console.log('Writing to:', armadaOutputPath);

try {
  // Write both maps
  fs.writeFileSync(legacyOutputPath, JSON.stringify(legacyNicknameMap, null, 2));
  fs.writeFileSync(legendsOutputPath, JSON.stringify(legendsNicknameMap, null, 2));
  fs.writeFileSync(armadaOutputPath, JSON.stringify(armadaNicknameMap, null, 2));

  console.log('Successfully wrote nickname maps');
  console.log('Legacy entries:', Object.keys(legacyNicknameMap).length);
  console.log('Legends entries:', Object.keys(legendsNicknameMap).length);
  console.log('Armada entries:', Object.keys(armadaNicknameMap).length);
} catch (error) {
  console.error('Error writing nickname maps:', error);
} 