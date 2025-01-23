import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllAmgSquadrons = async (req, res, next) => {
  console.log('Attempting to read amg-squadrons.json');
  const filePath = path.join(__dirname, '../public/converted-json/amg-squadrons/amg-squadrons.json');
  console.log('File path:', filePath);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read amg squadrons.json');
    const parsedData = JSON.parse(data);
    res.json(parsedData);
  } catch (err) {
    console.error('Error reading amg squadrons.json:', err);
    const error = new Error('Failed to read amg squadrons data');
    error.statusCode = 500;
    error.details = { filePath, originalError: err.message };
    next(error);
  }
};

export const getAmgSquadronById = async (req, res, next) => {
  const squadronId = req.params.id;
  console.log(`Attempting to get amg squadron with ID: ${squadronId}`);
  const filePath = path.join(__dirname, `../public/converted-json/amg-squadrons/${squadronId}.json`);
  console.log(`File path for amg squadron ${squadronId}: ${filePath}`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const squadronsData = JSON.parse(data);
    const squadron = squadronsData.squadrons[squadronId];
    if (squadron) {
      console.log(`Successfully read data for amg squadron ${squadronId}`);
      res.json(squadron);
    } else {
      res.status(404).json({ message: 'Amg squadron not found' });
    }
  } catch (err) {
    console.error(`Error reading amg squadrons.json:`, err);
    next(err);
  }
}; 