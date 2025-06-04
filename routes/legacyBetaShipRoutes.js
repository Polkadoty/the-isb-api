import express from 'express';
import { getAllLegacyBetaShips, getLegacyBetaShipById, searchLegacyBetaShips } from '../controllers/legacyBetaShipController.js';

const router = express.Router();

router.get('/', getAllLegacyBetaShips);
router.get('/search', searchLegacyBetaShips);
router.get('/:id', getLegacyBetaShipById);

export default router; 