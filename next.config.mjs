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
    ],
  },
};

export default nextConfig;
