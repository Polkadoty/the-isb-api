import express from 'express';
import { getAllLegendsSquadrons, getLegendsSquadronById, searchLegendsSquadrons } from '../controllers/legendsSquadronController.js';

const router = express.Router();

router.get('/', getAllLegendsSquadrons);
router.get('/search', searchLegendsSquadrons);
router.get('/:id', getLegendsSquadronById);


export default router;
