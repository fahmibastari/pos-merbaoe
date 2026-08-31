import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Merbaoe POS",
    short_name: "Merbaoe POS",
    description: "Sistem kasir dan analisis keuangan Kafe Kopi Merbaoe",
    lang: "id-ID",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f1efec",
    theme_color: "#8a2416",
    categories: ["business", "finance", "productivity"],
    icons: [
      {
        src: "/pwa-icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Buka POS",
        short_name: "POS",
        description: "Buka layar transaksi kasir",
        url: "/cashier",
        icons: [{ src: "/pwa-icon/192", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Dashboard Admin",
        short_name: "Dashboard",
        description: "Buka ringkasan operasional admin",
        url: "/admin/dashboard",
        icons: [{ src: "/pwa-icon/192", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
