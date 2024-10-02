const path = require('path');
const fs = require('fs');

exports.getAllSquadrons = (req, res, next) => {
  const faction = req.query.faction || 'rebel'; // Default to 'rebel' if no faction is specified
  const filePath = path.join(__dirname, `../public/converted-json/squadrons/${faction}/squadrons.json`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading squadrons.json:', err);
      return next(err);
    }
    res.json(JSON.parse(data));
  });
};

exports.getSquadronById = (req, res, next) => {
  const faction = req.query.faction || 'rebel'; // Default to 'rebel' if no faction is specified
  const squadronId = req.params.id;
  const filePath = path.join(__dirname, `../public/converted-json/squadrons/${faction}/${squadronId}.json`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading ${squadronId}.json:`, err);
      return res.status(404).json({ message: 'Squadron not found' });
    }
    res.json(JSON.parse(data));
  });
};