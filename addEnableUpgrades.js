const fs = require('fs');
const path = require('path');

const upgradesDirectory = path.join(__dirname, 'public/converted-json/upgrades');

function addEnableUpgradesToJson(directory) {
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
        console.log(`Processing file: ${filePath}`);
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const lines = fileContent.split('\n');
          let modified = false;

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('"disable_upgrades":')) {
              const indentation = lines[i].match(/^\s*/)[0];
              const nextLine = `${indentation}"enable_upgrades": [""],`;
              if (!lines[i + 1].includes('"enable_upgrades":')) {
                lines.splice(i + 1, 0, nextLine);
                modified = true;
                i++; // Skip the newly inserted line
              }
            }
          }

          if (modified) {
            fs.writeFileSync(filePath, lines.join('\n'));
            console.log(`Updated file: ${filePath}`);
          } else {
            console.log(`No changes needed for file: ${filePath}`);
          }
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
        }
      }
    });
  }

  processDirectory(directory);
}

// Main execution
console.log('Adding enable_upgrades to upgrade JSON files...');
addEnableUpgradesToJson(upgradesDirectory);
console.log('Script execution completed.');