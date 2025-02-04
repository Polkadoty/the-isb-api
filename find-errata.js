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
  'legacy-squadrons': path.join(__dirname, 'public/converted-json/legacy-squadrons'),
  'legacy-upgrades': path.join(__dirname, 'public/converted-json/legacy-upgrades'),
  'old-legacy-ships': path.join(__dirname, 'public/converted-json/old-legacy-ships'),
  'old-legacy-squadrons': path.join(__dirname, 'public/converted-json/old-legacy-squadrons'),
  'old-legacy-upgrades': path.join(__dirname, 'public/converted-json/old-legacy-upgrades'),
  // 'arc-upgrades': path.join(__dirname, 'public/converted-json/arc-upgrades'),
  // 'arc-ships': path.join(__dirname, 'public/converted-json/arc-ships'),
  // 'arc-squadrons': path.join(__dirname, 'public/converted-json/arc-squadrons'),
  // 'arc-objectives': path.join(__dirname, 'public/converted-json/arc-objectives'),
};

function findErrataKeys(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findErrataKeys(filePath);
    } else if (file.endsWith('.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        Object.entries(data).forEach(([category, content]) => {
          if (!result[category]) {
            result[category] = [];
          }
          
          if (typeof content === 'object') {
            if (category === 'ships') {
              // Look through each chassis
              Object.entries(content).forEach(([chassisName, chassis]) => {
                if (chassis.models) {
                  Object.entries(chassis.models).forEach(([modelKey, model]) => {
                    // Check for AMG Final Errata release
                    if (model.release === 'AMG Final Errata') {
                      if (!result.shipmodels) {
                        result.shipmodels = [];
                      }
                      const errataKey = `${modelKey}-errata`;
                      if (!result.shipmodels.includes(errataKey)) {
                        result.shipmodels.push(errataKey);
                      }
                    }
                    // Also check for existing -errata in key
                    if (modelKey.includes('-errata')) {
                      if (!result.shipmodels) {
                        result.shipmodels = [];
                      }
                      if (!result.shipmodels.includes(modelKey)) {
                        result.shipmodels.push(modelKey);
                      }
                    }
                  });
                }
              });
            } else {
              // For other categories (squadrons, upgrades, etc.)
              Object.entries(content).forEach(([key, item]) => {
                // Check both conditions: -errata in key OR AMG Final Errata release
                if (key.includes('-errata') || (item && item.release === 'AMG Final Errata')) {
                  const errataKey = key.includes('-errata') ? key : `${key}-errata`;
                  if (!result[category].includes(errataKey)) {
                    result[category].push(errataKey);
                  }
                }
              });
            }
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

// Add after writing the main errata-keys.json file
fs.writeFileSync(
  path.join(__dirname, 'src/discord/public/errata-keys.json'),
  JSON.stringify(result, null, 2)
); 