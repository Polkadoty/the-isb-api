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

// Process each directory
Object.values(directories).forEach(directory => {
  if (fs.existsSync(directory)) {
    processNicknames(directory);
  }
});

// Create the directory if it doesn't exist
const outputDir = path.join(__dirname, 'src', 'discord', 'public');
console.log('Creating output directory:', outputDir);

if (!fs.existsSync(outputDir)) {
  console.log('Directory does not exist, creating...');
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'nickname-map.json');
console.log('Writing to:', outputPath);

try {
  // Delete the existing file if it exists
  if (fs.existsSync(outputPath)) {
    console.log('Deleting existing nickname map...');
    fs.unlinkSync(outputPath);
  }

  // Write the result to a file
  fs.writeFileSync(outputPath, JSON.stringify(nicknameMap, null, 2));
  console.log('Successfully wrote nickname map with', Object.keys(nicknameMap).length, 'entries');
  
  // Verify the file was written
  const stats = fs.statSync(outputPath);
  console.log('File size:', stats.size, 'bytes');
  
  // Read back the first few entries to verify content
  const verification = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  console.log('Sample entries:', Object.entries(verification).slice(0, 3));
} catch (error) {
  console.error('Error writing nickname map:', error);
} 