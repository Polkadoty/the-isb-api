const path = require('path');
const fs = require('fs');

exports.getAllShips = (req, res, next) => {
  const filePath = path.join(__dirname, '../public/converted-json/ships/ships.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading ships.json:', err);
      return next(err);
    }
    res.json(JSON.parse(data));
  });
};

exports.getShipById = (req, res, next) => {
  const shipId = req.params.id;
  const filePath = path.join(__dirname, `../public/converted-json/ships/${shipId}.json`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading ${shipId}.json:`, err);
      return res.status(404).json({ message: 'Ship not found' });
    }
    res.json(JSON.parse(data));
  });
};

exports.searchShips = (req, res, next) => {
    const filePath = path.join(__dirname, '../public/converted-json/ships/ships.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading ships.json:', err);
        return next(err);
      }
      let ships = JSON.parse(data);
      const filters = req.query;
  
      // Apply filters
      ships = ships.filter(ship => {
        for (let key in filters) {
          if (key === 'points') {
            if (ship.points !== parseInt(filters[key])) {
              return false;
            }
          } else if (key === 'hull') {
            if (ship.hull !== parseInt(filters[key])) {
              return false;
            }
          } else if (key === 'chassis_name') {
            if (ship.chassis_name !== filters[key]) {
              return false;
            }
          } else if (key === 'faction') {
            if (ship.faction !== filters[key]) {
              return false;
            }
          } else if (ship[key] === undefined || ship[key] != filters[key]) {
            return false;
          }
        }
        return true;
      });
  
      res.json(ships);
    });
  };