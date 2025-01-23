import express from 'express';
import { getAllOldLegacyUpgrades, getOldLegacyUpgradeById, searchOldLegacyUpgrades } from '../controllers/oldLegacyUpgradeController.js';

const router = express.Router();

router.get('/', getAllOldLegacyUpgrades);
router.get('/search', searchOldLegacyUpgrades);
router.get('/:id', getOldLegacyUpgradeById);


export default router;
