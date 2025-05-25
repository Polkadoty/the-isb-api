import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

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

async function processFile(filePath, relativePath) {
  const outputDir = path.join(outputFolder, path.dirname(relativePath));
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, `${path.parse(filePath).name}.webp`);

  try {
    await sharp(filePath)
      .webp({ quality: 75 })
      .toFile(outputPath);
    console.log(`Converted ${filePath} to WebP at ${outputPath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function processDirectory(dir, baseDir = inputFolder) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    const relativePath = path.relative(baseDir, filePath);

    if (stat.isDirectory()) {
      await processDirectory(filePath, baseDir);
    } else {
      await processFile(filePath, relativePath);
    }
  }
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