import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login } from './auth.controller.js';
import { validate } from '../../middlewares/validate.js';
import { registerSchema, loginSchema } from './auth.validation.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again in 15 minutes',
    errors: [],
  },
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);

export default router;
