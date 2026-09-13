import { Router } from 'express';
import { statsController } from '../controllers/stats.controller';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/admin';

/**
 * Маршруты статистики (только для администраторов).
 */
export const statsRouter = Router();

statsRouter.use(authenticate(), requireRoles());

statsRouter.get('/', statsController.getStats);
statsRouter.get('/users', statsController.getUserStats);