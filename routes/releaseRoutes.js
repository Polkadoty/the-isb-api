import express from 'express';
import { getReleases } from '../controllers/releaseController.js';

const router = express.Router();

router.get('/', getReleases);

export default router;