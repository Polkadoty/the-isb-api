import express from 'express';
import { getAllOldLegacyShips, getOldLegacyShipById, searchOldLegacyShips } from '../controllers/oldLegacyShipController.js';
const router = express.Router();

router.get('/', getAllOldLegacyShips);
router.get('/search', searchOldLegacyShips);
router.get('/:id', getOldLegacyShipById);

export default router;
