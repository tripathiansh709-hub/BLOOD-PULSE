/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Make sure the seeded SQLite file and Prisma engine are bundled into the serverless functions.
    outputFileTracingIncludes: {
      '/api/**/*': ['./prisma/seed.db', './node_modules/.prisma/client/**/*'],
    },
  },
};

export default nextConfig;
