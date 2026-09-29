/** @type {import('next').NextConfig} */

// Разрешённые внешние источники изображений. Шаблона `**` намеренно нет:
// иначе оптимизатор Next.js можно использовать как прокси к произвольным
// хостам (в том числе внутрисетевым).
const remotePatterns = [
  { protocol: "https", hostname: "upload.wikimedia.org" },
  { protocol: "https", hostname: "en.wikipedia.org" },
  { protocol: "https", hostname: "core.renderweb.com" },
];

// Заголовки безопасности. CSP собрана так, чтобы не ломать Яндекс.Карты
// (скрипт api-maps.yandex.ru, чанки JS API с yastatic.net, тайлы с
// *.maps.yandex.net, стили и шрифты Яндекса) и React Hot Toast.
// В dev-режиме Next.js/webpack требует 'unsafe-eval' для HMR.
const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      // JS API 3.0: загрузчик с api-maps.yandex.ru, модули/чанки со
      // cdn api-maps.yandex.ru и yastatic.net (s3.mapsapi).
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://api-maps.yandex.ru https://yastatic.net`,
      "style-src 'self' 'unsafe-inline' https://api-maps.yandex.ru https://yastatic.net",
      "font-src 'self' data: https://yastatic.net",
      // Тайлы карт отдаются с *.maps.yandex.net (векторные/растровые рендереры),
      // спрайты и иконки — с *.yandex.ru и yastatic.net.
      "img-src 'self' data: blob: https://*.yandex.ru https://*.yandex.net https://*.ytimg.com https://upload.wikimedia.org https://en.wikipedia.org",
      // connect-src: загрузка модулей (ymaps3.import) и запросы рендерера тайлов.
      "connect-src 'self' https://api-maps.yandex.ru https://*.maps.yandex.net",
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  // В прод-сборке не раскрываем версии зависимостей в /_next/static
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
