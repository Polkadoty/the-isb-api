import express from 'express';
import { getUpdates } from '../controllers/updateController.js';
import { validateUpdateFile } from '../utils/validateUpdates.js';

const router = express.Router();

// Get all updates
router.get('/', getUpdates);

// Check update file status
router.get('/status', async (req, res) => {
  const isValid = await validateUpdateFile();
  res.json({
    status: isValid ? 'valid' : 'invalid',
    timestamp: new Date().toISOString()
  });
});

export default router; 