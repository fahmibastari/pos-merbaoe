"use server";

import { createSession } from "@/lib/auth";
import { cookies } from "next/headers";
import {
  actionFailure,
  actionSuccess,
} from "@/lib/action-result";
import { ValidationError } from "@/lib/validation";
import { authenticateCredentials } from "@/lib/login-service";
import { normalizeLoginUsername } from "@/lib/login-security";

export async function loginAction(formData: FormData) {
  try {
    const username = normalizeLoginUsername(
      String(formData.get("username") ?? ""),
    );
    const password = String(formData.get("password") ?? "");

    if (!username || !password || username.length > 50 || password.length > 72) {
      throw new ValidationError("Periksa kembali username dan password.", {
        ...(!username ? { username: ["Username harus diisi."] } : {}),
        ...(username.length > 50
          ? { username: ["Username maksimal 50 karakter."] }
          : {}),
        ...(!password ? { password: ["Password harus diisi."] } : {}),
        ...(password.length > 72
          ? { password: ["Password maksimal 72 karakter."] }
          : {}),
      });
    }

    const user = await authenticateCredentials(username, password);

  const token = await createSession({
    userId: user.userId,
    username: user.username,
    role: user.role as "admin" | "kasir",
    sessionVersion: user.sessionVersion,
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
