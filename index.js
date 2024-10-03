const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const shipRoutes = require('./routes/shipRoutes');
const squadronRoutes = require('./routes/squadronRoutes');
const upgradeRoutes = require('./routes/upgradeRoutes');
const errorHandler = require('./middleware/errorHandler');
const baseRoutes = require('./routes/baseRoutes');


const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/', baseRoutes)

app.use('/ships', shipRoutes);
app.use('/squadrons', squadronRoutes);
app.use('/upgrades', upgradeRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;