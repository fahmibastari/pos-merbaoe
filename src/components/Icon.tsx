import type { SVGProps } from "react";

export type IconName =
  | "arrow-left"
  | "audit"
  | "cart"
  | "check"
  | "close"
  | "dashboard"
  | "expenses"
  | "ingredients"
  | "minus"
  | "plus"
  | "pos"
  | "print"
  | "products"
  | "purchases"
  | "reports"
  | "sales"
  | "shifts"
  | "tray"
  | "users"
  | "warning";

const paths: Record<IconName, React.ReactNode> = {
  "arrow-left": <><path d="m15 18-6-6 6-6" /><path d="M9 12h10" /></>,
  audit: <><path d="M5 3h14v18H5z" /><path d="M9 3v3h6V3" /><path d="m8 12 2 2 4-4" /><path d="M8 18h8" /></>,
  cart: <><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 7H6" /><circle cx="10" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
  dashboard: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>,
  expenses: <><path d="M4 7h16v12H4z" /><path d="M4 10h16" /><path d="M8 15h4" /></>,
  ingredients: <><path d="M5 5h14l-1 16H6z" /><path d="M8 5V3h8v2" /><path d="M9 10v6M15 10v6" /></>,
  minus: <path d="M5 12h14" />,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  pos: <><path d="M4 5h16v14H4z" /><path d="M4 9h16" /><path d="M8 14h3" /><path d="M16 13v3" /><path d="M14.5 14.5h3" /></>,
  print: <><path d="M7 8V3h10v5" /><path d="M6 17H4V9h16v8h-2" /><path d="M7 14h10v7H7z" /><path d="M17 11h.01" /></>,
  products: <><path d="M7 8h10l1 13H6z" /><path d="M9 8a3 3 0 0 1 6 0" /><path d="M9 12h6" /></>,
  purchases: <><path d="M4 6h16v14H4z" /><path d="M8 6V4h8v2" /><path d="M12 10v6M9 13h6" /></>,
  reports: <><path d="M4 20h16" /><path d="M6 17v-5h3v5" /><path d="M11 17V7h3v10" /><path d="M16 17V4h3v13" /></>,
  sales: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  shifts: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  tray: <><path d="M4 5h16v14H4z" /><path d="M4 14h5l2 2h2l2-2h5" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2" /><circle cx="17" cy="9" r="2" /><path d="M15.5 14.5a4 4 0 0 1 5 3.9V20" /></>,
  warning: <><path d="M12 3 2.8 20h18.4z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
};

export function Icon({
  name,
  size = 18,
  label,
  ...props
}: SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : "true"}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
