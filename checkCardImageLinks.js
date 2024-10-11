const fs = require('fs');
const path = require('path');

const directories = {
  ships: path.join(__dirname, 'public/converted-json/ships'),
  squadrons: path.join(__dirname, 'public/converted-json/squadrons'),
  upgrades: path.join(__dirname, 'public/converted-json/upgrades'),
  objectives: path.join(__dirname, 'public/converted-json/objectives')
};

function checkCardImageLinks(directory) {
  const flaggedFiles = [];
  const filesWithDuplicates = [];

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
          if (checkJsonObject(data, filePath)) {
            flaggedFiles.push(filePath);
          }
          if (checkDuplicateCardimages(data, filePath)) {
            filesWithDuplicates.push(filePath);
          }
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
        }
      }
    });
  }

  function checkJsonObject(obj, filePath, parentKey = '') {
    if (typeof obj === 'object' && obj !== null) {
      if ('cardimage' in obj) {
        const cardimage = obj.cardimage;
        console.log(`Found cardimage in ${filePath} (${parentKey}):`, cardimage);
        if (!cardimage || !cardimage.startsWith('https://') || cardimage.includes('lensdump')) {
          console.log(`Flagging file ${filePath} due to invalid cardimage`);
          return true;
        }
      }
      for (let key in obj) {
        if (checkJsonObject(obj[key], filePath, key)) {
          return true;
        }
      }
    } else if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (checkJsonObject(obj[i], filePath, `${parentKey}[${i}]`)) {
          return true;
        }
      }
    }
    return false;
  }

  function checkDuplicateCardimages(obj, filePath) {
    const cardimages = new Set();
    const duplicates = new Set();

    function traverse(obj) {
      if (typeof obj === 'object' && obj !== null) {
        if ('cardimage' in obj) {
          const cardimage = obj.cardimage;
          if (cardimages.has(cardimage)) {
            duplicates.add(cardimage);
          } else {
            cardimages.add(cardimage);
          }
        }
        for (let key in obj) {
          traverse(obj[key]);
        }
      } else if (Array.isArray(obj)) {
        for (let item of obj) {
          traverse(item);
        }
      }
    }

    traverse(obj);

    if (duplicates.size > 0) {
      console.log(`Found duplicate cardimages in ${filePath}:`, Array.from(duplicates));
      return true;
    }
    return false;
  }

  processDirectory(directory);
  return { flaggedFiles, filesWithDuplicates };
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

let flaggedFiles = [];
let filesWithDuplicates = [];

if (flags.ships) {
  console.log('Checking ships...');
  const result = checkCardImageLinks(directories.ships);
  flaggedFiles = flaggedFiles.concat(result.flaggedFiles);
  filesWithDuplicates = filesWithDuplicates.concat(result.filesWithDuplicates);
}
if (flags.squadrons) {
  console.log('Checking squadrons...');
  const result = checkCardImageLinks(directories.squadrons);
  flaggedFiles = flaggedFiles.concat(result.flaggedFiles);
  filesWithDuplicates = filesWithDuplicates.concat(result.filesWithDuplicates);
}
if (flags.upgrades) {
  console.log('Checking upgrades...');
  const result = checkCardImageLinks(directories.upgrades);
  flaggedFiles = flaggedFiles.concat(result.flaggedFiles);
  filesWithDuplicates = filesWithDuplicates.concat(result.filesWithDuplicates);
}
if (flags.objectives) {
  console.log('Checking objectives...');
  const result = checkCardImageLinks(directories.objectives);
  flaggedFiles = flaggedFiles.concat(result.flaggedFiles);
  filesWithDuplicates = filesWithDuplicates.concat(result.filesWithDuplicates);
}

// If no flags are provided, inform the user
if (!Object.values(flags).some(Boolean)) {
  console.log('Please provide at least one flag: -ships, -squadrons, -upgrades, -objectives');
} else {
  if (flaggedFiles.length > 0) {
    console.log("Files with missing or invalid cardimage links:");
    flaggedFiles.forEach(file => console.log(file));
  } else {
    console.log("No files flagged for missing or invalid cardimage links.");
  }

  if (filesWithDuplicates.length > 0) {
    console.log("\nFiles with duplicate cardimage links:");
    filesWithDuplicates.forEach(file => console.log(file));
  } else {
    console.log("\nNo files with duplicate cardimage links found.");
  }
}

console.log('Script execution completed.');