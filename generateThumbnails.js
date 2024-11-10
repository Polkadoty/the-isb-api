import sharp from 'sharp';
import { encode } from 'blurhash';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Update these paths to match your directory structure
const imagesDir = path.join(__dirname, 'images');
const thumbnailsDir = path.join(__dirname, 'thumbnails');

// Function to load image data for blurhash
async function loadImageData(imagePath) {
  try {
    // Resize to 32x32 and get raw pixel data
    const { data, info } = await sharp(imagePath)
      .resize(32, 32, { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return {
      data: new Uint8ClampedArray(data),
      width: info.width,
      height: info.height
    };
  } catch (err) {
    console.error(`Error loading image data for ${imagePath}:`, err);
    throw err;
  }
}

async function generateBlurhash(imagePath) {
  try {
    const imageData = await loadImageData(imagePath);
    return encode(
      imageData.data,
      imageData.width,
      imageData.height,
      4,  // x components
      3   // y components
    );
  } catch (err) {
    console.error(`Error generating blurhash for ${imagePath}:`, err);
    return null;
  }
}

async function processImage(sourcePath, targetPath) {
  // Create thumbnail directory if it doesn't exist
  const thumbnailDir = path.dirname(targetPath);
  if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true });
  }

  try {
    // Generate blurhash
    const blurhash = await generateBlurhash(sourcePath);

    // Generate tiny thumbnail
    await sharp(sourcePath)
      .resize(20, 20, { fit: 'inside' })
      .webp({ quality: 20 })
      .toFile(targetPath);

    return blurhash;
  } catch (err) {
    console.error(`Error processing image ${sourcePath}:`, err);
    return null;
  }
}

async function processDirectory(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory does not exist: ${sourceDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(sourceDir);
  const blurhashes = {};

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      const nestedBlurhashes = await processDirectory(
        sourcePath,
        path.join(targetDir, file)
      );
      Object.assign(blurhashes, nestedBlurhashes);
    } else if (file.endsWith('.webp')) {
      const targetPath = path.join(targetDir, file);
      const key = path.parse(file).name;
      console.log(`Processing: ${file}`);
      blurhashes[key] = await processImage(sourcePath, targetPath);
    }
  }

  return blurhashes;
}

async function generateImageLinks() {
  let images = {};

  // Process all images and generate blurhashes
  console.log('Processing images from:', imagesDir);
  const blurhashes = await processDirectory(imagesDir, thumbnailsDir);

  // Reference the existing directories structure
  const directories = {
    ships: path.join(__dirname, 'public/converted-json/ships'),
    squadrons: path.join(__dirname, 'public/converted-json/squadrons'),
    upgrades: path.join(__dirname, 'public/converted-json/upgrades'),
    objectives: path.join(__dirname, 'public/converted-json/objectives'),
    'legends-ships': path.join(__dirname, 'public/converted-json/legends-ships'),
    'legends-squadrons': path.join(__dirname, 'public/converted-json/legends-squadrons'),
    'legends-upgrades': path.join(__dirname, 'public/converted-json/legends-upgrades'),
    'legacy-ships': path.join(__dirname, 'public/converted-json/legacy-ships'),
    'legacy-squadrons': path.join(__dirname, 'public/converted-json/legacy-squadrons'),
    'legacy-upgrades': path.join(__dirname, 'public/converted-json/legacy-upgrades'),
    'old-legacy-ships': path.join(__dirname, 'public/converted-json/old-legacy-ships'),
    'old-legacy-squadrons': path.join(__dirname, 'public/converted-json/old-legacy-squadrons'),
    'old-legacy-upgrades': path.join(__dirname, 'public/converted-json/old-legacy-upgrades'),
    'arc-upgrades': path.join(__dirname, 'public/converted-json/arc-upgrades'),
    'arc-ships': path.join(__dirname, 'public/converted-json/arc-ships'),
    'arc-squadrons': path.join(__dirname, 'public/converted-json/arc-squadrons'),
    'arc-objectives': path.join(__dirname, 'public/converted-json/arc-objectives')
  };

  Object.entries(directories).forEach(([dirKey, dirPath]) => {
    const jsonFileName = `${dirKey}.json`;
    const filePath = path.join(dirPath, jsonFileName);
    
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const topLevelKey = Object.keys(data)[0];

      Object.entries(data[topLevelKey]).forEach(([itemKey, itemData]) => {
        if (topLevelKey === 'ships') {
          Object.entries(itemData.models).forEach(([modelKey]) => {
            images[modelKey] = {
              fullsize: `https://api.swarmada.wiki/images/${modelKey}.webp`,
              thumbnail: `https://api.swarmada.wiki/thumbnails/${modelKey}.webp`,
              blurhash: blurhashes[modelKey] || null,
              baseToken: `https://api.swarmada.wiki/images/${modelKey}-base.webp`
            };
          });
        } else {
          images[itemKey] = {
            fullsize: `https://api.swarmada.wiki/images/${itemKey}.webp`,
            thumbnail: `https://api.swarmada.wiki/thumbnails/${itemKey}.webp`,
            blurhash: blurhashes[itemKey] || null,
            baseToken: `https://api.swarmada.wiki/images/${itemKey}-base.webp`
          };
        }
      });
    } catch (err) {
      console.error(`Error reading ${jsonFileName}:`, err);
    }
  });

  fs.writeFileSync(
    path.join(__dirname, 'public/images.json'), 
    JSON.stringify(images, null, 2)
  );

  console.log('Generated images.json with blurhashes');
}

generateImageLinks();