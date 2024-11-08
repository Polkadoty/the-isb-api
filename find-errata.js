import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Using the same directory structure as jsoncombiner.js
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

function findErrataKeys(directory) {
  const files = fs.readdirSync(directory);

  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findErrataKeys(filePath); // Recursively process subdirectories
    } else if (file.endsWith('.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // For each top-level key in the JSON file (ships, squadrons, etc.)
        Object.entries(data).forEach(([category, content]) => {
          // Initialize the category array if it doesn't exist
          if (!result[category]) {
            result[category] = [];
          }
          
          // Get all keys that contain '-errata'
          if (typeof content === 'object') {
            const errataKeys = Object.keys(content).filter(key => key.includes('-errata'));
            // Add unique keys to the result array
            errataKeys.forEach(key => {
              if (!result[category].includes(key)) {
                result[category].push(key);
              }
            });
          }
        });
      } catch (error) {
        console.error(`Error processing file: ${filePath}`, error);
      }
    }
  });
}

// Initialize result object (now empty since categories will be added dynamically)
const result = {};

// Process each directory
Object.values(directories).forEach(directory => {
  if (fs.existsSync(directory)) {
    findErrataKeys(directory);
  }
});

// Remove empty categories
Object.keys(result).forEach(key => {
  if (result[key].length === 0) {
    delete result[key];
  }
});

// Write the result to a file
fs.writeFileSync(
  path.join(__dirname, 'public/errata-keys.json'),
  JSON.stringify(result, null, 2)
); 