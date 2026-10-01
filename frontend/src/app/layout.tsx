import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Navigation } from '@/components/organisms/Navigation';

// Публичный адрес и подписи приходят из окружения сборки (см. .env.example):
// один и тот же код обслуживает и localhost, и сервер.
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || 'Гастрономия Коми';
const SITE_TAGLINE = process.env.NEXT_PUBLIC_SITE_TAGLINE?.trim();
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim();

/** Базовый адрес сайта для canonical/OG-ссылок; некорректное значение игнорируем. */
function siteBaseUrl(): URL | undefined {
  if (!SITE_URL) return undefined;
  try {
    return new URL(SITE_URL);
  } catch {
    return undefined;
  }
}

const baseUrl = siteBaseUrl();

export const metadata: Metadata = {
  ...(baseUrl ? { metadataBase: baseUrl } : {}),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    SITE_TAGLINE ||
    'Цифровая платформа национальной кухни Республики Коми: блюда, заведения, мастер-классы и мероприятия.',
  // Иконки: векторная (морошка) + растровые из public/
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

/** Цвет адресной строки на мобильных — фирменный зелёный. */
export const viewport: Viewport = {
  themeColor: '#1f6e46',
  width: 'device-width',
  initialScale: 1,
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
              © {new Date().getFullYear()} {SITE_NAME} — сохраняем вкус Республики Коми
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}