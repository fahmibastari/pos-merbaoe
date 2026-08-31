import { expect, test } from "@playwright/test";
import {
  E2E_ADMIN_STATE,
  E2E_CASHIER_STATE,
} from "./constants";

async function expectNoPageOverflow(page: import("@playwright/test").Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    body: document.body.scrollWidth,
    root: document.documentElement.scrollWidth,
  }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.root).toBeLessThanOrEqual(dimensions.viewport);
}

test.describe("admin responsif", () => {
  test.use({ storageState: E2E_ADMIN_STATE });

  test("dashboard tidak menyebabkan overflow halaman", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expectNoPageOverflow(page);
  });
});

test.describe("POS responsif", () => {
  test.use({ storageState: E2E_CASHIER_STATE });

  test("POS tetap operasional tanpa overflow halaman", async ({ page }) => {
    await page.goto("/cashier");
    await expect(page.getByLabel("Cari menu")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Keranjang" })).toBeVisible();
    await expectNoPageOverflow(page);
  });

  test("foto menu mempertahankan rasio saat katalog tablet padat", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "Skenario memakai viewport tablet landscape khusus.",
    );
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.goto("/cashier");

    const productCards = page.locator('[id^="product-"]');
    expect(await productCards.count()).toBeGreaterThanOrEqual(12);

    const layout = await productCards.evaluateAll((cards) => {
      const firstCards = cards.slice(0, 12) as HTMLElement[];
      const photos = firstCards.map((card) => {
        const photo = card.firstElementChild as HTMLElement;
        const box = photo.getBoundingClientRect();
        return {
          ratio: box.width / box.height,
          flexShrink: getComputedStyle(photo).flexShrink,
        };
      });
      const grid = firstCards[0].parentElement as HTMLElement;
      return {
        photos,
        gridClientHeight: grid.clientHeight,
        gridScrollHeight: grid.scrollHeight,
      };
    });

    for (const photo of layout.photos) {
      expect(photo.flexShrink).toBe("0");
      expect(photo.ratio).toBeGreaterThan(1.31);
      expect(photo.ratio).toBeLessThan(1.36);
    }
    expect(layout.gridScrollHeight).toBeGreaterThan(layout.gridClientHeight);
  });
});
