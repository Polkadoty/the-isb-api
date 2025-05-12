import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllNexusSquadrons = async (req, res, next) => {
  console.log('Attempting to read nexus squadrons.json');
  const filePath = path.join(__dirname, '../public/converted-json/nexus-squadrons/nexus-squadrons.json');
  console.log('File path:', filePath);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read nexus squadrons.json');
    const parsedData = JSON.parse(data);
    res.json(parsedData);
  } catch (err) {
    console.error('Error reading nexus squadrons.json:', err);
    const error = new Error('Failed to read nexus squadrons data');
    error.statusCode = 500;
    error.details = { filePath, originalError: err.message };
    next(error);
  }
};

export const getNexusSquadronById = async (req, res, next) => {
  const squadronId = req.params.id;
  console.log(`Attempting to get nexus squadron with ID: ${squadronId}`);
  const filePath = path.join(__dirname, `../public/converted-json/nexus-squadrons/${squadronId}.json`);
  console.log(`File path for nexus squadron ${squadronId}: ${filePath}`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const squadronsData = JSON.parse(data);
    const squadron = squadronsData.squadrons[squadronId];
    if (squadron) {
      console.log(`Successfully read data for nexus squadron ${squadronId}`);
      res.json(squadron);
    } else {
      res.status(404).json({ message: 'Nexus squadron not found' });
    }
  } catch (err) {
    console.error(`Error reading nexus squadrons.json:`, err);
    next(err);
  }
};

export const searchNexusSquadrons = async (req, res, next) => {
  const filePath = path.join(__dirname, '../public/converted-json/nexus-squadrons/nexus-squadrons.json');
  console.log('Attempting to read nexus squadrons.json for search');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read nexus squadrons.json for search');
    let squadronsData = JSON.parse(data);
    const filters = req.query;
    console.log('Applying filters:', filters);

    const compareValues = (value, filterValue, operator = '=') => {
      // Implementation remains the same as in squadronController.js
      // Lines 45-68 from squadronController.js
    };

    const getNestedValue = (obj, path) => {
      // Implementation remains the same as in squadronController.js
      // Lines 70-81 from squadronController.js
    };

    const filterSquadron = (squadron, filters) => {
      // Implementation remains the same as in squadronController.js
      // Lines 83-106 from squadronController.js
    };

    let filteredSquadrons = {};
    for (let squadronName in squadronsData.squadrons) {
      let squadron = squadronsData.squadrons[squadronName];
      if (filterSquadron(squadron, filters)) {
        filteredSquadrons[squadronName] = squadron;
      }
    }

    console.log(`Returning ${Object.keys(filteredSquadrons).length} nexus squadrons after applying filters`);
    res.json({ squadrons: filteredSquadrons });
  } catch (err) {
    console.error('Error reading nexus squadrons.json:', err);
    next(err);
  }
};