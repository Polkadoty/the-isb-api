import express from 'express';
import path from 'path';
const app = express();
const port = process.env.PORT || 5000;

app.use('/images', (req, res, next) => {
  console.log(`Attempting to serve image: ${req.url}`);
  next();
}, express.static(path.join(__dirname, 'images'), {
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
});
