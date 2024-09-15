const mongoose = require('mongoose');
const Ship = require('../models/shipModel');
const { replaceNullIds } = require('../utils/dataProcessing');

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
    const processedData = Ship.processData(req.body);
    const newShip = new Ship(processedData);
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