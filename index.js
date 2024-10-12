const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const shipRoutes = require('./routes/shipRoutes');
const squadronRoutes = require('./routes/squadronRoutes');
const upgradeRoutes = require('./routes/upgradeRoutes');
const errorHandler = require('./middleware/errorHandler');
const baseRoutes = require('./routes/baseRoutes');
const objectiveRoutes = require('./routes/objectiveRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/', baseRoutes);

app.use('/api/ships', shipRoutes);
app.use('/api/squadrons', squadronRoutes);
app.use('/api/upgrades', upgradeRoutes);
app.use('/api/objectives', objectiveRoutes);

// Add this new route for serving images
app.use('/images', express.static(path.join(__dirname, 'images'), {
  maxAge: '7d',
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
