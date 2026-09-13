import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { BookingService } from '../services/BookingService';

/**
 * BookingController — запись на мастер-классы/мероприятия и отмена.
 */
export const bookingController = {
  /** POST /api/bookings/masterclass/:id */
  bookMasterClass: asyncHandler(async (req: Request, res: Response) => {
    const data = await BookingService.bookMasterClass(req.user!.id, req.params.id);
    res.status(201).json({ success: true, data });
  }),

  /** POST /api/bookings/event/:id */
  bookEvent: asyncHandler(async (req: Request, res: Response) => {
    const data = await BookingService.bookEvent(req.user!.id, req.params.id);
    res.status(201).json({ success: true, data });
  }),

  /** DELETE /api/bookings/masterclass/:id */
  cancelBooking: asyncHandler(async (req: Request, res: Response) => {
    const data = await BookingService.cancelBooking(req.user!.id, req.params.id);
    res.json({ success: true, data });
  }),

  /** DELETE /api/bookings/event/:id */
  cancelEventBooking: asyncHandler(async (req: Request, res: Response) => {
    const data = await BookingService.cancelEventBooking(req.user!.id, req.params.id);
    res.json({ success: true, data });
  }),

  /** GET /api/bookings/my */
  myBookings: asyncHandler(async (req: Request, res: Response) => {
    const data = await BookingService.getMyBookings(req.user!.id);
    res.json({ success: true, data });
  }),
};
