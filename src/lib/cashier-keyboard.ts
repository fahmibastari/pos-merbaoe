export type CashierShortcut = "search" | "payment" | null;

export type ProductNavigationKey =
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "ArrowDown"
  | "Home"
  | "End";

export function resolveCashierShortcut({
  key,
  altKey = false,
  ctrlKey = false,
  metaKey = false,
  targetTagName = "",
  isContentEditable = false,
}: {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  targetTagName?: string;
  isContentEditable?: boolean;
}): CashierShortcut {
  if (key === "F2" && !altKey && !ctrlKey && !metaKey) return "payment";

  const editableTarget =
    isContentEditable ||
    ["INPUT", "SELECT", "TEXTAREA"].includes(targetTagName.toUpperCase());

  if (
    key === "/" &&
    !altKey &&
    !ctrlKey &&
    !metaKey &&
    !editableTarget
  ) {
    return "search";
  }

  return null;
}

export function nextEnabledProductIndex({
  currentIndex,
  itemCount,
  key,
  disabledIndexes = [],
}: {
  currentIndex: number;
  itemCount: number;
  key: ProductNavigationKey;
  disabledIndexes?: number[];
}): number | null {
  if (itemCount <= 0) return null;

  const disabled = new Set(disabledIndexes);
  const direction =
    key === "ArrowLeft" || key === "ArrowUp" || key === "End" ? -1 : 1;
  let candidate =
    key === "Home"
      ? 0
      : key === "End"
        ? itemCount - 1
        : (currentIndex + direction + itemCount) % itemCount;

  for (let checked = 0; checked < itemCount; checked += 1) {
    if (!disabled.has(candidate)) return candidate;
    candidate = (candidate + direction + itemCount) % itemCount;
  }

  return null;
}
