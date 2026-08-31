import { createBrandIcon } from "@/lib/brand-icon";

const supportedSizes = new Map([
  ["192", { size: 192, inset: 0.12 }],
  ["512", { size: 512, inset: 0.16 }],
] as const);

export function generateStaticParams() {
  return Array.from(supportedSizes.keys(), (size) => ({ size }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const configuration = supportedSizes.get(size as "192" | "512");

  if (!configuration) {
    return new Response("Ukuran ikon tidak tersedia.", { status: 404 });
  }

  return createBrandIcon(configuration.size, configuration.inset);
}
