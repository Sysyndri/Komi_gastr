import { Router } from 'express';
import { eventController } from '../controllers/event.controller';
import { validate } from '../middleware/validate';
import { createEventSchema, eventQuerySchema, updateEventSchema } from '../schemas/event.schema';
import { idParamSchema } from '../schemas/dish.schema';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/admin';

/**
 * Маршруты мероприятий.
 */
export const eventsRouter = Router();

eventsRouter.get('/', validate(eventQuerySchema, 'query'), eventController.list);
eventsRouter.get('/:id', validate(idParamSchema, 'params'), eventController.getById);

eventsRouter.post('/', authenticate(), requireRoles(), validate(createEventSchema), eventController.create);
eventsRouter.put(
  '/:id',
  authenticate(),
  requireRoles(),
  validate(idParamSchema, 'params'),
  validate(updateEventSchema),
  eventController.update,
);
eventsRouter.delete('/:id', authenticate(), requireRoles(), validate(idParamSchema, 'params'), eventController.remove);
