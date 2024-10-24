import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

const imagesPath = path.join(__dirname, 'images');

// Cache to store file paths
const imageCache = new Map();

// Function to recursively scan and cache image file paths
function cacheImagePaths(dir) {
  imageCache.clear();  // Clear old cache
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      cacheImagePaths(filePath);
    } else if (file.endsWith('.webp') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      const relativePath = path.relative(imagesPath, filePath);
      imageCache.set(file, relativePath);
    }
  }
  console.log(`Cached ${imageCache.size} image paths`);
}

// Cache images on server start
cacheImagePaths(imagesPath);

app.use('/images', (req, res, next) => {
  const imageName = path.basename(req.url);
  const cachedPath = imageCache.get(imageName);

  if (cachedPath) {
    console.log(`Image found in cache: ${cachedPath}`);
    req.url = '/' + cachedPath;
  } else {
    console.error(`Image not found in cache: ${imageName}`);
  }

  next();
}, express.static(imagesPath, {
  maxAge: '1h',
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=3600, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// Endpoint to refresh the cache
app.get('/refresh-image-cache', (req, res) => {
  cacheImagePaths(imagesPath);
  res.send('Image cache refreshed');
});

app.get('/image-server-status', (req, res) => {
  res.send('Image server is running');
});

app.use((req, res, next) => {
  console.log(`404 - Not Found: ${req.method} ${req.url}`);
  res.status(404).send('Not Found');
});

app.listen(port, () => {
  console.log(`Image server listening at http://localhost:${port}`);
  console.log(`Serving images from: ${imagesPath}`);
});

export default app;
