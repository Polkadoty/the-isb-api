const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fetch = require('node-fetch');
const shipRoutes = require('./routes/shipRoutes');
const squadronRoutes = require('./routes/squadronRoutes');
const upgradeRoutes = require('./routes/upgradeRoutes');
const errorHandler = require('./middleware/errorHandler');
const baseRoutes = require('./routes/baseRoutes');
const objectiveRoutes = require('./routes/objectiveRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

const MAIN_API = 'https://api.swarmada.wiki';
const BACKUP_API = 'https://api-backup.swarmada.wiki';

app.use(cors());
app.use(helmet());
app.use(express.json());

// Load balancer middleware
const loadBalancer = async (req, res, next) => {
  try {
    const mainApiResponse = await fetch(`${MAIN_API}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });

    if (mainApiResponse.ok) {
      const data = await mainApiResponse.json();
      return res.json(data);
    }

    // If main API fails, try backup
    const backupApiResponse = await fetch(`${BACKUP_API}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });

    if (backupApiResponse.ok) {
      const data = await backupApiResponse.json();
      return res.json(data);
    }

    // If both fail, pass to the next middleware (which will be your routes)
    next();
  } catch (error) {
    console.error('Load balancer error:', error);
    next();
  }
};

// Apply load balancer to all routes
app.use(loadBalancer);

// Your existing routes
app.use('/', baseRoutes);
app.use('/api/ships', shipRoutes);
app.use('/api/squadrons', squadronRoutes);
app.use('/api/upgrades', upgradeRoutes);
app.use('/api/objectives', objectiveRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;