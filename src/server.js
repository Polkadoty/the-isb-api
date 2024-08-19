require('dotenv').config();
const app = require('./app');
const connectDB = require('./utils/database');

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});