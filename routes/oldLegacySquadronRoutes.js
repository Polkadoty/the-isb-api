import express from 'express';
import { getAllOldLegacySquadrons, getOldLegacySquadronById, searchOldLegacySquadrons } from '../controllers/oldLegacySquadronController.js';

const router = express.Router();

router.get('/', getAllOldLegacySquadrons);
router.get('/search', searchOldLegacySquadrons);
router.get('/:id', getOldLegacySquadronById);


export default router;
