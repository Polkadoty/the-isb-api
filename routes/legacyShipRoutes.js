import express from 'express';
import { getAllLegacyShips, getLegacyShipById, searchLegacyShips } from '../controllers/legacyShipController.js';

const router = express.Router();

router.get('/', getAllLegacyShips);
router.get('/search', searchLegacyShips);
router.get('/:id', getLegacyShipById);

export default router;
