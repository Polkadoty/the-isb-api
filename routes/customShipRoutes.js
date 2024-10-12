import express from 'express';
import { getAllCustomShips, searchCustomShips, getCustomShipById } from '../controllers/customShipController.js';

const router = express.Router();

router.get('/', getAllCustomShips);
router.get('/search', searchCustomShips);
router.get('/:id', getCustomShipById);

export default router;