import express from 'express';
import { getAllLegendsShips, getLegendsShipById, searchLegendsShips } from '../controllers/legendsShipController.js';

const router = express.Router();

router.get('/', getAllLegendsShips);
router.get('/search', searchLegendsShips);
router.get('/:id', getLegendsShipById);


export default router;
