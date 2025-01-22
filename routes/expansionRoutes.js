import express from 'express';
import { getExpansions } from '../controllers/expansionController.js';

const router = express.Router();

router.get('/', getExpansions);

export default router;