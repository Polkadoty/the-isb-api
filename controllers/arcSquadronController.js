import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllArcSquadrons = async (req, res, next) => {
  console.log('Attempting to read arc-squadrons.json');
  const filePath = path.join(__dirname, '../public/converted-json/arc-squadrons/arc-squadrons.json');
  console.log('File path:', filePath);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read arc squadrons.json');
    const parsedData = JSON.parse(data);
    res.json(parsedData);
  } catch (err) {
    console.error('Error reading arc squadrons.json:', err);
    const error = new Error('Failed to read arc squadrons data');
    error.statusCode = 500;
    error.details = { filePath, originalError: err.message };
    next(error);
  }
};

export const getArcSquadronById = async (req, res, next) => {
  const squadronId = req.params.id;
  console.log(`Attempting to get arc squadron with ID: ${squadronId}`);
  const filePath = path.join(__dirname, `../public/converted-json/arc-squadrons/${squadronId}.json`);
  console.log(`File path for arc squadron ${squadronId}: ${filePath}`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const squadronsData = JSON.parse(data);
    const squadron = squadronsData.squadrons[squadronId];
    if (squadron) {
      console.log(`Successfully read data for arc squadron ${squadronId}`);
      res.json(squadron);
    } else {
      res.status(404).json({ message: 'Arc squadron not found' });
    }
  } catch (err) {
    console.error(`Error reading arc squadrons.json:`, err);
    next(err);
  }
}; 