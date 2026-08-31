import { expect, test } from "@playwright/test";
import {
  E2E_ADMIN_USERNAME,
  E2E_CASHIER_STATE,
  E2E_CASHIER_USERNAME,
  E2E_PASSWORD,
} from "./constants";

test("pengunjung tanpa sesi dialihkan ke login", async ({ page }) => {
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Masuk ke Merbaoe POS" })).toBeVisible();
});

test("admin dan kasir masuk ke area perannya", async ({ browser }) => {
  for (const account of [
    { username: E2E_ADMIN_USERNAME, target: /\/admin\/dashboard$/ },
    { username: E2E_CASHIER_USERNAME, target: /\/cashier$/ },
  ]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/login");
    await page.getByLabel("Username").fill(account.username);
    await page.getByLabel("Password").fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(account.target);
    await context.close();
  }
});

test.describe("otorisasi kasir", () => {
  test.use({ storageState: E2E_CASHIER_STATE });

  test("kasir yang membuka halaman admin dikembalikan ke POS", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/cashier$/);
    await expect(page.getByRole("heading", { name: "Keranjang" })).toBeVisible();
  });
});
