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
  const filePath = path.join(__dirname, `../public/converted-json/squadrons/${squadronId}.json`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading ${squadronId}.json:`, err);
      return res.status(404).json({ message: 'Squadron not found' });
    }
    res.json(JSON.parse(data));
  });
};

exports.searchSquadrons = (req, res, next) => {
    const filePath = path.join(__dirname, '../public/converted-json/squadrons/squadrons.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading squadrons.json:', err);
        return next(err);
      }
      let squadrons = JSON.parse(data);
      const filters = req.query;
  
      // Apply filters
      squadrons = squadrons.filter(squadron => {
        for (let key in filters) {
          if (key === 'points') {
            if (squadron.points !== parseInt(filters[key])) {
              return false;
            }
          } else if (key === 'hull') {
            if (squadron.hull !== parseInt(filters[key])) {
              return false;
            }
          } else if (key === 'squadron_type') {
            if (squadron.squadron_type !== filters[key]) {
              return false;
            }
          } else if (key === 'faction') {
            if (squadron.faction !== filters[key]) {
              return false;
            }
          } else if (squadron[key] === undefined || squadron[key] != filters[key]) {
            return false;
          }
        }
        return true;
      });
  
      res.json(squadrons);
    });
};