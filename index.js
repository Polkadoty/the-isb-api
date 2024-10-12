import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fetch from 'node-fetch';
import shipRoutes from './routes/shipRoutes.js';
import squadronRoutes from './routes/squadronRoutes.js';
import upgradeRoutes from './routes/upgradeRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import baseRoutes from './routes/baseRoutes.js';
import objectiveRoutes from './routes/objectiveRoutes.js';

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

export default app;
