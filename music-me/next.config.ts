import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "mosaic.scdn.co" },
      { protocol: "https", hostname: "**.spotifycdn.com" },
      { protocol: "https", hostname: "**.spotify.com" },
      { protocol: "https", hostname: "blend-playlist-covers.spotifycdn.com" },
      { protocol: "https", hostname: "image-cdn-*.spotifycdn.com" },
      { protocol: "https", hostname: "seed-mix-image.spotifycdn.com" },
      { protocol: "https", hostname: "wrapped-images.spotifycdn.com" },
      { protocol: "https", hostname: "lineup-images.scdn.co" },
      { protocol: "https", hostname: "newjams-images.scdn.co" },
      { protocol: "https", hostname: "dailymix-images.scdn.co" },
      { protocol: "https", hostname: "is1-ssl.mzstatic.com" },
      { protocol: "https", hostname: "i1.sndcdn.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "lastfm.freetls.fastly.net" },
      { protocol: "https", hostname: "e-cdns-images.dzcdn.net" },
      { protocol: "https", hostname: "cdns-preview-d.dzcdn.net" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
  serverExternalPackages: ["sharp", "bullmq"],
};

export default nextConfig;
