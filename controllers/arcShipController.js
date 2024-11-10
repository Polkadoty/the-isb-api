import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllArcShips = async (req, res, next) => {
  console.log('Attempting to read arc-ships.json');
  const filePath = path.join(__dirname, '../public/converted-json/arc-ships/arc-ships.json');
  console.log('File path:', filePath);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read arc ships.json');
    const parsedData = JSON.parse(data);
    res.json(parsedData);
  } catch (err) {
    console.error('Error reading arc ships.json:', err);
    const error = new Error('Failed to read arc ships data');
    error.statusCode = 500;
    error.details = { filePath, originalError: err.message };
    next(error);
  }
};

export const getArcShipById = async (req, res, next) => {
  const shipId = req.params.id;
  console.log(`Attempting to get arc ship with ID: ${shipId}`);
  const filePath = path.join(__dirname, `../public/converted-json/arc-ships/${shipId}.json`);
  console.log(`File path for arc ship ${shipId}: ${filePath}`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log(`Successfully read data for arc ship ${shipId}`);
    res.json(JSON.parse(data));
  } catch (err) {
    console.error(`Error reading arc ${shipId}.json:`, err);
    res.status(404).json({ message: 'Arc ship not found' });
  }
}; 