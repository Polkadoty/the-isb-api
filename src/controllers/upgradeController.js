const Upgrade = require('../models/upgradeModel');

exports.getAllUpgrades = async (req, res, next) => {
  try {
    const upgrades = await Upgrade.find();
    res.json(upgrades);
  } catch (error) {
    next(error);
  }
};

exports.getUpgradeById = async (req, res, next) => {
  try {
    const upgrade = await Upgrade.findById(req.params.id);
    if (!upgrade) return res.status(404).json({ message: 'Upgrade not found' });
    res.json(upgrade);
  } catch (error) {
    next(error);
  }
};

exports.createUpgrade = async (req, res, next) => {
  try {
    const newUpgrade = new Upgrade(req.body);
    const savedUpgrade = await newUpgrade.save();
    res.status(201).json(savedUpgrade);
  } catch (error) {
    next(error);
  }
};

exports.updateUpgrade = async (req, res, next) => {
  try {
    const updatedUpgrade = await Upgrade.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedUpgrade) return res.status(404).json({ message: 'Upgrade not found' });
    res.json(updatedUpgrade);
  } catch (error) {
    next(error);
  }
};

exports.deleteUpgrade = async (req, res, next) => {
  try {
    const deletedUpgrade = await Upgrade.findByIdAndDelete(req.params.id);
    if (!deletedUpgrade) return res.status(404).json({ message: 'Upgrade not found' });
    res.json({ message: 'Upgrade deleted successfully' });
  } catch (error) {
    next(error);
  }
};