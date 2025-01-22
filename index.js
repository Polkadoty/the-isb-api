import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import shipRoutes from './routes/shipRoutes.js';
import squadronRoutes from './routes/squadronRoutes.js';
import upgradeRoutes from './routes/upgradeRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import baseRoutes from './routes/baseRoutes.js';
import objectiveRoutes from './routes/objectiveRoutes.js';
import legendsShipRoutes from './routes/legendsShipRoutes.js';
import legendsSquadronRoutes from './routes/legendsSquadronRoutes.js';
import legendsUpgradeRoutes from './routes/legendsUpgradeRoutes.js';
import legacyShipRoutes from './routes/legacyShipRoutes.js';
import legacySquadronRoutes from './routes/legacySquadronRoutes.js';
import legacyUpgradeRoutes from './routes/legacyUpgradeRoutes.js';
import oldLegacyShipRoutes from './routes/oldLegacyShipRoutes.js';
import oldLegacySquadronRoutes from './routes/oldLegacySquadronRoutes.js';
import oldLegacyUpgradeRoutes from './routes/oldLegacyUpgradeRoutes.js';
import aliasRoutes from './routes/aliasRoutes.js';
import imageLinksRoutes from './routes/imageLinksRoutes.js';
import arcRoutes from './routes/arcRoutes.js';
import errataKeysRoutes from './routes/errataKeysRoutes.js';
import expansionRoutes from './routes/expansionRoutes.js';
import releaseRoutes from './routes/releaseRoutes.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import amgRoutes from './routes/amgRoutes.js';
const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = [
  'https://test.swarmada.wiki',
  'https://legacy.swarmada.wiki',
  'https://builder.swarmada.wiki',
  'https://api.swarmada.wiki',
  'https://star-forge.tools',
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
app.use(helmet());
app.use(express.json());

// Image server configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesPath = path.join(__dirname, 'images');
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

// Your existing routes
app.use('/', baseRoutes);
app.use('/api/ships', shipRoutes);
app.use('/api/squadrons', squadronRoutes);
app.use('/api/upgrades', upgradeRoutes);
app.use('/api/objectives', objectiveRoutes);
app.use('/legends/ships', legendsShipRoutes);
app.use('/legends/squadrons', legendsSquadronRoutes);
app.use('/legends/upgrades', legendsUpgradeRoutes);
app.use('/legacy/ships', legacyShipRoutes);
app.use('/legacy/squadrons', legacySquadronRoutes);
app.use('/legacy/upgrades', legacyUpgradeRoutes);
app.use('/old-legacy/ships', oldLegacyShipRoutes);
app.use('/old-legacy/squadrons', oldLegacySquadronRoutes);
app.use('/old-legacy/upgrades', oldLegacyUpgradeRoutes);
app.use('/aliases', aliasRoutes);
app.use('/image-links', imageLinksRoutes);
app.use('/arc', arcRoutes);
app.use('/errata-keys', errataKeysRoutes);
app.use('/expansions', expansionRoutes);
app.use('/releases', releaseRoutes);
app.use('/amg', amgRoutes);

// Image server middleware
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
  maxAge: '2d',
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=172800, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
