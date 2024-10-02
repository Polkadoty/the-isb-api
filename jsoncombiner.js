const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const directories = {
  ships: path.join(__dirname, 'public/converted-json/ships'),
  squadrons: path.join(__dirname, 'public/converted-json/squadrons'),
  upgrades: path.join(__dirname, 'public/converted-json/upgrades')
};

function processFiles(directory, outputFileName) {
  const files = fs.readdirSync(directory);
  const result = {};

  files.forEach(file => {
    if (file.endsWith('.json') && file !== outputFileName) {
      const filePath = path.join(directory, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      for (let key in data) {
        if (data[key]._id === null) {
          data[key]._id = uuidv4(); // Generate a unique ID
        }
        result[key] = data[key];
      }
    }
  });

  fs.writeFileSync(path.join(directory, outputFileName), JSON.stringify(result, null, 2));
}

processFiles(directories.ships, 'ships.json');
processFiles(directories.squadrons, 'squadrons.json');
processFiles(directories.upgrades, 'upgrades.json');