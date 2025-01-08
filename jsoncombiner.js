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
                if (key === '_id') {
                  obj[key] = uuidv4(); // Always generate a new ID
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
  const flags = {
    all: args.includes('-all'),
    ships: args.includes('-ships'),
    squadrons: args.includes('-squadrons'),
    upgrades: args.includes('-upgrades'),
    objectives: args.includes('-objectives'),
    'legacy-ships': args.includes('-legacy-ships'),
    'legacy-squadrons': args.includes('-legacy-squadrons'),
    'legacy-upgrades': args.includes('-legacy-upgrades'),
    'legends-ships': args.includes('-legends-ships'),
    'legends-squadrons': args.includes('-legends-squadrons'),
    'legends-upgrades': args.includes('-legends-upgrades'),
    'old-legacy-ships': args.includes('-old-legacy-ships'),
    'old-legacy-squadrons': args.includes('-old-legacy-squadrons'),
    'old-legacy-upgrades': args.includes('-old-legacy-upgrades'),
    'arc-upgrades': args.includes('-arc-upgrades'),
    'arc-ships': args.includes('-arc-ships'),
    'arc-squadrons': args.includes('-arc-squadrons'),
    'arc-objectives': args.includes('-arc-objectives')
  };

  if (flags.all) {
    Object.keys(flags).forEach(key => {
      if (key !== 'all') flags[key] = true;
    });
  }

  return flags;
}

// Main execution
const flags = parseArgs();

Object.entries(directories).forEach(([key, directory]) => {
  if (flags[key]) {
    updateIdsAndCombine(directory, `${key}.json`);
  }
});

// If no flags are provided, inform the user
if (!Object.values(flags).some(Boolean)) {
  console.log('Please provide at least one flag: -all, -ships, -squadrons, -upgrades, -objectives, -legends-ships, -legends-squadrons, -legends-upgrades, -legacy-ships, -legacy-squadrons, -legacy-upgrades, -old-legacy-ships, -old-legacy-squadrons, -old-legacy-upgrades, -arc-upgrades, -arc-ships, -arc-squadrons, -arc-objectives');
}
