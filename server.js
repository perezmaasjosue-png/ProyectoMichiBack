require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(() => {
    process.exit(1);
  });