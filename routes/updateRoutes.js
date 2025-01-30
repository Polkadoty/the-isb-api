import express from 'express';
import { getUpdates } from '../controllers/updateController.js';

const router = express.Router();

router.get('/', getUpdates);

export default router; 