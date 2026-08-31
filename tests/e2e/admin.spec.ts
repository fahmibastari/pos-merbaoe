import { expect, test } from "@playwright/test";
import { E2E_ADMIN_STATE } from "./constants";

test.use({ storageState: E2E_ADMIN_STATE });

test("admin dapat membuka layar operasional dan laporan utama", async ({ page }) => {
  test.setTimeout(120_000);
  const routes = [
    ["/admin/dashboard", "Dashboard"],
    ["/admin/ingredients", "Bahan Baku"],
    ["/admin/products", "Menu"],
    ["/admin/purchases", "Pembelian Stok"],
    ["/admin/reports/profit", "Laporan"],
    ["/admin/audit", "Jejak Audit"],
  ] as const;

  for (const [route, heading] of routes) {
    await page.goto(route);
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
  }
});
