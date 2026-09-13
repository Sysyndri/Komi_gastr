import { Router } from 'express';
import { searchController } from '../controllers/search.controller';

/**
 * Маршрут полнотекстового поиска.
 */
export const searchRouter = Router();

searchRouter.get('/', searchController.search);