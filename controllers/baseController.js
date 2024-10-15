import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getLastModifiedTime = async () => {
  const timestampFile = path.join(__dirname, '../lastModified.txt');
  console.log('Attempting to read timestamp file:', timestampFile);
  try {
    await fs.access(timestampFile);
    console.log('Timestamp file exists, attempting to read');
    
    const timestamp = await Promise.race([
      fs.readFile(timestampFile, 'utf8'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);
    console.log('Successfully read timestamp:', timestamp);
    const date = new Date(timestamp.trim());
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return date;
  } catch (error) {
    console.error('Error reading last modified timestamp:', error);
    return new Date();
  }
};

export const getStatus = async (req, res) => {
  console.log('getStatus function called');
  try {
    console.log('Attempting to get last modified time');
    const lastModified = await getLastModifiedTime();
    console.log('Last modified time:', lastModified);
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
