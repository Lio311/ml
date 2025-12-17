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
};

export default nextConfig;
