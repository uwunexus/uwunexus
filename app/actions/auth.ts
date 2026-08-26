"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(role: string = "student", userId: string = "", enrollmentNumber: string = "") {
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
  cookieStore.set("uwu_enrollment", enrollmentNumber, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("uwu_auth");
  cookieStore.delete("uwu_role");
  cookieStore.delete("uwu_user_id");
  cookieStore.delete("uwu_enrollment");
  redirect("/");
}
