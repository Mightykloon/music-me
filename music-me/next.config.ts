import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "mosaic.scdn.co" },
      { protocol: "https", hostname: "image-cdn-ak.spotifycdn.com" },
      { protocol: "https", hostname: "is1-ssl.mzstatic.com" },
      { protocol: "https", hostname: "i1.sndcdn.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "lastfm.freetls.fastly.net" },
      { protocol: "https", hostname: "e-cdns-images.dzcdn.net" },
      { protocol: "https", hostname: "cdns-preview-d.dzcdn.net" },
    ],
  },
  serverExternalPackages: ["sharp", "bullmq"],
};

export default nextConfig;
