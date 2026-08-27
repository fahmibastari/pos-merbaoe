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
  experimental: {
    serverActions: {
      // Foto dibatasi 3 MiB; sisa ruang menampung overhead multipart.
      bodySizeLimit: "3200kb",
    },
  },
};

export default nextConfig;
