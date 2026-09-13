import { Router } from 'express';
import { masterClassController } from '../controllers/masterclass.controller';
import { validate } from '../middleware/validate';
import {
  createMasterClassSchema,
  masterClassQuerySchema,
  updateMasterClassSchema,
} from '../schemas/masterclass.schema';
import { idParamSchema } from '../schemas/dish.schema';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/admin';

/**
 * Маршруты мастер-классов.
 */
export const masterClassesRouter = Router();

masterClassesRouter.get('/', validate(masterClassQuerySchema, 'query'), masterClassController.list);
masterClassesRouter.get('/:id', validate(idParamSchema, 'params'), masterClassController.getById);

masterClassesRouter.post('/', authenticate(), requireRoles(), validate(createMasterClassSchema), masterClassController.create);
masterClassesRouter.put(
  '/:id',
  authenticate(),
  requireRoles(),
  validate(idParamSchema, 'params'),
  validate(updateMasterClassSchema),
  masterClassController.update,
);
masterClassesRouter.delete(
  '/:id',
  authenticate(),
  requireRoles(),
  validate(idParamSchema, 'params'),
  masterClassController.remove,
);
