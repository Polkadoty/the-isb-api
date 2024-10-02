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
    let upgrades = JSON.parse(data);
    const filters = req.query;

    // Apply filters
    upgrades = upgrades.filter(upgrade => {
      for (let key in filters) {
        if (key === 'points') {
          if (upgrade.points !== parseInt(filters[key])) {
            return false;
          }
        } else if (key === 'type') {
          if (upgrade.type !== filters[key]) {
            return false;
          }
        } else if (upgrade[key] === undefined || upgrade[key] != filters[key]) {
          return false;
        }
      }
      return true;
    });

    res.json(upgrades);
  });
};