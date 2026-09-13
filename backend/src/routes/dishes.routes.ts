import { Router } from 'express';
import { dishController } from '../controllers/dish.controller';
import { validate } from '../middleware/validate';
import { createDishSchema, dishQuerySchema, idParamSchema, updateDishSchema } from '../schemas/dish.schema';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/admin';

/**
 * Маршруты блюд.
 * Чтение — публично, изменения — только для ADMIN.
 */
export const dishesRouter = Router();

dishesRouter.get('/', validate(dishQuerySchema, 'query'), dishController.list);
dishesRouter.get('/:id', validate(idParamSchema, 'params'), dishController.getById);

dishesRouter.post('/', authenticate(), requireRoles(), validate(createDishSchema), dishController.create);
dishesRouter.put('/:id', authenticate(), requireRoles(), validate(idParamSchema, 'params'), validate(updateDishSchema), dishController.update);
dishesRouter.delete('/:id', authenticate(), requireRoles(), validate(idParamSchema, 'params'), dishController.remove);
