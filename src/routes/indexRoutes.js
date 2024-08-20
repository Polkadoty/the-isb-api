// src/routes/indexRoutes.js
const express = require('express');
const router = express.Router();
const Ship = require('../models/shipModel');
const Squadron = require('../models/squadronModel');
const Upgrade = require('../models/upgradeModel');

router.get('/', async (req, res, next) => {
    try {
      console.log('Fetching data from database...');
  
      const ships = await Ship.find();
      const squadrons = await Squadron.find();
      const upgrades = await Upgrade.find();
  
      const result = {
        ships,
        squadrons,
        upgrades
      };
  
      console.log('Result:', JSON.stringify(result, null, 2));
  
      res.json(result);
    } catch (error) {
      console.error('Error in index route:', error);
      next(error);
    }
  });

module.exports = router;