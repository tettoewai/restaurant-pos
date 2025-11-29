/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude qr-scanner and its worker files from server-side bundling
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        "qr-scanner": "commonjs qr-scanner",
      });

      // Prevent worker files from being processed on server
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias["qr-scanner/qr-scanner-worker.min.js"] = false;

      // Externalize pino-pretty to avoid worker thread bundling issues
      config.externals.push("pino-pretty");
    }

    // Handle web workers properly on client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    return config;
  },
};

export default nextConfig;
