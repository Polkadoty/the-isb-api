const CustomObjective = require('../models/customObjective');

exports.getAllCustomObjectives = async (req, res) => {
  try {
    const customObjectives = await CustomObjective.find();
    res.json(customObjectives);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getCustomObjectiveByName = async (req, res) => {
  try {
    const customObjective = await CustomObjective.findOne({ [`objectives.${req.params.objectiveName}`]: { $exists: true } });
    if (!customObjective) {
      return res.status(404).json({ msg: 'Objective not found' });
    }
    res.json(customObjective.objectives.get(req.params.objectiveName));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.createCustomObjective = async (req, res) => {
  try {
    let customObjective = await CustomObjective.findOne();
    if (!customObjective) {
      customObjective = new CustomObjective({ objectives: {} });
    }
    customObjective.objectives.set(req.body.name, req.body);
    await customObjective.save();
    res.json(customObjective.objectives.get(req.body.name));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateCustomObjective = async (req, res) => {
  try {
    let customObjective = await CustomObjective.findOne({ [`objectives.${req.params.objectiveName}`]: { $exists: true } });
    if (!customObjective) {
      return res.status(404).json({ msg: 'Objective not found' });
    }
    
    customObjective.objectives.set(req.params.objectiveName, { ...customObjective.objectives.get(req.params.objectiveName), ...req.body });
    await customObjective.save();
    
    res.json(customObjective.objectives.get(req.params.objectiveName));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteCustomObjective = async (req, res) => {
  try {
    const customObjective = await CustomObjective.findOne({ [`objectives.${req.params.objectiveName}`]: { $exists: true } });
    if (!customObjective) {
      return res.status(404).json({ msg: 'Objective not found' });
    }
    
    customObjective.objectives.delete(req.params.objectiveName);
    await customObjective.save();
    
    res.json({ msg: 'Objective removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};