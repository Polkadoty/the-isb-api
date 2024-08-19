const Squadron = require('../models/squadronModel');

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

exports.createSquadron = async (req, res, next) => {
  try {
    const newSquadron = new Squadron(req.body);
    const savedSquadron = await newSquadron.save();
    res.status(201).json(savedSquadron);
  } catch (error) {
    next(error);
  }
};

exports.updateSquadron = async (req, res, next) => {
  try {
    const updatedSquadron = await Squadron.findByIdAndUpdate(req.params.id, req.body, { new: true });
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