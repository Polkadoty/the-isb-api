import express from 'express';
import { getAllCustomUpgrades, searchCustomUpgrades, getCustomUpgradeById } from '../controllers/customUpgradeController.js';

const router = express.Router();

router.get('/', getAllCustomUpgrades);
router.get('/search', searchCustomUpgrades);
router.get('/:id', getCustomUpgradeById);

export default router;