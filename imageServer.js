import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 5000;

function findImage(dir, filename) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      const found = findImage(filePath, filename);
      if (found) return found;
    } else if (file === filename) {
      return filePath;
    }
  }
  return null;
}

app.use('/images/:filename', (req, res, next) => {
  const filename = req.params.filename;
  const imagesDir = path.join(__dirname, 'images');
  const imagePath = findImage(imagesDir, filename);

  if (imagePath) {
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(imagePath);
  } else {
    res.status(404).send('Image not found');
  }
});

app.get('/', (req, res) => {
  res.send('Image server is running');
});

app.listen(port, () => {
  console.log(`Image server listening at http://localhost:${port}`);
});
