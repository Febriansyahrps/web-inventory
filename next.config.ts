import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.14"],
  // unzipper statically requires the optional @aws-sdk/client-s3 (its S3
  // helper), which isn't installed. Keep it external so the bundler doesn't
  // try to resolve it — it's only required from Node at runtime.
  serverExternalPackages: ["unzipper"],
  // Belt-and-suspenders with robots.txt and the noindex meta: tell crawlers
  // (and indexers that already know the URL) to drop every response.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
