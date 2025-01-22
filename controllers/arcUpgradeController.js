import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllArcUpgrades = async (req, res, next) => {
  console.log('Attempting to read arc-upgrades.json');
  const filePath = path.join(__dirname, '../public/converted-json/arc-upgrades/arc-upgrades.json');
  console.log('File path:', filePath);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read arc upgrades.json');
    const parsedData = JSON.parse(data);
    res.json(parsedData);
  } catch (err) {
    console.error('Error reading arc upgrades.json:', err);
    const error = new Error('Failed to read arc upgrades data');
    error.statusCode = 500;
    error.details = { filePath, originalError: err.message };
    next(error);
  }
};

export const getArcUpgradeById = async (req, res, next) => {
  const upgradeId = req.params.id;
  console.log(`Attempting to get arc upgrade with ID: ${upgradeId}`);
  const filePath = path.join(__dirname, `../public/converted-json/arc-upgrades/${upgradeId}.json`);
  console.log(`File path for arc upgrade ${upgradeId}: ${filePath}`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log(`Successfully read data for arc upgrade ${upgradeId}`);
    res.json(JSON.parse(data));
  } catch (err) {
    console.error(`Error reading arc ${upgradeId}.json:`, err);
    res.status(404).json({ message: 'Arc upgrade not found' });
  }
}; 