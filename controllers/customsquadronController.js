const CustomSquadron = require('../models/customSquadron');

exports.getAllCustomSquadrons = async (req, res) => {
  try {
    const customSquadrons = await CustomSquadron.find();
    res.json(customSquadrons);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getCustomSquadronByName = async (req, res) => {
  try {
    const customSquadron = await CustomSquadron.findOne({ [`squadrons.${req.params.squadronName}`]: { $exists: true } });
    if (!customSquadron) {
      return res.status(404).json({ msg: 'Squadron not found' });
    }
    res.json(customSquadron.squadrons.get(req.params.squadronName));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.createCustomSquadron = async (req, res) => {
  try {
    let customSquadron = await CustomSquadron.findOne();
    if (!customSquadron) {
      customSquadron = new CustomSquadron({ squadrons: {} });
    }
    customSquadron.squadrons.set(req.body.name, req.body);
    await customSquadron.save();
    res.json(customSquadron.squadrons.get(req.body.name));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateCustomSquadron = async (req, res) => {
  try {
    let customSquadron = await CustomSquadron.findOne({ [`squadrons.${req.params.squadronName}`]: { $exists: true } });
    if (!customSquadron) {
      return res.status(404).json({ msg: 'Squadron not found' });
    }
    
    customSquadron.squadrons.set(req.params.squadronName, { ...customSquadron.squadrons.get(req.params.squadronName), ...req.body });
    await customSquadron.save();
    
    res.json(customSquadron.squadrons.get(req.params.squadronName));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteCustomSquadron = async (req, res) => {
  try {
    const customSquadron = await CustomSquadron.findOne({ [`squadrons.${req.params.squadronName}`]: { $exists: true } });
    if (!customSquadron) {
      return res.status(404).json({ msg: 'Squadron not found' });
    }
    
    customSquadron.squadrons.delete(req.params.squadronName);
    await customSquadron.save();
    
    res.json({ msg: 'Squadron removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};