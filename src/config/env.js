import dotenv from 'dotenv';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/ecommerce'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  ADMIN_EMAIL: z.string().email().optional().default('admin@ecommerce.example.com'),
  ADMIN_PASSWORD: z.string().min(8).optional().default('AdminPassword123!'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error({ errors: parsed.error.format() }, 'Invalid environment variables');
  throw new Error(`Environment validation failed: ${JSON.stringify(parsed.error.format())}`);
}

const env = parsed.data;

const INSECURE_DEFAULT_SECRETS = [
  'replace_with_a_strong_random_secret',
  'secret',
  'jwt_secret',
  'changeme',
];

if (env.NODE_ENV === 'production') {
  if (INSECURE_DEFAULT_SECRETS.includes(env.JWT_SECRET.toLowerCase())) {
    throw new Error('Insecure JWT_SECRET specified in production environment');
  }
  if (env.JWT_SECRET.length < 32) {
    throw new Error('Production JWT_SECRET must be at least 32 characters long');
  }
}

export default env;
export { env };
