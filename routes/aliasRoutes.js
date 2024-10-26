import express from 'express';
import { getAliases } from '../controllers/aliasController.js';

const router = express.Router();

router.get('/', getAliases);

export default router;