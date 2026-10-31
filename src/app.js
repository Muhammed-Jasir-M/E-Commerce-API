import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';

import env from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';

import authRoutes from './modules/auth/auth.routes.js';
import { userRoutes, adminUserRoutes } from './modules/users/user.routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import productRoutes from './modules/products/product.routes.js';
import orderRoutes from './modules/orders/order.routes.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));

app.use(
  cors({
    origin: env.CLIENT_URL === '*' ? '*' : [env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/health' || req.url === '/api/v1/health',
    },
  })
);

// General rate limiter: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again in 15 minutes',
    errors: [],
  },
});
app.use('/api/', generalLimiter);

const healthHandler = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'E-commerce REST API is healthy',
    data: {
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    },
  });
};
app.get('/health', healthHandler);
app.get('/api/v1/health', healthHandler);

const openapiSpec = JSON.parse(
  fs.readFileSync(new URL('./docs/openapi.json', import.meta.url), 'utf8')
);

app.get('/docs', (req, res) => res.json(openapiSpec));
app.get('/api/v1/docs', (req, res) => res.json(openapiSpec));

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'E-Commerce REST API is operational',
    data: {
      version: '1.0.0',
      documentation: '/api/v1/docs',
      availableModules: ['/api/v1/auth', '/api/v1/users', '/api/v1/admin/users', '/api/v1/categories', '/api/v1/products', '/api/v1/orders'],
    },
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin/users', adminUserRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
export { app };
