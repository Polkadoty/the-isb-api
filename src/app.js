const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const shipRoutes = require('./routes/ships');
const upgradeCardRoutes = require('./routes/upgradeCards');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api/ships', shipRoutes);
app.use('/api/upgrade-cards', upgradeCardRoutes);

app.use(errorHandler);

module.exports = app;