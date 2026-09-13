import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { MasterClassService } from '../services/MasterClassService';

/**
 * MasterClassController — CRUD для мастер-классов.
 */
export const masterClassController = {
  /** GET /api/masterclasses */
  list: asyncHandler(async (req: Request, res: Response) => {
    const data = await MasterClassService.list(req.query as never);
    res.json({ success: true, data });
  }),

  /** GET /api/masterclasses/:id */
  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await MasterClassService.getById(req.params.id);
    res.json({ success: true, data });
  }),

  /** POST /api/masterclasses (admin) */
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await MasterClassService.create(req.body);
    res.status(201).json({ success: true, data });
  }),

  /** PUT /api/masterclasses/:id (admin) */
  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await MasterClassService.update(req.params.id, req.body);
    res.json({ success: true, data });
  }),

  /** DELETE /api/masterclasses/:id (admin) */
  remove: asyncHandler(async (req: Request, res: Response) => {
    await MasterClassService.remove(req.params.id);
    res.json({ success: true, data: { message: 'Мастер-класс удалён' } });
  }),
};
