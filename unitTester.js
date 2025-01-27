import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
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
  'arc-objectives': path.join(__dirname, 'public/converted-json/arc-objectives'),
  'amg-upgrades': path.join(__dirname, 'public/converted-json/amg-upgrades'),
  'amg-ships': path.join(__dirname, 'public/converted-json/amg-ships'),
  'amg-squadrons': path.join(__dirname, 'public/converted-json/amg-squadrons'),
  'amg-objectives': path.join(__dirname, 'public/converted-json/amg-objectives')
};

// Load tests from YAML file
const testsFile = path.join(__dirname, 'tests.yaml');
const tests = yaml.load(fs.readFileSync(testsFile, 'utf8'));

// Load modifications from YAML file
const modificationsFile = path.join(__dirname, 'modifications.yaml');
const modifications = yaml.load(fs.readFileSync(modificationsFile, 'utf8'));

function updateJsonValues(obj, modifications, parentKey = '', filename = '') {
  if (typeof obj === 'object' && obj !== null) {
    for (let key in obj) {
      if (modifications[key]) {
        const { pattern, replacement } = modifications[key];
        const shouldUpdate = flags.force || (typeof obj[key] === 'string' && (obj[key] === '' || new RegExp(pattern).test(obj[key])));
        
        if (shouldUpdate) {
          let newValue = replacement.replace('{key}', parentKey || key);
          // Check if this is an AMG Final Errata card
          if (obj.expansion === 'AMG Final Errata' && key === 'cardimage') {
            // Insert '-errata' before '.webp'
            newValue = newValue.replace('.webp', '-errata.webp');
          }
          console.log(`Updating ${key} from "${obj[key]}" to "${newValue}"`);
          obj[key] = newValue;
        }
      }
      if (typeof obj[key] === 'object') {
        updateJsonValues(obj[key], modifications, key, filename);
      }
    }
  }
}

function unitTest(directory, testsToRun) {
  const flaggedFiles = [];

  function processDirectory(dir) {
    console.log(`Processing directory: ${dir}`);
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        console.log(`Found subdirectory: ${filePath}`);
        processDirectory(filePath); // Recursively process subdirectories
      } else if (file.endsWith('.json')) {
        console.log(`Checking file: ${filePath}`);
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          let modified = false;

          if (!flags.noModifications) {
            const originalData = JSON.stringify(data);
            updateJsonValues(data, modifications, '', path.basename(file, '.json'));
            if (JSON.stringify(data) !== originalData) {
              modified = true;
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
              console.log(`Updated file: ${filePath}`);
            }
          }

          if (!flags.noTests && testsToRun) {
            const results = runTests(data, testsToRun, filePath);
            if (results.length > 0) {
              flaggedFiles.push({ file: filePath, issues: results });
            }
          }

          if (modified) {
            console.log(`File ${filePath} was modified.`);
          } else {
            console.log(`No changes were made to ${filePath}.`);
          }
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
        }
      }
    });
  }

  processDirectory(directory);
  return flaggedFiles;
}

function runTests(obj, tests, filePath) {
  const issues = [];

  function traverse(obj, path = '') {
    if (typeof obj === 'object' && obj !== null) {
      for (let key in obj) {
        const newPath = path ? `${path}.${key}` : key;
        
        // Check for duplicate keys
        if (obj.hasOwnProperty(key) && Object.keys(obj).filter(k => k === key).length > 1) {
          issues.push(`Duplicate key found: ${newPath}`);
        }

        // Run custom tests
        tests.forEach(test => {
          const result = test(key, obj[key], newPath, obj);
          if (result) {
            issues.push(`${newPath}: ${result}`);
          }
        });

        traverse(obj[key], newPath);
      }
    }
  }

  traverse(obj);
  return issues;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    all: args.includes('-all'),
    ships: args.includes('-ships'),
    squadrons: args.includes('-squadrons'),
    upgrades: args.includes('-upgrades'),
    objectives: args.includes('-objectives'),
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
    noModifications: args.includes('--no-modifications'),
    noTests: args.includes('--no-tests'),
    force: args.includes('--force'),
    'amg-upgrades': args.includes('-amg-upgrades'),
    'amg-ships': args.includes('-amg-ships'),
    'amg-squadrons': args.includes('-amg-squadrons'),
    'amg-objectives': args.includes('-amg-objectives')
  };

  if (flags.all) {
    Object.keys(flags).forEach(key => {
      if (key !== 'all' && !['noModifications', 'noTests', 'force'].includes(key)) {
        flags[key] = true;
      }
    });
  }

  return flags;
}

// Main execution
const flags = parseArgs();

let allFlaggedFiles = [];

Object.entries(directories).forEach(([key, directory]) => {
  if (flags[key]) {
    console.log(`Processing ${key}...`);
    const testType = key.includes('ships') ? tests.ships :
                     key.includes('squadrons') ? tests.squadrons :
                     key.includes('upgrades') ? tests.upgrades :
                     key.includes('objectives') ? tests.objectives : null;
    allFlaggedFiles = allFlaggedFiles.concat(unitTest(directory, testType));
  }
});

if (!Object.values(flags).some(Boolean) || (Object.keys(flags).length === 1 && flags.all)) {
  console.log('Please provide at least one flag: -all, -ships, -squadrons, -upgrades, -objectives, -legends-ships, -legends-squadrons, -legends-upgrades, -legacy-ships, -legacy-squadrons, -legacy-upgrades, -old-legacy-ships, -old-legacy-squadrons, -old-legacy-upgrades, -arc-upgrades, -arc-ships, -arc-squadrons, -arc-objectives');
  console.log('Optional flags: --no-modifications, --no-tests, --force');
} else {
  if (flags.noModifications) {
    console.log('Skipping modifications...');
  }
  if (flags.noTests) {
    console.log('Skipping tests...');
  }
  if (!flags.noTests && allFlaggedFiles.length > 0) {
    console.log("Files with issues:");
    allFlaggedFiles.forEach(({ file, issues }) => {
      console.log(`\nFile: ${file}`);
      issues.forEach(issue => console.log(`- ${issue}`));
    });
  } else if (!flags.noTests) {
    console.log("No issues found in the checked files.");
  }
}

console.log('Script execution completed.');
