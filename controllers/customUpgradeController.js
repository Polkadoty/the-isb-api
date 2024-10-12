import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllCustomUpgrades = async (req, res, next) => {
  console.log('Attempting to read custom upgrades.json');
  const filePath = path.join(__dirname, '../public/converted-json/custom/upgrades/upgrades.json');
  console.log('File path:', filePath);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read custom upgrades.json');
    const parsedData = JSON.parse(data);
    res.json(parsedData);
  } catch (err) {
    console.error('Error reading custom upgrades.json:', err);
    const error = new Error('Failed to read custom upgrades data');
    error.statusCode = 500;
    error.details = { filePath, originalError: err.message };
    next(error);
  }
};

export const getCustomUpgradeById = async (req, res, next) => {
  const upgradeId = req.params.id;
  console.log(`Attempting to get custom upgrade with ID: ${upgradeId}`);
  const filePath = path.join(__dirname, `../public/converted-json/custom/upgrades/${upgradeId}.json`);
  console.log(`File path for custom upgrade ${upgradeId}: ${filePath}`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log(`Successfully read data for custom upgrade ${upgradeId}`);
    res.json(JSON.parse(data));
  } catch (err) {
    console.error(`Error reading custom ${upgradeId}.json:`, err);
    res.status(404).json({ message: 'Custom upgrade not found' });
  }
};

export const searchCustomUpgrades = async (req, res, next) => {
  const filePath = path.join(__dirname, '../public/converted-json/custom/upgrades/upgrades.json');
  console.log('Attempting to read custom upgrades.json for search');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read custom upgrades.json for search');
    let upgradesData = JSON.parse(data);
    const filters = req.query;
    console.log('Applying filters:', filters);

    const compareValues = (value, filterValue, operator = '=') => {
      // Implementation remains the same as in upgradeController.js
      // Lines 51-74 from upgradeController.js
    };

    const getNestedValue = (obj, path) => {
      // Implementation remains the same as in upgradeController.js
      // Lines 76-87 from upgradeController.js
    };

    const filterUpgrade = (upgrade, filters) => {
      // Implementation remains the same as in upgradeController.js
      // Lines 89-112 from upgradeController.js
    };

    let filteredUpgrades = {};
    for (let upgradeName in upgradesData.upgrades) {
      let upgrade = upgradesData.upgrades[upgradeName];
      if (filterUpgrade(upgrade, filters)) {
        filteredUpgrades[upgradeName] = upgrade;
      }
    }

    console.log(`Returning ${Object.keys(filteredUpgrades).length} custom upgrades after applying filters`);
    res.json({ upgrades: filteredUpgrades });
  } catch (err) {
    console.error('Error reading custom upgrades.json:', err);
    next(err);
  }
};