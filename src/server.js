import env from './config/env.js';
import { logger } from './utils/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { seedInitialAdmin } from './utils/seedAdmin.js';
import { app } from './app.js';

let server = null;

async function gracefulShutdown(signal) {
  logger.info({ signal }, 'Shutting down server...');

  if (server) {
    server.close(async () => {
      await disconnectDatabase();
      logger.info('Graceful shutdown complete');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Shutdown timed out, forcing exit');
      process.exit(1);
    }, 10000).unref();
  } else {
    await disconnectDatabase();
    process.exit(0);
  }
}

async function startServer() {
  try {
    await connectDatabase(env.MONGODB_URI);
    await seedInitialAdmin();

    const port = process.env.PORT || env.PORT || 3000;

    server = app.listen(port, '0.0.0.0', () => {
      logger.info({ port, environment: env.NODE_ENV }, `Server running on port ${port}`);
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error({ err: reason }, 'Unhandled rejection');
    });

    process.on('uncaughtException', (err) => {
      logger.error({ err }, 'Uncaught exception');
      gracefulShutdown('uncaughtException');
    });
  } catch (err) {
    logger.fatal({ err: err.message }, 'Server failed to start');
    await disconnectDatabase();
    process.exit(1);
  }
}

startServer();
