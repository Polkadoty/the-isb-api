import express from 'express';
import { getAllUpgrades, searchUpgrades, getUpgradeById } from '../controllers/upgradeController.js';

const router = express.Router();

router.get('/', getAllUpgrades);
router.get('/search', searchUpgrades);
router.get('/:id', getUpgradeById);

export default router;
