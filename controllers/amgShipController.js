import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllAmgShips = async (req, res, next) => {
  console.log('Attempting to read amg-ships.json');
  const filePath = path.join(__dirname, '../public/converted-json/amg-ships/amg-ships.json');
  console.log('File path:', filePath);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read amg ships.json');
    const parsedData = JSON.parse(data);
    res.json(parsedData);
  } catch (err) {
    console.error('Error reading amg ships.json:', err);
    const error = new Error('Failed to read amg ships data');
    error.statusCode = 500;
    error.details = { filePath, originalError: err.message };
    next(error);
  }
};

export const getAmgShipById = async (req, res, next) => {
  const shipId = req.params.id;
  console.log(`Attempting to get amg ship with ID: ${shipId}`);
  const filePath = path.join(__dirname, `../public/converted-json/amg-ships/${shipId}.json`);
  console.log(`File path for amg ship ${shipId}: ${filePath}`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log(`Successfully read data for amg ship ${shipId}`);
    res.json(JSON.parse(data));
  } catch (err) {
    console.error(`Error reading amg ${shipId}.json:`, err);
    res.status(404).json({ message: 'Amg ship not found' });
  }
}; 