import express from 'express';
import { getImageLinks } from '../controllers/imageLinksController.js';

const router = express.Router();

router.get('/', getImageLinks);

export default router;