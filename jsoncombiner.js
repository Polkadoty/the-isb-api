import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directories = {
  ships: path.join(__dirname, 'public/converted-json/ships'),
  squadrons: path.join(__dirname, 'public/converted-json/squadrons'),
  upgrades: path.join(__dirname, 'public/converted-json/upgrades'),
  objectives: path.join(__dirname, 'public/converted-json/objectives'),
  //
  'custom-ships': path.join(__dirname, 'public/converted-json/custom/ships'),
  'custom-squadrons': path.join(__dirname, 'public/converted-json/custom/squadrons'),
  'custom-upgrades': path.join(__dirname, 'public/converted-json/custom/upgrades'),
};

function updateIdsAndCombine(directory, outputFileName) {
  const result = {};

  function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        processDirectory(filePath); // Recursively process subdirectories
      } else if (file.endsWith('.json') && file !== outputFileName) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          // Recursively update _id fields
          function updateIds(obj) {
            if (obj && typeof obj === 'object') {
              for (let key in obj) {
                if (key === '_id' && (obj[key] === null || !obj[key])) {
                  obj[key] = uuidv4(); // Generate a unique ID
                } else {
                  updateIds(obj[key]);
                }
              }
            }
          }

          updateIds(data);

          // Combine data under the top-level key (e.g., "ships" or "squadrons")
          for (let topKey in data) {
            if (!result[topKey]) {
              result[topKey] = {};
            }
            Object.assign(result[topKey], data[topKey]);
          }
        } catch (error) {
          console.error(`Error parsing JSON file: ${filePath}`, error);
        }
      }
    });
  }

  processDirectory(directory);

  fs.writeFileSync(path.join(directory, outputFileName), JSON.stringify(result, null, 2));
}

// New function to parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    ships: args.includes('-ships'),
    squadrons: args.includes('-squadrons'),
    upgrades: args.includes('-upgrades'),
    objectives: args.includes('-objectives'),
    'custom-ships': args.includes('-custom-ships'),
    'custom-squadrons': args.includes('-custom-squadrons'),
    'custom-upgrades': args.includes('-custom-upgrades')
  };
}

// Main execution
const flags = parseArgs();

if (flags.ships) {
  updateIdsAndCombine(directories.ships, 'ships.json');
}
if (flags.squadrons) {
  updateIdsAndCombine(directories.squadrons, 'squadrons.json');
}
if (flags.upgrades) {
  updateIdsAndCombine(directories.upgrades, 'upgrades.json');
}
if (flags.objectives) {
  updateIdsAndCombine(directories.objectives, 'objectives.json');
}
if (flags['custom-ships']) {
  updateIdsAndCombine(directories['custom-ships'], 'custom-ships.json');
}
if (flags['custom-squadrons']) {
  updateIdsAndCombine(directories['custom-squadrons'], 'custom-squadrons.json');
}
if (flags['custom-upgrades']) {
  updateIdsAndCombine(directories['custom-upgrades'], 'custom-upgrades.json');
}

// If no flags are provided, inform the user
if (!Object.values(flags).some(Boolean)) {
  console.log('Please provide at least one flag: -ships, -squadrons, -upgrades, -objectives, -custom-ships, -custom-squadrons, -custom-upgrades');
}
