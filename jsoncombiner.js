const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const directories = {
  ships: path.join(__dirname, 'public/converted-json/ships'),
  squadrons: path.join(__dirname, 'public/converted-json/squadrons'),
  upgrades: path.join(__dirname, 'public/converted-json/upgrades')
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
      }
    });
  }

  processDirectory(directory);

  fs.writeFileSync(path.join(directory, outputFileName), JSON.stringify(result, null, 2));
}

updateIdsAndCombine(directories.ships, 'ships.json');
updateIdsAndCombine(directories.squadrons, 'squadrons.json');
updateIdsAndCombine(directories.upgrades, 'upgrades.json');