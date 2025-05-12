import express from 'express';
import { getAllNexusSquadrons, getNexusSquadronById, searchNexusSquadrons } from '../controllers/nexusSquadronController.js';

const router = express.Router();

router.get('/', getAllNexusSquadrons);
router.get('/search', searchNexusSquadrons);
router.get('/:id', getNexusSquadronById);


export default router;
