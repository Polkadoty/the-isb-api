import express from 'express';
import {
  getAllAmgShips,
  getAmgShipById
} from '../controllers/amgShipController.js';

import {
  getAllAmgSquadrons,
  getAmgSquadronById
} from '../controllers/amgSquadronController.js';

import {
  getAllAmgUpgrades,
  getAmgUpgradeById
} from '../controllers/amgUpgradeController.js';

import {
  getAllAmgObjectives,
  getAmgObjectiveById
} from '../controllers/amgObjectiveController.js';

const router = express.Router();

// AMG Ships routes
router.get('/ships', getAllAmgShips);
router.get('/ships/:id', getAmgShipById);

// AMG Squadrons routes
router.get('/squadrons', getAllAmgSquadrons);
router.get('/squadrons/:id', getAmgSquadronById);

// AMG Upgrades routes
router.get('/upgrades', getAllAmgUpgrades);
router.get('/upgrades/:id', getAmgUpgradeById);

// AMG Objectives routes
router.get('/objectives', getAllAmgObjectives);
router.get('/objectives/:id', getAmgObjectiveById);

export default router; 