/** @type {import('next').NextConfig} */

const nextConfig = {
  async rewrites() {
    // Proxy API requests to the backend at server when in development
    // In dev/production, this is setup on OpenShift
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
        },
      ];
    } else {
      return [];
    }
  },
};

export default nextConfig;
