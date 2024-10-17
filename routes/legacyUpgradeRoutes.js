import express from 'express';
import { getAllLegacyUpgrades, getLegacyUpgradeById, searchLegacyUpgrades } from '../controllers/legacyUpgradeController.js';

const router = express.Router();

router.get('/', getAllLegacyUpgrades);
router.get('/search', searchLegacyUpgrades);
router.get('/:id', getLegacyUpgradeById);


export default router;
