import express from 'express';
import { getAllLegacyBetaSquadrons, getLegacyBetaSquadronById, searchLegacyBetaSquadrons } from '../controllers/legacyBetaSquadronController.js';

const router = express.Router();

router.get('/', getAllLegacyBetaSquadrons);
router.get('/search', searchLegacyBetaSquadrons);
router.get('/:id', getLegacyBetaSquadronById);

export default router; 