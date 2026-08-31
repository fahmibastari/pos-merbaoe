export type SearchParamValue = string | string[] | undefined;

export function getStringParam(value: SearchParamValue): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export function parsePage(value: SearchParamValue): number {
  const parsed = Number(getStringParam(value));
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function paginate(totalItems: number, requestedPage: number, pageSize: number) {
  if (!Number.isSafeInteger(pageSize) || pageSize <= 0) {
    throw new Error("Ukuran halaman harus berupa bilangan bulat positif.");
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);

  return {
    page,
    totalPages,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function pageHref(
  pathname: string,
  params: Record<string, string | number | undefined>,
  page: number,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  if (page > 1) query.set("page", String(page));
  else query.delete("page");

  const suffix = query.toString();
  return suffix ? `${pathname}?${suffix}` : pathname;
}
