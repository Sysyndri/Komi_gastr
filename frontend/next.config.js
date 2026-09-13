/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  async rewrites() {
    // В dev-режиме проксируем API-запросы на backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl?.startsWith('http://') || apiUrl?.startsWith('https://')) {
      return [];
    }
    return [];
  },
};

module.exports = nextConfig;