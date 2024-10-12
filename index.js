import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import shipRoutes from './routes/shipRoutes.js';
import squadronRoutes from './routes/squadronRoutes.js';
import upgradeRoutes from './routes/upgradeRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import baseRoutes from './routes/baseRoutes.js';
import objectiveRoutes from './routes/objectiveRoutes.js';
import loadBalancer from './middleware/loadBalancer.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Apply load balancer to all routes
app.use(loadBalancer);

// Add this new route before your other route definitions
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Your existing routes
app.use('/', baseRoutes);
app.use('/api/ships', shipRoutes);
app.use('/api/squadrons', squadronRoutes);
app.use('/api/upgrades', upgradeRoutes);
app.use('/api/objectives', objectiveRoutes);

app.use(errorHandler);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  checkApiHealth(MAIN_API).then(healthy => {
    useMainApi = healthy;
    console.log(`Initial health check: Using ${useMainApi ? 'Main' : 'Backup'} API.`);
  });
});

export default app;
