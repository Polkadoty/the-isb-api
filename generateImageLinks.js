import fs from 'fs';
import path from 'path';
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
  'old-legacy-upgrades': path.join(__dirname, 'public/converted-json/old-legacy-upgrades')
};

function generateImageLinks() {
  let images = {};

  Object.entries(directories).forEach(([dirKey, dirPath]) => {
    const jsonFileName = `${dirKey}.json`;
    const filePath = path.join(dirPath, jsonFileName);
    
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const topLevelKey = Object.keys(data)[0];

      Object.entries(data[topLevelKey]).forEach(([itemKey, itemData]) => {
        if (topLevelKey === 'ships') {
          Object.entries(itemData.models).forEach(([modelKey]) => {
            images[modelKey] = `https://api.swarmada.wiki/images/${modelKey}.webp`;
          });
        } else {
          images[itemKey] = `https://api.swarmada.wiki/images/${itemKey}.webp`;
        }
      });
    } catch (err) {
      console.error(`Error reading ${jsonFileName}:`, err);
    }
  });

  fs.writeFileSync(path.join(__dirname, 'public/images.json'), JSON.stringify(images, null, 2));
}

generateImageLinks(); 