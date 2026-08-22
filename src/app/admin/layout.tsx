import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
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
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "var(--bg-base)" }}>
      <AdminSidebar username={session.username} />
      <main
        style={{
          flex: 1,
          marginLeft: "16rem",
          padding: "2rem",
          minHeight: "100dvh",
          overflowY: "auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}
