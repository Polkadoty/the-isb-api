import express from 'express';
import { getAllLegendsUpgrades, getLegendsUpgradeById, searchLegendsUpgrades } from '../controllers/legendsUpgradeController.js';

const router = express.Router();

router.get('/', getAllLegendsUpgrades);
router.get('/search', searchLegendsUpgrades);
router.get('/:id', getLegendsUpgradeById);


export default router;
