const Ship = require('../models/Ship');
const UpgradeCard = require('../models/UpgradeCard');

exports.getAllShips = async (req, res, next) => {
  try {
    const ships = await Ship.find();
    res.json(ships);
  } catch (error) {
    next(error);
  }
};

exports.getShipById = async (req, res, next) => {
  try {
    const ship = await Ship.findById(req.params.id);
    if (!ship) return res.status(404).json({ message: 'Ship not found' });
    res.json(ship);
  } catch (error) {
    next(error);
  }
};

exports.createShip = async (req, res, next) => {
  try {
    const newShip = new Ship(req.body);
    const savedShip = await newShip.save();
    res.status(201).json(savedShip);
  } catch (error) {
    next(error);
  }
};

exports.updateShip = async (req, res, next) => {
  try {
    const updatedShip = await Ship.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedShip) return res.status(404).json({ message: 'Ship not found' });
    res.json(updatedShip);
  } catch (error) {
    next(error);
  }
};

exports.deleteShip = async (req, res, next) => {
  try {
    const deletedShip = await Ship.findByIdAndDelete(req.params.id);
    if (!deletedShip) return res.status(404).json({ message: 'Ship not found' });
    res.json({ message: 'Ship deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getCompatibleUpgrades = async (req, res, next) => {
  try {
    const ship = await Ship.findById(req.params.id);
    if (!ship) return res.status(404).json({ message: 'Ship not found' });

    const compatibleUpgrades = await UpgradeCard.find({
      $or: [
        { faction: ship.faction },
        { faction: 'Neutral' }
      ],
      type: { $in: ship.upgrades }
    });

    res.json(compatibleUpgrades);
  } catch (error) {
    next(error);
  }
};