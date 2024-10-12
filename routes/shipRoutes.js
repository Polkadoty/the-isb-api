import express from 'express';
import { getAllShips, searchShips, getShipById } from '../controllers/shipController.js';

const router = express.Router();

router.get('/', getAllShips);
router.get('/search', searchShips);
router.get('/:id', getShipById);

export default router;
