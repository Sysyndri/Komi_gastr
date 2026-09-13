import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Navigation } from '@/components/organisms/Navigation';

export const metadata: Metadata = {
  title: {
    default: 'Гастрономия Коми',
    template: '%s | Гастрономия Коми',
  },
  description:
    'Цифровая платформа национальной кухни Республики Коми: блюда, заведения, мастер-классы и мероприятия.',
};

/**
 * Корневой layout приложения.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navigation />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
            <footer className="border-t border-gray-200 bg-white py-4 text-center text-sm text-gray-500">
              © {new Date().getFullYear()} Гастрономия Коми — сохраняем вкус Республики Коми
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}