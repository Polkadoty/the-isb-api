import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import shipRoutes from './routes/shipRoutes.js';
import squadronRoutes from './routes/squadronRoutes.js';
import upgradeRoutes from './routes/upgradeRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import baseRoutes from './routes/baseRoutes.js';
import objectiveRoutes from './routes/objectiveRoutes.js';
//
import legendsShipRoutes from './routes/legendsShipRoutes.js';
import legendsSquadronRoutes from './routes/legendsSquadronRoutes.js';
import legendsUpgradeRoutes from './routes/legendsUpgradeRoutes.js';

import legacyShipRoutes from './routes/legacyShipRoutes.js';
import legacySquadronRoutes from './routes/legacySquadronRoutes.js';
import legacyUpgradeRoutes from './routes/legacyUpgradeRoutes.js';


const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Your existing routes
app.use('/', baseRoutes);
app.use('/api/ships', shipRoutes);
app.use('/api/squadrons', squadronRoutes);
app.use('/api/upgrades', upgradeRoutes);
app.use('/api/objectives', objectiveRoutes);
//
app.use('/legends/ships', legendsShipRoutes);
app.use('/legends/squadrons', legendsSquadronRoutes);
app.use('/legends/upgrades', legendsUpgradeRoutes);

// Legacy routes
app.use('/legacy/ships', legacyShipRoutes);
app.use('/legacy/squadrons', legacySquadronRoutes);
app.use('/legacy/upgrades', legacyUpgradeRoutes);


app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
