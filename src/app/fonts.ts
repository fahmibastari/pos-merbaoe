import { EB_Garamond, IBM_Plex_Mono, Inter } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  display: "swap",
  style: "normal",
  weight: "variable",
  variable: "--font-eb-garamond",
});

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  style: "normal",
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});
