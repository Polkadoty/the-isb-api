import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getReleases = async (req, res, next) => {
    console.log('Attempting to read releases.json');
    const filePath = path.join(__dirname, '../public/releases.json');
    console.log('File path:', filePath);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      console.log('Successfully read releases.json');
      const parsedData = JSON.parse(data);
      res.json(parsedData);
    } catch (err) {
      console.error('Error reading releases.json:', err);
      const error = new Error('Failed to read releases data');
      error.statusCode = 500;
      error.details = { filePath, originalError: err.message };
      next(error);
    }
  };