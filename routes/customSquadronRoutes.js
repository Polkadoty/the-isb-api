import express from 'express';
import { getAllCustomSquadrons, searchCustomSquadrons, getCustomSquadronById } from '../controllers/customSquadronController.js';

const router = express.Router();

router.get('/', getAllCustomSquadrons);
router.get('/search', searchCustomSquadrons);
router.get('/:id', getCustomSquadronById);

export default router;