const path = require('path');
const fs = require('fs');

exports.getAllShips = (req, res, next) => {
  const faction = req.query.faction || 'rebel'; // Default to 'rebel' if no faction is specified
  const filePath = path.join(__dirname, `../public/converted-json/ships/${faction}/ships.json`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading ships.json:', err);
      return next(err);
    }
    res.json(JSON.parse(data));
  });
};

exports.getShipById = (req, res, next) => {
  const faction = req.query.faction || 'rebel'; // Default to 'rebel' if no faction is specified
  const shipId = req.params.id;
  const filePath = path.join(__dirname, `../public/converted-json/ships/${faction}/${shipId}.json`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading ${shipId}.json:`, err);
      return res.status(404).json({ message: 'Ship not found' });
    }
    res.json(JSON.parse(data));
  });
};