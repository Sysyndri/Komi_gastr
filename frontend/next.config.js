/** @type {import('next').NextConfig} */

// Разрешённые внешние источники изображений. Шаблона `**` намеренно нет:
// иначе оптимизатор Next.js можно использовать как прокси к произвольным
// хостам (в том числе внутрисетевым).
const remotePatterns = [
  { protocol: "https", hostname: "upload.wikimedia.org" },
  { protocol: "https", hostname: "en.wikipedia.org" },
  { protocol: "https", hostname: "core.renderweb.com" },
];

// Заголовки безопасности собираются из публичных адресов, заданных при сборке
// (NEXT_PUBLIC_API_URL / NEXT_PUBLIC_SITE_URL): политика остаётся корректной и
// для локальной разработки, и для сервера.
const isDev = process.env.NODE_ENV !== "production";

/** Origin вида `http://host:port` из абсолютного URL; для относительного — null. */
function originOf(value) {
  if (!value) return null;
  if (value.startsWith("/")) return null; // API за тем же reverse-proxy
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

const SITE_ORIGIN = originOf(process.env.NEXT_PUBLIC_SITE_URL);
const API_ORIGIN = originOf(process.env.NEXT_PUBLIC_API_URL);

// HSTS имеет смысл только на HTTPS: на HTTP браузер его игнорирует. Прода
// доступен по http://85.192.20.218 (домена и сертификата нет), поэтому заголовок
// отдаём только когда сайт действительно https.
const isHttps = Boolean(SITE_ORIGIN?.startsWith("https://"));

// Хосты Яндекс.Карт (JS API 3.0): загрузчик и модули — api-maps.yandex.ru и
// yastatic.net, тайлы/рендерер — *.maps.yandex.net, тайлы и иконки — *.yandex.net.
const YMAPS_SCRIPTS = ["https://api-maps.yandex.ru", "https://yastatic.net"];
const YMAPS_CONNECT = [
  "https://api-maps.yandex.ru",
  "https://*.maps.yandex.net",
  "https://yastatic.net",
];
const YMAPS_IMG = [
  "https://*.yandex.ru",
  "https://*.yandex.net",
  "https://*.ytimg.com",
];

/**
 * CSP фронтенда.
 *
 * `upgrade-insecure-requests` намеренно НЕ добавляется: продакшен доступен по
 * http://85.192.20.218, и эта директива принудительно перевела бы все запросы
 * на https и сломала загрузку ресурсов. При появлении домена и TLS её нужно
 * включить вместе с HSTS.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  // App Router отдаёт инлайн-скрипты RSC-payload, Яндекс.Карты тоже требуют
  // инлайн-инициализации; 'unsafe-eval' нужен только webpack HMR в dev.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${YMAPS_SCRIPTS.join(" ")}`,
  `style-src 'self' 'unsafe-inline' ${YMAPS_SCRIPTS.join(" ")}`,
  "font-src 'self' data: https://yastatic.net",
  // img-src: локальные /images, оптимизатор Next (blob), тайлы и иконки Яндекса
  "img-src 'self' data: blob: " + YMAPS_IMG.join(" "),
  // connect-src: запросы к API (origin берётся из NEXT_PUBLIC_API_URL; при
  // относительном /api достаточно 'self') + модули и тайлы Яндекс.Карт
  "connect-src " +
    [
      "'self'",
      // HMR в dev ходит по WebSocket к dev-серверу
      ...(isDev ? ["ws://localhost:3000", "ws://127.0.0.1:3000"] : []),
      ...(API_ORIGIN ? [API_ORIGIN] : []),
      ...YMAPS_CONNECT,
    ].join(" "),
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: csp },
  ...(isHttps
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  // Минимальный production-образ: сервер собирается в .next/standalone
  output: "standalone",
  // Не раскрываем стек технологий (X-Powered-By: Next.js)
  poweredByHeader: false,
  // В прод-сборке не отдаём браузерные source maps
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
