/* eslint-disable @next/next/no-img-element */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

const LOGO_WIDTH = 1355;
const LOGO_HEIGHT = 601;
const PAPER = "#f1efec";

/**
 * Menempatkan aset resmi yang lebar pada kanvas persegi tanpa crop atau distorsi.
 * Inset yang lebih besar dipakai untuk ikon maskable agar bangunan tetap utuh.
 */
export async function createBrandIcon(size: number, insetRatio: number) {
  const logoData = await readFile(
    join(process.cwd(), "public", "Logo-IconOnly.png"),
    "base64"
  );
  const logoWidth = Math.round(size * (1 - insetRatio * 2));
  const logoHeight = Math.round((logoWidth * LOGO_HEIGHT) / LOGO_WIDTH);

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          backgroundColor: PAPER,
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <img
          alt=""
          height={logoHeight}
          src={`data:image/png;base64,${logoData}`}
          style={{ objectFit: "contain" }}
          width={logoWidth}
        />
      </div>
    ),
    { height: size, width: size }
  );
}
