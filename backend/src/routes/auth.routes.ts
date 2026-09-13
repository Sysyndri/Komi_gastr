import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { loginSchema, refreshSchema, registerSchema } from '../schemas/auth.schema';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

/**
 * Маршруты аутентификации.
 */
export const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema), authController.register);
authRouter.post('/login', authLimiter, validate(loginSchema), authController.login);
authRouter.post('/refresh', validate(refreshSchema), authController.refresh);
authRouter.post('/logout', authenticate(), authController.logout);
authRouter.get('/me', authenticate(), authController.me);
