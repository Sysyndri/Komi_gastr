import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { SearchService } from '../services/SearchService';

/**
 * SearchController — полнотекстовый поиск.
 */
export const searchController = {
  /** GET /api/search?q=... */
  search: asyncHandler(async (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const data = await SearchService.search(q, limit);
    res.json({ success: true, data });
  }),
};
