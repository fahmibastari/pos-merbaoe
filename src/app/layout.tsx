import type { Metadata } from "next";
import { ebGaramond, ibmPlexMono, inter } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Merbaoe POS",
    template: "%s | Merbaoe POS",
  },
  description: "Sistem kasir dan analisis keuangan Kafe Kopi Merbaoe",
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
