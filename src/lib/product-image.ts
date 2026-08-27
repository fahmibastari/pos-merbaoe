import "server-only";

import { randomUUID } from "node:crypto";
import { ActionError } from "@/lib/action-result";

const BUCKET = "menu-images";
const MAX_BYTES = 3 * 1024 * 1024;

type ValidatedImage = {
  bytes: ArrayBuffer;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
};

function storageConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) {
    throw new ActionError(
      "Penyimpanan foto belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new ActionError("Alamat Supabase untuk penyimpanan foto tidak sah.");
  }
  if (parsed.protocol !== "https:") {
    throw new ActionError("Alamat Supabase untuk penyimpanan foto harus memakai HTTPS.");
  }

  return { baseUrl, serviceKey };
}

function storageHeaders(serviceKey: string) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };
}

function encodeObjectPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function ensureBucket(baseUrl: string, serviceKey: string) {
  const headers = storageHeaders(serviceKey);
  const existing = await fetch(`${baseUrl}/storage/v1/bucket/${BUCKET}`, {
    headers,
    cache: "no-store",
  });
  if (existing.ok) return;
  if (existing.status !== 404) {
    throw new ActionError("Supabase Storage tidak dapat diperiksa saat ini.");
  }

  const created = await fetch(`${baseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: true,
      file_size_limit: MAX_BYTES,
      allowed_mime_types: ["image/jpeg", "image/png", "image/webp"],
    }),
  });
  if (!created.ok && created.status !== 409) {
    throw new ActionError("Bucket foto menu tidak dapat dibuat di Supabase Storage.");
  }
}

async function validateImage(file: File): Promise<ValidatedImage> {
  if (file.size === 0) throw new ActionError("Berkas foto kosong.");
  if (file.size > MAX_BYTES) {
    throw new ActionError("Ukuran foto maksimal 3 MiB.");
  }

  const bytes = await file.arrayBuffer();
  const header = new Uint8Array(bytes.slice(0, 12));
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng =
    header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e &&
    header[3] === 0x47 && header[4] === 0x0d && header[5] === 0x0a &&
    header[6] === 0x1a && header[7] === 0x0a;
  const isWebp =
    String.fromCharCode(...header.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...header.slice(8, 12)) === "WEBP";

  if (file.type === "image/jpeg" && isJpeg) {
    return { bytes, contentType: "image/jpeg", extension: "jpg" };
  }
  if (file.type === "image/png" && isPng) {
    return { bytes, contentType: "image/png", extension: "png" };
  }
  if (file.type === "image/webp" && isWebp) {
    return { bytes, contentType: "image/webp", extension: "webp" };
  }
  throw new ActionError("Foto harus berupa JPEG, PNG, atau WebP yang valid.");
}

export function imageFileFrom(formData: FormData, name = "image") {
  const value = formData.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

export async function uploadProductImage(file: File) {
  const { baseUrl, serviceKey } = storageConfig();
  const image = await validateImage(file);
  await ensureBucket(baseUrl, serviceKey);

  const path = `products/${randomUUID()}.${image.extension}`;
  const uploaded = await fetch(
    `${baseUrl}/storage/v1/object/${BUCKET}/${encodeObjectPath(path)}`,
    {
      method: "POST",
      headers: {
        ...storageHeaders(serviceKey),
        "Content-Type": image.contentType,
        "x-upsert": "false",
      },
      body: image.bytes,
    },
  );
  if (!uploaded.ok) {
    throw new ActionError("Foto menu gagal diunggah ke Supabase Storage.");
  }
  return path;
}

export async function deleteProductImage(path: string) {
  const { baseUrl, serviceKey } = storageConfig();
  const response = await fetch(
    `${baseUrl}/storage/v1/object/${BUCKET}/${encodeObjectPath(path)}`,
    { method: "DELETE", headers: storageHeaders(serviceKey) },
  );
  if (!response.ok && response.status !== 404) {
    throw new Error(`Gagal menghapus foto menu lama (${response.status}).`);
  }
}

export function productImageUrl(path: string | null | undefined) {
  if (!path) return null;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!baseUrl) return null;
  return `${baseUrl}/storage/v1/object/public/${BUCKET}/${encodeObjectPath(path)}`;
}
