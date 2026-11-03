import { expect, test } from "@playwright/test";
import { E2E_ADMIN_STATE, E2E_INGREDIENT_NAME } from "./constants";

test.use({ storageState: E2E_ADMIN_STATE });

const routes = [
  "/admin/dashboard",
  "/admin/purchases",
  "/admin/expenses",
  "/admin/sales",
  "/admin/shifts",
  "/admin/reports/profit",
  "/admin/reports/inventory",
  "/admin/audit",
  "stock-card",
];

for (const route of routes) {
  test(`filter mengikuti Apply, Reset, Back, dan Forward: ${route}`, async ({ page }) => {
    test.setTimeout(120_000);
    let path = route;
    if (route === "stock-card") {
      await page.goto(`/admin/ingredients?q=${encodeURIComponent(E2E_INGREDIENT_NAME)}`);
      const cardLink = page.getByRole("row").filter({ hasText: E2E_INGREDIENT_NAME }).getByRole("link", { name: /Kartu Stok/i });
      path = (await cardLink.getAttribute("href"))!;
    }
    await page.goto(path);
    const form = page.locator("form").filter({ has: page.locator('input[name="from"]') });
    const from = form.locator('input[name="from"]');
    const to = form.locator('input[name="to"]');
    const defaultFrom = await from.inputValue();
    const defaultTo = await to.inputValue();
    if (await form.getByRole("link", { name: /Reset|Bulan Ini/ }).count()) {
      await from.fill("2026-07-01");
      await form.getByRole("link", { name: /Reset|Bulan Ini/ }).click();
      await expect(from).toHaveValue(defaultFrom);
    }
    const search = form.locator('input[name="q"]');
    const select = form.locator("select").first();
    const selectedValue = (await select.count()) ? await select.locator("option").last().getAttribute("value") : null;

    await from.fill("2026-08-01");
    await to.fill("2026-08-31");
    if (await search.count()) await search.fill("UJI FILTER TIDAK ADA");
    if (selectedValue) await select.selectOption(selectedValue);
    await form.getByRole("button", { name: /Terapkan|Cari/ }).click();
    await expect(page).toHaveURL(/from=2026-08-01.*to=2026-08-31/);
    await expect(from).toHaveValue("2026-08-01");
    if (route === "/admin/dashboard") await expect(page.getByText("2026-08-01—2026-08-31", { exact: true })).toBeVisible();

    // Dirty DOM values must not survive navigation to the reset URL.
    await from.fill("2026-07-01");
    if (await search.count()) await search.fill("BELUM DITERAPKAN");
    if (selectedValue) await select.selectOption("");
    await form.getByRole("link", { name: /Reset|Bulan Ini/ }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(from).toHaveValue(defaultFrom);
    await expect(to).toHaveValue(defaultTo);
    if (await search.count()) await expect(search).toHaveValue("");
    if (await select.count()) await expect(select).toHaveValue("");

    await page.goBack();
    await expect(page).toHaveURL(/from=2026-08-01/);
    await expect(from).toHaveValue("2026-08-01");
    await expect(to).toHaveValue("2026-08-31");
    if (await search.count()) await expect(search).toHaveValue("UJI FILTER TIDAK ADA");
    if (selectedValue) await expect(select).toHaveValue(selectedValue);
    await from.fill("2026-07-01");
    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(from).toHaveValue(defaultFrom);
    await expect(to).toHaveValue(defaultTo);
  });
}

test("periode tidak valid menampilkan periode efektif pada Dashboard dan ekspor laporan", async ({ page }) => {
  test.setTimeout(120_000);
  for (const path of ["/admin/dashboard", "/admin/reports/profit", "/admin/reports/inventory", "/admin/audit"]) {
    await page.goto(path);
    const from = page.locator('input[name="from"]');
    const to = page.locator('input[name="to"]');
    const defaultFrom = await from.inputValue();
    const defaultTo = await to.inputValue();
    await page.goto(`${path}?from=2026-08-31&to=2026-08-01`);
    await expect(from).toHaveValue(defaultFrom);
    await expect(to).toHaveValue(defaultTo);
    await expect(page.getByRole("alert").filter({ hasText: "Tanggal awal tidak boleh" })).toBeVisible();
    if (path.includes("/reports/")) {
      await expect(page.getByRole("link", { name: /CSV/ })).toHaveAttribute("href", `${path}/export?from=${defaultFrom}&to=${defaultTo}`);
    }
  }
});

test("pagination mempertahankan filter terapan dan membuang edit yang belum diterapkan", async ({ page }) => {
  await page.goto("/admin/audit?from=2026-08-01&to=2026-08-31");
  const user = page.locator("#audit-user");
  await user.selectOption({ label: "E2E Administrator · e2e-merbaoe-admin" });
  const userId = await user.inputValue();
  await page.getByRole("button", { name: "Terapkan", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`userId=${userId}`));
  await expect(page.getByText("Halaman 1 dari 2", { exact: true })).toBeVisible();
  await page.locator("#audit-from").fill("2026-07-01");
  await user.selectOption("");
  await page.getByRole("link", { name: "Berikutnya", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator("#audit-from")).toHaveValue("2026-08-01");
  await expect(user).toHaveValue(userId);
  await expect(page.getByText("Halaman 2 dari 2", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Sebelumnya", exact: true }).click();
  await expect(page.getByText("Halaman 1 dari 2", { exact: true })).toBeVisible();
  await expect(user).toHaveValue(userId);
});
