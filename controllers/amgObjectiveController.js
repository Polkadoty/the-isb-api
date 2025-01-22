import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllAmgObjectives = async (req, res, next) => {
  console.log('Attempting to read amg-objectives.json');
  const filePath = path.join(__dirname, '../public/converted-json/amg-objectives/amg-objectives.json');
  console.log('File path:', filePath);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read amg objectives.json');
    const parsedData = JSON.parse(data);
    res.json(parsedData);
  } catch (err) {
    console.error('Error reading amg objectives.json:', err);
    const error = new Error('Failed to read amg objectives data');
    error.statusCode = 500;
    error.details = { filePath, originalError: err.message };
    next(error);
  }
};

export const getAmgObjectiveById = async (req, res, next) => {
  const objectiveId = req.params.id;
  console.log(`Attempting to get amg objective with ID: ${objectiveId}`);
  const filePath = path.join(__dirname, `../public/converted-json/amg-objectives/${objectiveId}.json`);
  console.log(`File path for amg objective ${objectiveId}: ${filePath}`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log(`Successfully read data for amg objective ${objectiveId}`);
    res.json(JSON.parse(data));
  } catch (err) {
    console.error(`Error reading amg ${objectiveId}.json:`, err);
    res.status(404).json({ message: 'Amg objective not found' });
  }
}; 