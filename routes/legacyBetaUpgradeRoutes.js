import express from 'express';
import { getAllLegacyBetaUpgrades, getLegacyBetaUpgradeById, searchLegacyBetaUpgrades } from '../controllers/legacyBetaUpgradeController.js';

const router = express.Router();

router.get('/', getAllLegacyBetaUpgrades);
router.get('/search', searchLegacyBetaUpgrades);
router.get('/:id', getLegacyBetaUpgradeById);

export default router; 