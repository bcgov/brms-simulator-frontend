/** @type {import('next').NextConfig} */

const nextConfig = {
  async rewrites() {
    // Proxy API requests to the backend at server when in development
    // In dev/production, this is setup on OpenShift
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/:path*`,
        },
        {
          source: "/auth/:path*",
          destination: `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/:path*`,
        },
      ];
    } else {
      return [];
    }
  },
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ["pino", "pino-pretty"],
  },
};

export default nextConfig;
