import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/guard";

export default async function HomePage() {
  const session = await getActiveSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "admin") {
    redirect("/admin/dashboard");
  }

  redirect("/cashier");
}
