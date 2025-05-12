import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const inputFolder = process.argv[2];
const outputFolder = process.argv[3];

if (!inputFolder || !outputFolder) {
  console.error('Please provide input and output folder paths.');
  process.exit(1);
}

// Create output folder if it doesn't exist
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

function processFile(filePath, relativePath) {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(outputFolder, path.dirname(relativePath));
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, `${path.parse(filePath).name}.webp`);
    const command = `squoosh-cli --webp '{"quality":75}' "${filePath}" -d "${outputDir}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error processing ${filePath}:`, error);
        reject(error);
      } else {
        console.log(`Converted ${filePath} to WebP at ${outputPath}`);
        resolve();
      }
    });
  });
}

async function processDirectory(dir, baseDir = inputFolder) {
  const files = fs.readdirSync(dir);
  const promises = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    const relativePath = path.relative(baseDir, filePath);

    if (stat.isDirectory()) {
      promises.push(processDirectory(filePath, baseDir));
    } else {
      promises.push(processFile(filePath, relativePath));
    }
  }

  await Promise.all(promises);
}

// Function to remove empty directories
function removeEmptyDirectories(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      removeEmptyDirectories(filePath);
      if (fs.readdirSync(filePath).length === 0) {
        fs.rmdirSync(filePath);
        console.log(`Removed empty directory: ${filePath}`);
      }
    }
  });
}

// Main execution
(async () => {
  try {
    console.log('Starting WebP conversion...');
    await processDirectory(inputFolder);
    console.log('WebP conversion complete.');

    console.log('Removing empty directories...');
    removeEmptyDirectories(outputFolder);
    console.log('Empty directories removal complete.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
})();
