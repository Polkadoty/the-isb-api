import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAliases = async (req, res, next) => {
  console.log('Attempting to read aliases.json');
  const filePath = path.join(__dirname, '../public/aliases.json');
  console.log('File path:', filePath);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read aliases.json');
    const parsedData = JSON.parse(data);
    res.json(parsedData);
  } catch (err) {
    console.error('Error reading aliases.json:', err);
    const error = new Error('Failed to read aliases data');
    error.statusCode = 500;
    error.details = { filePath, originalError: err.message };
    next(error);
  }
};