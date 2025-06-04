import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllLegacyBetaSquadrons = async (req, res, next) => {
  console.log('Attempting to read legacy-beta-squadrons.json');
  const filePath = path.join(__dirname, '../public/converted-json/legacy-beta-squadrons/legacy-beta-squadrons.json');
  console.log('File path:', filePath);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read legacy-beta squadrons.json');
    const parsedData = JSON.parse(data);
    res.json(parsedData);
  } catch (err) {
    console.error('Error reading legacy-beta squadrons.json:', err);
    const error = new Error('Failed to read legacy-beta squadrons data');
    error.statusCode = 500;
    error.details = { filePath, originalError: err.message };
    next(error);
  }
};

export const getLegacyBetaSquadronById = async (req, res, next) => {
  const squadronId = req.params.id;
  console.log(`Attempting to get legacy-beta squadron with ID: ${squadronId}`);
  const filePath = path.join(__dirname, `../public/converted-json/legacy-beta-squadrons/${squadronId}.json`);
  console.log(`File path for legacy-beta squadron ${squadronId}: ${filePath}`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const squadronsData = JSON.parse(data);
    const squadron = squadronsData.squadrons[squadronId];
    if (squadron) {
      console.log(`Successfully read data for legacy-beta squadron ${squadronId}`);
      res.json(squadron);
    } else {
      res.status(404).json({ message: 'Legacy-beta squadron not found' });
    }
  } catch (err) {
    console.error(`Error reading legacy-beta squadrons.json:`, err);
    next(err);
  }
};

export const searchLegacyBetaSquadrons = async (req, res, next) => {
  const filePath = path.join(__dirname, '../public/converted-json/legacy-beta-squadrons/legacy-beta-squadrons.json');
  console.log('Attempting to read legacy-beta squadrons.json for search');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read legacy-beta squadrons.json for search');
    let squadronsData = JSON.parse(data);
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

    const filterSquadron = (squadron, filters) => {
      const includeNeutral = filters.include_neutral === 'true';
      for (let key in filters) {
        if (key === 'include_neutral') continue;
        let [filterKey, operator] = key.split(/(!=|>=|<=|>|<)/).filter(Boolean);
        operator = operator || '=';
        let filterValue = decodeURIComponent(filters[key]);
        let value = squadron[filterKey];
        if (value === undefined) {
          console.log(`Skipping undefined value for ${filterKey}`);
          continue;
        }
        if (filterKey === 'faction') {
          if (value.length === 0 || value.includes('')) {
            if (!includeNeutral) {
              console.log(`Neutral squadron filtered out`);
              return false;
            }
          } else if (!value.includes(filterValue)) {
            console.log(`Squadron filtered out due to faction mismatch`);
            return false;
          }
        } else if (Array.isArray(value)) {
          if (!value.includes(filterValue)) {
            console.log(`Squadron filtered out due to array value mismatch`);
            return false;
          }
        } else if (!compareValues(value, filterValue, operator)) {
          console.log(`Squadron filtered out due to ${filterKey}`);
          return false;
        }
      }
      return true;
    };

    let filteredSquadrons = {};
    for (let squadronName in squadronsData.squadrons) {
      let squadron = squadronsData.squadrons[squadronName];
      if (filterSquadron(squadron, filters)) {
        filteredSquadrons[squadronName] = squadron;
      }
    }

    console.log(`Returning ${Object.keys(filteredSquadrons).length} legacy-beta squadrons after applying filters`);
    res.json({ squadrons: filteredSquadrons });
  } catch (err) {
    console.error('Error reading legacy-beta squadrons.json:', err);
    next(err);
  }
}; 