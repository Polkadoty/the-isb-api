import express from 'express';
import { getAllSquadrons, searchSquadrons, getSquadronById } from '../controllers/squadronController.js';

const router = express.Router();

router.get('/', getAllSquadrons);
router.get('/search', searchSquadrons);
router.get('/:id', getSquadronById);

export default router;
