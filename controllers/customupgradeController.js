const CustomUpgrade = require('../models/customUpgrade');

exports.getAllCustomUpgrades = async (req, res) => {
  try {
    const customUpgrades = await CustomUpgrade.find();
    res.json(customUpgrades);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getCustomUpgradeByName = async (req, res) => {
  try {
    const customUpgrade = await CustomUpgrade.findOne({ [`upgrades.${req.params.upgradeName}`]: { $exists: true } });
    if (!customUpgrade) {
      return res.status(404).json({ msg: 'Upgrade not found' });
    }
    res.json(customUpgrade.upgrades.get(req.params.upgradeName));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.createCustomUpgrade = async (req, res) => {
  try {
    let customUpgrade = await CustomUpgrade.findOne();
    if (!customUpgrade) {
      customUpgrade = new CustomUpgrade({ upgrades: {} });
    }
    customUpgrade.upgrades.set(req.body.name, req.body);
    await customUpgrade.save();
    res.json(customUpgrade.upgrades.get(req.body.name));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateCustomUpgrade = async (req, res) => {
  try {
    let customUpgrade = await CustomUpgrade.findOne({ [`upgrades.${req.params.upgradeName}`]: { $exists: true } });
    if (!customUpgrade) {
      return res.status(404).json({ msg: 'Upgrade not found' });
    }
    
    customUpgrade.upgrades.set(req.params.upgradeName, { ...customUpgrade.upgrades.get(req.params.upgradeName), ...req.body });
    await customUpgrade.save();
    
    res.json(customUpgrade.upgrades.get(req.params.upgradeName));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteCustomUpgrade = async (req, res) => {
  try {
    const customUpgrade = await CustomUpgrade.findOne({ [`upgrades.${req.params.upgradeName}`]: { $exists: true } });
    if (!customUpgrade) {
      return res.status(404).json({ msg: 'Upgrade not found' });
    }
    
    customUpgrade.upgrades.delete(req.params.upgradeName);
    await customUpgrade.save();
    
    res.json({ msg: 'Upgrade removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};