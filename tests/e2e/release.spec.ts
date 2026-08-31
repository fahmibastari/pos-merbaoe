import { expect, test } from "@playwright/test";

test("manifest, ikon rilis, dan header keamanan tersedia tanpa service worker", async ({
  page,
  request,
}) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.status()).toBe(200);
  expect(manifestResponse.headers()["content-type"]).toContain(
    "application/manifest+json"
  );

  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({
    name: "Merbaoe POS",
    short_name: "Merbaoe POS",
    start_url: "/",
    display: "standalone",
  });
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: "/pwa-icon/192", sizes: "192x192" }),
      expect.objectContaining({ src: "/pwa-icon/512", sizes: "512x512" }),
      expect.objectContaining({ src: "/pwa-icon/512", purpose: "maskable" }),
    ])
  );

  for (const path of ["/icon", "/apple-icon", "/pwa-icon/192", "/pwa-icon/512"]) {
    const iconResponse = await request.get(path);
    expect(iconResponse.status()).toBe(200);
    expect(iconResponse.headers()["content-type"]).toContain("image/png");
  }

  const loginResponse = await page.goto("/login");
  expect(loginResponse?.status()).toBe(200);
  expect(loginResponse?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(loginResponse?.headers()["x-frame-options"]).toBe("DENY");
  expect(loginResponse?.headers()["referrer-policy"]).toBe(
    "strict-origin-when-cross-origin"
  );
  expect(loginResponse?.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'"
  );

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    /manifest\.webmanifest/
  );
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", /\/icon/);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    /\/apple-icon/
  );
  expect(await page.locator('link[href*="favicon.ico"]').count()).toBe(0);

  const iconSizes = await page.evaluate(async () => {
    const load = (src: string) =>
      new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () =>
          resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error(`Ikon gagal dimuat: ${src}`));
        image.src = src;
      });

    return Promise.all([load("/pwa-icon/192"), load("/pwa-icon/512")]);
  });
  expect(iconSizes).toEqual([
    { width: 192, height: 192 },
    { width: 512, height: 512 },
  ]);

  const registrations = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return 0;
    return (await navigator.serviceWorker.getRegistrations()).length;
  });
  expect(registrations).toBe(0);
  expect((await request.get("/sw.js")).status()).toBe(404);
});
