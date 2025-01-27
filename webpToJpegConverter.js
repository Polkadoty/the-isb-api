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

    // Pipeline for extreme compression
    sharp(filePath)
      // First pass: reduce noise and prepare for compression
      .median(3) // Remove noise
      .resize({
        width: 500,  // Further reduced dimensions
        height: 700,
        fit: 'inside',
        withoutEnlargement: true,
        kernel: 'lanczos3' // Better quality downscaling
      })
      // Reduce color palette
      .gamma(1.1) // Slightly brighten midtones
      .modulate({
        saturation: 0.9 // Slightly reduce saturation
      })
      // Enhanced sharpening for perceived quality
      .sharpen({
        sigma: 1.2,
        m1: 0.5,
        m2: 0.7,
        x1: 2,
        y2: 10,
        y3: 20
      })
      // Extreme JPEG compression with mozjpeg
      .jpeg({
        quality: 15,  // Even more aggressive quality reduction
        mozjpeg: true,
        chromaSubsampling: '4:2:0',
        trellisQuantisation: true,
        overshootDeringing: true,
        optimizeScans: true,
        optimizeCoding: true,
        quantisationTable: 5, // Most aggressive quantisation
        force: true
      })
      .toFile(outputPath)
      .then(() => {
        console.log(`Converted ${filePath} to low-res JPEG`);
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