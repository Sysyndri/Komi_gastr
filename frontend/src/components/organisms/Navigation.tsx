'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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
 *
 * Адаптив: на десктопе (>= md) меню отображается строкой, на планшете и
 * телефоне прячется в «бургер». Панель мобильного меню рендерится только
 * при открытии — в DOM нет дублей ссылок (это важно и для e2e-тестов).
 */
export function Navigation() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Переход на другую страницу закрывает мобильное меню
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Escape закрывает меню
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      pathname === href || pathname.startsWith(`${href}/`)
        ? 'bg-primary-50 text-primary-700'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-base font-bold text-primary-700 sm:text-lg"
        >
          <span aria-hidden>🍲</span>
          <span className="truncate">Гастрономия Коми</span>
        </Link>

        {/* Десктоп и широкий планшет: меню строкой */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Основная навигация">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}

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
                className="max-w-[10rem] truncate rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
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

        {/* Телефон и планшет: вход + «бургер» */}
        <div className="flex shrink-0 items-center gap-2 md:hidden">
          {!isAuthenticated && (
            <Link href="/login">
              <Button variant="outline" size="sm">
                Войти
              </Button>
            </Link>
          )}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition hover:bg-gray-100"
            aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsMenuOpen((open) => !open)}
            data-testid="nav-toggle"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              {isMenuOpen ? (
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              ) : (
                <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Мобильная навигация"
          className="border-t border-gray-200 bg-white px-3 pb-4 pt-2 sm:px-4 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}

            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-lg px-3 py-2 text-sm font-medium text-nordic hover:bg-blue-50"
              >
                Админ-панель
              </Link>
            )}

            {isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="truncate rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  {user?.name ?? 'Профиль'}
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-primary-700 transition hover:bg-primary-50"
                >
                  Выйти
                </button>
              </>
            ) : (
              <Link href="/register">
                <Button variant="primary" size="sm" className="w-full">
                  Регистрация
                </Button>
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
