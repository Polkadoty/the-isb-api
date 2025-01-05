import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const inputFolder = process.argv[2];
if (!inputFolder) {
  console.error('Please provide input folder path.');
  process.exit(1);
}

const outputFolder = path.join(path.dirname(inputFolder), 'jpeg-' + path.basename(inputFolder));

// Create output folder if it doesn't exist
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

function processFile(filePath, relativePath) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(outputFolder, relativePath.replace(/\.webp$/, '.jpg'));
    const outputDir = path.dirname(outputPath);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Use sharp library directly instead of CLI
    sharp(filePath)
      .jpeg({ quality: 65 })
      .toFile(outputPath)
      .then(() => {
        console.log(`Converted ${filePath} to JPEG`);
        resolve();
      })
      .catch(error => {
        console.error(`Error processing ${filePath}:`, error);
        reject(error);
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
    } else if (file.toLowerCase().endsWith('.webp')) {
      promises.push(processFile(filePath, relativePath));
    } else {
      // Copy non-webp files directly
      const outputPath = path.join(outputFolder, relativePath);
      const outputDir = path.dirname(outputPath);
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.copyFileSync(filePath, outputPath);
      console.log(`Copied ${filePath}`);
    }
  }

  await Promise.all(promises);
}

// Main execution
(async () => {
  try {
    console.log('Starting WebP to JPEG conversion...');
    console.log(`Input folder: ${inputFolder}`);
    console.log(`Output folder: ${outputFolder}`);
    await processDirectory(inputFolder);
    console.log('Conversion complete.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
})(); 