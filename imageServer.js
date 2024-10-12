import express from 'express';
import path from 'path';
const app = express();
const port = process.env.PORT || 5000;

app.use('/images', express.static(path.join(__dirname, 'images'), {
  maxAge: '7d',
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

app.get('/', (req, res) => {
  res.send('Image server is running');
});

app.listen(port, () => {
  console.log(`Image server listening at http://localhost:${port}`);
});