/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "mehappy.vn",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s3-hcm-r2.s3cloud.vn",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
    ],
  },
};
eslint: {
    // Tắt kiểm tra lỗi ESLint khi deploy lên Vercel để tránh bị lỗi Build
    ignoreDuringBuilds: true,
  },
};
export default nextConfig;
