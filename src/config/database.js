import mongoose from 'mongoose';
import env from './env.js';
import { logger } from '../utils/logger.js';

let memoryReplicaSet = null;

export async function connectDatabase(uri = env.MONGODB_URI) {
  mongoose.set('strictQuery', true);

  try {
    logger.info({ uri: uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') }, 'Connecting to MongoDB...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    logger.info('Connected to MongoDB successfully');
    return mongoose;
  } catch (initialError) {
    // In dev, fallback to in-memory replica set if local MongoDB is not running
    if (env.NODE_ENV !== 'production' && (uri.includes('127.0.0.1') || uri.includes('localhost'))) {
      logger.warn('Local MongoDB unavailable, starting in-memory replica set...');
      try {
        const { MongoMemoryReplSet, MongoMemoryServer } = await import('mongodb-memory-server');
        if (typeof MongoMemoryReplSet?.create === 'function') {
          memoryReplicaSet = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: 'wiredTiger' },
          });
        } else {
          memoryReplicaSet = await MongoMemoryServer.create();
        }
        const memoryUri = memoryReplicaSet.getUri();
        await mongoose.connect(memoryUri);
        logger.info('Connected to in-memory MongoDB with transaction support');
        return mongoose;
      } catch (memError) {
        logger.error({ err: memError }, 'Failed to start in-memory MongoDB');
        throw initialError;
      }
    }

    logger.error({ err: initialError.message }, 'Failed to connect to MongoDB');
    throw initialError;
  }
}

export async function disconnectDatabase() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('Mongoose disconnected');
    }
    if (memoryReplicaSet) {
      await memoryReplicaSet.stop();
      memoryReplicaSet = null;
      logger.info('In-memory MongoDB stopped');
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Error disconnecting from MongoDB');
  }
}

export default {
  connectDatabase,
  disconnectDatabase,
};
