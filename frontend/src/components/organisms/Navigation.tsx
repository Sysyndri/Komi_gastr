'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

const navLinks = [
  { href: '/', label: 'Главная' },
  { href: '/dishes', label: 'Блюда' },
  { href: '/masterclasses', label: 'Мастер-классы' },
  { href: '/events', label: 'Мероприятия' },
];

/**
 * Организм: шапка сайта с навигацией.
 */
export function Navigation() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary-700">
          <span aria-hidden>🍲</span>
          Гастрономия Коми
        </Link>

        <nav className="flex items-center gap-1" aria-label="Основная навигация">
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-nordic hover:bg-blue-50"
                >
                  Админ-панель
                </Link>
              )}
              <Link
                href="/profile"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                {user?.name ?? 'Профиль'}
              </Link>
              <Button variant="ghost" size="sm" onClick={() => void logout()}>
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Войти
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Регистрация
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}