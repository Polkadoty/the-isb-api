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
      let ships = JSON.parse(data);
      const filters = req.query;
      console.log('Applying filters:', filters);
  
      // Apply filters
      ships = ships.filter(ship => {
        for (let key in filters) {
          if (key === 'points') {
            if (ship.points !== parseInt(filters[key])) {
              console.log(`Ship ${ship.name} filtered out due to points mismatch`);
              return false;
            }
          } else if (key === 'hull') {
            if (ship.hull !== parseInt(filters[key])) {
              console.log(`Ship ${ship.name} filtered out due to hull mismatch`);
              return false;
            }
          } else if (key === 'chassis_name') {
            if (ship.chassis_name !== filters[key]) {
              console.log(`Ship ${ship.name} filtered out due to chassis_name mismatch`);
              return false;
            }
          } else if (key === 'faction') {
            if (ship.faction !== filters[key]) {
              console.log(`Ship ${ship.name} filtered out due to faction mismatch`);
              return false;
            }
          } else if (ship[key] === undefined || ship[key] != filters[key]) {
            console.log(`Ship ${ship.name} filtered out due to ${key} mismatch`);
            return false;
          }
        }
        return true;
      });
  
      console.log(`Returning ${ships.length} ships after applying filters`);
      res.json(ships);
    });
  };