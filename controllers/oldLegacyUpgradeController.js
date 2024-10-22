import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllOldLegacyUpgrades = async (req, res, next) => {
  console.log('Attempting to read old-legacy upgrades.json');
  const filePath = path.join(__dirname, '../public/converted-json/old-legacy-upgrades/old-legacy-upgrades.json');
  console.log('File path:', filePath);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read old-legacy upgrades.json');
    const parsedData = JSON.parse(data);
    res.json(parsedData);
  } catch (err) {
    console.error('Error reading old-legacy upgrades.json:', err);
    const error = new Error('Failed to read old-legacy upgrades data');
    error.statusCode = 500;
    error.details = { filePath, originalError: err.message };
    next(error);
  }
};

export const getOldLegacyUpgradeById = async (req, res, next) => {
  const upgradeId = req.params.id;
  console.log(`Attempting to get old-legacy upgrade with ID: ${upgradeId}`);
  const filePath = path.join(__dirname, `../public/converted-json/old-legacy-upgrades/${upgradeId}.json`);
  console.log(`File path for old-legacy upgrade ${upgradeId}: ${filePath}`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log(`Successfully read data for old-legacy upgrade ${upgradeId}`);
    res.json(JSON.parse(data));
  } catch (err) {
    console.error(`Error reading old-legacy ${upgradeId}.json:`, err);
    res.status(404).json({ message: 'Legacy upgrade not found' });
  }
};

export const searchOldLegacyUpgrades = async (req, res, next) => {
  const filePath = path.join(__dirname, '../public/converted-json/old-legacy-upgrades/old-legacy-upgrades.json');
  console.log('Attempting to read old-legacy upgrades.json for search');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read old-legacy upgrades.json for search');
    let upgradesData = JSON.parse(data);
    const filters = req.query;
    console.log('Applying filters:', filters);

    const compareValues = (value, filterValue, operator = '=') => {
      const numValue = Number(value);
      const numFilterValue = Number(filterValue);
      let result;
      if (!isNaN(numValue) && !isNaN(numFilterValue)) {
        switch(operator) {
          case '>': result = numValue > numFilterValue; break;
          case '<': result = numValue < numFilterValue; break;
          case '>=': result = numValue >= numFilterValue; break;
          case '<=': result = numValue <= numFilterValue; break;
          case '!=': result = numValue !== numFilterValue; break;
          default: result = numValue === numFilterValue;
        }
      } else {
        switch(operator) {
          case '!=': result = value !== filterValue; break;
          case '>=': result = value >= filterValue; break;
          case '<=': result = value <= filterValue; break;
          default: result = value === filterValue;
        }
      }
      console.log(`Comparing ${value} ${operator} ${filterValue}: ${result}`);
      return result;
    };

    const getNestedValue = (obj, path) => {
      const value = path.split('.').reduce((prev, curr) => {
        if (prev && prev[curr] !== undefined) {
          return prev[curr];
        } else if (Array.isArray(prev) && !isNaN(parseInt(curr))) {
          return prev[parseInt(curr)];
        }
        return undefined;
      }, obj);
      console.log(`Getting nested value for path ${path}: ${value}`);
      return value;
    };

    const filterUpgrade = (upgrade, filters) => {
      for (let key in filters) {
        if (key === 'include_neutral') continue; // Skip this filter key
        let [filterKey, operator] = key.split(/(!=|>=|<=|>|<)/).filter(Boolean);
        operator = operator || '=';
        let filterValue = decodeURIComponent(filters[key]);
        let value = upgrade[filterKey];
        if (value === undefined) {
          console.log(`Skipping undefined value for ${filterKey}`);
          continue;
        }
        if (filterKey === 'faction') {
          if (value.length === 0 || value.includes('')) {
            // This is a neutral upgrade, include it if includeNeutral is true
            if (!includeNeutral) {
              console.log(`Neutral upgrade filtered out`);
              return false;
            }
          } else if (!value.includes(filterValue)) {
            console.log(`Upgrade filtered out due to faction mismatch`);
            return false;
          }
        } else if (Array.isArray(value)) {
          if (!value.includes(filterValue)) {
            console.log(`Upgrade filtered out due to array value mismatch`);
            return false;
          }
        } else if (!compareValues(value, filterValue, operator)) {
          console.log(`Upgrade filtered out due to ${filterKey}`);
          return false;
        }
      }
      return true;
    };

    let filteredUpgrades = {};
    for (let upgradeName in upgradesData.upgrades) {
      let upgrade = upgradesData.upgrades[upgradeName];
      if (filterUpgrade(upgrade, filters)) {
        filteredUpgrades[upgradeName] = upgrade;
      }
    }

    console.log(`Returning ${Object.keys(filteredUpgrades).length} old-legacy upgrades after applying filters`);
    res.json({ upgrades: filteredUpgrades });
  } catch (err) {
    console.error('Error reading old-legacy upgrades.json:', err);
    next(err);
  }
};
