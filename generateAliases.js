 // Start of Selection
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

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function generateAliases() {
  let aliases = {};

  Object.entries(directories).forEach(([dirKey, dirPath]) => {
    const jsonFileName = `${dirKey}.json`;
    const filePath = path.join(dirPath, jsonFileName);
    
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const topLevelKey = Object.keys(data)[0];

      Object.entries(data[topLevelKey]).forEach(([itemKey, itemData]) => {
        if (topLevelKey === 'ships') {
          Object.entries(itemData.models).forEach(([modelKey, modelData]) => {
            const exportText = `${modelData.name}${modelData.alias !== 'AMG' && modelData.alias !== 'FFG' ? ` [${modelData.alias}]` : ''} (${modelData.points})`;
            aliases[exportText] = modelKey;
          });
        } else if (topLevelKey === 'objectives') {
          const exportText = `${itemData.name}${itemData.alias !== 'AMG' && itemData.alias !== 'FFG' ? ` [${itemData.alias}]` : ''}`;
          aliases[exportText] = itemKey;
        } else {
          const exportText = itemData['ace-name'] 
            ? `${itemData['ace-name']} - ${itemData.name}${itemData.alias !== 'AMG' && itemData.alias !== 'FFG' ? ` [${itemData.alias}]` : ''} (${itemData.points})`
            : `${itemData.name}${itemData.alias !== 'AMG' && itemData.alias !== 'FFG' ? ` [${itemData.alias}]` : ''} (${itemData.points})`;
          aliases[exportText] = itemKey;
        }
      });
    } catch (err) {
      console.error(`Error reading ${jsonFileName}:`, err);
    }
  });

  // Remove duplicates (if any)
  aliases = Object.fromEntries(
    Object.entries(aliases).filter(([key, value], index, self) =>
      index === self.findIndex(t => t[1] === value)
    )
  );

  // Write aliases to a JSON file
  fs.writeFileSync(path.join(__dirname, 'public/aliases.json'), JSON.stringify(aliases, null, 2));
}

generateAliases();
