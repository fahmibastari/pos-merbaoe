import { expect, test } from "@playwright/test";
import {
  E2E_CASHIER_STATE,
  E2E_PRODUCT_NAME,
} from "./constants";

test.use({ storageState: E2E_CASHIER_STATE });

test("kasir mencari menu, checkout QRIS, dan membuka struk", async ({ page }) => {
  await page.goto("/cashier");
  const search = page.getByLabel("Cari menu");
  await expect(search).toBeFocused();
  await search.fill(E2E_PRODUCT_NAME);
  await search.press("Enter");

  await expect(page.getByText(E2E_PRODUCT_NAME, { exact: true }).last()).toBeVisible();
  await page.getByRole("button", { name: "QRIS", exact: true }).click();
  await page.locator("#btn-checkout").click();
  await expect(page.getByText("Transaksi berhasil", { exact: true })).toBeVisible();

  const receiptLink = page.getByRole("link", { name: "Lihat & Cetak Struk" });
  await expect(receiptLink).toBeVisible();
  await receiptLink.click();
  await expect(page).toHaveURL(/\/cashier\/receipt\/\d+$/);
  await expect(page.getByText(E2E_PRODUCT_NAME, { exact: true })).toBeVisible();
});
