import { getActiveSession } from "@/lib/guard";
import { redirect } from "next/navigation";

export default async function CashierLayout({ children }: { children: React.ReactNode }) {
  const session = await getActiveSession();
  if (!session) redirect("/login");
  return <>{children}</>;
}
