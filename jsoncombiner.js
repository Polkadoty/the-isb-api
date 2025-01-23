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
  'legacy-squadrons': path.join(__dirname, 'public/converted-json/legacy-squadrons'),
  'legacy-upgrades': path.join(__dirname, 'public/converted-json/legacy-upgrades'),
  'old-legacy-ships': path.join(__dirname, 'public/converted-json/old-legacy-ships'),
  'old-legacy-squadrons': path.join(__dirname, 'public/converted-json/old-legacy-squadrons'),
  'old-legacy-upgrades': path.join(__dirname, 'public/converted-json/old-legacy-upgrades'),
  'arc-upgrades': path.join(__dirname, 'public/converted-json/arc-upgrades'),
  'arc-ships': path.join(__dirname, 'public/converted-json/arc-ships'),
  'arc-squadrons': path.join(__dirname, 'public/converted-json/arc-squadrons'),
  'arc-objectives': path.join(__dirname, 'public/converted-json/arc-objectives'),
  'damage': path.join(__dirname, 'public/converted-json/damage'),
  'amg-upgrades': path.join(__dirname, 'public/converted-json/amg-upgrades'),
  'amg-ships': path.join(__dirname, 'public/converted-json/amg-ships'),
  'amg-squadrons': path.join(__dirname, 'public/converted-json/amg-squadrons'),
  'amg-objectives': path.join(__dirname, 'public/converted-json/amg-objectives')
};

function updateIdsAndCombine(directory, outputFileName) {
  const result = {};
  let fileCount = 0;

  function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    console.log(`Processing directory: ${dir}`);
    console.log(`Found ${files.length} files/directories`);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else if (file.endsWith('.json') && file !== outputFileName) {
        try {
          console.log(`Processing file: ${file}`);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          fileCount++;

          // Recursively update _id fields
          function updateIds(obj) {
            if (Array.isArray(obj)) {
              obj.forEach(item => updateIds(item));
            } else if (obj && typeof obj === 'object') {
              for (let key in obj) {
                if (key === '_id') {
                  obj[key] = uuidv4();
                } else {
                  updateIds(obj[key]);
                }
              }
            }
          }

          updateIds(data);

          // Handle both array and object structures
          for (let topKey in data) {
            if (!result[topKey]) {
              result[topKey] = Array.isArray(data[topKey]) ? [] : {};
            }
            
            if (Array.isArray(data[topKey])) {
              result[topKey].push(...data[topKey]);
            } else {
              Object.assign(result[topKey], data[topKey]);
            }
          }
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
        }
      }
    });
  }

  processDirectory(directory);
  console.log(`Processed ${fileCount} files for ${outputFileName}`);
  
  if (fileCount > 0) {
    fs.writeFileSync(path.join(directory, outputFileName), JSON.stringify(result, null, 2));
    console.log(`Successfully wrote ${outputFileName}`);
  } else {
    console.warn(`No files were processed for ${outputFileName}`);
  }
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
    'arc-objectives': args.includes('-arc-objectives'),
    'amg-upgrades': args.includes('-amg-upgrades'),
    'amg-ships': args.includes('-amg-ships'),
    'amg-squadrons': args.includes('-amg-squadrons'),
    'amg-objectives': args.includes('-amg-objectives')
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
