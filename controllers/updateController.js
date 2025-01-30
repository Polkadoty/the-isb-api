import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAliases = async (req, res, next) => {
  console.log('Attempting to read update.json');
  const filePath = path.join(__dirname, '../public/update.json');
  console.log('File path:', filePath);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read update.json');
    const parsedData = JSON.parse(data);
    res.json(parsedData);
  } catch (err) {
    console.error('Error reading update.json:', err);
    const error = new Error('Failed to read update data');
    error.statusCode = 500;
    error.details = { filePath, originalError: err.message };
    next(error);
  }
};