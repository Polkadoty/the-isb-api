const path = require('path');
const fs = require('fs');

exports.getAllShips = (req, res, next) => {
  console.log('Attempting to read ships.json');
  const filePath = path.join(__dirname, '../public/converted-json/ships/ships.json');
  console.log('File path:', filePath);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading ships.json:', err);
      // Create a custom error with more details
      const error = new Error('Failed to read ships data');
      error.statusCode = 500;
      error.details = { filePath, originalError: err.message };
      return next(error);
    }
    console.log('Successfully read ships.json');
    try {
      const parsedData = JSON.parse(data);
      res.json(parsedData);
    } catch (parseError) {
      const error = new Error('Failed to parse ships data');
      error.statusCode = 500;
      error.details = { filePath, originalError: parseError.message };
      next(error);
    }
  });
};

exports.getShipById = (req, res, next) => {
  const shipId = req.params.id;
  console.log(`Attempting to get ship with ID: ${shipId}`);
  const filePath = path.join(__dirname, `../public/converted-json/ships/${shipId}.json`);
  console.log(`File path for ship ${shipId}: ${filePath}`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading ${shipId}.json:`, err);
      return res.status(404).json({ message: 'Ship not found' });
    }
    console.log(`Successfully read data for ship ${shipId}`);
    res.json(JSON.parse(data));
  });
};

exports.searchShips = (req, res, next) => {
  const filePath = path.join(__dirname, '../public/converted-json/ships/ships.json');
  console.log('Attempting to read ships.json for search');
  fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
          console.error('Error reading ships.json:', err);
          return next(err);
      }
      console.log('Successfully read ships.json for search');
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
  });
};