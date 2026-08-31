import type { Metadata, Viewport } from "next";
import { ebGaramond, ibmPlexMono, inter } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Merbaoe POS",
  title: {
    default: "Merbaoe POS",
    template: "%s | Merbaoe POS",
  },
  description: "Sistem kasir dan analisis keuangan Kafe Kopi Merbaoe",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Merbaoe POS",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#8a2416",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${ebGaramond.variable} ${ibmPlexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
