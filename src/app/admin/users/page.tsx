import type { Metadata } from "next";
import { requireAdmin } from "@/lib/guard";
import { getManagedUsers } from "@/lib/user-management";
import UserManager from "./UserManager";

export const metadata: Metadata = { title: "Pengguna" };

export default async function UsersPage() {
  const session = await requireAdmin();
  const users = await getManagedUsers();

  return (
    <div>
      <div className="page-header">
        <h1>Pengguna</h1>
        <p>Kelola akses kasir, status akun, dan penggantian password</p>
      </div>
      <UserManager users={users} currentUserId={session.userId} />
    </div>
  );
}
