import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllOldLegacyShips = async (req, res, next) => {
  console.log('Attempting to read old-legacy ships.json');
  const filePath = path.join(__dirname, '../public/converted-json/old-legacy-ships/old-legacy-ships.json');
  console.log('File path:', filePath);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read old-legacy ships.json');
    const parsedData = JSON.parse(data);
    res.json(parsedData);
  } catch (err) {
    console.error('Error reading old-legacy ships.json:', err);
    const error = new Error('Failed to read old-legacy ships data');
    error.statusCode = 500;
    error.details = { filePath, originalError: err.message };
    next(error);
  }
};

export const getOldLegacyShipById = async (req, res, next) => {
  const shipId = req.params.id;
  console.log(`Attempting to get old-legacy ship with ID: ${shipId}`);
  const filePath = path.join(__dirname, `../public/converted-json/old-legacy-ships/${shipId}.json`);
  console.log(`File path for old-legacy ship ${shipId}: ${filePath}`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log(`Successfully read data for old-legacy ship ${shipId}`);
    res.json(JSON.parse(data));
  } catch (err) {
    console.error(`Error reading old-legacy ${shipId}.json:`, err);
    res.status(404).json({ message: 'Legacy ship not found' });
  }
};

export const searchOldLegacyShips = async (req, res, next) => {
  const filePath = path.join(__dirname, '../public/converted-json/old-legacy-ships/old-legacy-ships.json');
  console.log('Attempting to read old-legacy ships.json for search');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read old-legacy ships.json for search');
    let shipsData = JSON.parse(data);
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

    const filterShip = (ship, chassis, filters) => {
      for (let key in filters) {
        let [filterKey, operator] = key.split(/__(!?=|>=|<=|>|<)/);
        operator = operator || '=';
        let filterValue = decodeURIComponent(filters[key]);
        let value;
        if (filterKey === 'hull') {
          value = chassis.hull;
        } else {
          value = getNestedValue(ship, filterKey);
          if (value === undefined) {
            value = getNestedValue(chassis, filterKey);
          }
        }
        console.log(`Filtering ${filterKey} with value ${value}, operator ${operator}, filter value ${filterValue}`);
        if (value === undefined) {
          console.log(`Skipping undefined value for ${filterKey}`);
          continue;
        }
        if (!compareValues(value, filterValue, operator)) {
          console.log(`Ship filtered out due to ${filterKey}`);
          return false;
        }
      }
      return true;
    };

    let filteredShips = {};
    for (let chassisName in shipsData.ships) {
      let chassis = shipsData.ships[chassisName];
      let filteredModels = {};
      for (let modelName in chassis.models) {
        let model = chassis.models[modelName];
        console.log(`Checking model: ${modelName}`);
        if (filterShip(model, chassis, filters)) {
          console.log(`Model ${modelName} passed filters`);
          filteredModels[modelName] = model;
        }
      }
      if (Object.keys(filteredModels).length > 0) {
        filteredShips[chassisName] = {
          ...chassis,
          models: filteredModels
        };
      }
    }

    console.log(`Returning ${Object.keys(filteredShips).length} chassis after applying filters`);
    res.json({ ships: filteredShips });
  } catch (err) {
    console.error('Error reading old-legacy ships.json:', err);
    next(err);
  }
};
