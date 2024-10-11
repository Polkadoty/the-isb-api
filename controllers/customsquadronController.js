const CustomSquadron = require('../models/customSquadron');

exports.getAllCustomSquadrons = async (req, res) => {
  try {
    console.log('Fetching all custom squadrons');
    const customSquadron = await CustomSquadron.findOne();
    console.log('Custom squadron data:', customSquadron);
    if (!customSquadron || !customSquadron.squadrons) {
      console.log('No custom squadrons found');
      return res.json({ squadrons: {} });
    }
    res.json({ squadrons: customSquadron.squadrons.toObject() });
  } catch (err) {
    console.error('Error in getAllCustomSquadrons:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
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

exports.debugDatabase = async (req, res) => {
  try {
    console.log('Debugging database contents');
    const allCollections = await mongoose.connection.db.listCollections().toArray();
    console.log('All collections:', allCollections.map(c => c.name));

    const squadronCollection = mongoose.connection.db.collection('squadrons');
    const squadronCount = await squadronCollection.countDocuments();
    console.log('Squadron count:', squadronCount);

    const sampleSquadrons = await squadronCollection.find().limit(5).toArray();
    console.log('Sample squadrons:', JSON.stringify(sampleSquadrons, null, 2));

    res.json({ 
      collections: allCollections.map(c => c.name),
      squadronCount,
      sampleSquadrons
    });
  } catch (err) {
    console.error('Error in debugDatabase:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
};