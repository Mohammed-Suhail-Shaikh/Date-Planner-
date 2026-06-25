import { cookies } from "next/headers";

const ADMIN_COOKIE = "admin_session";

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE);
  return session?.value === "authenticated";
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "your-secret-password";
}

export { ADMIN_COOKIE };
