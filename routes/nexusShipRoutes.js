import express from 'express';
import { getAllNexusShips, getNexusShipById, searchNexusShips } from '../controllers/nexusShipController.js';

const router = express.Router();

router.get('/', getAllNexusShips);
router.get('/search', searchNexusShips);
router.get('/:id', getNexusShipById);


export default router;
