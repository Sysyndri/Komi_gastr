'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/admin', label: 'Дашборд', icon: '📊' },
  { href: '/admin/masterclasses', label: 'Мастер-классы', icon: '👨‍🍳' },
  { href: '/admin/events', label: 'Мероприятия', icon: '🎉' },
  { href: '/admin/dishes', label: 'Блюда', icon: '🥘' },
  { href: '/admin/users', label: 'Пользователи', icon: '👥' },
];

/**
 * Организм: меню админ-панели.
 *
 * Адаптив: на телефоне и планшете — горизонтальная прокручиваемая строка
 * вкладок, на широких экранах (>= lg) — привычный вертикальный сайдбар.
 */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="shrink-0 border-b border-gray-200 bg-gray-50 p-3 lg:w-56 lg:border-b-0 lg:border-r lg:p-4"
      data-testid="admin-sidebar"
    >
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400 lg:mb-4">
        Администрирование
      </p>
      <nav
        className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0 lg:space-y-1 lg:overflow-visible lg:pb-0"
        aria-label="Меню администратора"
      >
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}