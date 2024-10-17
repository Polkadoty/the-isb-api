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
  //
  'legends-ships': path.join(__dirname, 'public/converted-json/legends-ships'),
  'legends-squadrons': path.join(__dirname, 'public/converted-json/legends-squadrons'),
  'legends-upgrades': path.join(__dirname, 'public/converted-json/legends-upgrades'),
  'legacy-ships': path.join(__dirname, 'public/converted-json/legacy-ships'),
  'legacy-squadrons': path.join(__dirname, 'public/converted-json/legacy-squadrons'),
  'legacy-upgrades': path.join(__dirname, 'public/converted-json/legacy-upgrades')
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
      if (parentKey === 'upgrades' && modifications.keyUpdate) {
        const { pattern, replacement } = modifications.keyUpdate;
        const newKey = replacement.replace('{filename}', filename);
        if (new RegExp(pattern).test(key) && key !== newKey) {
          console.log(`Updating key from "${key}" to "${newKey}"`);
          obj[newKey] = obj[key];
          delete obj[key];
        }
      }
      if (modifications[key]) {
        const { pattern, replacement } = modifications[key];
        const shouldUpdate = flags.force || (typeof obj[key] === 'string' && (obj[key] === '' || new RegExp(pattern).test(obj[key])));
        
        if (shouldUpdate) {
          console.log(`Updating ${key} from "${obj[key]}" to "${replacement.replace('{key}', parentKey || key)}"`);
          obj[key] = replacement.replace('{key}', parentKey || key);
        }
      }
      if (typeof obj[key] === 'object') {
        updateJsonValues(obj[key], modifications, key, filename);
      }
    }
  }
}

// function updateJsonValues(obj, modifications, parentKey = '', filename = '') {
//   if (typeof obj === 'object' && obj !== null) {
//     for (let key in obj) {
//       if (modifications[key]) {
//         const { pattern, replacement } = modifications[key];
//         const shouldUpdate = flags.force || (typeof obj[key] === 'string' && new RegExp(pattern).test(obj[key]));
        
//         if (shouldUpdate) {
//           const newValue = replacement.replace('{key}', filename || parentKey || key);
//           console.log(`Updating ${key} from "${obj[key]}" to "${newValue}"`);
//           obj[key] = newValue;
//         }
//       }
//       if (typeof obj[key] === 'object') {
//         updateJsonValues(obj[key], modifications, key, filename);
//       }
//     }
//   }
// }

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
  return {
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
    noModifications: args.includes('--no-modifications'),
    noTests: args.includes('--no-tests'),
    force: args.includes('--force') // Add this line
  };
}

// Main execution
const flags = parseArgs();

let allFlaggedFiles = [];

if (flags.ships) {
  console.log('Processing ships...');
  allFlaggedFiles = allFlaggedFiles.concat(unitTest(directories.ships, tests.ships));
}
if (flags.squadrons) {
  console.log('Processing squadrons...');
  allFlaggedFiles = allFlaggedFiles.concat(unitTest(directories.squadrons, tests.squadrons));
}
if (flags.upgrades) {
  console.log('Processing upgrades...');
  allFlaggedFiles = allFlaggedFiles.concat(unitTest(directories.upgrades, tests.upgrades));
}
if (flags.objectives) {
  console.log('Processing objectives...');
  allFlaggedFiles = allFlaggedFiles.concat(unitTest(directories.objectives, tests.objectives));
}
if (flags['custom-ships']) {
  console.log('Processing custom ships...');
  allFlaggedFiles = allFlaggedFiles.concat(unitTest(directories['custom-ships'], tests.ships));
}
if (flags['custom-squadrons']) {
  console.log('Processing custom squadrons...');
  allFlaggedFiles = allFlaggedFiles.concat(unitTest(directories['custom-squadrons'], tests.squadrons));
}
if (flags['custom-upgrades']) {
  console.log('Processing custom upgrades...');
  allFlaggedFiles = allFlaggedFiles.concat(unitTest(directories['custom-upgrades'], tests.upgrades));
}

if (flags['legends-ships']) {
  console.log('Processing legends ships...');
  allFlaggedFiles = allFlaggedFiles.concat(unitTest(directories['legends-ships'], tests.ships));
}
if (flags['legends-squadrons']) {
  console.log('Processing legends squadrons...');
  allFlaggedFiles = allFlaggedFiles.concat(unitTest(directories['legends-squadrons'], tests.squadrons));
}
if (flags['legends-upgrades']) {
  console.log('Processing legends upgrades...');
  allFlaggedFiles = allFlaggedFiles.concat(unitTest(directories['legends-upgrades'], tests.upgrades));
}

if (flags['legacy-ships']) {
  console.log('Processing legacy ships...');
  allFlaggedFiles = allFlaggedFiles.concat(unitTest(directories['legacy-ships'], tests.ships));
}
if (flags['legacy-squadrons']) {
  console.log('Processing legacy squadrons...');
  allFlaggedFiles = allFlaggedFiles.concat(unitTest(directories['legacy-squadrons'], tests.squadrons));
}
if (flags['legacy-upgrades']) {
  console.log('Processing legacy upgrades...');
  allFlaggedFiles = allFlaggedFiles.concat(unitTest(directories['legacy-upgrades'], tests.upgrades));
}

if (!Object.values(flags).some(Boolean)) {
  console.log('Please provide at least one flag: -ships, -squadrons, -upgrades, -objectives, -custom-ships, -custom-squadrons, -custom-upgrades');
  console.log('Optional flags: --no-modifications, --no-tests');
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
