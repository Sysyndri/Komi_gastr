import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthService } from '../services/AuthService';
import { clearAccessTokenCookie, setAccessTokenCookie } from '../utils/authCookies';

/**
 * AuthController — обработчики эндпоинтов аутентификации.
 *
 * Вместе с JSON-ответом выставляется HttpOnly cookie с access-токеном: её
 * читает серверный middleware фронтенда, проверяя доступ к /profile и /admin.
 * Cookie ставит именно сервер — клиентский JavaScript не может её подделать.
 */
export const authController = {
  /** POST /api/auth/register */
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    setAccessTokenCookie(res, result.accessToken);
    res.status(201).json({ success: true, data: result });
  }),

  /** POST /api/auth/login */
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    setAccessTokenCookie(res, result.accessToken);
    res.json({ success: true, data: result });
  }),

  /** POST /api/auth/refresh */
  refresh: asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.refresh(req.body.refreshToken);
    // Обновляем cookie вместе с парой токенов, иначе серверный middleware
    // перестанет видеть активную сессию после истечения access-токена.
    setAccessTokenCookie(res, result.accessToken);
    res.json({ success: true, data: result });
  }),

  /** POST /api/auth/logout */
  logout: asyncHandler(async (req: Request, res: Response) => {
    await AuthService.logout(req.user!.id);
    clearAccessTokenCookie(res);
    res.json({ success: true, data: { message: 'Вы вышли из системы' } });
  }),

  /** GET /api/auth/me */
  me: asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: req.user });
  }),
};

