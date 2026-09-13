import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { EventService } from '../services/EventService';

/**
 * EventController — CRUD для мероприятий.
 */
export const eventController = {
  /** GET /api/events */
  list: asyncHandler(async (req: Request, res: Response) => {
    const data = await EventService.list(req.query as never);
    res.json({ success: true, data });
  }),

  /** GET /api/events/:id */
  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await EventService.getById(req.params.id);
    res.json({ success: true, data });
  }),

  /** POST /api/events (admin) */
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await EventService.create(req.body);
    res.status(201).json({ success: true, data });
  }),

  /** PUT /api/events/:id (admin) */
  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await EventService.update(req.params.id, req.body);
    res.json({ success: true, data });
  }),

  /** DELETE /api/events/:id (admin) */
  remove: asyncHandler(async (req: Request, res: Response) => {
    await EventService.remove(req.params.id);
    res.json({ success: true, data: { message: 'Мероприятие удалено' } });
  }),
};
