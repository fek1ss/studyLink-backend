require('dotenv').config();

const app = require('./app');
const sequelize = require('./config/db');

const PORT = parseInt(process.env.PORT, 10) || 5000;

(async function start() {
  try {
    // Verify DB connection and sync models
    await sequelize.authenticate();
    // Sync without forcing by default. Change to { alter: true } or { force: true } if needed.
    await sequelize.sync();
    console.log('Database connection established and models synced.');

    const server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down server...');
      server.close(async () => {
        try {
          await sequelize.close();
          console.log('Database connection closed.');
        } catch (err) {
          console.error('Error closing database connection', err);
        }
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
