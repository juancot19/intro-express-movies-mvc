import 'dotenv/config';
import express from 'express';
import pinoHttp from 'pino-http';
import { logger } from './lib/logger.js';
import './lib/db.js';
import router from './controllers/index.js';
import { errors } from './middlewares/index.js';

const app = express();

app.use(pinoHttp({ logger }));
app.use(express.json());

app.use(router);

app.use(errors.notFound);
app.use(errors.globalHandler);

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT ?? 3000;
  app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
}

export default app;
