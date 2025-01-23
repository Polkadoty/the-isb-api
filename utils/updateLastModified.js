import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const updateLastModified = async () => {
  const timestampFile = path.join(__dirname, '../lastModified.txt');
  const currentTime = new Date().toISOString();
  try {
    await fs.writeFile(timestampFile, currentTime);
    console.log('Last modified timestamp updated:', currentTime);
  } catch (error) {
    console.error('Error updating last modified timestamp:', error);
  }
};
