require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/utils/database');

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});