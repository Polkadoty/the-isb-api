import express from 'express';
import { getAllObjectives, searchObjectives, getObjectiveById } from '../controllers/objectiveController.js';

const router = express.Router();

router.get('/', getAllObjectives);
router.get('/search', searchObjectives);
router.get('/:id', getObjectiveById);

export default router;
