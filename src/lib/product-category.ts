export function productCategorySlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function filterCatalogProducts<
  T extends { name: string; categoryId: number },
>(products: T[], search: string, categoryId: number | null): T[] {
  const normalizedSearch = search.trim().toLocaleLowerCase("id-ID");
  return products.filter(
    (product) =>
      (categoryId === null || product.categoryId === categoryId) &&
      (normalizedSearch === "" ||
        product.name.toLocaleLowerCase("id-ID").includes(normalizedSearch)),
  );
}
