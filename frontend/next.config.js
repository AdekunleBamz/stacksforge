/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
    },
    images: {
        domains: ['assets.coingecko.com', 'images.unsplash.com'],
        formats: ['image/avif', 'image/webp'],
    },
    experimental: {
        optimizeCss: true,
    },
};

module.exports = nextConfig;
