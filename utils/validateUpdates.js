import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function validateUpdateFile() {
  const filePath = path.join(__dirname, '../public/update.json');
  
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const updates = JSON.parse(data);
    
    // Validate structure
    if (typeof updates !== 'object' || updates === null) {
      throw new Error('Updates must be an object');
    }
    
    // Validate each entry
    for (const [oldName, newName] of Object.entries(updates)) {
      if (typeof oldName !== 'string' || typeof newName !== 'string') {
        throw new Error(`Invalid update entry: ${oldName} -> ${newName}`);
      }
      
      // Validate format (name followed by points in parentheses)
      const nameFormat = /^.+\s\(\d+\)$/;
      if (!nameFormat.test(oldName) || !nameFormat.test(newName)) {
        throw new Error(`Invalid name format: ${oldName} -> ${newName}`);
      }
    }
    
    console.log(`Update file validated successfully with ${Object.keys(updates).length} entries`);
    return true;
  } catch (error) {
    console.error('Update file validation failed:', error);
    return false;
  }
} 