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
});
