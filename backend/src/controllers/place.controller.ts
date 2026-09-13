import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { PlaceService } from '../services/PlaceService';

/**
 * PlaceController — CRUD для заведений.
 */
export const placeController = {
  /** GET /api/places */
  list: asyncHandler(async (req: Request, res: Response) => {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const data = await PlaceService.list(search);
    res.json({ success: true, data });
  }),

  /** GET /api/places/:id */
  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await PlaceService.getById(req.params.id);
    res.json({ success: true, data });
  }),

  /** POST /api/places (admin) */
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await PlaceService.create(req.body);
    res.status(201).json({ success: true, data });
  }),

  /** PUT /api/places/:id (admin) */
  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await PlaceService.update(req.params.id, req.body);
    res.json({ success: true, data });
  }),

  /** DELETE /api/places/:id (admin) */
  remove: asyncHandler(async (req: Request, res: Response) => {
    await PlaceService.remove(req.params.id);
    res.json({ success: true, data: { message: 'Заведение удалено' } });
  }),
};
