import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { StatsService } from '../services/StatsService';

/**
 * StatsController — статистика для дашборда.
 */
export const statsController = {
  /** GET /api/stats */
  getStats: asyncHandler(async (req: Request, res: Response) => {
    const from = typeof req.query.from === 'string' ? new Date(req.query.from) : undefined;
    const to = typeof req.query.to === 'string' ? new Date(req.query.to) : undefined;
    const data = await StatsService.getStats(from, to);
    res.json({ success: true, data });
  }),

  /** GET /api/stats/users */
  getUserStats: asyncHandler(async (_req: Request, res: Response) => {
    const data = await StatsService.getUserStats();
    res.json({ success: true, data });
  }),
};
