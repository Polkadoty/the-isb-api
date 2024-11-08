import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

const imagesPath = path.join(__dirname, 'images');

// Cache to store file paths
const imageCache = new Map();

// Function to recursively scan and cache image file paths
function cacheImagePaths(dir) {
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
}

// Cache image paths on server start
console.log('Caching image paths...');
cacheImagePaths(imagesPath);
console.log(`Cached ${imageCache.size} image paths`);

// Add CORS configuration
const allowedOrigins = [
  'https://test.swarmada.wiki',
  'https://legacy.swarmada.wiki',
  'https://builder.swarmada.wiki',
  'https://api.swarmada.wiki',
  'http://localhost:3000',
  'http://localhost:5000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin matches our allowed domains
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'HEAD'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

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
  maxAge: '2d', // Cache for 2 days
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=172800, immutable'); // 2 days in seconds
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

app.get('/', (req, res) => {
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