"use server";

import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Username dan password harus diisi." };
  }

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    return { error: "Username atau password salah." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Username atau password salah." };
  }

  const token = await createSession({
    userId: user.id,
    username: user.username,
    role: user.role as "admin" | "kasir",
  });

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 jam
    path: "/",
  });

  if (user.role === "admin") {
    redirect("/admin/dashboard");
  } else {
    redirect("/cashier");
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}
