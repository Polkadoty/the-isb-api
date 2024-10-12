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
  'custom-ships': path.join(__dirname, 'public/converted-json/custom-ships'),
  'custom-squadrons': path.join(__dirname, 'public/converted-json/custom-squadrons'),
  'custom-upgrades': path.join(__dirname, 'public/converted-json/custom-upgrades'),
};

// Load tests from YAML file
const testsFile = path.join(__dirname, 'tests.yaml');
const tests = yaml.load(fs.readFileSync(testsFile, 'utf8'));

// Load modifications from YAML file
const modificationsFile = path.join(__dirname, 'modifications.yaml');
const modifications = yaml.load(fs.readFileSync(modificationsFile, 'utf8'));

function updateJsonValues(obj, modifications, parentKey = '') {
  if (typeof obj === 'object' && obj !== null) {
    for (let key in obj) {
      if (modifications[key]) {
        const { pattern, replacement } = modifications[key];
        const shouldUpdate = flags.force || (typeof obj[key] === 'string' && (obj[key] === '' || new RegExp(pattern).test(obj[key])));
        
        if (shouldUpdate) {
          console.log(`Updating ${key} from "${obj[key]}" to "${replacement.replace('{key}', parentKey || key)}"`);
          obj[key] = replacement.replace('{key}', parentKey || key);
        }
      }
      if (typeof obj[key] === 'object') {
        updateJsonValues(obj[key], modifications, key);
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
            updateJsonValues(data, modifications);
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
    'custom-ships': args.includes('-custom-ships'),
    'custom-squadrons': args.includes('-custom-squadrons'),
    'custom-upgrades': args.includes('-custom-upgrades'),
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
