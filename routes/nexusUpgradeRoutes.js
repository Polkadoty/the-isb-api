import express from 'express';
import { getAllNexusUpgrades, getNexusUpgradeById, searchNexusUpgrades } from '../controllers/nexusUpgradeController.js';

const router = express.Router();

router.get('/', getAllNexusUpgrades);
router.get('/search', searchNexusUpgrades);
router.get('/:id', getNexusUpgradeById);


export default router;
