const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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

app.use('/', baseRoutes)

app.use('/api/ships', shipRoutes);
app.use('/api/squadrons', squadronRoutes);
app.use('/api/upgrades', upgradeRoutes);
app.use('/api/objectives', objectiveRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;