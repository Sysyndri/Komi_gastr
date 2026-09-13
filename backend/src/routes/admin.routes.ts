import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { validate } from '../middleware/validate';
import { idParamSchema } from '../schemas/dish.schema';
import { roleSchema } from '../schemas/auth.schema';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/admin';

/**
 * Админ-маршруты: всё доступно только с ролью ADMIN.
 */
export const adminRouter = Router();

adminRouter.use(authenticate(), requireRoles());

adminRouter.get('/users', adminController.listUsers);
adminRouter.patch('/users/:id/role', validate(idParamSchema, 'params'), validate(roleSchema), adminController.updateUserRole);
adminRouter.patch('/users/:id/block', validate(idParamSchema, 'params'), adminController.toggleBlock);

adminRouter.get('/masterclasses/export', adminController.exportMasterClasses);
adminRouter.get('/bookings/export', adminController.exportBookings);