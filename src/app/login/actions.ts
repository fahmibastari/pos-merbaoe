"use server";

import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import {
  ActionError,
  actionFailure,
  actionSuccess,
} from "@/lib/action-result";
import { ValidationError } from "@/lib/validation";

export async function loginAction(formData: FormData) {
  try {
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!username || !password) {
      throw new ValidationError("Username dan password harus diisi.", {
        ...(!username ? { username: ["Username harus diisi."] } : {}),
        ...(!password ? { password: ["Password harus diisi."] } : {}),
      });
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      throw new ActionError("Username atau password salah.");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new ActionError("Username atau password salah.");
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

    return actionSuccess({
      redirectTo: user.role === "admin" ? "/admin/dashboard" : "/cashier",
    });
  } catch (error) {
    return actionFailure(error, { actionName: "login" });
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    return actionSuccess({ redirectTo: "/login" });
  } catch (error) {
    return actionFailure(error, { actionName: "logout" });
  }
}
