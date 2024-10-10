const CustomShip = require('../models/customShip');

exports.getAllCustomShips = async (req, res) => {
  try {
    const customShips = await CustomShip.find();
    res.json(customShips);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getCustomShipByChassisName = async (req, res) => {
  try {
    const customShip = await CustomShip.findOne({ [`ships.${req.params.chassisName}`]: { $exists: true } });
    if (!customShip) {
      return res.status(404).json({ msg: 'Ship not found' });
    }
    res.json(customShip.ships.get(req.params.chassisName));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.createCustomShip = async (req, res) => {
  try {
    let customShip = await CustomShip.findOne();
    if (!customShip) {
      customShip = new CustomShip({ ships: {} });
    }
    customShip.ships.set(req.body.chassis_name, req.body);
    await customShip.save();
    res.json(customShip.ships.get(req.body.chassis_name));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateCustomShip = async (req, res) => {
  try {
    let customShip = await CustomShip.findOne({ [`ships.${req.params.chassisName}`]: { $exists: true } });
    if (!customShip) {
      return res.status(404).json({ msg: 'Ship not found' });
    }
    
    customShip.ships.set(req.params.chassisName, { ...customShip.ships.get(req.params.chassisName), ...req.body });
    await customShip.save();
    
    res.json(customShip.ships.get(req.params.chassisName));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteCustomShip = async (req, res) => {
  try {
    const customShip = await CustomShip.findOne({ [`ships.${req.params.chassisName}`]: { $exists: true } });
    if (!customShip) {
      return res.status(404).json({ msg: 'Ship not found' });
    }
    
    customShip.ships.delete(req.params.chassisName);
    await customShip.save();
    
    res.json({ msg: 'Ship removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};