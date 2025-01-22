import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllAmgUpgrades = async (req, res, next) => {
  console.log('Attempting to read amg-upgrades.json');
  const filePath = path.join(__dirname, '../public/converted-json/amg-upgrades/amg-upgrades.json');
  console.log('File path:', filePath);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read amg upgrades.json');
    const parsedData = JSON.parse(data);
    res.json(parsedData);
  } catch (err) {
    console.error('Error reading amg upgrades.json:', err);
    const error = new Error('Failed to read amg upgrades data');
    error.statusCode = 500;
    error.details = { filePath, originalError: err.message };
    next(error);
  }
};

export const getAmgUpgradeById = async (req, res, next) => {
  const upgradeId = req.params.id;
  console.log(`Attempting to get amg upgrade with ID: ${upgradeId}`);
  const filePath = path.join(__dirname, `../public/converted-json/amg-upgrades/${upgradeId}.json`);
  console.log(`File path for amg upgrade ${upgradeId}: ${filePath}`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log(`Successfully read data for amg upgrade ${upgradeId}`);
    res.json(JSON.parse(data));
  } catch (err) {
    console.error(`Error reading amg ${upgradeId}.json:`, err);
    res.status(404).json({ message: 'Amg upgrade not found' });
  }
}; 