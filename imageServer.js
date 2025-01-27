import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import NodeCache from 'node-cache';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// Add this right after creating the Express app (after line 13)
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    url: req.url,
    path: req.path,
    headers: req.headers
  });
  next();
});

const imagesPath = path.join(__dirname, 'images');
const jpegImagesPath = path.join(__dirname, 'jpeg-images');

// Cache to store file paths
const imageCache = new Map();
const jpegImageCache = new Map();

const imageStatsCache = new NodeCache({ 
  stdTTL: 3600, // 1 hour
  checkperiod: 120 // Check for expired entries every 2 minutes
});

// Add before image serving middleware
const pendingRequests = new Map();

function coalesceRequests(key, operation) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  const promise = operation().finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  return promise;
}

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

// Add this near the start of your server, after directory definitions
if (!fs.existsSync(jpegImagesPath)) {
  console.error(`JPEG images directory does not exist: ${jpegImagesPath}`);
  fs.mkdirSync(jpegImagesPath, { recursive: true });
}

// After caching images
console.log('JPEG images directory contents:', fs.readdirSync(jpegImagesPath));

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
  'https://api.swarmada.wiki',
  'http://localhost:39999', // TTS local testing
  'https://steamcommunity.com',
  'https://workshop.steamcommunity.com',
  'http://localhost:3000',
  'https://star-forge.tools'
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
    'Cache-Control': 'public, max-age=172800, immutable, stale-while-revalidate=86400',
    'X-Content-Type-Options': 'nosniff',
    'Vary': 'Accept-Encoding, Origin',
    'Accept-Ranges': 'bytes',
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

const cloudflareHeaders = (req, res, next) => {
  // Help debug cache status
  res.set({
    'CF-Cache-Status': 'DYNAMIC',
    'CDN-Cache-Control': 'public, max-age=172800, immutable',
    'Cache-Tag': 'images,v1',
    'Surrogate-Control': 'max-age=172800',
    'Surrogate-Key': 'images'
  });
  next();
};



// Regular WebP images route
app.use('/images', regularCors, cloudflareHeaders, cacheControl(), (req, res, next) => {
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
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=172800, immutable, stale-while-revalidate=86400');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('CF-Cache-Status', 'DYNAMIC');
  }
}));

// TTS-specific JPEG images route
app.use('/jpeg-images', regularCors, cloudflareHeaders, cacheControl(), (req, res, next) => {
  const imageName = path.basename(req.url);
  const cachedPath = jpegImageCache.get(imageName);
  
  console.log('JPEG request received:', {
    imageName,
    cachedPath,
    fullUrl: req.url,
    method: req.method,
    headers: req.headers,
    jpegCacheSize: jpegImageCache.size,
    cacheContents: Array.from(jpegImageCache.keys())
  });
  
  if (cachedPath) {
    console.log(`JPEG image found in cache: ${cachedPath}`);
    req.url = '/' + cachedPath;
  } else {
    console.error(`JPEG image not found in cache: ${imageName}`);
    console.error('Available images:', Array.from(jpegImageCache.keys()));
    // Return 404 instead of continuing
    return res.status(404).json({
      error: 'Image not found',
      requestedImage: imageName,
      availableImages: Array.from(jpegImageCache.keys()),
      cacheSize: jpegImageCache.size
    });
  }
  
  next();
}, express.static(jpegImagesPath, {
  maxAge: '2d',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=172800, immutable, stale-while-revalidate=86400');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('CF-Cache-Status', 'DYNAMIC');
    res.setHeader('Content-Type', 'image/jpeg');
  }
}));

app.get('/', (req, res) => {
  res.send('Image server is running');
});

app.use((req, res, next) => {
  console.log(`404 - Not Found: ${req.method} ${req.url}`);
  res.status(404).send('Not Found');
});

app.use(compression({
  filter: (req, res) => {
    // Don't compress already compressed images
    if (req.path.match(/\.(webp|jpg|jpeg|png)$/)) return false;
    return compression.filter(req, res);
  },
  level: 6 // Balance between compression and CPU usage
}));

app.post('/purge-cache', async (req, res) => {
  if (req.headers['x-purge-key'] !== process.env.PURGE_KEY) {
    return res.status(403).json({ error: 'Invalid purge key' });
  }

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE_ID}/purge_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CF_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: [
          'https://api.swarmada.wiki/images/*',
          'https://api.swarmada.wiki/thumbnails/*'
        ]
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to purge cache' });
  }
});

app.listen(port, () => {
  console.log(`Image server listening at http://localhost:${port}`);
  console.log(`Serving WebP images from: ${imagesPath}`);
  console.log(`Serving JPEG images from: ${jpegImagesPath}`);
});

const used = process.memoryUsage();
setInterval(() => {
  console.log({
    rss: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
    external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`,
  });
}, 30000);

export default app;