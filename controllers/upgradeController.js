const path = require('path');
const fs = require('fs');

exports.getAllUpgrades = (req, res, next) => {
  const filePath = path.join(__dirname, '../public/converted-json/upgrades/upgrades.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading upgrades.json:', err);
      return next(err);
    }
    res.json(JSON.parse(data));
  });
};

exports.getUpgradeById = (req, res, next) => {
  const upgradeId = req.params.id;
  const filePath = path.join(__dirname, `../public/converted-json/upgrades/${upgradeId}.json`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading ${upgradeId}.json:`, err);
      return res.status(404).json({ message: 'Upgrade not found' });
    }
    res.json(JSON.parse(data));
  });
};

exports.searchUpgrades = (req, res, next) => {
  const filePath = path.join(__dirname, '../public/converted-json/upgrades/upgrades.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading upgrades.json:', err);
      return next(err);
    }
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
        let [filterKey, operator] = key.split(/__(!=|>=|<=|>|<)/).filter(Boolean);
        operator = operator || '=';
        let filterValue = decodeURIComponent(filters[key]);
        
        let value = upgrade[filterKey];
        if (value === undefined) {
          console.log(`Skipping undefined value for ${filterKey}`);
          continue;
        }

        if (filterKey === 'faction') {
          // Special handling for faction
          if (!(value.includes(filterValue) || value.length === 0)) {
            return false;
          }
        } else if (Array.isArray(value)) {
          // For other array values, check if the array includes the filter value
          if (!value.includes(filterValue)) {
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

    console.log(`Returning ${Object.keys(filteredUpgrades).length} upgrades after applying filters`);
    res.json({ upgrades: filteredUpgrades });
  });
};