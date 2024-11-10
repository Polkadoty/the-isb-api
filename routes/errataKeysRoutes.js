import express from 'express';
import { getAllErrataKeys } from '../controllers/errataKeysController.js';

const router = express.Router();

router.get('/', getAllErrataKeys);

export default router; 