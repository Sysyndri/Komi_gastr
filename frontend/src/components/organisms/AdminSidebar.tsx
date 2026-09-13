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
 * Организм: боковое меню админ-панели.
 */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-gray-50 p-4" data-testid="admin-sidebar">
      <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Администрирование
      </p>
      <nav className="space-y-1" aria-label="Меню администратора">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
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