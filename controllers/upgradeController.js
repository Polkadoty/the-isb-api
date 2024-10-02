const path = require('path');
const fs = require('fs');

exports.getAllUpgrades = (req, res, next) => {
  const faction = req.query.faction || 'rebel'; // Default to 'rebel' if no faction is specified
  const filePath = path.join(__dirname, `../public/converted-json/upgrades/${faction}/upgrades.json`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading upgrades.json:', err);
      return next(err);
    }
    res.json(JSON.parse(data));
  });
};

exports.getUpgradeById = (req, res, next) => {
  const faction = req.query.faction || 'rebel'; // Default to 'rebel' if no faction is specified
  const upgradeId = req.params.id;
  const filePath = path.join(__dirname, `../public/converted-json/upgrades/${faction}/${upgradeId}.json`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading ${upgradeId}.json:`, err);
      return res.status(404).json({ message: 'Upgrade not found' });
    }
    res.json(JSON.parse(data));
  });
};