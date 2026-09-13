import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { DishService } from '../services/DishService';

/**
 * DishController — CRUD для блюд.
 */
export const dishController = {
  /** GET /api/dishes */
  list: asyncHandler(async (req: Request, res: Response) => {
    const data = await DishService.list(req.query as never);
    res.json({ success: true, data });
  }),

  /** GET /api/dishes/:id */
  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await DishService.getById(req.params.id);
    res.json({ success: true, data });
  }),

  /** POST /api/dishes (admin) */
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await DishService.create(req.body);
    res.status(201).json({ success: true, data });
  }),

  /** PUT /api/dishes/:id (admin) */
  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await DishService.update(req.params.id, req.body);
    res.json({ success: true, data });
  }),

  /** DELETE /api/dishes/:id (admin) */
  remove: asyncHandler(async (req: Request, res: Response) => {
    await DishService.remove(req.params.id);
    res.json({ success: true, data: { message: 'Блюдо удалено' } });
  }),
};
