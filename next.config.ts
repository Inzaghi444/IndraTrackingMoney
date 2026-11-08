import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Seluruh halaman aplikasi bergantung pada session pengguna (dinamis),
  // jadi prerendering statis tidak memberi manfaat dan justru memaksa
  // Suspense boundary di setiap route. Dimatikan secara eksplisit.
  cacheComponents: false,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
