import express from 'express';
import { getAllLegacySquadrons, getLegacySquadronById, searchLegacySquadrons } from '../controllers/legacySquadronController.js';

const router = express.Router();

router.get('/', getAllLegacySquadrons);
router.get('/search', searchLegacySquadrons);
router.get('/:id', getLegacySquadronById);


export default router;
