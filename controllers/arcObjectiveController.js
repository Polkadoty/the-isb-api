import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllArcObjectives = async (req, res, next) => {
  console.log('Attempting to read arc-objectives.json');
  const filePath = path.join(__dirname, '../public/converted-json/arc-objectives/arc-objectives.json');
  console.log('File path:', filePath);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read arc objectives.json');
    const parsedData = JSON.parse(data);
    res.json(parsedData);
  } catch (err) {
    console.error('Error reading arc objectives.json:', err);
    const error = new Error('Failed to read arc objectives data');
    error.statusCode = 500;
    error.details = { filePath, originalError: err.message };
    next(error);
  }
};

export const getArcObjectiveById = async (req, res, next) => {
  const objectiveId = req.params.id;
  console.log(`Attempting to get arc objective with ID: ${objectiveId}`);
  const filePath = path.join(__dirname, `../public/converted-json/arc-objectives/${objectiveId}.json`);
  console.log(`File path for arc objective ${objectiveId}: ${filePath}`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log(`Successfully read data for arc objective ${objectiveId}`);
    res.json(JSON.parse(data));
  } catch (err) {
    console.error(`Error reading arc ${objectiveId}.json:`, err);
    res.status(404).json({ message: 'Arc objective not found' });
  }
}; 