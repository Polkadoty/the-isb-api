const mongoose = require('mongoose');
const Squadron = require('../models/squadronModel');

exports.createSquadron = async (req, res, next) => {
  try {
    const processedData = Squadron.processData(req.body);
    const newSquadron = new Squadron(processedData);
    const savedSquadron = await newSquadron.save();
    res.status(201).json(savedSquadron);
  } catch (error) {
    next(error);
  }
};

exports.getAllSquadrons = async (req, res, next) => {
  try {
    const squadrons = await Squadron.find();
    res.json(squadrons);
  } catch (error) {
    next(error);
  }
};

exports.getSquadronById = async (req, res, next) => {
  try {
    const squadron = await Squadron.findById(req.params.id);
    if (!squadron) return res.status(404).json({ message: 'Squadron not found' });
    res.json(squadron);
  } catch (error) {
    next(error);
  }
};

exports.updateSquadron = async (req, res, next) => {
  try {
    const processedData = Squadron.processData(req.body);
    const updatedSquadron = await Squadron.findByIdAndUpdate(req.params.id, processedData, { new: true });
    if (!updatedSquadron) return res.status(404).json({ message: 'Squadron not found' });
    res.json(updatedSquadron);
  } catch (error) {
    next(error);
  }
};

exports.deleteSquadron = async (req, res, next) => {
  try {
    const deletedSquadron = await Squadron.findByIdAndDelete(req.params.id);
    if (!deletedSquadron) return res.status(404).json({ message: 'Squadron not found' });
    res.json({ message: 'Squadron deleted successfully' });
  } catch (error) {
    next(error);
  }
};