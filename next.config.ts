import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseImagePattern = (() => {
  if (!supabaseUrl) return [];
  try {
    const url = new URL(supabaseUrl);
    if (url.protocol !== "https:") return [];
    return [{
      protocol: "https" as const,
      hostname: url.hostname,
      port: "",
      pathname: "/storage/v1/object/public/menu-images/**",
    }];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  images: { remotePatterns: supabaseImagePattern },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), usb=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      // Foto dibatasi 3 MiB; sisa ruang menampung overhead multipart.
      bodySizeLimit: "3200kb",
    },
  },
};

export default nextConfig;
