/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'fimgs.net',
      },
      {
        protocol: 'https',
        hostname: 'pimgs.net',
      },
      {
        protocol: 'https',
        hostname: 'www.fragrantica.com',
      },
      {
        protocol: 'https',
        hostname: 'www.cp-parfums.com',
      },
      {
        protocol: 'https',
        hostname: 'wp.logos-download.com',
      },
      {
        protocol: 'https',
        hostname: 'ipiccirilliperfumes.com',
      },
      {
        protocol: 'https',
        hostname: 'aromadilamore.com',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.ml-tlv.com https://*.clerk.services https://www.googletagmanager.com https://www.google-analytics.com https://*.clarity.ms https://browser.sentry-cdn.com https://*.sentry.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com; img-src 'self' data: blob: https://*.clerk.com https://clerk.ml-tlv.com https://*.clerk.accounts.dev https://images.unsplash.com https://fimgs.net https://pimgs.net https://www.fragrantica.com https://www.cp-parfums.com https://wp.logos-download.com https://ipiccirilliperfumes.com https://aromadilamore.com https://encrypted-tbn0.gstatic.com https://www.google-analytics.com https://*.clarity.ms https://*.sentry.io; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.clerk.accounts.dev https://clerk.ml-tlv.com https://*.clerk.services https://www.google-analytics.com https://*.clarity.ms https://*.sentry.io; frame-src 'self' https://*.clerk.accounts.dev https://clerk.ml-tlv.com https://*.clerk.services; object-src 'none'; base-uri 'self'; form-action 'self';"
          }
        ],
      },
    ];
  },
};

import { withSentryConfig } from "@sentry/nextjs";

export default withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: "ml-tv",
    project: "javascript-nextjs",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);
