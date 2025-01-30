import express from 'express';
import { getAliases } from '../controllers/updateController.js';

const router = express.Router();

router.get('/update', getAliases);

export default router; 