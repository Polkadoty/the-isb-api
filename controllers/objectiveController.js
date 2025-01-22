import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllObjectives = async (req, res, next) => {
  const filePath = path.join(__dirname, '../public/converted-json/objectives/objectives.json');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    console.error('Error reading objectives.json:', err);
    next(err);
  }
};

export const getObjectiveById = async (req, res, next) => {
  const objectiveId = req.params.id;
  const filePath = path.join(__dirname, `../public/converted-json/objectives/${objectiveId}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    console.error(`Error reading ${objectiveId}.json:`, err);
    res.status(404).json({ message: 'Objective not found' });
  }
};

export const searchObjectives = async (req, res, next) => {
  const filePath = path.join(__dirname, '../public/converted-json/objectives/objectives.json');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    let objectivesData = JSON.parse(data);
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
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
      }, obj);
    };

    const filterObjective = (objective, filters) => {
      for (let key in filters) {
        let [filterKey, operator] = key.split(/__(!=|>=|<=|>|<)/).filter(Boolean);
        operator = operator || '=';
        let filterValue = decodeURIComponent(filters[key]);
        let value = getNestedValue(objective, filterKey);
        console.log(`Filtering ${filterKey} with value ${value}, operator ${operator}, filter value ${filterValue}`);
        if (value === undefined) {
          console.log(`Skipping undefined value for ${filterKey}`);
          continue;
        }
        if (!compareValues(value, filterValue, operator)) {
          console.log(`Objective filtered out due to ${filterKey}`);
          return false;
        }
      }
      return true;
    };

    let filteredObjectives = {};
    for (let objectiveName in objectivesData.objectives) {
      let objective = objectivesData.objectives[objectiveName];
      if (filterObjective(objective, filters)) {
        filteredObjectives[objectiveName] = objective;
      }
    }

    console.log(`Returning ${Object.keys(filteredObjectives).length} objectives after applying filters`);
    res.json({ objectives: filteredObjectives });
  } catch (err) {
    console.error('Error reading objectives.json:', err);
    next(err);
  }
};
