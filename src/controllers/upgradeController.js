const UpgradeCard = require('../models/Upgrade');

exports.getAllUpgradeCards = async (req, res, next) => {
  try {
    const upgradeCards = await UpgradeCard.find();
    res.json(upgradeCards);
  } catch (error) {
    next(error);
  }
};

exports.getUpgradeCardById = async (req, res, next) => {
  try {
    const upgradeCard = await UpgradeCard.findById(req.params.id);
    if (!upgradeCard) return res.status(404).json({ message: 'Upgrade card not found' });
    res.json(upgradeCard);
  } catch (error) {
    next(error);
  }
};

exports.createUpgradeCard = async (req, res, next) => {
  try {
    const newUpgradeCard = new UpgradeCard(req.body);
    const savedUpgradeCard = await newUpgradeCard.save();
    res.status(201).json(savedUpgradeCard);
  } catch (error) {
    next(error);
  }
};

exports.updateUpgradeCard = async (req, res, next) => {
  try {
    const updatedUpgradeCard = await UpgradeCard.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedUpgradeCard) return res.status(404).json({ message: 'Upgrade card not found' });
    res.json(updatedUpgradeCard);
  } catch (error) {
    next(error);
  }
};

exports.deleteUpgradeCard = async (req, res, next) => {
  try {
    const deletedUpgradeCard = await UpgradeCard.findByIdAndDelete(req.params.id);
    if (!deletedUpgradeCard) return res.status(404).json({ message: 'Upgrade card not found' });
    res.json({ message: 'Upgrade card deleted successfully' });
  } catch (error) {
    next(error);
  }
};