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
  objectives: path.join(__dirname, 'public/converted-json/objectives')
};

// Load tests from YAML file
const testsFile = path.join(__dirname, 'tests.yaml');
const tests = yaml.load(fs.readFileSync(testsFile, 'utf8'));

function unitTest(directory, tests) {
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
          const results = runTests(data, tests, filePath);
          if (results.length > 0) {
            flaggedFiles.push({ file: filePath, issues: results });
          }
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
        }
      }
    });
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

  processDirectory(directory);
  return flaggedFiles;
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    ships: args.includes('-ships'),
    squadrons: args.includes('-squadrons'),
    upgrades: args.includes('-upgrades'),
    objectives: args.includes('-objectives')
  };
}

// Main execution
const flags = parseArgs();

let allFlaggedFiles = [];

if (flags.ships) {
  console.log('Testing ships...');
  allFlaggedFiles = allFlaggedFiles.concat(unitTest(directories.ships, tests.ships));
}
if (flags.squadrons) {
  console.log('Testing squadrons...');
  allFlaggedFiles = allFlaggedFiles.concat(unitTest(directories.squadrons, tests.squadrons));
}
if (flags.upgrades) {
  console.log('Testing upgrades...');
  allFlaggedFiles = allFlaggedFiles.concat(unitTest(directories.upgrades, tests.upgrades));
}
if (flags.objectives) {
  console.log('Testing objectives...');
  allFlaggedFiles = allFlaggedFiles.concat(unitTest(directories.objectives, tests.objectives));
}

if (!Object.values(flags).some(Boolean)) {
  console.log('Please provide at least one flag: -ships, -squadrons, -upgrades, -objectives');
} else {
  if (allFlaggedFiles.length > 0) {
    console.log("Files with issues:");
    allFlaggedFiles.forEach(({ file, issues }) => {
      console.log(`\nFile: ${file}`);
      issues.forEach(issue => console.log(`- ${issue}`));
    });
  } else {
    console.log("No issues found in the checked files.");
  }
}

console.log('Script execution completed.');
