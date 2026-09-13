import { Router } from 'express';
import { placeController } from '../controllers/place.controller';
import { validate } from '../middleware/validate';
import { createPlaceSchema, updatePlaceSchema } from '../schemas/place.schema';
import { idParamSchema } from '../schemas/dish.schema';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/admin';

/**
 * Маршруты заведений.
 */
export const placesRouter = Router();

placesRouter.get('/', placeController.list);
placesRouter.get('/:id', validate(idParamSchema, 'params'), placeController.getById);

placesRouter.post('/', authenticate(), requireRoles(), validate(createPlaceSchema), placeController.create);
placesRouter.put('/:id', authenticate(), requireRoles(), validate(idParamSchema, 'params'), validate(updatePlaceSchema), placeController.update);
placesRouter.delete('/:id', authenticate(), requireRoles(), validate(idParamSchema, 'params'), placeController.remove);
