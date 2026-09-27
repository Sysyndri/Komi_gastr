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
// (скрипт api-maps.yandex.ru, стили и шрифты Яндекса) и React Hot Toast.
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
      "script-src 'self' 'unsafe-inline' https://api-maps.yandex.ru https://core-renderer-tiles.maps.yandex.ru",
      "style-src 'self' 'unsafe-inline' https://api-maps.yandex.ru https://yastatic.net",
      "font-src 'self' data: https://yastatic.net",
      "img-src 'self' data: blob: https://*.yandex.ru https://*.ytimg.com https://upload.wikimedia.org https://en.wikipedia.org",
      "connect-src 'self' https://api-maps.yandex.ru https://core-renderer-tiles.maps.yandex.ru",
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
