"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Sets auth cookies WITHOUT redirecting — use this from client components
// so you can navigate with router.push() and avoid the NEXT_REDIRECT flash.
export async function setAuthCookies(role: string = "student", userId: string = "") {
  const cookieStore = await cookies();
  cookieStore.set("uwu_auth", "true", {
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  cookieStore.set("uwu_role", role, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  cookieStore.set("uwu_user_id", userId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

// Kept for any form-action usage (e.g. server-rendered forms)
export async function loginAction(role: string = "student", userId: string = "") {
  await setAuthCookies(role, userId);
  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("uwu_auth");
  cookieStore.delete("uwu_role");
  cookieStore.delete("uwu_user_id");
  redirect("/");
}
