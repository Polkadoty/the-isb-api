import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

const imagesPath = path.join(__dirname, 'images');
const jpegImagesPath = path.join(__dirname, 'jpeg-images');

// Cache to store file paths
const imageCache = new Map();
const jpegImageCache = new Map();

// Function to recursively scan and cache image file paths
function cacheImagePaths(dir, cache) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      cacheImagePaths(filePath, cache);
    } else if (file.endsWith('.webp') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      const relativePath = path.relative(dir === jpegImagesPath ? jpegImagesPath : imagesPath, filePath);
      cache.set(file, relativePath);
    }
  }
}

// Cache image paths on server start
console.log('Caching image paths...');
cacheImagePaths(imagesPath, imageCache);
cacheImagePaths(jpegImagesPath, jpegImageCache);
console.log(`Cached ${imageCache.size} WebP images and ${jpegImageCache.size} JPEG images`);

// Regular allowed origins
const allowedOrigins = [
  'https://test.swarmada.wiki',
  'https://legacy.swarmada.wiki',
  'https://builder.swarmada.wiki',
  'https://api.swarmada.wiki',
  'https://star-forge.tools',
  'http://localhost:3000',
  'http://localhost:5000'
];

// TTS-specific allowed origins
const ttsAllowedOrigins = [
  'http://localhost:39999', // TTS local testing
  'https://steamcommunity.com',
  'https://workshop.steamcommunity.com'
];

// Regular CORS middleware
const regularCors = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'HEAD'],
  credentials: true,
  maxAge: 86400
});

// TTS-specific CORS middleware
const ttsCors = cors({
  origin: (origin, callback) => {
    if (!origin || ttsAllowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET'],
  maxAge: 86400
});

// Optimize cache headers for Cloudflare
const cacheControl = (maxAge = '2d') => (req, res, next) => {
  if (process.env.NODE_ENV === 'development') return next();

  res.set({
    'Cache-Control': 'public, max-age=172800, immutable',
    'X-Content-Type-Options': 'nosniff',
    'Vary': 'Origin',
    // Add header to help debug Cloudflare caching
    'X-Cache-Status': 'Origin'
  });
  next();
};

// Basic security headers
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false // If you're having CSP issues
}));

// Optimize for Cloudflare
app.use((req, res, next) => {
  // Help debug cache status
  res.set('X-Origin-Server', process.env.HOSTNAME || 'origin');
  next();
});

// Regular WebP images route
app.use('/images', regularCors, cacheControl(), (req, res, next) => {
  const imageName = path.basename(req.url);
  const cachedPath = imageCache.get(imageName);
  
  if (cachedPath) {
    req.url = '/' + cachedPath;
  } else {
    console.error(`Image not found in cache: ${imageName}`);
  }
  
  next();
}, express.static(imagesPath, {
  maxAge: '2d',
  immutable: true,
  // Let Cloudflare handle compression
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=172800, immutable');
  }
}));

// TTS-specific JPEG images route
app.use('/jpeg-images', ttsCors, (req, res, next) => {
  const imageName = path.basename(req.url);
  const cachedPath = jpegImageCache.get(imageName);
  
  if (cachedPath) {
    console.log(`JPEG image found in cache: ${cachedPath}`);
    req.url = '/' + cachedPath;
  } else {
    console.error(`JPEG image not found in cache: ${imageName}`);
  }
  
  next();
}, express.static(jpegImagesPath, {
  maxAge: '2d',
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=172800, immutable');
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
  console.log(`Serving WebP images from: ${imagesPath}`);
  console.log(`Serving JPEG images from: ${jpegImagesPath}`);
});

export default app;