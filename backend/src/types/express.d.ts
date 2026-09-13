import { Role } from '@prisma/client';

// Расширение типов Express: авторизованный пользователь в req.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        name: string;
      };
    }
  }
}

export {};
