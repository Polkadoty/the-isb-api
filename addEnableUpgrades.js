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
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          let modified = false;

          function processObject(obj) {
            if (typeof obj === 'object' && obj !== null) {
              if (obj.restrictions && Array.isArray(obj.restrictions.disable_upgrades)) {
                if (!obj.restrictions.enable_upgrades) {
                  obj.restrictions.enable_upgrades = [""];
                  modified = true;
                }
              }
              for (let key in obj) {
                processObject(obj[key]);
              }
            } else if (Array.isArray(obj)) {
              obj.forEach(item => processObject(item));
            }
          }

          processObject(data);

          if (modified) {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
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