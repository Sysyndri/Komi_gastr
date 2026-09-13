import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { prisma } from '../lib/prisma';
import { toCsv } from '../utils/csv';
import { BookingStatus, Role } from '@prisma/client';

/**
 * AdminController — админ-эндпоинты: пользователи, бронирования,
 * экспорт отчётов в CSV.
 */
export const adminController = {
  /** GET /api/admin/users?search=&role=&page= */
  listUsers: asyncHandler(async (req: Request, res: Response) => {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const role = typeof req.query.role === 'string' ? (req.query.role as Role) : undefined;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    const where = {
      ...(search
        ? { OR: [{ email: { contains: search, mode: 'insensitive' as const } }, { name: { contains: search, mode: 'insensitive' as const } }] }
        : {}),
      ...(role ? { role } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          isBlocked: true,
          createdAt: true,
          _count: { select: { bookings: true, eventBookings: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: { items, total, page, limit, pages: Math.ceil(total / limit) } });
  }),

  /** PATCH /api/admin/users/:id/role */
  updateUserRole: asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: req.body.role },
      select: { id: true, email: true, role: true },
    });
    res.json({ success: true, data: user });
  }),

  /** PATCH /api/admin/users/:id/block */
  toggleBlock: asyncHandler(async (req: Request, res: Response) => {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Пользователь не найден' } });
      return;
    }
    if (target.role === Role.ADMIN) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Нельзя заблокировать администратора' } });
      return;
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isBlocked: !target.isBlocked },
      select: { id: true, email: true, isBlocked: true },
    });
    res.json({ success: true, data: user });
  }),

  /** GET /api/admin/masterclasses/export — экспорт МК в CSV */
  exportMasterClasses: asyncHandler(async (_req: Request, res: Response) => {
    const items = await prisma.masterClass.findMany({
      include: { _count: { select: { bookings: { where: { status: BookingStatus.CONFIRMED } } } } },
      orderBy: { date: 'desc' },
    });
    const csv = toCsv(
      items.map((mc) => ({
        id: mc.id,
        title: mc.title,
        date: mc.date.toISOString(),
        durationMin: mc.durationMin,
        price: Number(mc.price),
        maxParticipants: mc.maxParticipants,
        bookings: mc._count.bookings,
        status: mc.status,
      })),
      [
        { header: 'ID', key: 'id' },
        { header: 'Название', key: 'title' },
        { header: 'Дата', key: 'date' },
        { header: 'Длительность (мин)', key: 'durationMin' },
        { header: 'Цена', key: 'price' },
        { header: 'Макс. участников', key: 'maxParticipants' },
        { header: 'Записей', key: 'bookings' },
        { header: 'Статус', key: 'status' },
      ],
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="masterclasses.csv"');
    res.send('\uFEFF' + csv);
  }),

  /** GET /api/admin/bookings/export — экспорт бронирований в CSV */
  exportBookings: asyncHandler(async (_req: Request, res: Response) => {
    const bookings = await prisma.booking.findMany({
      include: { user: { select: { name: true, email: true } }, masterClass: { select: { title: true, date: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const csv = toCsv(
      bookings.map((b) => ({
        user: b.user.name,
        email: b.user.email,
        masterclass: b.masterClass.title,
        date: b.masterClass.date.toISOString(),
        status: b.status,
      })),
      [
        { header: 'Пользователь', key: 'user' },
        { header: 'Email', key: 'email' },
        { header: 'Мастер-класс', key: 'masterclass' },
        { header: 'Дата МК', key: 'date' },
        { header: 'Статус', key: 'status' },
      ],
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings.csv"');
    res.send('\uFEFF' + csv);
  }),
};
