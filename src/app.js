const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const shipRoutes = require('./routes/shipRoutes');
const squadronRoutes = require('./routes/squadronRoutes');
const upgradeRoutes = require('./routes/upgradeRoutes');
const indexRoutes = require('./routes/indexRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/', indexRoutes);
app.use('/api/ships', shipRoutes);
app.use('/api/squadrons', squadronRoutes);
app.use('/api/upgrades', upgradeRoutes);

app.use(errorHandler);

module.exports = app;