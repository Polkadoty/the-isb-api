import express from 'express';
import {
  getAllArcShips,
  getArcShipById
} from '../controllers/arcShipController.js';

import {
  getAllArcSquadrons,
  getArcSquadronById
} from '../controllers/arcSquadronController.js';

import {
  getAllArcUpgrades,
  getArcUpgradeById
} from '../controllers/arcUpgradeController.js';

import {
  getAllArcObjectives,
  getArcObjectiveById
} from '../controllers/arcObjectiveController.js';

const router = express.Router();

// ARC Ships routes
router.get('/ships', getAllArcShips);
router.get('/ships/:id', getArcShipById);

// ARC Squadrons routes
router.get('/squadrons', getAllArcSquadrons);
router.get('/squadrons/:id', getArcSquadronById);

// ARC Upgrades routes
router.get('/upgrades', getAllArcUpgrades);
router.get('/upgrades/:id', getArcUpgradeById);

// ARC Objectives routes
router.get('/objectives', getAllArcObjectives);
router.get('/objectives/:id', getArcObjectiveById);

export default router; 