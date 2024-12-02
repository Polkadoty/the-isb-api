import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Using the same directory structure as other scripts
const directories = {
  ships: path.join(__dirname, 'public/converted-json/ships'),
  squadrons: path.join(__dirname, 'public/converted-json/squadrons'),
  upgrades: path.join(__dirname, 'public/converted-json/upgrades'),
  objectives: path.join(__dirname, 'public/converted-json/objectives'),
  'legends-ships': path.join(__dirname, 'public/converted-json/legends-ships'),
  'legends-squadrons': path.join(__dirname, 'public/converted-json/legends-squadrons'),
  'legends-upgrades': path.join(__dirname, 'public/converted-json/legends-upgrades'),
//   'legacy-ships': path.join(__dirname, 'public/converted-json/legacy-ships'),
//   'legacy-squadrons': path.join(__dirname, 'public/converted-json/legacy-squadrons'),
//   'legacy-upgrades': path.join(__dirname, 'public/converted-json/legacy-upgrades'),
  'old-legacy-ships': path.join(__dirname, 'public/converted-json/old-legacy-ships'),
  'old-legacy-squadrons': path.join(__dirname, 'public/converted-json/old-legacy-squadrons'),
  'old-legacy-upgrades': path.join(__dirname, 'public/converted-json/old-legacy-upgrades'),
  'arc-upgrades': path.join(__dirname, 'public/converted-json/arc-upgrades'),
  'arc-ships': path.join(__dirname, 'public/converted-json/arc-ships'),
  'arc-squadrons': path.join(__dirname, 'public/converted-json/arc-squadrons'),
  'arc-objectives': path.join(__dirname, 'public/converted-json/arc-objectives')
};

// Initialize result object for nickname mappings
const nicknameMap = {};

function processNicknames(directory) {
  const files = fs.readdirSync(directory);

  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processNicknames(filePath);
    } else if (file.endsWith('.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // For each top-level key in the JSON file
        Object.entries(data).forEach(([category, content]) => {
          if (typeof content === 'object') {
            Object.entries(content).forEach(([itemKey, itemData]) => {
              const nicknames = new Set();
              
              // Add the main name if it exists
              if (itemData.name) {
                nicknames.add(itemData.name);
              }
              
              // Add ace-name if it exists
              if (itemData['ace-name']) {
                nicknames.add(itemData['ace-name']);
              }
              
              // Add all nicknames from the nicknames array
              if (Array.isArray(itemData.nicknames)) {
                itemData.nicknames.forEach(nickname => nicknames.add(nickname));
              }
              
              // Process each nickname
              nicknames.forEach(nickname => {
                if (!nicknameMap[nickname]) {
                  nicknameMap[nickname] = [];
                }
                if (!nicknameMap[nickname].includes(itemKey)) {
                  nicknameMap[nickname].push(itemKey);
                }
              });
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

// Process each directory
Object.values(directories).forEach(directory => {
  if (fs.existsSync(directory)) {
    processNicknames(directory);
  }
});

// Create the directory if it doesn't exist
const outputDir = path.join(__dirname, 'src', 'discord', 'public');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write the result to a file
fs.writeFileSync(
  path.join(outputDir, 'nickname-map.json'),
  JSON.stringify(nicknameMap, null, 2)
); 