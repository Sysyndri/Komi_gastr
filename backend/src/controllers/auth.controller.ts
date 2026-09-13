import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthService } from '../services/AuthService';

/**
 * AuthController — обработчики эндпоинтов аутентификации.
 */
export const authController = {
  /** POST /api/auth/register */
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    res.status(201).json({ success: true, data: result });
  }),

  /** POST /api/auth/login */
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json({ success: true, data: result });
  }),

  /** POST /api/auth/refresh */
  refresh: asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.refresh(req.body.refreshToken);
    res.json({ success: true, data: result });
  }),

  /** POST /api/auth/logout */
  logout: asyncHandler(async (req: Request, res: Response) => {
    await AuthService.logout(req.user!.id);
    res.json({ success: true, data: { message: 'Вы вышли из системы' } });
  }),

  /** GET /api/auth/me */
  me: asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: req.user });
  }),
};
