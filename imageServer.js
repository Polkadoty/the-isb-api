import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

const imagesPath = path.join(__dirname, 'images');

// Check if images directory exists
if (!fs.existsSync(imagesPath)) {
  console.error(`Images directory not found: ${imagesPath}`);
}

app.use('/images', (req, res, next) => {
  const imagePath = path.join(imagesPath, req.url.replace('/images', ''));
  console.log(`Attempting to serve image: ${imagePath}`);
  
  if (fs.existsSync(imagePath)) {
    console.log(`Image found: ${imagePath}`);
  } else {
    console.error(`Image not found: ${imagePath}`);
  }
  
  next();
}, express.static(imagesPath, {
  maxAge: '7d',
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
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
