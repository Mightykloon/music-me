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
      { protocol: "https", hostname: "**.dzcdn.net" },
      { protocol: "https", hostname: "**.mzstatic.com" },
      { protocol: "https", hostname: "**.sndcdn.com" },
      { protocol: "https", hostname: "**.ytimg.com" },
      { protocol: "https", hostname: "cdns-preview-d.dzcdn.net" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
  serverExternalPackages: ["sharp", "bullmq"],
  // don't advertise the framework
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // nobody else may put the site in a frame (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self' https://accounts.google.com" },
          // browsers must trust the declared file type
          { key: "X-Content-Type-Options", value: "nosniff" },
          // other sites see only "remixd.tech", not full page addresses
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // features the site never uses
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
