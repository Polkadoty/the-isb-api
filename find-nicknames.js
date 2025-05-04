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
  'legends-ships': path.join(__dirname, 'public/converted-json/old-legends-ships'),
  'legends-squadrons': path.join(__dirname, 'public/converted-json/old-legends-squadrons'),
  'legends-upgrades': path.join(__dirname, 'public/converted-json/old-legends-upgrades'),
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
  'nexus-squadrons': path.join(__dirname, 'public/converted-json/nexus-squadrons'),
  'nexus-ships': path.join(__dirname, 'public/converted-json/nexus-ships'),
  'nexus-upgrades': path.join(__dirname, 'public/converted-json/nexus-upgrades'),
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
                nicknames.add(modelData.name);
              }
              
              if (Array.isArray(modelData.nicknames)) {
                modelData.nicknames.forEach(nickname => nicknames.add(nickname));
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
              nicknames.add(itemData.name);
            }
            
            if (itemData['ace-name']) {
              nicknames.add(itemData['ace-name']);
            }
            
            if (Array.isArray(itemData.nicknames)) {
              itemData.nicknames.forEach(nickname => nicknames.add(nickname));
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