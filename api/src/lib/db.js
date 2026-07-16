import mongoose from 'mongoose';
import { MONGODB_URI } from './config.js';
import { logger } from './logger.js';

mongoose
  .connect(MONGODB_URI)
  .then(() => logger.info(`Connected to MongoDB: ${MONGODB_URI}`))
  .catch((err) => {
    logger.error({ err }, 'Error connecting to MongoDB');
    process.exit(1);
  });
