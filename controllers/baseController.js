import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getLastModifiedTime = async () => {
  const timestampFile = path.join(__dirname, '../lastModified.txt');
  try {
    const timestamp = await Promise.race([
      fs.readFile(timestampFile, 'utf8'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);
    return new Date(timestamp);
  } catch (error) {
    console.error('Error reading last modified timestamp:', error);
    return new Date();
  }
};

export const getStatus = async (req, res) => {
  try {
    const lastModified = await getLastModifiedTime();
    res.json({
      status: 'API is running',
      version: '1.0.0',
      message: 'Welcome to the Armada List Builder API',
      lastModified: lastModified.toISOString()
    });
  } catch (error) {
    console.error('Error in getStatus:', error);
    res.status(500).json({
      status: 'Error',
      message: 'An error occurred while fetching API status'
    });
  }
};
