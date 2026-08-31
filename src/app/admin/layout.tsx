import type { Metadata } from "next";
import { getActiveSession } from "@/lib/guard";
import { redirect } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

export const metadata: Metadata = {
  title: {
    default: "Dashboard Admin",
    template: "%s | Admin Merbaoe",
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getActiveSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="admin-shell">
      <AdminSidebar username={session.username} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
