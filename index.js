const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const shipRoutes = require('./routes/shipRoutes');
const squadronRoutes = require('./routes/squadronRoutes');
const upgradeRoutes = require('./routes/upgradeRoutes');
const errorHandler = require('./middleware/errorHandler');
const baseRoutes = require('./routes/baseRoutes');
const objectiveRoutes = require('./routes/objectiveRoutes');
const customshipRoutes = require('./routes/customshipRoutes');
const customsquadronRoutes = require('./routes/customsquadronRoutes');
const customupgradeRoutes = require('./routes/customupgradeRoutes');
const customobjectiveRoutes = require('./routes/customobjectiveRoutes');
const connectDB = require('./config/database');
require('dotenv').config();

// Connect to MongoDB
connectDB();
console.log('MongoDB connected successfully');

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

app.use('/custom/ships', customshipRoutes);
app.use('/custom/squadrons', customsquadronRoutes);
app.use('/custom/upgrades', customupgradeRoutes);
app.use('/custom/objectives', customobjectiveRoutes);

app.use(errorHandler);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;