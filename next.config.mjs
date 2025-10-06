/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // Don't fail Vercel builds because of ESLint warnings/errors
      ignoreDuringBuilds: true,
    },
  };
  
  export default nextConfig;
  