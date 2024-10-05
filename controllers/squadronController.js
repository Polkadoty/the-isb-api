const path = require('path');
const fs = require('fs');

exports.getAllSquadrons = (req, res, next) => {
  const filePath = path.join(__dirname, '../public/converted-json/squadrons/squadrons.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading squadrons.json:', err);
      return next(err);
    }
    res.json(JSON.parse(data));
  });
};

exports.getSquadronById = (req, res, next) => {
  const squadronId = req.params.id;
  const filePath = path.join(__dirname, '../public/converted-json/squadrons/squadrons.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading squadrons.json:', err);
      return next(err);
    }
    const squadronsData = JSON.parse(data);
    const squadron = squadronsData.squadrons[squadronId];
    if (squadron) {
      res.json(squadron);
    } else {
      res.status(404).json({ message: 'Squadron not found' });
    }
  });
};
exports.searchSquadrons = (req, res, next) => {
    const filePath = path.join(__dirname, '../public/converted-json/squadrons/squadrons.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading squadrons.json:', err);
            return next(err);
        }
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
            for (let key in filters) {
                let [filterKey, operator] = key.split(/__(!=|>=|<=|>|<)/).filter(Boolean);
                operator = operator || '=';
                let filterValue = decodeURIComponent(filters[key]);
                let value = getNestedValue(squadron, filterKey);
                console.log(`Filtering ${filterKey} with value ${value}, operator ${operator}, filter value ${filterValue}`);
                if (value === undefined) {
                    console.log(`Skipping undefined value for ${filterKey}`);
                    continue;
                }
                if (Array.isArray(value)) {
                    // Handle array values (like faction)
                    if (!value.includes(filterValue)) {
                        console.log(`Squadron filtered out due to ${filterKey}`);
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

        console.log(`Returning ${Object.keys(filteredSquadrons).length} squadrons after applying filters`);
        res.json({ squadrons: filteredSquadrons });
    });
};