import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getUpdates = async (req, res, next) => {
  console.log('Attempting to read update.json');
  const filePath = path.join(__dirname, '../public/update.json');
  console.log('File path:', filePath);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read update.json');
    const parsedData = JSON.parse(data);
    
    // Validate the update data structure
    if (typeof parsedData !== 'object') {
      throw new Error('Invalid update data format');
    }

    // Log the number of updates available
    console.log(`Loaded ${Object.keys(parsedData).length} card updates`);
    
    res.json(parsedData);
  } catch (err) {
    console.error('Error reading update.json:', err);
    const error = new Error('Failed to read update data');
    error.statusCode = 500;
    error.details = { 
      filePath, 
      originalError: err.message,
      type: err.name 
    };
    next(error);
  }
};