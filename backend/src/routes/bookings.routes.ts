import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { validate } from '../middleware/validate';
import { idParamSchema } from '../schemas/dish.schema';
import { authenticate } from '../middleware/auth';

/**
 * Маршруты бронирований (требуют авторизации).
 */
export const bookingsRouter = Router();

bookingsRouter.use(authenticate());

bookingsRouter.get('/my', bookingController.myBookings);
bookingsRouter.post('/masterclass/:id', validate(idParamSchema, 'params'), bookingController.bookMasterClass);
bookingsRouter.post('/event/:id', validate(idParamSchema, 'params'), bookingController.bookEvent);
bookingsRouter.delete('/masterclass/:id', validate(idParamSchema, 'params'), bookingController.cancelBooking);
bookingsRouter.delete('/event/:id', validate(idParamSchema, 'params'), bookingController.cancelEventBooking);